import { Injectable, NotFoundException, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class VotesService {
  constructor(private prisma: PrismaService, private events: EventEmitter2) {}

  async vote(userId: string, targetId: string, targetType: 'QUESTION' | 'ANSWER', value: 1 | -1) {
    // Verify target exists and check for self-vote
    if (targetType === 'QUESTION') {
      const q = await this.prisma.question.findFirst({ where: { id: targetId, isDeleted: false } });
      if (!q) throw new NotFoundException('Question not found');
      if (q.authorId === userId) throw new BadRequestException('Cannot vote on your own content');
    } else {
      const a = await this.prisma.answer.findFirst({ where: { id: targetId, isDeleted: false } });
      if (!a) throw new NotFoundException('Answer not found');
      if (a.authorId === userId) throw new BadRequestException('Cannot vote on your own content');
    }

    const existing = await this.prisma.vote.findUnique({
      where: { userId_targetId_targetType: { userId, targetId, targetType } },
    });

    const reputationPerVote = targetType === 'QUESTION' ? 5 : 10;
    let delta = 0;
    let reputationDelta = 0;
    let action: string;

    // H-2 fix: all vote mutations inside a single Prisma transaction to prevent race conditions
    if (existing) {
      if (existing.value === (value === 1 ? 'UP' : 'DOWN')) {
        // Remove vote (toggle off)
        delta = existing.value === 'UP' ? -1 : 1;
        reputationDelta = existing.value === 'UP' ? -reputationPerVote : reputationPerVote;
        action = 'removed';

        await this.prisma.$transaction([
          this.prisma.vote.delete({ where: { userId_targetId_targetType: { userId, targetId, targetType } } }),
          this.updateScoreTx(targetId, targetType, delta),
          this.updateAuthorReputationTx(targetId, targetType, reputationDelta),
        ]);
      } else {
        // Flip vote
        delta = value === 1 ? 2 : -2;
        reputationDelta = value === 1 ? reputationPerVote * 2 : -reputationPerVote * 2;
        action = 'flipped';

        await this.prisma.$transaction([
          this.prisma.vote.update({
            where: { userId_targetId_targetType: { userId, targetId, targetType } },
            data: { value: value === 1 ? 'UP' : 'DOWN' },
          }),
          this.updateScoreTx(targetId, targetType, delta),
          this.updateAuthorReputationTx(targetId, targetType, reputationDelta),
        ]);
      }
    } else {
      // New vote
      delta = value;
      reputationDelta = value === 1 ? reputationPerVote : -reputationPerVote;
      action = 'added';

      await this.prisma.$transaction([
        this.prisma.vote.create({ data: { userId, targetId, targetType, value: value === 1 ? 'UP' : 'DOWN' } }),
        this.updateScoreTx(targetId, targetType, delta),
        this.updateAuthorReputationTx(targetId, targetType, reputationDelta),
      ]);
    }

    this.events.emit('vote.cast', { userId, targetId, targetType, value, reputationDelta });

    return { action, voteScore: await this.getScore(targetId, targetType) };
  }

  // Returns a Prisma operation (not awaited) suitable for $transaction
  private updateScoreTx(targetId: string, targetType: string, delta: number) {
    if (targetType === 'QUESTION') {
      return this.prisma.question.update({ where: { id: targetId }, data: { voteScore: { increment: delta } } });
    }
    return this.prisma.answer.update({ where: { id: targetId }, data: { voteScore: { increment: delta } } });
  }

  private updateAuthorReputationTx(targetId: string, targetType: string, delta: number) {
    // We build the nested update using the known authorId from above checks — for simplicity, use unchecked update
    // The author lookup is done inside the transaction via updateMany where conditions.
    if (targetType === 'QUESTION') {
      return this.prisma.$executeRawUnsafe(
        `UPDATE users SET reputation = reputation + $1 WHERE id = (SELECT author_id FROM questions WHERE id = $2)`,
        delta,
        targetId,
      );
    }
    return this.prisma.$executeRawUnsafe(
      `UPDATE users SET reputation = reputation + $1 WHERE id = (SELECT author_id FROM answers WHERE id = $2)`,
      delta,
      targetId,
    );
  }

  private async getScore(targetId: string, targetType: string): Promise<number> {
    if (targetType === 'QUESTION') {
      const q = await this.prisma.question.findUnique({ where: { id: targetId }, select: { voteScore: true } });
      return q?.voteScore || 0;
    }
    const a = await this.prisma.answer.findUnique({ where: { id: targetId }, select: { voteScore: true } });
    return a?.voteScore || 0;
  }
}

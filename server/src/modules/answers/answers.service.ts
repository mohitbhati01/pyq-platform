import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateAnswerDto } from './dto/create-answer.dto';
import { UpdateAnswerDto } from './dto/update-answer.dto';

@Injectable()
export class AnswersService {
  constructor(private prisma: PrismaService, private events: EventEmitter2) {}

  async create(questionId: string, authorId: string, dto: CreateAnswerDto) {
    const question = await this.prisma.question.findFirst({ where: { id: questionId, isDeleted: false } });
    if (!question) throw new NotFoundException('Question not found');

    const answer = await this.prisma.answer.create({
      data: { questionId, authorId, body: dto.body },
      include: { author: { select: { id: true, username: true, name: true, avatarUrl: true, reputation: true } } },
    });

    this.events.emit('answer.created', { answer, question, authorId });
    return answer;
  }

  async findByQuestion(questionId: string, userId?: string) {
    const question = await this.prisma.question.findFirst({ where: { id: questionId, isDeleted: false } });
    if (!question) throw new NotFoundException('Question not found');

    const answers = await this.prisma.answer.findMany({
      where: { questionId, isDeleted: false },
      include: {
        author: { select: { id: true, username: true, name: true, avatarUrl: true, reputation: true } },
        _count: { select: { comments: true } },
        ...(userId ? { votes: { where: { userId } } } : {}),
      },
      orderBy: [{ isAccepted: 'desc' }, { voteScore: 'desc' }, { createdAt: 'asc' }],
    });

    return answers.map((a) => ({
      ...a,
      userVote: userId ? (a as any).votes?.[0]?.value || null : null,
      votes: undefined,
    }));
  }

  // H-3 fix: use UpdateAnswerDto (PartialType) instead of CreateAnswerDto
  async update(id: string, userId: string, dto: UpdateAnswerDto) {
    const answer = await this.prisma.answer.findFirst({ where: { id, isDeleted: false } });
    if (!answer) throw new NotFoundException('Answer not found');
    if (answer.authorId !== userId) throw new ForbiddenException('Not the author');

    // Track edit history
    const history = [...(answer.editHistory as any[]), { body: answer.body, editedAt: new Date() }];
    return this.prisma.answer.update({
      where: { id },
      data: { ...(dto.body ? { body: dto.body } : {}), editHistory: history },
      include: { author: { select: { id: true, username: true, name: true, avatarUrl: true } } },
    });
  }

  async remove(id: string, userId: string, isAdmin = false) {
    const answer = await this.prisma.answer.findFirst({ where: { id, isDeleted: false } });
    if (!answer) throw new NotFoundException('Answer not found');
    if (!isAdmin && answer.authorId !== userId) throw new ForbiddenException('Not the author');
    return this.prisma.answer.update({ where: { id }, data: { isDeleted: true } });
  }

  async acceptAnswer(answerId: string, userId: string) {
    const answer = await this.prisma.answer.findFirst({
      where: { id: answerId, isDeleted: false },
      include: { question: true },
    });
    if (!answer) throw new NotFoundException('Answer not found');
    if (answer.question.authorId !== userId) throw new ForbiddenException('Only question author can accept');

    // Unaccept any previously accepted answer
    await this.prisma.answer.updateMany({
      where: { questionId: answer.questionId, isAccepted: true },
      data: { isAccepted: false },
    });

    const updated = await this.prisma.answer.update({
      where: { id: answerId },
      data: { isAccepted: true },
    });

    this.events.emit('answer.accepted', { answer: updated, acceptedBy: userId });
    return updated;
  }
}

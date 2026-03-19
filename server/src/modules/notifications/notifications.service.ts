import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService, private gateway: NotificationsGateway) {}

  async getForUser(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [total, unreadCount, notifications] = await Promise.all([
      this.prisma.notification.count({ where: { recipientId: userId } }),
      this.prisma.notification.count({ where: { recipientId: userId, isRead: false } }),
      this.prisma.notification.findMany({
        where: { recipientId: userId },
        include: { actor: { select: { id: true, username: true, name: true, avatarUrl: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);
    return { data: notifications, total, unreadCount, page, limit };
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { recipientId: userId, isRead: false },
      data: { isRead: true },
    });
    return { success: true };
  }

  async markOneRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, recipientId: userId },
      data: { isRead: true },
    });
  }

  private async createAndPush(data: {
    recipientId: string;
    actorId: string;
    type: any;
    resourceId: string;
    resourceType: string;
  }) {
    if (data.recipientId === data.actorId) return; // Don't notify yourself

    const notification = await this.prisma.notification.create({
      data,
      include: { actor: { select: { id: true, username: true, name: true, avatarUrl: true } } },
    });

    // Push real-time notification via WebSocket
    this.gateway.sendToUser(data.recipientId, 'notification', notification);
    return notification;
  }

  @OnEvent('answer.created')
  async onAnswerCreated({ answer, question, authorId }: any) {
    await this.createAndPush({
      recipientId: question.authorId,
      actorId: authorId,
      type: 'NEW_ANSWER',
      resourceId: answer.id,
      resourceType: 'answer',
    });
  }

  @OnEvent('answer.accepted')
  async onAnswerAccepted({ answer, acceptedBy }: any) {
    await this.createAndPush({
      recipientId: answer.authorId,
      actorId: acceptedBy,
      type: 'ANSWER_ACCEPTED',
      resourceId: answer.id,
      resourceType: 'answer',
    });
  }

  @OnEvent('comment.created')
  async onCommentCreated({ comment, dto, authorId }: any) {
    if (dto.targetType === 'question') {
      const question = await this.prisma.question.findUnique({ where: { id: dto.targetId }, select: { authorId: true } });
      if (question) {
        await this.createAndPush({
          recipientId: question.authorId,
          actorId: authorId,
          type: 'COMMENT_ON_QUESTION',
          resourceId: dto.targetId,
          resourceType: 'question',
        });
      }
    } else {
      const answer = await this.prisma.answer.findUnique({ where: { id: dto.targetId }, select: { authorId: true } });
      if (answer) {
        await this.createAndPush({
          recipientId: answer.authorId,
          actorId: authorId,
          type: 'COMMENT_ON_ANSWER',
          resourceId: dto.targetId,
          resourceType: 'answer',
        });
      }
    }
  }

  @OnEvent('users.followed')
  async onUserFollowed({ followerId, followingId }: any) {
    await this.createAndPush({
      recipientId: followingId,
      actorId: followerId,
      type: 'NEW_FOLLOWER',
      resourceId: followerId,
      resourceType: 'user',
    });
  }

  @OnEvent('reputation.updated')
  async onReputationUpdated({ userId }: any) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { reputation: true } });
    if (!user) return;

    const thresholds = [
      { threshold: 1, badgeSlug: 'beginner' },
      { threshold: 100, badgeSlug: 'contributor' },
      { threshold: 500, badgeSlug: 'expert' },
    ];

    for (const { threshold, badgeSlug } of thresholds) {
      if (user.reputation >= threshold) {
        const badge = await this.prisma.badge.findUnique({ where: { slug: badgeSlug } });
        if (!badge) continue;
        const alreadyHas = await this.prisma.userBadge.findUnique({
          where: { userId_badgeId: { userId, badgeId: badge.id } },
        });
        if (!alreadyHas) {
          await this.prisma.userBadge.create({ data: { userId, badgeId: badge.id } });
          this.gateway.sendToUser(userId, 'badge_earned', { badge });
        }
      }
    }
  }
}

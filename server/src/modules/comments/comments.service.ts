import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService, private events: EventEmitter2) {}

  async create(authorId: string, dto: CreateCommentDto) {
    const comment = await this.prisma.comment.create({
      data: {
        authorId,
        body: dto.body,
        questionId: dto.targetType === 'question' ? dto.targetId : undefined,
        answerId: dto.targetType === 'answer' ? dto.targetId : undefined,
        parentId: dto.parentId,
      },
      include: { author: { select: { id: true, username: true, name: true, avatarUrl: true } } },
    });
    this.events.emit('comment.created', { comment, dto, authorId });
    return comment;
  }

  async findByTarget(targetId: string, targetType: 'question' | 'answer', userId?: string) {
    const where =
      targetType === 'question'
        ? { questionId: targetId, parentId: null, isDeleted: false }
        : { answerId: targetId, parentId: null, isDeleted: false };

    const comments = await this.prisma.comment.findMany({
      where,
      include: {
        author: { select: { id: true, username: true, name: true, avatarUrl: true } },
        // Include current user's like for this comment
        ...(userId ? { likes: { where: { userId } } } : {}),
        replies: {
          where: { isDeleted: false },
          include: {
            author: { select: { id: true, username: true, name: true, avatarUrl: true } },
            ...(userId ? { likes: { where: { userId } } } : {}),
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Shape each comment: add isLiked flag, strip internal likes array
    return comments.map((c) => this.shapeComment(c, userId));
  }

  // M-3 fix: Edit comment (author only)
  async update(id: string, userId: string, dto: UpdateCommentDto) {
    const comment = await this.prisma.comment.findFirst({ where: { id, isDeleted: false } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.authorId !== userId) throw new ForbiddenException('Not the author');

    return this.prisma.comment.update({
      where: { id },
      data: { body: dto.body },
      include: { author: { select: { id: true, username: true, name: true, avatarUrl: true } } },
    });
  }

  async remove(id: string, userId: string, isAdmin = false) {
    const comment = await this.prisma.comment.findFirst({ where: { id, isDeleted: false } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (!isAdmin && comment.authorId !== userId) throw new ForbiddenException('Not the author');
    return this.prisma.comment.update({ where: { id }, data: { isDeleted: true } });
  }

  // C-1 fix: Proper per-user toggle using CommentLike join table
  async toggleLike(commentId: string, userId: string) {
    const comment = await this.prisma.comment.findFirst({ where: { id: commentId, isDeleted: false } });
    if (!comment) throw new NotFoundException('Comment not found');

    const existing = await this.prisma.commentLike.findUnique({
      where: { userId_commentId: { userId, commentId } },
    });

    if (existing) {
      // Unlike: remove record and decrement
      await this.prisma.$transaction([
        this.prisma.commentLike.delete({ where: { userId_commentId: { userId, commentId } } }),
        this.prisma.comment.update({ where: { id: commentId }, data: { likeCount: { decrement: 1 } } }),
      ]);
      return { liked: false, likeCount: Math.max(0, comment.likeCount - 1) };
    } else {
      // Like: create record and increment
      const [, updated] = await this.prisma.$transaction([
        this.prisma.commentLike.create({ data: { userId, commentId } }),
        this.prisma.comment.update({ where: { id: commentId }, data: { likeCount: { increment: 1 } } }),
      ]);
      return { liked: true, likeCount: updated.likeCount };
    }
  }

  private shapeComment(c: any, userId?: string) {
    const isLiked = userId ? (c.likes?.length > 0) : false;
    const { likes, replies, ...rest } = c;
    return {
      ...rest,
      isLiked,
      replies: (replies || []).map((r: any) => {
        const { likes: rLikes, ...rRest } = r;
        return { ...rRest, isLiked: userId ? (rLikes?.length > 0) : false };
      }),
    };
  }
}

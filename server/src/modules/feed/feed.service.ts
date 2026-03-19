import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class FeedService {
  constructor(private prisma: PrismaService) {}

  async getUserFeed(userId: string, page = 1, limit = 15) {
    const skip = (page - 1) * limit;

    // Get IDs of users this person follows
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const followingIds = following.map((f) => f.followingId);

    if (followingIds.length === 0) {
      return this.getTrending(page, limit);
    }

    const [total, questions] = await Promise.all([
      this.prisma.question.count({ where: { authorId: { in: followingIds }, isDeleted: false } }),
      this.prisma.question.findMany({
        where: { authorId: { in: followingIds }, isDeleted: false },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          author: { select: { id: true, username: true, name: true, avatarUrl: true } },
          images: { take: 1 },
          _count: { select: { answers: true, comments: true } },
          bookmarks: { where: { userId } },
        },
      }),
    ]);

    const data = questions.map((q) => ({
      ...q,
      isBookmarked: (q as any).bookmarks?.length > 0,
      bookmarks: undefined,
    }));

    return { data, total, page, limit, totalPages: Math.ceil(total / limit), type: 'following' };
  }

  async getTrending(page = 1, limit = 15) {
    const skip = (page - 1) * limit;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [total, questions] = await Promise.all([
      this.prisma.question.count({ where: { isDeleted: false, createdAt: { gte: sevenDaysAgo } } }),
      this.prisma.question.findMany({
        where: { isDeleted: false, createdAt: { gte: sevenDaysAgo } },
        orderBy: [{ voteScore: 'desc' }, { viewCount: 'desc' }],
        skip,
        take: limit,
        include: {
          author: { select: { id: true, username: true, name: true, avatarUrl: true } },
          images: { take: 1 },
          _count: { select: { answers: true, comments: true } },
        },
      }),
    ]);

    return { data: questions, total, page, limit, totalPages: Math.ceil(total / limit), type: 'trending' };
  }
}

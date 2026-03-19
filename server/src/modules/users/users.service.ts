import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService, private events: EventEmitter2) {}

  async findByUsername(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: {
        _count: { select: { followers: true, following: true, questions: true, answers: true } },
        badges: { include: { badge: true } },
      },
    });
    if (!user || user.isBanned) throw new NotFoundException('User not found');
    const { passwordHash, googleId, ...safe } = user as any;
    return safe;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    if (dto.username) {
      const existing = await this.prisma.user.findFirst({
        where: { username: dto.username, NOT: { id: userId } },
      });
      if (existing) throw new ConflictException('Username already taken');
    }
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
    });
    const { passwordHash, googleId, ...safe } = user as any;
    return safe;
  }

  async followUser(followerId: string, followingId: string) {
    if (followerId === followingId) throw new ConflictException('Cannot follow yourself');
    const target = await this.prisma.user.findUnique({ where: { id: followingId } });
    if (!target) throw new NotFoundException('User not found');

    const existing = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });
    if (existing) {
      await this.prisma.follow.delete({ where: { followerId_followingId: { followerId, followingId } } });
      return { following: false };
    }
    await this.prisma.follow.create({ data: { followerId, followingId } });
    // H-6 fix: emit event so NotificationsService can send a "New Follower" notification
    this.events.emit('users.followed', { followerId, followingId });
    return { following: true };
  }

  async getFollowers(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [total, followers] = await Promise.all([
      this.prisma.follow.count({ where: { followingId: userId } }),
      this.prisma.follow.findMany({
        where: { followingId: userId },
        include: { follower: { select: { id: true, username: true, name: true, avatarUrl: true, reputation: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return { data: followers.map((f) => f.follower), total, page, limit };
  }

  async getFollowing(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [total, following] = await Promise.all([
      this.prisma.follow.count({ where: { followerId: userId } }),
      this.prisma.follow.findMany({
        where: { followerId: userId },
        include: { following: { select: { id: true, username: true, name: true, avatarUrl: true, reputation: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return { data: following.map((f) => f.following), total, page, limit };
  }

  async getLeaderboard(limit = 20) {
    const users = await this.prisma.user.findMany({
      where: { isBanned: false },
      orderBy: { reputation: 'desc' },
      take: limit,
      select: {
        id: true, username: true, name: true, avatarUrl: true, reputation: true,
        _count: { select: { questions: true, answers: true } },
        badges: { include: { badge: true }, take: 3, orderBy: { awardedAt: 'desc' } },
      },
    });
    return users;
  }

  async getUserQuestions(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [total, questions] = await Promise.all([
      this.prisma.question.count({ where: { authorId: userId, isDeleted: false } }),
      this.prisma.question.findMany({
        where: { authorId: userId, isDeleted: false },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { _count: { select: { answers: true } } },
      }),
    ]);
    return { data: questions, total, page, limit };
  }

  async getBookmarks(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [total, bookmarks] = await Promise.all([
      this.prisma.bookmark.count({ where: { userId } }),
      this.prisma.bookmark.findMany({
        where: { userId },
        include: { question: { include: { author: { select: { id: true, username: true, avatarUrl: true } }, _count: { select: { answers: true } } } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return { data: bookmarks.map((b) => b.question), total, page, limit };
  }
}

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getReports(status?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;

    const [total, reports] = await Promise.all([
      this.prisma.report.count({ where }),
      this.prisma.report.findMany({
        where,
        include: { reporter: { select: { id: true, username: true, name: true, avatarUrl: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);
    return { data: reports, total, page, limit };
  }

  async resolveReport(id: string, status: 'RESOLVED' | 'DISMISSED', adminNote?: string) {
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('Report not found');
    return this.prisma.report.update({ where: { id }, data: { status, adminNote } });
  }

  async banUser(userId: string, ban: boolean) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.isAdmin) throw new ForbiddenException('Cannot ban admin users');
    return this.prisma.user.update({ where: { id: userId }, data: { isBanned: ban } });
  }

  async getDashboardStats() {
    const [totalUsers, totalQuestions, totalAnswers, pendingReports, newUsersToday] = await Promise.all([
      this.prisma.user.count({ where: { isBanned: false } }),
      this.prisma.question.count({ where: { isDeleted: false } }),
      this.prisma.answer.count({ where: { isDeleted: false } }),
      this.prisma.report.count({ where: { status: 'PENDING' } }),
      this.prisma.user.count({ where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
    ]);
    return { totalUsers, totalQuestions, totalAnswers, pendingReports, newUsersToday };
  }

  async createReport(reporterId: string, dto: { targetId: string; targetType: string; reason: string }) {
    return this.prisma.report.create({
      data: { reporterId, targetId: dto.targetId, targetType: dto.targetType as any, reason: dto.reason },
    });
  }

  async getAllUsers(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (search) where.OR = [
      { username: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { name: { contains: search, mode: 'insensitive' } },
    ];

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        select: { id: true, username: true, name: true, email: true, reputation: true, isBanned: true, isAdmin: true, createdAt: true, _count: { select: { questions: true, answers: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);
    return { data: users, total, page, limit };
  }
}

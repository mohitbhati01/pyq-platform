import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QuestionFilterDto } from './dto/question-filter.dto';

@Injectable()
export class QuestionsService {
  constructor(private prisma: PrismaService, private events: EventEmitter2) {}

  async create(authorId: string, dto: CreateQuestionDto) {
    const question = await this.prisma.question.create({
      data: {
        authorId,
        title: dto.title,
        description: dto.description,
        tags: dto.tags || [],
        examName: dto.examName,
        examYear: dto.examYear,
        difficulty: dto.difficulty || 'MEDIUM',
        images: dto.imageUrls?.length
          ? { create: dto.imageUrls.map((url, i) => ({ url, publicId: url, sortOrder: i })) }
          : undefined,
      },
      include: { author: { select: { id: true, username: true, name: true, avatarUrl: true } }, images: true },
    });
    this.events.emit('question.created', { question, authorId });
    return question;
  }

  async findAll(filter: QuestionFilterDto, userId?: string) {
    const { page = 1, limit = 15, search, examName, examYear, difficulty, tags, sort = 'newest' } = filter;
    const skip = (page - 1) * limit;

    const where: any = { isDeleted: false };
    if (examName) where.examName = { contains: examName, mode: 'insensitive' };
    if (examYear) where.examYear = +examYear;
    if (difficulty) where.difficulty = difficulty;
    if (tags?.length) where.tags = { hasSome: tags };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { hasSome: [search] } },
      ];
    }

    const orderBy: any =
      sort === 'votes' ? { voteScore: 'desc' }
      : sort === 'views' ? { viewCount: 'desc' }
      : sort === 'answered' ? { answers: { _count: 'desc' } }
      : { createdAt: 'desc' };

    const [total, questions] = await Promise.all([
      this.prisma.question.count({ where }),
      this.prisma.question.findMany({
        where,
        orderBy,
        skip,
        take: +limit,
        include: {
          author: { select: { id: true, username: true, name: true, avatarUrl: true } },
          images: { take: 1 },
          _count: { select: { answers: true } },
          ...(userId ? { bookmarks: { where: { userId } } } : {}),
        },
      }),
    ]);

    const data = questions.map((q) => ({
      ...q,
      isBookmarked: userId ? (q as any).bookmarks?.length > 0 : false,
      bookmarks: undefined,
    }));

    return { data, total, page: +page, limit: +limit, totalPages: Math.ceil(total / +limit) };
  }

  // M-2 fix: In-memory viewer dedup (replace with Redis in production for multi-instance deployments)
  // Key format: "questionId:userId-or-IP", expires after 24 hours
  private viewedRecently = new Map<string, number>();

  async findOne(id: string, userId?: string, viewerIp?: string) {
    const question = await this.prisma.question.findFirst({
      where: { id, isDeleted: false },
      include: {
        author: { select: { id: true, username: true, name: true, avatarUrl: true, reputation: true } },
        images: true,
        _count: { select: { answers: true, comments: true } },
        ...(userId ? { bookmarks: { where: { userId } } } : {}),
      },
    });
    if (!question) throw new NotFoundException('Question not found');

    // M-2 fix: Deduplicate views by viewer (userId or IP), TTL 24 hours
    const viewerKey = `${id}:${userId || viewerIp || 'anonymous'}`;
    const now = Date.now();
    const lastSeen = this.viewedRecently.get(viewerKey);
    const TTL_MS = 24 * 60 * 60 * 1000;
    if (!lastSeen || now - lastSeen > TTL_MS) {
      this.viewedRecently.set(viewerKey, now);
      this.prisma.question.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => {});
      // Cleanup old entries every 1000 views to prevent memory growth
      if (this.viewedRecently.size > 1000) {
        for (const [key, timestamp] of this.viewedRecently.entries()) {
          if (now - timestamp > TTL_MS) this.viewedRecently.delete(key);
        }
      }
    }

    return {
      ...question,
      isBookmarked: userId ? (question as any).bookmarks?.length > 0 : false,
      bookmarks: undefined,
    };
  }

  async update(id: string, userId: string, dto: UpdateQuestionDto) {
    const question = await this.prisma.question.findFirst({ where: { id, isDeleted: false } });
    if (!question) throw new NotFoundException('Question not found');
    if (question.authorId !== userId) throw new ForbiddenException('Not the author');

    return this.prisma.question.update({
      where: { id },
      data: { ...dto },
      include: { author: { select: { id: true, username: true, name: true, avatarUrl: true } }, images: true },
    });
  }

  async remove(id: string, userId: string, isAdmin = false) {
    const question = await this.prisma.question.findFirst({ where: { id, isDeleted: false } });
    if (!question) throw new NotFoundException('Question not found');
    if (!isAdmin && question.authorId !== userId) throw new ForbiddenException('Not the author');
    return this.prisma.question.update({ where: { id }, data: { isDeleted: true } });
  }

  async toggleBookmark(userId: string, questionId: string) {
    const question = await this.prisma.question.findFirst({ where: { id: questionId, isDeleted: false } });
    if (!question) throw new NotFoundException('Question not found');

    const existing = await this.prisma.bookmark.findUnique({
      where: { userId_questionId: { userId, questionId } },
    });
    if (existing) {
      await this.prisma.bookmark.delete({ where: { userId_questionId: { userId, questionId } } });
      return { bookmarked: false };
    }
    await this.prisma.bookmark.create({ data: { userId, questionId } });
    return { bookmarked: true };
  }

  async getDistinctExams() {
    const result = await this.prisma.question.findMany({
      where: { isDeleted: false },
      select: { examName: true, examYear: true },
      distinct: ['examName'],
      orderBy: { examName: 'asc' },
    });
    return result;
  }

  // M-1 fix: Use raw SQL with UNNEST + GROUP BY instead of loading all questions into memory
  // This scales to millions of questions without performance degradation
  async getPopularTags(limit = 20): Promise<{ tag: string; count: number }[]> {
    const result = await this.prisma.$queryRaw<{ tag: string; count: bigint }[]>`
      SELECT tag, COUNT(*) as count
      FROM questions, UNNEST(tags) AS tag
      WHERE is_deleted = false
      GROUP BY tag
      ORDER BY count DESC
      LIMIT ${limit}
    `;
    // BigInt from raw SQL must be converted to number for JSON serialisation
    return result.map((r) => ({ tag: r.tag, count: Number(r.count) }));
  }
}

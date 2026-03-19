import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { username: dto.username }] },
    });
    if (existing) {
      throw new ConflictException(
        existing.email === dto.email ? 'Email already registered' : 'Username already taken',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        name: dto.name,
        passwordHash,
        emailVerified: false,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) return null;
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return null;
    if (user.isBanned) throw new UnauthorizedException('Account has been suspended');
    return user;
  }

  async login(user: any) {
    const tokens = await this.generateTokens(user.id, user.email);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  async googleLogin(googleUser: any) {
    let user = await this.prisma.user.findUnique({ where: { googleId: googleUser.googleId } });

    if (!user) {
      user = await this.prisma.user.findUnique({ where: { email: googleUser.email } });
      if (user) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { googleId: googleUser.googleId, avatarUrl: googleUser.avatarUrl || user.avatarUrl },
        });
      } else {
        const username = await this.generateUniqueUsername(googleUser.name);
        user = await this.prisma.user.create({
          data: {
            googleId: googleUser.googleId,
            email: googleUser.email,
            name: googleUser.name,
            username,
            avatarUrl: googleUser.avatarUrl,
            emailVerified: true,
          },
        });
      }
    }

    const tokens = await this.generateTokens(user.id, user.email);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  /**
   * C-2 fix: Generate a short-lived one-time code stored in the DB instead of putting
   * tokens directly in the redirect URL. The client exchanges this code within 2 minutes.
   */
  async createOAuthCode(userId: string): Promise<string> {
    const code = uuidv4();
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes
    // Reuse the RefreshToken table with a special marker prefix to avoid schema changes
    await this.prisma.refreshToken.create({
      data: { token: `oauth_code:${code}`, userId, expiresAt },
    });
    return code;
  }

  /**
   * C-2 fix: Exchange a one-time OAuth code for real auth tokens.
   * Code is deleted immediately after use (truly one-time).
   */
  async exchangeOAuthCode(code: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: `oauth_code:${code}` },
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired OAuth code');
    }

    // Delete immediately — one-time use
    await this.prisma.refreshToken.delete({ where: { token: `oauth_code:${code}` } });

    const user = await this.prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user || user.isBanned) throw new UnauthorizedException('User not found or banned');

    const tokens = await this.generateTokens(user.id, user.email);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  async refreshTokens(refreshToken: string) {
    const stored = await this.prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user || user.isBanned) throw new UnauthorizedException();

    // Rotate refresh token
    await this.prisma.refreshToken.delete({ where: { token: refreshToken } });
    return this.generateTokens(user.id, user.email);
  }

  async logout(refreshToken: string) {
    await this.prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    const accessToken = this.jwt.sign(payload);
    const refreshToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: { token: refreshToken, userId, expiresAt },
    });

    return { accessToken, refreshToken };
  }

  private async generateUniqueUsername(name: string): Promise<string> {
    const base = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    let username = base;
    let i = 1;
    while (await this.prisma.user.findUnique({ where: { username } })) {
      username = `${base}_${i++}`;
    }
    return username;
  }

  // L-4 fix: make sanitizeUser private
  private sanitizeUser(user: any) {
    const { passwordHash, googleId, ...safe } = user;
    return safe;
  }
}

import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../../../src/modules/auth/auth.service';
import { PrismaService } from '../../../src/shared/prisma/prisma.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPrismaService = {
  user: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  refreshToken: {
    create: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock-access-token'),
};

const mockConfigService = {
  get: jest.fn().mockReturnValue('http://localhost:3000'),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  // ─── register ──────────────────────────────────────────────────────────────

  describe('register', () => {
    const dto = { email: 'user@test.com', username: 'testuser', password: 'P@ssw0rd!', name: 'Test User' };

    it('should register a new user and return tokens', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: 'uuid-1',
        email: dto.email,
        username: dto.username,
        name: dto.name,
        passwordHash: 'hashed',
        googleId: null,
        emailVerified: false,
        isBanned: false,
        isAdmin: false,
        reputation: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        bio: null,
        avatarUrl: null,
        skills: [],
        subjects: [],
        education: null,
      });
      mockPrismaService.refreshToken.create.mockResolvedValue({});

      const result = await service.register(dto);

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(dto.email);
      // sanitizeUser ran — passwordHash and googleId should NOT be on the response
      expect(result.user.passwordHash).toBeUndefined();
      expect(result.user.googleId).toBeUndefined();
      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBeDefined();
    });

    it('should throw ConflictException if email already exists', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({ email: dto.email, username: 'other' });
      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if username already exists', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({ email: 'other@test.com', username: dto.username });
      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });
  });

  // ─── validateUser ──────────────────────────────────────────────────────────

  describe('validateUser', () => {
    const passwordHash = bcrypt.hashSync('correct-password', 10);

    it('should return user when credentials are correct', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'uuid-1', email: 'u@test.com', passwordHash, isBanned: false,
      });
      const result = await service.validateUser('u@test.com', 'correct-password');
      expect(result).toBeDefined();
      expect(result?.id).toBe('uuid-1');
    });

    it('should return null when password is wrong', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'uuid-1', email: 'u@test.com', passwordHash, isBanned: false,
      });
      const result = await service.validateUser('u@test.com', 'wrong-password');
      expect(result).toBeNull();
    });

    it('should return null when user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      const result = await service.validateUser('nobody@test.com', 'anything');
      expect(result).toBeNull();
    });

    it('should throw UnauthorizedException when user is banned', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'uuid-1', email: 'u@test.com', passwordHash, isBanned: true,
      });
      await expect(service.validateUser('u@test.com', 'correct-password')).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── refreshTokens ─────────────────────────────────────────────────────────

  describe('refreshTokens', () => {
    it('should rotate refresh token and return new tokens', async () => {
      const futureDate = new Date(Date.now() + 10_000);
      mockPrismaService.refreshToken.findUnique.mockResolvedValue({
        token: 'old-refresh', userId: 'uuid-1', expiresAt: futureDate,
      });
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'uuid-1', email: 'u@test.com', isBanned: false });
      mockPrismaService.refreshToken.delete.mockResolvedValue({});
      mockPrismaService.refreshToken.create.mockResolvedValue({});

      const result = await service.refreshTokens('old-refresh');
      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBeDefined();
      // Ensure old token was deleted (rotation)
      expect(mockPrismaService.refreshToken.delete).toHaveBeenCalledWith({ where: { token: 'old-refresh' } });
    });

    it('should throw UnauthorizedException for expired refresh token', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue({
        token: 'old-refresh', userId: 'uuid-1', expiresAt: new Date(Date.now() - 1000),
      });
      await expect(service.refreshTokens('old-refresh')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when token is not found', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue(null);
      await expect(service.refreshTokens('nonexistent')).rejects.toThrow(UnauthorizedException);
    });
  });
});

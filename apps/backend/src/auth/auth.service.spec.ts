import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;

  const mockUser = {
    id: 'user-uuid-1',
    email: 'test@restaurant.com',
    fullName: 'Test User',
    passwordHash: '',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    roles: [
      {
        role: {
          name: 'CAISSIER',
          permissions: [
            { permission: { action: 'read', resource: 'orders' } },
            { permission: { action: 'create', resource: 'orders' } },
          ],
        },
      },
    ],
  };

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      create: jest.fn().mockResolvedValue({ id: 'token-id', token: 'refresh-token' }),
      findUnique: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue('mock-access-token'),
  };

  const mockConfigService = {
    get: jest.fn((key: string, fallback?: any) => {
      const map: Record<string, string> = {
        JWT_ACCESS_SECRET: 'test-secret',
        JWT_REFRESH_SECRET: 'test-refresh-secret',
        JWT_ACCESS_EXPIRES_IN: '15m',
        JWT_REFRESH_EXPIRES_IN: '7d',
      };
      return map[key] ?? fallback;
    }),
  };

  beforeAll(async () => {
    mockUser.passwordHash = await bcrypt.hash('password123', 12);
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  // ── Login ─────────────────────────────────────────────────
  describe('login', () => {
    it('should return tokens and user on valid credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.login({ email: mockUser.email, password: 'password123' });

      expect(result.accessToken).toBe('mock-access-token');
      expect(result.user.email).toBe(mockUser.email);
      expect(result.user.roles).toContain('CAISSIER');
      expect(result.user.permissions).toContain('read:orders');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'unknown@test.com', password: 'any' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException on wrong password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.login({ email: mockUser.email, password: 'wrong-password' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw ForbiddenException if user is disabled', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, isActive: false });

      await expect(
        service.login({ email: mockUser.email, password: 'password123' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ── Logout ────────────────────────────────────────────────
  describe('logout', () => {
    it('should delete specific refresh token', async () => {
      await service.logout(mockUser.id, 'some-token');
      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { token: 'some-token', userId: mockUser.id },
      });
    });

    it('should delete all tokens when no refreshToken provided', async () => {
      await service.logout(mockUser.id);
      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
      });
    });
  });
});

import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RefreshTokenDto } from './dto/auth.dto';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { JwtPayload } from '../common/decorators/current-user.decorator';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // ── Login ─────────────────────────────────────────────────
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }
    if (!user.isActive) {
      throw new ForbiddenException('Votre compte a été désactivé');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const roles = user.roles.map((ur) => ur.role.name);
    const permissions: string[] = Array.from(
      new Set(
        user.roles.flatMap((ur) =>
          ur.role.permissions.map(
            (rp) => `${rp.permission.action}:${rp.permission.resource}`,
          ),
        ),
      ),
    );

    const tokens = await this.generateTokens(user.id, user.email, user.fullName, roles, permissions);

    this.logger.log(`User logged in: ${user.email}`);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        roles,
        permissions,
      },
    };
  }

  // ── Refresh Token ─────────────────────────────────────────
  async refreshTokens(dto: RefreshTokenDto) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: dto.refreshToken },
      include: {
        user: {
          include: {
            roles: {
              include: {
                role: {
                  include: {
                    permissions: { include: { permission: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!stored) throw new UnauthorizedException('Refresh token invalide');
    if (stored.expiresAt < new Date()) {
      await this.prisma.refreshToken.delete({ where: { id: stored.id } });
      throw new UnauthorizedException('Refresh token expiré');
    }
    if (!stored.user.isActive) {
      throw new ForbiddenException('Compte désactivé');
    }

    // Rotation : supprimer l'ancien, émettre un nouveau
    await this.prisma.refreshToken.delete({ where: { id: stored.id } });

    const roles = stored.user.roles.map((ur) => ur.role.name);
    const permissions: string[] = Array.from(
      new Set(
        stored.user.roles.flatMap((ur) =>
          ur.role.permissions.map(
            (rp) => `${rp.permission.action}:${rp.permission.resource}`,
          ),
        ),
      ),
    );

    return this.generateTokens(
      stored.user.id,
      stored.user.email,
      stored.user.fullName,
      roles,
      permissions,
    );
  }

  // ── Logout ────────────────────────────────────────────────
  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await this.prisma.refreshToken.deleteMany({
        where: { token: refreshToken, userId },
      });
    } else {
      // Révoquer tous les tokens de l'utilisateur
      await this.prisma.refreshToken.deleteMany({ where: { userId } });
    }
    this.logger.log(`User logged out: ${userId}`);
  }

  // ── Me ────────────────────────────────────────────────────
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    });

    if (!user) throw new NotFoundException('Utilisateur introuvable');

    const roles = user.roles.map((ur) => ur.role.name);
    const permissions: string[] = Array.from(
      new Set(
        user.roles.flatMap((ur) =>
          ur.role.permissions.map(
            (rp) => `${rp.permission.action}:${rp.permission.resource}`,
          ),
        ),
      ),
    );

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      isActive: user.isActive,
      createdAt: user.createdAt,
      roles,
      permissions,
    };
  }

  // ── Private helpers ───────────────────────────────────────
  private async generateTokens(
    userId: string,
    email: string,
    fullName: string,
    roles: string[],
    permissions: string[],
  ) {
    const payload: JwtPayload = { sub: userId, email, fullName, roles, permissions };

    const [accessToken, refreshTokenValue] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN', '15m'),
      }),
      uuidv4(),
    ]);

    const expiresIn = this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d');
    const expiresAt = this.parseExpiry(expiresIn);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshTokenValue,
        userId,
        expiresAt,
      },
    });

    return { accessToken, refreshToken: refreshTokenValue };
  }

  private parseExpiry(expiresIn: string): Date {
    const now = new Date();
    const unit = expiresIn.slice(-1);
    const value = parseInt(expiresIn.slice(0, -1), 10);
    if (unit === 'd') now.setDate(now.getDate() + value);
    else if (unit === 'h') now.setHours(now.getHours() + value);
    else if (unit === 'm') now.setMinutes(now.getMinutes() + value);
    return now;
  }
}

// ============================================================
// roles.service.ts
// ============================================================
import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

// ── DTOs inline ───────────────────────────────────────────────
export class CreateRoleDto {
  @ApiProperty({ example: 'SERVEUR' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  permissionIds?: string[];
}

export class UpdateRoleDto extends PartialType(CreateRoleDto) {}

export class CreatePermissionDto {
  @ApiProperty({ example: 'create' })
  @IsString()
  @IsNotEmpty()
  action: string;

  @ApiProperty({ example: 'orders' })
  @IsString()
  @IsNotEmpty()
  resource: string;
}

// ── Service ───────────────────────────────────────────────────
@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async findAllRoles() {
    return this.prisma.role.findMany({
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOneRole(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: { permissions: { include: { permission: true } } },
    });
    if (!role) throw new NotFoundException('Rôle introuvable');
    return role;
  }

  async createRole(dto: CreateRoleDto) {
    const exists = await this.prisma.role.findUnique({ where: { name: dto.name } });
    if (exists) throw new ConflictException('Ce nom de rôle existe déjà');

    return this.prisma.role.create({
      data: {
        name: dto.name.toUpperCase(),
        description: dto.description,
        permissions: dto.permissionIds?.length
          ? { create: dto.permissionIds.map((permissionId) => ({ permissionId })) }
          : undefined,
      },
      include: { permissions: { include: { permission: true } } },
    });
  }

  async updateRole(id: string, dto: UpdateRoleDto) {
    await this.findOneRole(id);

    if (dto.permissionIds !== undefined) {
      await this.prisma.rolePermission.deleteMany({ where: { roleId: id } });
    }

    return this.prisma.role.update({
      where: { id },
      data: {
        name: dto.name?.toUpperCase(),
        description: dto.description,
        permissions: dto.permissionIds
          ? { create: dto.permissionIds.map((permissionId) => ({ permissionId })) }
          : undefined,
      },
      include: { permissions: { include: { permission: true } } },
    });
  }

  async deleteRole(id: string) {
    await this.findOneRole(id);
    await this.prisma.role.delete({ where: { id } });
    return { message: 'Rôle supprimé' };
  }

  async findAllPermissions() {
    return this.prisma.permission.findMany({ orderBy: [{ resource: 'asc' }, { action: 'asc' }] });
  }

  async createPermission(dto: CreatePermissionDto) {
    const exists = await this.prisma.permission.findUnique({
      where: { action_resource: { action: dto.action, resource: dto.resource } },
    });
    if (exists) throw new ConflictException('Cette permission existe déjà');

    return this.prisma.permission.create({ data: dto });
  }
}

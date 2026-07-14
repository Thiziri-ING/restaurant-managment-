import { Injectable } from '@nestjs/common';
import { Controller, Get, Module, Query } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto, paginate, getSkip } from '../common/dto/pagination.dto';
import { CanRead } from '../common/decorators/permissions.decorator';

interface AuditLogEvent {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string | null;
  oldValue?: any;
  newValue?: any;
  ip?: string | null;
}

// ── Service ───────────────────────────────────────────────────
@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  @OnEvent('audit.log')
  async handleAuditLog(event: AuditLogEvent) {
    await this.prisma.auditLog.create({
      data: {
        userId: event.userId,
        action: event.action,
        resource: event.resource,
        resourceId: event.resourceId ?? null,
        oldValue: event.oldValue ?? undefined,
        newValue: event.newValue ?? undefined,
        ip: event.ip ?? null,
      },
    });
  }

  async findAll(dto: { page?: number; limit?: number; search?: string } & { resource?: string; userId?: string }) {
    const where: any = {};
    if (dto.resource) where.resource = dto.resource;
    if (dto.userId) where.userId = dto.userId;

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: { user: { select: { fullName: true, email: true } } },
        skip: getSkip(dto),
        take: dto.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return paginate(data, total, dto);
  }
}

// ── Controller ────────────────────────────────────────────────
@ApiTags('Audit')
@ApiBearerAuth('access-token')
@Controller('audit-logs')
export class AuditController {
  constructor(private service: AuditService) {}

  @Get()
  @CanRead('audit')
  @ApiOperation({ summary: 'Journal d\'audit (filtrable par ressource / utilisateur)' })
  findAll(
    @Query() dto: PaginationDto,
    @Query('resource') resource?: string,
    @Query('userId') userId?: string,
  ) {
    return this.service.findAll({ ...dto, resource, userId });
  }
}

// ── Module ────────────────────────────────────────────────────
@Module({
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}

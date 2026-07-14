import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  Body,
  Controller,
  Delete,
  Get,
  Module,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags, PartialType } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ReservationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto, paginate, getSkip } from '../common/dto/pagination.dto';
import { CanCreate, CanDelete, CanRead, CanUpdate } from '../common/decorators/permissions.decorator';

// ── DTOs ──────────────────────────────────────────────────────
export class CreateReservationDto {
  @ApiProperty({ example: 'Karim Benali' })
  @IsString()
  @IsNotEmpty()
  clientName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty()
  @IsDateString()
  dateTime: string;

  @ApiProperty({ example: 4 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  guestCount: number;

  @ApiPropertyOptional({ example: 90, default: 60 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(15)
  durationMin?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty()
  @IsUUID()
  tableId: string;
}

export class UpdateReservationDto extends PartialType(CreateReservationDto) {}

export class UpdateReservationStatusDto {
  @ApiProperty({ enum: ReservationStatus })
  @IsEnum(ReservationStatus)
  status: ReservationStatus;
}

// ── Service ───────────────────────────────────────────────────
@Injectable()
export class ReservationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(dto: { page?: number; limit?: number; search?: string } & { date?: string }) {
    const where: any = {};
    if (dto.search) where.clientName = { contains: dto.search, mode: 'insensitive' };
    if (dto.date) {
      const start = new Date(dto.date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(dto.date);
      end.setHours(23, 59, 59, 999);
      where.dateTime = { gte: start, lte: end };
    }

    const [data, total] = await Promise.all([
      this.prisma.reservation.findMany({
        where,
        include: { table: { include: { zone: true } } },
        skip: getSkip(dto),
        take: dto.limit,
        orderBy: { dateTime: 'asc' },
      }),
      this.prisma.reservation.count({ where }),
    ]);
    return paginate(data, total, dto);
  }

  async findOne(id: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: { table: { include: { zone: true } } },
    });
    if (!reservation) throw new NotFoundException('Réservation introuvable');
    return reservation;
  }

  async create(dto: CreateReservationDto) {
    // Vérifier les conflits d'horaire sur la même table
    const requestedStart = new Date(dto.dateTime);
    const duration = dto.durationMin ?? 60;
    const requestedEnd = new Date(requestedStart.getTime() + duration * 60000);

    const existing = await this.prisma.reservation.findMany({
      where: {
        tableId: dto.tableId,
        status: 'CONFIRMED',
      },
    });

    const hasConflict = existing.some((r) => {
      const existingStart = new Date(r.dateTime);
      const existingEnd = new Date(existingStart.getTime() + r.durationMin * 60000);
      return requestedStart < existingEnd && requestedEnd > existingStart;
    });

    if (hasConflict) {
      throw new BadRequestException('Cette table est déjà réservée sur ce créneau');
    }

    const reservation = await this.prisma.reservation.create({
      data: {
        clientName: dto.clientName,
        phone: dto.phone,
        dateTime: requestedStart,
        guestCount: dto.guestCount,
        durationMin: duration,
        notes: dto.notes,
        tableId: dto.tableId,
      },
      include: { table: { include: { zone: true } } },
    });

    await this.prisma.restaurantTable.update({
      where: { id: dto.tableId },
      data: { status: 'RESERVED' },
    });

    return reservation;
  }

  async update(id: string, dto: UpdateReservationDto) {
    await this.findOne(id);
    return this.prisma.reservation.update({
      where: { id },
      data: {
        ...dto,
        dateTime: dto.dateTime ? new Date(dto.dateTime) : undefined,
      },
      include: { table: { include: { zone: true } } },
    });
  }

  async updateStatus(id: string, dto: UpdateReservationStatusDto) {
    const reservation = await this.findOne(id);
    const updated = await this.prisma.reservation.update({
      where: { id },
      data: { status: dto.status },
      include: { table: { include: { zone: true } } },
    });

    if (dto.status === 'CANCELLED' || dto.status === 'COMPLETED') {
      await this.prisma.restaurantTable.update({
        where: { id: reservation.tableId },
        data: { status: 'FREE' },
      });
    }

    return updated;
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.reservation.delete({ where: { id } });
    return { message: 'Réservation supprimée' };
  }
}

// ── Controller ────────────────────────────────────────────────
@ApiTags('Réservations')
@ApiBearerAuth('access-token')
@Controller('reservations')
export class ReservationsController {
  constructor(private service: ReservationsService) {}

  @Get()
  @CanRead('reservations')
  @ApiOperation({ summary: 'Liste des réservations (filtrable par date)' })
  findAll(@Query() dto: PaginationDto, @Query('date') date?: string) {
    return this.service.findAll({ ...dto, date });
  }

  @Get(':id')
  @CanRead('reservations')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @CanCreate('reservations')
  create(@Body() dto: CreateReservationDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @CanUpdate('reservations')
  update(@Param('id') id: string, @Body() dto: UpdateReservationDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/status')
  @CanUpdate('reservations')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateReservationStatusDto) {
    return this.service.updateStatus(id, dto);
  }

  @Delete(':id')
  @CanDelete('reservations')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

// ── Module ────────────────────────────────────────────────────
@Module({
  controllers: [ReservationsController],
  providers: [ReservationsService],
  exports: [ReservationsService],
})
export class ReservationsModule {}

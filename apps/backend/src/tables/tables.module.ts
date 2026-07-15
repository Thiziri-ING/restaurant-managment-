import {
  Injectable,
  ConflictException,
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
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { OrderStatus, TableStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CanCreate, CanDelete, CanRead, CanUpdate } from '../common/decorators/permissions.decorator';

// ── DTOs ──────────────────────────────────────────────────────
export class CreateTableDto {
  @ApiProperty({ example: 'T-12' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @ApiProperty()
  @IsUUID()
  zoneId: string;
}

export class UpdateTableDto extends PartialType(CreateTableDto) {}

export class UpdateTableStatusDto {
  @ApiProperty({ enum: TableStatus })
  @IsEnum(TableStatus)
  status: TableStatus;
}

export class MergeTablesDto {
  @ApiProperty({ type: [String], description: 'IDs des tables à fusionner' })
  @IsUUID('4', { each: true })
  tableIds: string[];
}

export class TransferOrderDto {
  @ApiProperty()
  @IsUUID()
  orderId: string;

  @ApiProperty()
  @IsUUID()
  toTableId: string;
}

// ── Service ───────────────────────────────────────────────────
const TABLE_INCLUDE = {
  zone: true,
  orders: {
    where: { status: { in: ['PENDING', 'PREPARING', 'SERVED'] as OrderStatus[] } },
    include: { items: { include: { menuItem: true } } },
  },
};

@Injectable()
export class TablesService {
  constructor(private prisma: PrismaService) {}

  async findAll(zoneId?: string) {
    return this.prisma.restaurantTable.findMany({
      where: zoneId ? { zoneId } : undefined,
      include: TABLE_INCLUDE,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const table = await this.prisma.restaurantTable.findUnique({
      where: { id },
      include: TABLE_INCLUDE,
    });
    if (!table) throw new NotFoundException('Table introuvable');
    return table;
  }

  create(dto: CreateTableDto) {
    return this.prisma.restaurantTable.create({
      data: { ...dto, capacity: dto.capacity ?? 4 },
      include: { zone: true },
    });
  }

  async update(id: string, dto: UpdateTableDto) {
    await this.findOne(id);
    return this.prisma.restaurantTable.update({
      where: { id },
      data: dto,
      include: { zone: true },
    });
  }

  async updateStatus(id: string, dto: UpdateTableStatusDto) {
    await this.findOne(id);
    return this.prisma.restaurantTable.update({
      where: { id },
      data: { status: dto.status },
      include: { zone: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.restaurantTable.delete({ where: { id } });
    return { message: 'Table supprimée' };
  }

  // ── Fusion de tables ───────────────────────────────────────
  // Combine plusieurs commandes actives de tables différentes en une seule
  async mergeTables(dto: MergeTablesDto) {
    if (dto.tableIds.length < 2) {
      throw new BadRequestException('Il faut au moins 2 tables à fusionner');
    }

    const tables = await this.prisma.restaurantTable.findMany({
      where: { id: { in: dto.tableIds } },
      include: {
        orders: { where: { status: { in: ['PENDING', 'PREPARING'] as OrderStatus[] } } },
      },
    });

    if (tables.length !== dto.tableIds.length) {
      throw new NotFoundException('Une ou plusieurs tables sont introuvables');
    }

    const [mainTable, ...otherTables] = tables;
    const mainOrder = mainTable.orders[0];

    if (!mainOrder) {
      throw new BadRequestException('La table principale n\'a pas de commande active');
    }

    return this.prisma.$transaction(async (tx) => {
      // Transférer tous les items des autres commandes vers la commande principale
      for (const table of otherTables) {
        for (const order of table.orders) {
          await tx.orderItem.updateMany({
            where: { orderId: order.id },
            data: { orderId: mainOrder.id },
          });
          await tx.order.delete({ where: { id: order.id } });
        }
        await tx.restaurantTable.update({
          where: { id: table.id },
          data: { status: 'FREE' },
        });
      }

      return tx.order.findUnique({
        where: { id: mainOrder.id },
        include: { items: { include: { menuItem: true } }, table: true },
      });
    });
  }

  // ── Transfert de commande vers une autre table ────────────
  async transferOrder(dto: TransferOrderDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { table: true },
    });
    if (!order) throw new NotFoundException('Commande introuvable');

    const targetTable = await this.findOne(dto.toTableId);
    if (targetTable.status === 'OCCUPIED') {
      throw new BadRequestException('La table cible est déjà occupée');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: dto.orderId },
        data: { tableId: dto.toTableId },
      });

      if (order.tableId) {
        await tx.restaurantTable.update({
          where: { id: order.tableId },
          data: { status: 'FREE' },
        });
      }

      await tx.restaurantTable.update({
        where: { id: dto.toTableId },
        data: { status: 'OCCUPIED' },
      });

      return tx.order.findUnique({
        where: { id: dto.orderId },
        include: { table: true, items: { include: { menuItem: true } } },
      });
    });
  }
}

// ── Controller ────────────────────────────────────────────────
@ApiTags('Tables')
@ApiBearerAuth('access-token')
@Controller('tables')
export class TablesController {
  constructor(private service: TablesService) {}

  @Get()
  @CanRead('tables')
  @ApiOperation({ summary: 'Liste des tables (filtrable par zone)' })
  findAll(@Query('zoneId') zoneId?: string) {
    return this.service.findAll(zoneId);
  }

  @Get(':id')
  @CanRead('tables')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @CanCreate('tables')
  create(@Body() dto: CreateTableDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @CanUpdate('tables')
  update(@Param('id') id: string, @Body() dto: UpdateTableDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/status')
  @CanUpdate('tables')
  @ApiOperation({ summary: 'Changer le statut d\'une table' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateTableStatusDto) {
    return this.service.updateStatus(id, dto);
  }

  @Delete(':id')
  @CanDelete('tables')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post('merge')
  @CanUpdate('tables')
  @ApiOperation({ summary: 'Fusionner plusieurs tables en une commande' })
  merge(@Body() dto: MergeTablesDto) {
    return this.service.mergeTables(dto);
  }

  @Post('transfer')
  @CanUpdate('tables')
  @ApiOperation({ summary: 'Transférer une commande vers une autre table' })
  transfer(@Body() dto: TransferOrderDto) {
    return this.service.transferOrder(dto);
  }
}

// ── Module ────────────────────────────────────────────────────
@Module({
  controllers: [TablesController],
  providers: [TablesService],
  exports: [TablesService],
})
export class TablesModule {}

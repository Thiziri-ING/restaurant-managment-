// ── DTOs ──────────────────────────────────────────────────────
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto, paginate, getSkip } from '../../common/dto/pagination.dto';
import { CanCreate, CanRead } from '../../common/decorators/permissions.decorator';

export class StockOutputItemDto {
  @ApiProperty()
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 5 })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  quantity: number;
}

export class CreateStockOutputDto {
  @ApiProperty({ example: 'Utilisation cuisine' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [StockOutputItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StockOutputItemDto)
  items: StockOutputItemDto[];
}

const OUTPUT_INCLUDE = {
  items: { include: { product: { include: { category: true } } } },
} as const;

// ── Service ───────────────────────────────────────────────────
@Injectable()
export class StockOutputsService {
  constructor(private prisma: PrismaService) {}

  async findAll(dto: PaginationDto) {
    const [data, total] = await Promise.all([
      this.prisma.stockOutput.findMany({
        include: OUTPUT_INCLUDE,
        skip: getSkip(dto),
        take: dto.limit,
        orderBy: { outputDate: 'desc' },
      }),
      this.prisma.stockOutput.count(),
    ]);
    return paginate(data, total, dto);
  }

  async findOne(id: string) {
    const output = await this.prisma.stockOutput.findUnique({
      where: { id },
      include: OUTPUT_INCLUDE,
    });
    if (!output) throw new NotFoundException('Sortie de stock introuvable');
    return output;
  }

  async create(dto: CreateStockOutputDto) {
    // Vérifier les quantités disponibles
    for (const item of dto.items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
      });
      if (!product) throw new NotFoundException(`Produit ${item.productId} introuvable`);
      if (Number(product.currentQty) < item.quantity) {
        throw new BadRequestException(
          `Stock insuffisant pour "${product.name}": disponible=${product.currentQty}, demandé=${item.quantity}`,
        );
      }
    }

    // Transaction
    return this.prisma.$transaction(async (tx) => {
      const output = await tx.stockOutput.create({
        data: {
          reason: dto.reason,
          notes: dto.notes,
          items: {
            create: dto.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
          },
        },
        include: OUTPUT_INCLUDE,
      });

      // Décrémenter les quantités
      for (const item of dto.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { currentQty: { decrement: item.quantity } },
        });
      }

      return output;
    });
  }
}

// ── Controller ────────────────────────────────────────────────
@ApiTags('Stock — Sorties')
@ApiBearerAuth('access-token')
@Controller('stock/outputs')
export class StockOutputsController {
  constructor(private service: StockOutputsService) {}

  @Get()
  @CanRead('stock')
  @ApiOperation({ summary: 'Historique des sorties de stock' })
  findAll(@Query() dto: PaginationDto) {
    return this.service.findAll(dto);
  }

  @Get(':id')
  @CanRead('stock')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @CanCreate('stock')
  @ApiOperation({ summary: 'Saisir une sortie de stock' })
  create(@Body() dto: CreateStockOutputDto) {
    return this.service.create(dto);
  }
}

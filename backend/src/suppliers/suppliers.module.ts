import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  Body,
  Controller,
  Delete,
  Get,
  Module,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiPropertyOptional, ApiTags, PartialType } from '@nestjs/swagger';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto, paginate, getSkip } from '../common/dto/pagination.dto';
import { CanCreate, CanDelete, CanRead, CanUpdate } from '../common/decorators/permissions.decorator';

// ── DTOs ──────────────────────────────────────────────────────
export class CreateSupplierDto {
  @ApiProperty({ example: 'Fournisseur Général SARL' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;
}

export class UpdateSupplierDto extends PartialType(CreateSupplierDto) {}

// ── Service ───────────────────────────────────────────────────
@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  async findAll(dto: PaginationDto) {
    const where = {
      isActive: true,
      ...(dto.search && {
        name: { contains: dto.search, mode: 'insensitive' as const },
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        skip: getSkip(dto),
        take: dto.limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.supplier.count({ where }),
    ]);
    return paginate(data, total, dto);
  }

  async findOne(id: string) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id } });
    if (!supplier) throw new NotFoundException('Fournisseur introuvable');
    return supplier;
  }

  create(dto: CreateSupplierDto) {
    return this.prisma.supplier.create({ data: dto });
  }

  async update(id: string, dto: UpdateSupplierDto) {
    await this.findOne(id);
    return this.prisma.supplier.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.supplier.update({ where: { id }, data: { isActive: false } });
    return { message: 'Fournisseur supprimé' };
  }
}

// ── Controller ────────────────────────────────────────────────
@ApiTags('Fournisseurs')
@ApiBearerAuth('access-token')
@Controller('suppliers')
export class SuppliersController {
  constructor(private service: SuppliersService) {}

  @Get()
  @CanRead('stock')
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
  @ApiOperation({ summary: 'Créer un fournisseur' })
  create(@Body() dto: CreateSupplierDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @CanUpdate('stock')
  update(@Param('id') id: string, @Body() dto: UpdateSupplierDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @CanDelete('stock')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

// ── Module ────────────────────────────────────────────────────
@Module({
  controllers: [SuppliersController],
  providers: [SuppliersService],
  exports: [SuppliersService],
})
export class SuppliersModule {}

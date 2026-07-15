import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { CanCreate, CanDelete, CanRead, CanUpdate } from '../../common/decorators/permissions.decorator';

export class CreateStockCategoryDto {
  @ApiProperty({ example: 'Boissons' })
  @IsString()
  @IsNotEmpty()
  name: string;
}

@Injectable()
export class StockCategoriesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.stockCategory.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.stockCategory.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Catégorie introuvable');
    return category;
  }

  async create(dto: CreateStockCategoryDto) {
    const exists = await this.prisma.stockCategory.findUnique({ where: { name: dto.name } });
    if (exists) throw new ConflictException('Cette catégorie existe déjà');
    return this.prisma.stockCategory.create({ data: dto });
  }

  async update(id: string, dto: CreateStockCategoryDto) {
    await this.findOne(id);
    return this.prisma.stockCategory.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.stockCategory.delete({ where: { id } });
    return { message: 'Catégorie supprimée' };
  }
}

@ApiTags('Stock — Catégories')
@ApiBearerAuth('access-token')
@Controller('stock/categories')
export class StockCategoriesController {
  constructor(private service: StockCategoriesService) {}

  @Get()
  @CanRead('stock')
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @CanCreate('stock')
  create(@Body() dto: CreateStockCategoryDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @CanUpdate('stock')
  update(@Param('id') id: string, @Body() dto: CreateStockCategoryDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @CanDelete('stock')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

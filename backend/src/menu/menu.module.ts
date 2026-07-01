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
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto, paginate, getSkip } from '../common/dto/pagination.dto';
import { CanCreate, CanDelete, CanRead, CanUpdate } from '../common/decorators/permissions.decorator';

// ── DTOs ──────────────────────────────────────────────────────
export class CreateMenuCategoryDto {
  @ApiProperty({ example: 'Plats principaux' })
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class CreateMenuItemDto {
  @ApiProperty({ example: 'Couscous Royal' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 1200 })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  available?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty()
  @IsUUID()
  categoryId: string;
}

export class UpdateMenuItemDto extends PartialType(CreateMenuItemDto) {}

export class ToggleAvailabilityDto {
  @ApiProperty()
  @IsBoolean()
  available: boolean;
}

// ── Categories Service ───────────────────────────────────────
@Injectable()
export class MenuCategoriesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.menuCategory.findMany({
      include: { _count: { select: { items: true } } },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.menuCategory.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Catégorie introuvable');
    return category;
  }

  async create(dto: CreateMenuCategoryDto) {
    const exists = await this.prisma.menuCategory.findUnique({ where: { name: dto.name } });
    if (exists) throw new ConflictException('Cette catégorie existe déjà');
    return this.prisma.menuCategory.create({ data: dto });
  }

  async update(id: string, dto: CreateMenuCategoryDto) {
    await this.findOne(id);
    return this.prisma.menuCategory.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.menuCategory.delete({ where: { id } });
    return { message: 'Catégorie supprimée' };
  }
}

// ── Items Service ────────────────────────────────────────────
@Injectable()
export class MenuItemsService {
  constructor(private prisma: PrismaService) {}

  async findAll(dto: { page?: number; limit?: number; search?: string } & { categoryId?: string; available?: boolean }) {
    const where: any = {};
    if (dto.search) where.name = { contains: dto.search, mode: 'insensitive' };
    if (dto.categoryId) where.categoryId = dto.categoryId;
    if (dto.available !== undefined) where.available = dto.available;

    const [data, total] = await Promise.all([
      this.prisma.menuItem.findMany({
        where,
        include: { category: true },
        skip: getSkip(dto),
        take: dto.limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.menuItem.count({ where }),
    ]);
    return paginate(data, total, dto);
  }

  async findOne(id: string) {
    const item = await this.prisma.menuItem.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!item) throw new NotFoundException('Plat introuvable');
    return item;
  }

  create(dto: CreateMenuItemDto) {
    return this.prisma.menuItem.create({
      data: { ...dto, available: dto.available ?? true },
      include: { category: true },
    });
  }

  async update(id: string, dto: UpdateMenuItemDto) {
    await this.findOne(id);
    return this.prisma.menuItem.update({
      where: { id },
      data: dto,
      include: { category: true },
    });
  }

  async toggleAvailability(id: string, dto: ToggleAvailabilityDto) {
    await this.findOne(id);
    return this.prisma.menuItem.update({
      where: { id },
      data: { available: dto.available },
      include: { category: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.menuItem.delete({ where: { id } });
    return { message: 'Plat supprimé' };
  }
}

// ── Controllers ───────────────────────────────────────────────
@ApiTags('Menu — Catégories')
@ApiBearerAuth('access-token')
@Controller('menu/categories')
export class MenuCategoriesController {
  constructor(private service: MenuCategoriesService) {}

  @Get()
  @CanRead('menu')
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @CanCreate('menu')
  create(@Body() dto: CreateMenuCategoryDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @CanUpdate('menu')
  update(@Param('id') id: string, @Body() dto: CreateMenuCategoryDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @CanDelete('menu')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

@ApiTags('Menu — Plats')
@ApiBearerAuth('access-token')
@Controller('menu/items')
export class MenuItemsController {
  constructor(private service: MenuItemsService) {}

  @Get()
  @CanRead('menu')
  @ApiOperation({ summary: 'Liste des plats' })
  findAll(
    @Query() dto: PaginationDto,
    @Query('categoryId') categoryId?: string,
    @Query('available') available?: string,
  ) {
    return this.service.findAll({
      ...dto,
      categoryId,
      available: available !== undefined ? available === 'true' : undefined,
    });
  }

  @Get(':id')
  @CanRead('menu')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @CanCreate('menu')
  create(@Body() dto: CreateMenuItemDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @CanUpdate('menu')
  update(@Param('id') id: string, @Body() dto: UpdateMenuItemDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/availability')
  @CanUpdate('menu')
  @ApiOperation({ summary: 'Changer la disponibilité d\'un plat' })
  toggleAvailability(@Param('id') id: string, @Body() dto: ToggleAvailabilityDto) {
    return this.service.toggleAvailability(id, dto);
  }

  @Delete(':id')
  @CanDelete('menu')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

// ── Module ────────────────────────────────────────────────────
@Module({
  controllers: [MenuCategoriesController, MenuItemsController],
  providers: [MenuCategoriesService, MenuItemsService],
  exports: [MenuItemsService, MenuCategoriesService],
})
export class MenuModule {}

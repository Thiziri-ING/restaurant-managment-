import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CanCreate, CanRead, CanUpdate, CanDelete } from '../../common/decorators/permissions.decorator';

@ApiTags('Stock — Produits')
@ApiBearerAuth('access-token')
@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  @CanRead('products')
  @ApiOperation({ summary: 'Liste des produits de stock' })
  findAll(
    @Query() dto: PaginationDto,
    @Query('categoryId') categoryId?: string,
    @Query('alert') alert?: string,
    @Query('outOfStock') outOfStock?: string,
  ) {
    return this.productsService.findAll({
      ...dto,
      categoryId,
      alert: alert === 'true',
      outOfStock: outOfStock === 'true',
    });
  }

  @Get('alerts')
  @CanRead('products')
  @ApiOperation({ summary: 'Produits en rupture ou proche du seuil d\'alerte' })
  findAlerts() {
    return this.productsService.findAlertsRaw();
  }

  @Get(':id')
  @CanRead('products')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @CanCreate('products')
  @ApiOperation({ summary: 'Créer un produit' })
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Put(':id')
  @CanUpdate('products')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @CanDelete('products')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}

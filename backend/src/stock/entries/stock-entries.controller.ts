import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StockEntriesService } from './stock-entries.service';
import { CreateStockEntryDto } from './dto/stock-entry.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CanCreate, CanRead } from '../../common/decorators/permissions.decorator';

@ApiTags('Stock — Entrées')
@ApiBearerAuth('access-token')
@Controller('stock/entries')
export class StockEntriesController {
  constructor(private service: StockEntriesService) {}

  @Get()
  @CanRead('stock')
  @ApiOperation({ summary: 'Historique des entrées de stock' })
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
  @ApiOperation({ summary: 'Saisir une entrée de stock' })
  create(@Body() dto: CreateStockEntryDto) {
    return this.service.create(dto);
  }
}

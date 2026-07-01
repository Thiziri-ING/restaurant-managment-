import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import {
  CreateOrderDto,
  AddOrderItemsDto,
  UpdateOrderStatusDto,
  ApplyDiscountDto,
  ReturnOrderItemDto,
} from './dto/order.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CanCreate, CanRead, CanUpdate } from '../common/decorators/permissions.decorator';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@ApiTags('Commandes')
@ApiBearerAuth('access-token')
@Controller('orders')
export class OrdersController {
  constructor(private service: OrdersService) {}

  @Get()
  @CanRead('orders')
  @ApiOperation({ summary: 'Liste des commandes (filtres: statut, type, date)' })
  findAll(
    @Query() dto: PaginationDto,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('date') date?: string,
  ) {
    return this.service.findAll({ ...dto, status, type, date });
  }

  @Get('active')
  @CanRead('orders')
  @ApiOperation({ summary: 'Commandes actives (en cours)' })
  findActive() {
    return this.service.findActive();
  }

  @Get(':id')
  @CanRead('orders')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @CanCreate('orders')
  @ApiOperation({ summary: 'Créer une commande' })
  create(@Body() dto: CreateOrderDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(dto, user.sub);
  }

  @Post(':id/items')
  @CanUpdate('orders')
  @ApiOperation({ summary: 'Ajouter des articles à une commande' })
  addItems(@Param('id') id: string, @Body() dto: AddOrderItemsDto) {
    return this.service.addItems(id, dto);
  }

  @Delete(':id/items/:itemId')
  @CanUpdate('orders')
  removeItem(@Param('id') id: string, @Param('itemId') itemId: string) {
    return this.service.removeItem(id, itemId);
  }

  @Patch(':id/status')
  @CanUpdate('orders')
  @ApiOperation({ summary: 'Changer le statut d\'une commande' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.service.updateStatus(id, dto);
  }

  @Post(':id/discount')
  @CanUpdate('orders')
  @ApiOperation({ summary: 'Appliquer une remise à la commande' })
  applyDiscount(@Param('id') id: string, @Body() dto: ApplyDiscountDto) {
    return this.service.applyDiscount(id, dto);
  }

  @Post(':id/return')
  @CanUpdate('orders')
  @ApiOperation({ summary: 'Retourner un article (offert / non facturé)' })
  returnItem(@Param('id') id: string, @Body() dto: ReturnOrderItemDto) {
    return this.service.returnItem(id, dto);
  }
}

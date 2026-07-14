import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { OrderType, OrderStatus } from '@prisma/client';

export class CreateOrderItemDto {
  @ApiProperty()
  @IsUUID()
  menuItemId: string;

  @ApiProperty({ example: 2 })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  quantity: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discount?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  isOffer?: boolean;
}

export class CreateOrderDto {
  @ApiProperty({ enum: OrderType, default: 'DINE_IN' })
  @IsEnum(OrderType)
  type: OrderType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  tableId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [CreateOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}

export class AddOrderItemsDto {
  @ApiProperty({ type: [CreateOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus })
  @IsEnum(OrderStatus)
  status: OrderStatus;
}

export class ApplyDiscountDto {
  @ApiProperty({ example: 500, description: 'Montant de la remise (en unité monétaire)' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discount: number;
}

export class ReturnOrderItemDto {
  @ApiProperty()
  @IsUUID()
  orderItemId: string;

  @ApiProperty({ example: 'Plat froid' })
  @IsString()
  @IsNotEmpty()
  returnReason: string;
}

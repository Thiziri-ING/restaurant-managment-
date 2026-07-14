// ============================================================
// DTOs
// ============================================================
import {
  IsArray,
  IsDateString,
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

export class StockEntryItemDto {
  @ApiProperty()
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 50 })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiProperty({ example: 250 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class CreateStockEntryDto {
  @ApiProperty({ example: 'BON-2024-001' })
  @IsString()
  @IsNotEmpty()
  reference: string;

  @ApiProperty()
  @IsUUID()
  supplierId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  entryDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [StockEntryItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StockEntryItemDto)
  items: StockEntryItemDto[];
}

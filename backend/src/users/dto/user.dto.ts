import {
  IsEmail,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsArray,
  MinLength,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'Ali Meziane' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: 'ali@restaurant.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  roleIds?: string[];
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}

export class AssignRolesDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  roleIds: string[];
}

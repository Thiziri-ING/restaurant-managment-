import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Body, Controller, Delete, Get, Module, Param, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { CanCreate, CanDelete, CanRead, CanUpdate } from '../common/decorators/permissions.decorator';

export class CreateZoneDto {
  @ApiProperty({ example: 'Terrasse' })
  @IsString()
  @IsNotEmpty()
  name: string;
}

@Injectable()
export class ZonesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.zone.findMany({
      include: { _count: { select: { tables: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const zone = await this.prisma.zone.findUnique({ where: { id } });
    if (!zone) throw new NotFoundException('Zone introuvable');
    return zone;
  }

  async create(dto: CreateZoneDto) {
    const exists = await this.prisma.zone.findUnique({ where: { name: dto.name } });
    if (exists) throw new ConflictException('Cette zone existe déjà');
    return this.prisma.zone.create({ data: dto });
  }

  async update(id: string, dto: CreateZoneDto) {
    await this.findOne(id);
    return this.prisma.zone.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.zone.delete({ where: { id } });
    return { message: 'Zone supprimée' };
  }
}

@ApiTags('Zones')
@ApiBearerAuth('access-token')
@Controller('zones')
export class ZonesController {
  constructor(private service: ZonesService) {}

  @Get()
  @CanRead('tables')
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @CanCreate('tables')
  create(@Body() dto: CreateZoneDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @CanUpdate('tables')
  update(@Param('id') id: string, @Body() dto: CreateZoneDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @CanDelete('tables')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

@Module({
  controllers: [ZonesController],
  providers: [ZonesService],
  exports: [ZonesService],
})
export class ZonesModule {}

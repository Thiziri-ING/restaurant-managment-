import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import {
  Body,
  Controller,
  Get,
  Module,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CashMovementType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto, paginate, getSkip } from '../common/dto/pagination.dto';
import { CanCreate, CanRead } from '../common/decorators/permissions.decorator';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

// ── DTOs ──────────────────────────────────────────────────────
export class OpenCashRegisterDto {
  @ApiProperty({ example: 5000 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  openingAmount: number;
}

export class CloseCashRegisterDto {
  @ApiProperty({ example: 18500 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  closingAmount: number;
}

export class CashMovementDto {
  @ApiProperty({ enum: CashMovementType })
  @IsEnum(CashMovementType)
  type: CashMovementType;

  @ApiProperty({ example: 2000 })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

// ── Service ───────────────────────────────────────────────────
const REGISTER_INCLUDE = {
  user: { select: { id: true, fullName: true } },
  movements: { orderBy: { movedAt: 'desc' as const } },
} as const;

@Injectable()
export class CashRegisterService {
  constructor(private prisma: PrismaService) {}

  async getCurrentOpen(userId: string) {
    return this.prisma.cashRegister.findFirst({
      where: { userId, closedAt: null },
      include: REGISTER_INCLUDE,
    });
  }

  async open(userId: string, dto: OpenCashRegisterDto) {
    const existing = await this.getCurrentOpen(userId);
    if (existing) throw new ConflictException('Une caisse est déjà ouverte pour cet utilisateur');

    return this.prisma.cashRegister.create({
      data: { userId, openingAmount: dto.openingAmount },
      include: REGISTER_INCLUDE,
    });
  }

  async close(userId: string, dto: CloseCashRegisterDto) {
    const register = await this.getCurrentOpen(userId);
    if (!register) throw new NotFoundException('Aucune caisse ouverte pour cet utilisateur');

    return this.prisma.cashRegister.update({
      where: { id: register.id },
      data: { closingAmount: dto.closingAmount, closedAt: new Date() },
      include: REGISTER_INCLUDE,
    });
  }

  async addMovement(userId: string, dto: CashMovementDto) {
    const register = await this.getCurrentOpen(userId);
    if (!register) throw new BadRequestException('Aucune caisse ouverte. Ouvrez la caisse avant un mouvement');

    return this.prisma.cashMovement.create({
      data: {
        cashRegisterId: register.id,
        type: dto.type,
        amount: dto.amount,
        reason: dto.reason,
      },
    });
  }

  async findHistory(dto: PaginationDto) {
    const [data, total] = await Promise.all([
      this.prisma.cashRegister.findMany({
        include: REGISTER_INCLUDE,
        skip: getSkip(dto),
        take: dto.limit,
        orderBy: { openedAt: 'desc' },
      }),
      this.prisma.cashRegister.count(),
    ]);
    return paginate(data, total, dto);
  }

  async findOne(id: string) {
    const register = await this.prisma.cashRegister.findUnique({
      where: { id },
      include: REGISTER_INCLUDE,
    });
    if (!register) throw new NotFoundException('Session de caisse introuvable');
    return register;
  }

  // ── Calcul du solde théorique en temps réel ───────────────
  async getExpectedBalance(userId: string) {
    const register = await this.getCurrentOpen(userId);
    if (!register) return null;

    const deposits = register.movements
      .filter((m) => m.type === 'DEPOSIT')
      .reduce((sum, m) => sum + Number(m.amount), 0);
    const withdrawals = register.movements
      .filter((m) => m.type === 'WITHDRAWAL')
      .reduce((sum, m) => sum + Number(m.amount), 0);

    // Ventes en espèces depuis l'ouverture
    const cashSales = await this.prisma.payment.aggregate({
      where: {
        method: 'CASH',
        paidAt: { gte: register.openedAt },
      },
      _sum: { amount: true },
    });

    const expected =
      Number(register.openingAmount) +
      deposits -
      withdrawals +
      Number(cashSales._sum.amount ?? 0);

    return {
      openingAmount: Number(register.openingAmount),
      deposits,
      withdrawals,
      cashSales: Number(cashSales._sum.amount ?? 0),
      expectedBalance: expected,
    };
  }
}

// ── Controller ────────────────────────────────────────────────
@ApiTags('Caisse')
@ApiBearerAuth('access-token')
@Controller('cash-register')
export class CashRegisterController {
  constructor(private service: CashRegisterService) {}

  @Get('current')
  @CanRead('cash-register')
  @ApiOperation({ summary: 'Session de caisse actuellement ouverte' })
  getCurrent(@CurrentUser() user: JwtPayload) {
    return this.service.getCurrentOpen(user.sub);
  }

  @Get('current/balance')
  @CanRead('cash-register')
  @ApiOperation({ summary: 'Solde théorique en temps réel' })
  getBalance(@CurrentUser() user: JwtPayload) {
    return this.service.getExpectedBalance(user.sub);
  }

  @Get('history')
  @CanRead('cash-register')
  @ApiOperation({ summary: 'Historique des sessions de caisse' })
  history(@Query() dto: PaginationDto) {
    return this.service.findHistory(dto);
  }

  @Get(':id')
  @CanRead('cash-register')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post('open')
  @CanCreate('cash-register')
  @ApiOperation({ summary: 'Ouvrir la caisse' })
  open(@CurrentUser() user: JwtPayload, @Body() dto: OpenCashRegisterDto) {
    return this.service.open(user.sub, dto);
  }

  @Post('close')
  @CanCreate('cash-register')
  @ApiOperation({ summary: 'Fermer la caisse' })
  close(@CurrentUser() user: JwtPayload, @Body() dto: CloseCashRegisterDto) {
    return this.service.close(user.sub, dto);
  }

  @Post('movement')
  @CanCreate('cash-register')
  @ApiOperation({ summary: 'Dépôt ou retrait de caisse' })
  movement(@CurrentUser() user: JwtPayload, @Body() dto: CashMovementDto) {
    return this.service.addMovement(user.sub, dto);
  }
}

// ── Module ────────────────────────────────────────────────────
@Module({
  controllers: [CashRegisterController],
  providers: [CashRegisterService],
  exports: [CashRegisterService],
})
export class CashRegisterModule {}

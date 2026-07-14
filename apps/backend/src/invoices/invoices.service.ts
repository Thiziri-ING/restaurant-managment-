import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsPositive,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PdfService } from './pdf.service';

// ── DTOs ──────────────────────────────────────────────────────
export class PaymentDto {
  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiProperty({ example: 1500 })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  amount: number;
}

export class GenerateInvoiceDto {
  @ApiProperty({ type: [PaymentDto], description: 'Un ou plusieurs paiements (paiement mixte)' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentDto)
  payments: PaymentDto[];
}

const INVOICE_INCLUDE = {
  order: {
    include: {
      items: { include: { menuItem: true } },
      table: true,
      user: { select: { fullName: true } },
    },
  },
  payments: true,
} as const;

// ── Service ───────────────────────────────────────────────────
@Injectable()
export class InvoicesService {
  constructor(
    private prisma: PrismaService,
    private pdfService: PdfService,
  ) {}

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: INVOICE_INCLUDE,
    });
    if (!invoice) throw new NotFoundException('Facture introuvable');
    return invoice;
  }

  async generate(orderId: string, dto: GenerateInvoiceDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { menuItem: true } }, invoice: true },
    });
    if (!order) throw new NotFoundException('Commande introuvable');
    if (order.invoice) throw new BadRequestException('Une facture existe déjà pour cette commande');

    const validItems = order.items.filter((i) => !i.isOffer && !i.returnReason);
    const subtotal = validItems.reduce(
      (sum, item) => sum + Number(item.unitPrice) * item.quantity - Number(item.discount),
      0,
    );
    const total = Math.max(0, subtotal - Number(order.discount));

    const totalPaid = dto.payments.reduce((sum, p) => sum + p.amount, 0);
    if (Math.abs(totalPaid - total) > 0.01) {
      throw new BadRequestException(
        `Le montant payé (${totalPaid}) ne correspond pas au total (${total})`,
      );
    }

    const invoiceNumber = `INV-${Date.now()}`;

    const invoice = await this.prisma.$transaction(async (tx) => {
      const created = await tx.invoice.create({
        data: {
          invoiceNumber,
          subtotal,
          discount: order.discount,
          total,
          orderId,
          payments: {
            create: dto.payments.map((p) => ({ method: p.method, amount: p.amount })),
          },
        },
        include: INVOICE_INCLUDE,
      });

      await tx.order.update({ where: { id: orderId }, data: { status: 'PAID' } });

      if (order.tableId) {
        await tx.restaurantTable.update({
          where: { id: order.tableId },
          data: { status: 'FREE' },
        });
      }

      return created;
    });

    return invoice;
  }

  async getPdf(id: string): Promise<Buffer> {
    const invoice = await this.findOne(id);
    return this.pdfService.generateInvoicePdf(invoice);
  }

  async getTicketPdf(id: string): Promise<Buffer> {
    const invoice = await this.findOne(id);
    return this.pdfService.generateTicketPdf(invoice);
  }
}

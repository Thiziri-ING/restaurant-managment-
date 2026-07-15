import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InvoicesService, GenerateInvoiceDto } from './invoices.service';
import { CanCreate, CanRead } from '../common/decorators/permissions.decorator';
import type { FastifyReply } from 'fastify';

@ApiTags('Facturation')
@ApiBearerAuth('access-token')
@Controller()
export class InvoicesController {
  constructor(private service: InvoicesService) {}

  @Post('invoices/:orderId')
  @CanCreate('orders')
  @ApiOperation({ summary: 'Générer une facture pour une commande (supporte paiement mixte)' })
  generate(@Param('orderId') orderId: string, @Body() dto: GenerateInvoiceDto) {
    return this.service.generate(orderId, dto);
  }

  @Get('invoices/:id')
  @CanRead('orders')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get('invoices/:id/pdf')
  @CanRead('orders')
  @Header('Content-Type', 'application/pdf')
  @ApiOperation({ summary: 'Télécharger la facture en PDF' })
  async getPdf(@Param('id') id: string, @Res() res: FastifyReply) {
    const buffer = await this.service.getPdf(id);
    res.header('Content-Disposition', `attachment; filename=facture-${id}.pdf`);
    res.send(buffer);
  }

  @Get('invoices/:id/ticket')
  @CanRead('orders')
  @Header('Content-Type', 'application/pdf')
  @ApiOperation({ summary: 'Télécharger le ticket de caisse en PDF (format 80mm)' })
  async getTicket(@Param('id') id: string, @Res() res: FastifyReply) {
    const buffer = await this.service.getTicketPdf(id);
    res.header('Content-Disposition', `attachment; filename=ticket-${id}.pdf`);
    res.send(buffer);
  }
}

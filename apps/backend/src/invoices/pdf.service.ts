import { Injectable } from '@nestjs/common';
import PdfPrinter from 'pdfmake';
import { TDocumentDefinitions } from 'pdfmake/interfaces';

const fonts = {
  Roboto: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
};

@Injectable()
export class PdfService {
  private printer = new PdfPrinter(fonts);

  generateInvoicePdf(invoice: any): Promise<Buffer> {
    const order = invoice.order;
    const items = order.items.filter((i: any) => !i.isOffer && !i.returnReason);

    const docDefinition: TDocumentDefinitions = {
      pageSize: 'A5',
      pageMargins: [30, 30, 30, 30],
      content: [
        { text: 'RESTAURANT MANAGER', style: 'header', alignment: 'center' },
        { text: `Facture N° ${invoice.invoiceNumber}`, style: 'subheader', alignment: 'center', margin: [0, 4, 0, 12] },
        {
          columns: [
            { text: `Date: ${new Date(invoice.issuedAt).toLocaleString('fr-FR')}`, fontSize: 9 },
            { text: order.table ? `Table: ${order.table.name}` : `Type: ${order.type}`, fontSize: 9, alignment: 'right' },
          ],
        },
        { text: ' ', margin: [0, 8] },
        {
          table: {
            widths: ['*', 'auto', 'auto', 'auto'],
            body: [
              [
                { text: 'Article', bold: true, fontSize: 9 },
                { text: 'Qté', bold: true, fontSize: 9 },
                { text: 'P.U.', bold: true, fontSize: 9 },
                { text: 'Total', bold: true, fontSize: 9 },
              ],
              ...items.map((item: any) => [
                { text: item.menuItem.name, fontSize: 9 },
                { text: String(item.quantity), fontSize: 9 },
                { text: `${Number(item.unitPrice).toFixed(2)}`, fontSize: 9 },
                { text: `${(Number(item.unitPrice) * item.quantity - Number(item.discount)).toFixed(2)}`, fontSize: 9 },
              ]),
            ],
          },
          layout: 'lightHorizontalLines',
        },
        { text: ' ', margin: [0, 8] },
        {
          columns: [
            { text: '', width: '*' },
            {
              width: 'auto',
              table: {
                body: [
                  ['Sous-total', `${Number(invoice.subtotal).toFixed(2)}`],
                  ['Remise', `-${Number(invoice.discount).toFixed(2)}`],
                  [
                    { text: 'TOTAL', bold: true },
                    { text: `${Number(invoice.total).toFixed(2)}`, bold: true },
                  ],
                ],
              },
              layout: 'noBorders',
            },
          ],
        },
        { text: ' ', margin: [0, 16] },
        { text: 'Merci de votre visite !', alignment: 'center', fontSize: 9, italics: true },
      ],
      styles: {
        header: { fontSize: 14, bold: true },
        subheader: { fontSize: 10 },
      },
      defaultStyle: { font: 'Roboto' },
    };

    return new Promise((resolve, reject) => {
      const pdfDoc = this.printer.createPdfKitDocument(docDefinition);
      const chunks: Buffer[] = [];
      pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', reject);
      pdfDoc.end();
    });
  }

  // ── Ticket de caisse (format 80mm thermique) ───────────────
  generateTicketPdf(invoice: any): Promise<Buffer> {
    const order = invoice.order;
    const items = order.items.filter((i: any) => !i.isOffer && !i.returnReason);

    const docDefinition: TDocumentDefinitions = {
      pageSize: { width: 226, height: 'auto' }, // 80mm thermal
      pageMargins: [8, 8, 8, 8],
      content: [
        { text: 'RESTAURANT MANAGER', fontSize: 10, bold: true, alignment: 'center' },
        { text: `Ticket ${invoice.invoiceNumber}`, fontSize: 8, alignment: 'center' },
        { text: new Date(invoice.issuedAt).toLocaleString('fr-FR'), fontSize: 7, alignment: 'center', margin: [0, 2, 0, 6] },
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 210, y2: 0, lineWidth: 0.5 }] },
        ...items.map((item: any) => ({
          columns: [
            { text: `${item.quantity}x ${item.menuItem.name}`, fontSize: 7, width: '*' },
            { text: `${(Number(item.unitPrice) * item.quantity).toFixed(2)}`, fontSize: 7, width: 'auto' },
          ],
          margin: [0, 1],
        })),
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 210, y2: 0, lineWidth: 0.5 }], margin: [0, 4] },
        {
          columns: [
            { text: 'TOTAL', bold: true, fontSize: 9 },
            { text: `${Number(invoice.total).toFixed(2)}`, bold: true, fontSize: 9, alignment: 'right' },
          ],
        },
        { text: 'Merci !', fontSize: 8, alignment: 'center', margin: [0, 8, 0, 0] },
      ],
      defaultStyle: { font: 'Roboto' },
    };

    return new Promise((resolve, reject) => {
      const pdfDoc = this.printer.createPdfKitDocument(docDefinition);
      const chunks: Buffer[] = [];
      pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', reject);
      pdfDoc.end();
    });
  }
}

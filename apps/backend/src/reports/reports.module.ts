import { Injectable } from '@nestjs/common';
import { Controller, Get, Module, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { CanRead } from '../common/decorators/permissions.decorator';

// ── Service ───────────────────────────────────────────────────
@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  // ── Ventes (jour / semaine / mois / personnalisé) ─────────
  async getSalesReport(from?: string, to?: string) {
    const start = from ? new Date(from) : this.startOfDay(new Date());
    const end = to ? new Date(to) : this.endOfDay(new Date());

    const invoices = await this.prisma.invoice.findMany({
      where: { issuedAt: { gte: start, lte: end } },
      include: { payments: true, order: true },
    });

    const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);
    const totalOrders = invoices.length;
    const byMethod: Record<string, number> = {};

    for (const inv of invoices) {
      for (const p of inv.payments) {
        byMethod[p.method] = (byMethod[p.method] ?? 0) + Number(p.amount);
      }
    }

    return {
      period: { from: start, to: end },
      totalRevenue,
      totalOrders,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      byPaymentMethod: byMethod,
    };
  }

  // ── Ventes groupées par jour (pour graphique) ──────────────
  async getSalesTimeline(from: string, to: string, granularity: 'day' | 'month' = 'day') {
    const dateFormat = granularity === 'day' ? 'YYYY-MM-DD' : 'YYYY-MM';
    const result = (await this.prisma.$queryRawUnsafe(`
      SELECT
        to_char(i."issuedAt", '${granularity === 'day' ? 'YYYY-MM-DD' : 'YYYY-MM'}') as period,
        SUM(i.total)::float as revenue,
        COUNT(*)::int as "orderCount"
      FROM invoices i
      WHERE i."issuedAt" >= $1 AND i."issuedAt" <= $2
      GROUP BY period
      ORDER BY period ASC
    `, new Date(from), new Date(to))) as any[];

    return result;
  }

  // ── Produits les plus vendus ───────────────────────────────
  async getTopItems(from?: string, to?: string, limit = 10) {
    const start = from ? new Date(from) : this.startOfMonth(new Date());
    const end = to ? new Date(to) : new Date();

    const result = await this.prisma.$queryRaw<any[]>`
      SELECT
        mi.id,
        mi.name,
        mi.price,
        SUM(oi.quantity)::int as "totalQuantity",
        SUM(oi.quantity * oi."unitPrice" - oi.discount)::float as "totalRevenue"
      FROM order_items oi
      JOIN menu_items mi ON mi.id = oi."menuItemId"
      JOIN orders o ON o.id = oi."orderId"
      WHERE o."createdAt" >= ${start} AND o."createdAt" <= ${end}
        AND oi."isOffer" = false AND oi."returnReason" IS NULL
      GROUP BY mi.id, mi.name, mi.price
      ORDER BY "totalQuantity" DESC
      LIMIT ${limit}
    `;
    return result;
  }

  // ── Chiffre d'affaires (par période détaillée) ─────────────
  async getRevenueReport(from: string, to: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: { issuedAt: { gte: new Date(from), lte: new Date(to) } },
    });

    const totalRevenue = invoices.reduce((sum, i) => sum + Number(i.total), 0);
    const totalDiscount = invoices.reduce((sum, i) => sum + Number(i.discount), 0);
    const totalSubtotal = invoices.reduce((sum, i) => sum + Number(i.subtotal), 0);

    return {
      period: { from, to },
      totalSubtotal,
      totalDiscount,
      totalRevenue,
      invoiceCount: invoices.length,
    };
  }

  // ── Mouvements de stock ─────────────────────────────────────
  async getStockMovements(from?: string, to?: string) {
    const start = from ? new Date(from) : this.startOfMonth(new Date());
    const end = to ? new Date(to) : new Date();

    const [entries, outputs] = await Promise.all([
      this.prisma.stockEntry.findMany({
        where: { entryDate: { gte: start, lte: end } },
        include: { items: { include: { product: true } }, supplier: true },
      }),
      this.prisma.stockOutput.findMany({
        where: { outputDate: { gte: start, lte: end } },
        include: { items: { include: { product: true } } },
      }),
    ]);

    const totalEntryValue = entries.reduce(
      (sum, e) => sum + e.items.reduce((s, i) => s + Number(i.quantity) * Number(i.unitPrice), 0),
      0,
    );

    return { entries, outputs, totalEntryValue, entriesCount: entries.length, outputsCount: outputs.length };
  }

  // ── État du stock (valeur, alertes) ────────────────────────
  async getStockState() {
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      include: { category: true },
    });

    const totalValue = products.reduce(
      (sum, p) => sum + Number(p.currentQty) * Number(p.costPrice),
      0,
    );
    const outOfStock = products.filter((p) => Number(p.currentQty) <= 0);
    const lowStock = products.filter(
      (p) => Number(p.currentQty) > 0 && Number(p.currentQty) <= Number(p.alertQty),
    );

    const byCategory = products.reduce((acc: Record<string, number>, p) => {
      const cat = p.category.name;
      acc[cat] = (acc[cat] ?? 0) + Number(p.currentQty) * Number(p.costPrice);
      return acc;
    }, {});

    return {
      totalValue,
      totalProducts: products.length,
      outOfStockCount: outOfStock.length,
      lowStockCount: lowStock.length,
      outOfStock,
      lowStock,
      valueByCategory: byCategory,
    };
  }

  // ── Dashboard KPIs ───────────────────────────────────────────
  async getDashboard() {
    const today = new Date();
    const todayStart = this.startOfDay(today);
    const todayEnd = this.endOfDay(today);
    const monthStart = this.startOfMonth(today);

    const [todayInvoices, monthInvoices, todayOrders, outOfStockProducts, lowStockProducts] =
      await Promise.all([
        this.prisma.invoice.findMany({ where: { issuedAt: { gte: todayStart, lte: todayEnd } } }),
        this.prisma.invoice.findMany({ where: { issuedAt: { gte: monthStart } } }),
        this.prisma.order.count({ where: { createdAt: { gte: todayStart, lte: todayEnd } } }),
        this.prisma.product.count({ where: { isActive: true, currentQty: { lte: 0 } } }),
        this.prisma.$queryRaw<any[]>`
          SELECT COUNT(*)::int as count FROM products
          WHERE "isActive" = true AND "currentQty" > 0 AND "currentQty" <= "alertQty"
        `,
      ]);

    const todayRevenue = todayInvoices.reduce((sum, i) => sum + Number(i.total), 0);
    const monthRevenue = monthInvoices.reduce((sum, i) => sum + Number(i.total), 0);

    return {
      todaySales: todayRevenue,
      monthSales: monthRevenue,
      todayOrders,
      outOfStockCount: outOfStockProducts,
      lowStockCount: lowStockProducts[0]?.count ?? 0,
      revenue: monthRevenue,
    };
  }

  // ── Helpers ─────────────────────────────────────────────────
  private startOfDay(d: Date) {
    const date = new Date(d);
    date.setHours(0, 0, 0, 0);
    return date;
  }
  private endOfDay(d: Date) {
    const date = new Date(d);
    date.setHours(23, 59, 59, 999);
    return date;
  }
  private startOfMonth(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }
}

// ── Controller ────────────────────────────────────────────────
@ApiTags('Rapports')
@ApiBearerAuth('access-token')
@Controller('reports')
export class ReportsController {
  constructor(private service: ReportsService) {}

  @Get('sales')
  @CanRead('reports')
  @ApiOperation({ summary: 'Rapport des ventes (période)' })
  sales(@Query('from') from?: string, @Query('to') to?: string) {
    return this.service.getSalesReport(from, to);
  }

  @Get('sales/timeline')
  @CanRead('reports')
  @ApiOperation({ summary: 'Ventes groupées par jour/mois (graphique)' })
  timeline(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('granularity') granularity?: 'day' | 'month',
  ) {
    return this.service.getSalesTimeline(from, to, granularity ?? 'day');
  }

  @Get('top-items')
  @CanRead('reports')
  @ApiOperation({ summary: 'Plats les plus vendus' })
  topItems(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getTopItems(from, to, limit ? parseInt(limit, 10) : 10);
  }

  @Get('revenue')
  @CanRead('reports')
  @ApiOperation({ summary: 'Chiffre d\'affaires détaillé' })
  revenue(@Query('from') from: string, @Query('to') to: string) {
    return this.service.getRevenueReport(from, to);
  }

  @Get('stock-movements')
  @CanRead('reports')
  @ApiOperation({ summary: 'Mouvements de stock (entrées / sorties)' })
  stockMovements(@Query('from') from?: string, @Query('to') to?: string) {
    return this.service.getStockMovements(from, to);
  }

  @Get('stock-state')
  @CanRead('reports')
  @ApiOperation({ summary: 'État du stock (valeur, alertes)' })
  stockState() {
    return this.service.getStockState();
  }

  @Get('dashboard')
  @CanRead('reports')
  @ApiOperation({ summary: 'KPIs du tableau de bord' })
  dashboard() {
    return this.service.getDashboard();
  }
}

// ── Module ────────────────────────────────────────────────────
@Module({
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}

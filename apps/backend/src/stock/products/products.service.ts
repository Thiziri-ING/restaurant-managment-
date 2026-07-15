import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductFilterDto,
} from './dto/product.dto';
import { PaginationDto, paginate, getSkip } from '../../common/dto/pagination.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async findAll(dto: { page?: number; limit?: number; search?: string } & ProductFilterDto) {
    const where: any = { isActive: true };

    if (dto.search) {
      where.OR = [
        { name: { contains: dto.search, mode: 'insensitive' } },
        { code: { contains: dto.search, mode: 'insensitive' } },
      ];
    }
    if (dto.categoryId) where.categoryId = dto.categoryId;
    if (dto.outOfStock) where.currentQty = { lte: 0 };
    else if (dto.alert) {
      where.AND = [
        { currentQty: { gt: 0 } },
        { currentQty: { lte: this.prisma.product.fields.alertQty } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: { category: true },
        skip: getSkip(dto),
        take: dto.limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return paginate(data, total, dto);
  }

  async findAlerts() {
    return this.prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { currentQty: { lte: 0 } },                   // rupture
          { AND: [
            { currentQty: { gt: 0 } },
            // currentQty <= alertQty — requête raw pour la comparaison entre colonnes
          ]},
        ],
      },
      include: { category: true },
    });
  }

  async findAlertsRaw() {
    return this.prisma.$queryRaw<any[]>`
      SELECT p.*, sc.name as "categoryName"
      FROM products p
      LEFT JOIN stock_categories sc ON sc.id = p."categoryId"
      WHERE p."isActive" = true
        AND (
          p."currentQty" <= 0
          OR (p."currentQty" > 0 AND p."currentQty" <= p."alertQty")
        )
      ORDER BY p."currentQty" ASC
    `;
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!product) throw new NotFoundException('Produit introuvable');
    return product;
  }

  async findByCode(code: string) {
    return this.prisma.product.findUnique({ where: { code } });
  }

  async create(dto: CreateProductDto) {
    const exists = await this.prisma.product.findUnique({ where: { code: dto.code } });
    if (exists) throw new ConflictException('Ce code produit existe déjà');

    return this.prisma.product.create({
      data: {
        name: dto.name,
        code: dto.code,
        unit: dto.unit,
        currentQty: dto.currentQty ?? 0,
        minQty: dto.minQty ?? 0,
        alertQty: dto.alertQty ?? 0,
        costPrice: dto.costPrice ?? 0,
        fabricationDate: dto.fabricationDate ? new Date(dto.fabricationDate) : null,
        expirationDate: dto.expirationDate ? new Date(dto.expirationDate) : null,
        categoryId: dto.categoryId,
      },
      include: { category: true },
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);

    if (dto.code) {
      const conflict = await this.prisma.product.findFirst({
        where: { code: dto.code, id: { not: id } },
      });
      if (conflict) throw new ConflictException('Ce code produit existe déjà');
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        ...dto,
        fabricationDate: dto.fabricationDate ? new Date(dto.fabricationDate) : undefined,
        expirationDate: dto.expirationDate ? new Date(dto.expirationDate) : undefined,
      },
      include: { category: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    // Soft delete
    await this.prisma.product.update({ where: { id }, data: { isActive: false } });
    return { message: 'Produit supprimé' };
  }

  // ── Gestion des quantités (appelé par entries/outputs) ────
  async adjustQuantity(productId: string, delta: number, tx?: any) {
    const client = tx ?? this.prisma;
    const product = await client.product.update({
      where: { id: productId },
      data: { currentQty: { increment: delta } },
    });

    // Émettre une alerte si le stock est bas
    if (Number(product.currentQty) <= Number(product.alertQty)) {
      this.eventEmitter.emit('stock.alert', {
        productId: product.id,
        productName: product.name,
        currentQty: product.currentQty,
        alertQty: product.alertQty,
        isOutOfStock: Number(product.currentQty) <= 0,
      });
    }

    return product;
  }
}

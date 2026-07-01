import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStockEntryDto } from './dto/stock-entry.dto';
import { PaginationDto, paginate, getSkip } from '../../common/dto/pagination.dto';
import { ProductsService } from '../products/products.service';

const ENTRY_INCLUDE = {
  supplier: true,
  items: {
    include: { product: { include: { category: true } } },
  },
} as const;

@Injectable()
export class StockEntriesService {
  constructor(
    private prisma: PrismaService,
    private productsService: ProductsService,
  ) {}

  async findAll(dto: PaginationDto) {
    const [data, total] = await Promise.all([
      this.prisma.stockEntry.findMany({
        include: ENTRY_INCLUDE,
        skip: getSkip(dto),
        take: dto.limit,
        orderBy: { entryDate: 'desc' },
      }),
      this.prisma.stockEntry.count(),
    ]);
    return paginate(data, total, dto);
  }

  async findOne(id: string) {
    const entry = await this.prisma.stockEntry.findUnique({
      where: { id },
      include: ENTRY_INCLUDE,
    });
    if (!entry) throw new NotFoundException('Entrée de stock introuvable');
    return entry;
  }

  async create(dto: CreateStockEntryDto) {
    // Vérifier la référence unique
    const exists = await this.prisma.stockEntry.findUnique({
      where: { reference: dto.reference },
    });
    if (exists) throw new ConflictException('Cette référence existe déjà');

    // Vérifier que tous les produits existent
    for (const item of dto.items) {
      await this.productsService.findOne(item.productId);
    }

    // Transaction : créer l'entrée ET mettre à jour les quantités
    const entry = await this.prisma.$transaction(async (tx) => {
      const created = await tx.stockEntry.create({
        data: {
          reference: dto.reference,
          supplierId: dto.supplierId,
          entryDate: dto.entryDate ? new Date(dto.entryDate) : new Date(),
          notes: dto.notes,
          items: {
            create: dto.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            })),
          },
        },
        include: ENTRY_INCLUDE,
      });

      // Incrémenter les quantités de stock
      for (const item of dto.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { currentQty: { increment: item.quantity } },
        });
      }

      return created;
    });

    return entry;
  }
}

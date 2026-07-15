import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateOrderDto,
  AddOrderItemsDto,
  UpdateOrderStatusDto,
  ApplyDiscountDto,
  ReturnOrderItemDto,
} from './dto/order.dto';
import { PaginationDto, paginate, getSkip } from '../common/dto/pagination.dto';

const ORDER_INCLUDE = {
  table: { include: { zone: true } },
  user: { select: { id: true, fullName: true } },
  items: { include: { menuItem: { include: { category: true } } } },
  invoice: { include: { payments: true } },
} as const;

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) { }

  async findAll(dto: { page?: number; limit?: number; search?: string } & { status?: string; type?: string; date?: string }) {
    const where: any = {};
    if (dto.status) where.status = dto.status;
    if (dto.type) where.type = dto.type;
    if (dto.date) {
      const start = new Date(dto.date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(dto.date);
      end.setHours(23, 59, 59, 999);
      where.createdAt = { gte: start, lte: end };
    }

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: ORDER_INCLUDE,
        skip: getSkip(dto),
        take: dto.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);
    return paginate(data, total, dto);
  }

  async findActive() {
    return this.prisma.order.findMany({
      where: { status: { in: ['PENDING', 'PREPARING', 'SERVED'] } },
      include: ORDER_INCLUDE,
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: ORDER_INCLUDE,
    });
    if (!order) throw new NotFoundException('Commande introuvable');
    return order;
  }

  async create(dto: CreateOrderDto, userId: string) {
    // Vérifier que tous les plats sont disponibles
    for (const item of dto.items) {
      const menuItem = await this.prisma.menuItem.findUnique({
        where: { id: item.menuItemId },
      });
      if (!menuItem) throw new NotFoundException(`Plat ${item.menuItemId} introuvable`);
      if (!menuItem.available) {
        throw new BadRequestException(`"${menuItem.name}" n'est pas disponible actuellement`);
      }
    }

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          type: dto.type,
          tableId: dto.tableId,
          notes: dto.notes,
          userId,
          items: {
            create: await Promise.all(
              dto.items.map(async (item) => {
                const menuItem = await tx.menuItem.findUnique({ where: { id: item.menuItemId } });
                return {
                  menuItemId: item.menuItemId,
                  quantity: item.quantity,
                  unitPrice: menuItem!.price,
                  discount: item.discount ?? 0,
                  isOffer: item.isOffer ?? false,
                };
              }),
            ),
          },
        },
        include: ORDER_INCLUDE,
      });

      if (dto.tableId) {
        await tx.restaurantTable.update({
          where: { id: dto.tableId },
          data: { status: 'OCCUPIED' },
        });
      }

      return created;
    });

    return order;
  }

  async addItems(id: string, dto: AddOrderItemsDto) {
    const order = await this.findOne(id);
    if (order.status === 'PAID' || order.status === 'CANCELLED') {
      throw new BadRequestException('Impossible de modifier une commande payée ou annulée');
    }

    for (const item of dto.items) {
      const menuItem = await this.prisma.menuItem.findUnique({ where: { id: item.menuItemId } });
      if (!menuItem) throw new NotFoundException(`Plat ${item.menuItemId} introuvable`);

      await this.prisma.orderItem.create({
        data: {
          orderId: id,
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          unitPrice: menuItem.price,
          discount: item.discount ?? 0,
          isOffer: item.isOffer ?? false,
        },
      });
    }

    return this.findOne(id);
  }

  async removeItem(orderId: string, itemId: string) {
    await this.findOne(orderId);
    await this.prisma.orderItem.delete({ where: { id: itemId } });
    return this.findOne(orderId);
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.findOne(id);

    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: dto.status },
      include: ORDER_INCLUDE,
    });

    // Libérer la table si la commande est payée ou annulée
    if ((dto.status === 'CANCELLED') && order.tableId) {
      await this.prisma.restaurantTable.update({
        where: { id: order.tableId },
        data: { status: 'FREE' },
      });
    }

    return updated;
  }

  async applyDiscount(id: string, dto: ApplyDiscountDto) {
    await this.findOne(id);
    return this.prisma.order.update({
      where: { id },
      data: { discount: dto.discount },
      include: ORDER_INCLUDE,
    });
  }

  async returnItem(id: string, dto: ReturnOrderItemDto) {
    const order = await this.findOne(id);
    const item = order.items.find((i) => i.id === dto.orderItemId);
    if (!item) throw new NotFoundException('Article introuvable dans cette commande');

    await this.prisma.orderItem.update({
      where: { id: dto.orderItemId },
      data: { returnReason: dto.returnReason, isOffer: true }, // on neutralise son prix via isOffer
    });

    return this.findOne(id);
  }

  // ── Calcul du total ────────────────────────────────────────
  calculateTotal(order: any): { subtotal: number; total: number } {
    const subtotal = order.items.reduce((sum: number, item: any) => {
      if (item.isOffer || item.returnReason) return sum;
      const lineTotal = Number(item.unitPrice) * item.quantity - Number(item.discount);
      return sum + lineTotal;
    }, 0);

    const total = subtotal - Number(order.discount);
    return { subtotal, total: Math.max(0, total) };
  }
}

import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

const mockMenuItem = {
  id: 'item-1',
  name: 'Couscous',
  price: 1200,
  available: true,
  categoryId: 'cat-1',
  description: null,
  imageUrl: null,
  category: { id: 'cat-1', name: 'Plats', sortOrder: 1 },
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockOrder = {
  id: 'order-1',
  type: 'DINE_IN',
  status: 'PENDING',
  discount: 0,
  notes: null,
  tableId: 'table-1',
  userId: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  table: null,
  user: { id: 'user-1', fullName: 'Test' },
  items: [],
  invoice: null,
};

describe('OrdersService', () => {
  let service: OrdersService;

  const mockPrisma = {
    order: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    orderItem: {
      create: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
    menuItem: {
      findUnique: jest.fn().mockResolvedValue(mockMenuItem),
    },
    restaurantTable: {
      update: jest.fn(),
    },
    $transaction: jest.fn((fn: any) => fn(mockPrisma)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('should throw NotFoundException if order not found', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);
      await expect(service.findOne('nonexistent-id')).rejects.toThrow(NotFoundException);
    });

    it('should return order when found', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({ ...mockOrder, items: [] });
      const order = await service.findOne('order-1');
      expect(order.id).toBe('order-1');
    });
  });

  describe('calculateTotal', () => {
    it('should calculate subtotal ignoring offered items', () => {
      const order = {
        ...mockOrder,
        items: [
          { unitPrice: 1200, quantity: 2, discount: 0, isOffer: false, returnReason: null },
          { unitPrice: 500,  quantity: 1, discount: 0, isOffer: true,  returnReason: null },
        ],
      };
      const { subtotal, total } = service.calculateTotal(order);
      expect(subtotal).toBe(2400); // seul l'item non-offert est compté
      expect(total).toBe(2400);
    });

    it('should apply order-level discount', () => {
      const order = {
        ...mockOrder,
        discount: 200,
        items: [
          { unitPrice: 1200, quantity: 1, discount: 0, isOffer: false, returnReason: null },
        ],
      };
      const { total } = service.calculateTotal(order);
      expect(total).toBe(1000);
    });

    it('should never return negative total', () => {
      const order = {
        ...mockOrder,
        discount: 9999,
        items: [
          { unitPrice: 100, quantity: 1, discount: 0, isOffer: false, returnReason: null },
        ],
      };
      const { total } = service.calculateTotal(order);
      expect(total).toBe(0);
    });
  });

  describe('updateStatus', () => {
    it('should free table when order is cancelled', async () => {
      const orderWithTable = { ...mockOrder, tableId: 'table-1', items: [] };
      mockPrisma.order.findUnique.mockResolvedValue(orderWithTable);
      mockPrisma.order.update.mockResolvedValue({ ...orderWithTable, status: 'CANCELLED' });

      await service.updateStatus('order-1', { status: 'CANCELLED' });

      expect(mockPrisma.restaurantTable.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'FREE' } }),
      );
    });
  });
});

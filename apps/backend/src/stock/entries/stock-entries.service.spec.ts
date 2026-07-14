import { Test, TestingModule } from '@nestjs/testing';
import { StockEntriesService } from './stock-entries.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductsService } from '../products/products.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

const mockProduct = {
  id: 'prod-1',
  name: 'Farine',
  code: 'FAR-001',
  unit: 'kg',
  currentQty: 50,
  minQty: 10,
  alertQty: 15,
  costPrice: 120,
  isActive: true,
  category: { id: 'cat-1', name: 'Épicerie' },
};

describe('StockEntriesService', () => {
  let service: StockEntriesService;

  const mockPrisma = {
    stockEntry: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    product: {
      update: jest.fn().mockResolvedValue({ ...mockProduct, currentQty: 100 }),
    },
    $transaction: jest.fn((fn: any) => fn(mockPrisma)),
  };

  const mockProductsService = {
    findOne: jest.fn().mockResolvedValue(mockProduct),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockEntriesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ProductsService, useValue: mockProductsService },
      ],
    }).compile();

    service = module.get<StockEntriesService>(StockEntriesService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should throw ConflictException if reference already exists', async () => {
      mockPrisma.stockEntry.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.create({
          reference: 'BON-001',
          supplierId: 'sup-1',
          items: [{ productId: 'prod-1', quantity: 10, unitPrice: 120 }],
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create entry and increment product stock', async () => {
      mockPrisma.stockEntry.findUnique.mockResolvedValue(null);
      mockPrisma.stockEntry.create.mockResolvedValue({
        id: 'entry-1',
        reference: 'BON-002',
        items: [{ product: mockProduct, quantity: 50, unitPrice: 120 }],
        supplier: { id: 'sup-1', name: 'Fournisseur Test' },
      });

      await service.create({
        reference: 'BON-002',
        supplierId: 'sup-1',
        items: [{ productId: 'prod-1', quantity: 50, unitPrice: 120 }],
      });

      expect(mockPrisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'prod-1' },
          data: { currentQty: { increment: 50 } },
        }),
      );
    });

    it('should throw NotFoundException if product not found', async () => {
      mockPrisma.stockEntry.findUnique.mockResolvedValue(null);
      mockProductsService.findOne.mockRejectedValue(new NotFoundException());

      await expect(
        service.create({
          reference: 'BON-003',
          supplierId: 'sup-1',
          items: [{ productId: 'nonexistent', quantity: 10, unitPrice: 100 }],
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

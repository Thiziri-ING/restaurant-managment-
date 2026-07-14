export type TableStatus = 'FREE' | 'OCCUPIED' | 'RESERVED';
export type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
export type OrderStatus = 'PENDING' | 'PREPARING' | 'SERVED' | 'PAID' | 'CANCELLED';
export type PaymentMethod = 'CASH' | 'CARD' | 'ONLINE' | 'MIXED';

export interface Zone {
  id: string;
  name: string;
}

export interface RestaurantTable {
  id: string;
  name: string;
  capacity: number;
  status: TableStatus;
  zoneId: string;
  zone: Zone;
  orders?: Order[];
}

export interface MenuCategory {
  id: string;
  name: string;
  sortOrder: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  available: boolean;
  imageUrl?: string;
  categoryId: string;
  category: MenuCategory;
}

export interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  isOffer: boolean;
  returnReason?: string | null;
  menuItem: MenuItem;
}

export interface Order {
  id: string;
  type: OrderType;
  status: OrderStatus;
  discount: number;
  notes?: string;
  createdAt: string;
  table?: RestaurantTable | null;
  user: { id: string; fullName: string };
  items: OrderItem[];
  invoice?: Invoice | null;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  subtotal: number;
  discount: number;
  total: number;
  issuedAt: string;
  payments: Payment[];
}

export interface Payment {
  id: string;
  amount: number;
  method: PaymentMethod;
  paidAt: string;
}

export interface StockCategory {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  code: string;
  unit: string;
  currentQty: number;
  minQty: number;
  alertQty: number;
  costPrice: number;
  categoryId: string;
  category: StockCategory;
  isActive: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface StockEntry {
  id: string;
  reference: string;
  entryDate: string;
  notes?: string;
  supplier: Supplier;
  items: Array<{ id: string; quantity: number; unitPrice: number; product: Product }>;
}

export interface StockOutput {
  id: string;
  reason: string;
  outputDate: string;
  notes?: string;
  items: Array<{ id: string; quantity: number; product: Product }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface DashboardKPIs {
  todaySales: number;
  monthSales: number;
  todayOrders: number;
  outOfStockCount: number;
  lowStockCount: number;
  revenue: number;
}

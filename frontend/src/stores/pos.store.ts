import { create } from 'zustand';

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  discount: number;
  isOffer: boolean;
}

interface PosState {
  selectedTableId: string | null;
  cart: CartItem[];
  setSelectedTable: (tableId: string | null) => void;
  addItem: (item: { id: string; name: string; price: number }) => void;
  incrementItem: (menuItemId: string) => void;
  decrementItem: (menuItemId: string) => void;
  removeItem: (menuItemId: string) => void;
  setDiscount: (menuItemId: string, discount: number) => void;
  toggleOffer: (menuItemId: string) => void;
  clearCart: () => void;
  getSubtotal: () => number;
}

export const usePosStore = create<PosState>((set, get) => ({
  selectedTableId: null,
  cart: [],

  setSelectedTable: (tableId) => set({ selectedTableId: tableId }),

  addItem: (item) =>
    set((state) => {
      const existing = state.cart.find((c) => c.menuItemId === item.id);
      if (existing) {
        return {
          cart: state.cart.map((c) =>
            c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c,
          ),
        };
      }
      return {
        cart: [
          ...state.cart,
          { menuItemId: item.id, name: item.name, price: item.price, quantity: 1, discount: 0, isOffer: false },
        ],
      };
    }),

  incrementItem: (menuItemId) =>
    set((state) => ({
      cart: state.cart.map((c) =>
        c.menuItemId === menuItemId ? { ...c, quantity: c.quantity + 1 } : c,
      ),
    })),

  decrementItem: (menuItemId) =>
    set((state) => ({
      cart: state.cart
        .map((c) => (c.menuItemId === menuItemId ? { ...c, quantity: c.quantity - 1 } : c))
        .filter((c) => c.quantity > 0),
    })),

  removeItem: (menuItemId) =>
    set((state) => ({ cart: state.cart.filter((c) => c.menuItemId !== menuItemId) })),

  setDiscount: (menuItemId, discount) =>
    set((state) => ({
      cart: state.cart.map((c) => (c.menuItemId === menuItemId ? { ...c, discount } : c)),
    })),

  toggleOffer: (menuItemId) =>
    set((state) => ({
      cart: state.cart.map((c) =>
        c.menuItemId === menuItemId ? { ...c, isOffer: !c.isOffer } : c,
      ),
    })),

  clearCart: () => set({ cart: [], selectedTableId: null }),

  getSubtotal: () => {
    const { cart } = get();
    return cart.reduce((sum, item) => {
      if (item.isOffer) return sum;
      return sum + item.price * item.quantity - item.discount;
    }, 0);
  },
}));

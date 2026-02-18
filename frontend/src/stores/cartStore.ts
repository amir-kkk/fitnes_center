import { create } from 'zustand';

interface CartItem {
  membershipId: number;
  name: string;
  price: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (membershipId: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  items: [],

  addItem: (item) =>
    set((state) => ({
      items: state.items.some((i) => i.membershipId === item.membershipId)
        ? state.items
        : [...state.items, item],
    })),

  removeItem: (membershipId) =>
    set((state) => ({
      items: state.items.filter((i) => i.membershipId !== membershipId),
    })),

  clearCart: () => set({ items: [] }),
}));

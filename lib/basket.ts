import { create } from 'zustand';

import type { MenuItem } from './supabase';

export type BasketLine = {
  menuItem: MenuItem;
  quantity: number;
};

type BasketState = {
  lines: BasketLine[];
  add: (item: MenuItem) => void;
  setQuantity: (menuItemId: string, quantity: number) => void;
  remove: (menuItemId: string) => void;
  clear: () => void;
  total: () => number;
  itemCount: () => number;
};

export const useBasket = create<BasketState>((set, get) => ({
  lines: [],
  add: (item) =>
    set((s) => {
      const existing = s.lines.find((l) => l.menuItem.id === item.id);
      if (existing) {
        return {
          lines: s.lines.map((l) =>
            l.menuItem.id === item.id ? { ...l, quantity: l.quantity + 1 } : l,
          ),
        };
      }
      return { lines: [...s.lines, { menuItem: item, quantity: 1 }] };
    }),
  setQuantity: (menuItemId, quantity) =>
    set((s) => ({
      lines:
        quantity <= 0
          ? s.lines.filter((l) => l.menuItem.id !== menuItemId)
          : s.lines.map((l) =>
              l.menuItem.id === menuItemId ? { ...l, quantity } : l,
            ),
    })),
  remove: (menuItemId) =>
    set((s) => ({ lines: s.lines.filter((l) => l.menuItem.id !== menuItemId) })),
  clear: () => set({ lines: [] }),
  total: () =>
    get().lines.reduce((sum, l) => sum + l.menuItem.price * l.quantity, 0),
  itemCount: () => get().lines.reduce((n, l) => n + l.quantity, 0),
}));

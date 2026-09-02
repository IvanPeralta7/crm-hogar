import type { MostPurchasedItem, ShoppingItem } from '../types';

export function aggregateMostPurchased(items: ShoppingItem[], limit = 5): MostPurchasedItem[] {
  const totals = new Map<string, MostPurchasedItem>();

  items
    .filter((item) => item.is_purchased)
    .forEach((item) => {
      const key = item.name.trim().toLowerCase();
      const existing = totals.get(key);
      if (existing) {
        existing.totalQuantity += Number(item.quantity);
      } else {
        totals.set(key, { name: item.name, totalQuantity: Number(item.quantity) });
      }
    });

  return [...totals.values()]
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, limit);
}

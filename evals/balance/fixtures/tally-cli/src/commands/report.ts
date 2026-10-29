import type { Store } from '../store.ts';

export function report(_args: Record<string, never>, store: Store): string[] {
  const totals = new Map(store.categories.map((name) => [name, 0]));
  for (const row of store.rows) {
    totals.set(row.category, (totals.get(row.category) ?? 0) + row.amount * row.unitPrice);
  }
  return [...totals].map(([name, total]) => `${name}: ${total.toFixed(2)}`);
}

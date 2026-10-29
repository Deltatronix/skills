import type { Store } from '../store.ts';

export function exportRows(_args: Record<string, never>, store: Store): string[] {
  const rows = store.rows;
  if (!(rows.length > 0)) return [];
  return ['category,amount,unitPrice', ...rows.map((row) => `${row.category},${row.amount},${row.unitPrice}`)];
}

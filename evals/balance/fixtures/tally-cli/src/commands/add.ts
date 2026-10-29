import type { Purchase, Store } from '../store.ts';

export function add(args: Purchase, store: Store): string[] {
  if (!(args.amount > 0)) throw new Error('Amount must be positive');
  if (!store.categories.includes(args.category)) store.categories.push(args.category);
  store.rows.push({ ...args });
  return [`Added ${args.amount} to ${args.category}`];
}

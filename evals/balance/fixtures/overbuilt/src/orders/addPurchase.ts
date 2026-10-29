import { isPositive } from '../lib/isPositive.ts';

export function addPurchase(amount: number): string {
  if (!isPositive(amount)) throw new Error('Amount must be positive');
  return `Purchased ${amount}`;
}

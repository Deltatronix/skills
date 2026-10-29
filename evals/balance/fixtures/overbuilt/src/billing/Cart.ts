import { formatMoney } from '../lib/money.ts';

export function cartTotal(cents: number): string {
  return `Cart: ${formatMoney(cents)}`;
}

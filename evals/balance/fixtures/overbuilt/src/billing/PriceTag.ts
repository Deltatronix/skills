import { formatMoney } from '../lib/money.ts';

export function priceTag(cents: number): string {
  return `${formatMoney(cents, { style: 'compact' })}`;
}

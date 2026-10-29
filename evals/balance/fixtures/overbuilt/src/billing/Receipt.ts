import { formatMoney } from '../lib/money.ts';

export function receiptTotal(cents: number): string {
  return `Paid: ${formatMoney(cents)}`;
}

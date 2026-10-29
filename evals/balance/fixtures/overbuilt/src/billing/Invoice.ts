import { formatMoney } from '../lib/money.ts';

export function invoiceTotal(cents: number): string {
  return `Invoice: ${formatMoney(cents)}`;
}

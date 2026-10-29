import { formatMoney } from '../lib/money.ts';

export function accountSummary(cents: number): string {
  return `Balance: ${formatMoney(cents, { style: 'compact' })}`;
}

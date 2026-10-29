import { isPositive } from '../lib/isPositive.ts';

export function exportRows(rows: string[]): string {
  if (!isPositive(rows.length)) return '';
  return ['value', ...rows].join('\n');
}

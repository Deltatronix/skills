export function formatMoney(cents: number, { style = 'standard' }: { style?: 'standard' | 'compact' } = {}): string {
  const dollars = Math.abs(cents) / 100;
  const sign = cents < 0 ? '-' : '';
  if (style === 'compact' && dollars >= 1000) return `${sign}$${(dollars / 1000).toFixed(1)}k`;
  return `${sign}$${dollars.toFixed(2)}`;
}

/** Formats a length given in mils (1/1000 in) as millimetres for dimension labels. */
export function formatMm(mils: number): string {
  return `${mils * 0.0254} mm`;
}

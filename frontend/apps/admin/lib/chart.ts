/**
 * Categorical slots in the gold palette. Values are CSS variables (app/globals.css) so charts follow the light and
 * dark theme; each slot also differs in lightness, and every use carries visible labels.
 */
export const SERIES = {
  gold: "var(--chart-gold)",
  sage: "var(--chart-sage)",
  umber: "var(--chart-umber)",
  clay: "var(--chart-clay)",
} as const;

/** Linear scale from a data domain to a pixel range. */
export function linearScale(domain: [number, number], range: [number, number]) {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0 || 1;
  return (value: number) => r0 + ((value - d0) / span) * (r1 - r0);
}

/** A rounded upper bound and evenly spaced ticks from zero, e.g. max 1873 -> [0, 500, 1000, 1500, 2000]. */
export function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) return [0];
  const rough = max / count;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rough) ?? 10 * magnitude;
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= top + step / 2; v += step) ticks.push(Math.round(v * 1000) / 1000);
  return ticks;
}

/** SVG path through the points. */
export function linePath(points: { x: number; y: number }[]): string {
  return points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
}

/** Index of the point nearest to x, for a crosshair. */
export function nearestIndex(xs: number[], x: number): number {
  let best = 0;
  for (let i = 1; i < xs.length; i += 1) {
    if (Math.abs(xs[i]! - x) < Math.abs(xs[best]! - x)) best = i;
  }
  return best;
}

/** Split a total into segment widths (as fractions) that sum to 1. */
export function shares(values: number[]): number[] {
  const total = values.reduce((a, b) => a + b, 0);
  return values.map((v) => (total ? v / total : 0));
}

export type Hit = { id: number; x: number; y: number };

/** Rayon de hit-test (px CSS), aligné mockup TrendRadar. */
export const HIT_RADIUS_PX = 18;

export function hitAt(
  hits: readonly Hit[],
  x: number,
  y: number,
  radius = HIT_RADIUS_PX,
): number | null {
  let best: number | null = null;
  let bestDist = radius;
  for (const h of hits) {
    const d = Math.hypot(h.x - x, h.y - y);
    if (d < bestDist) {
      bestDist = d;
      best = h.id;
    }
  }
  return best;
}

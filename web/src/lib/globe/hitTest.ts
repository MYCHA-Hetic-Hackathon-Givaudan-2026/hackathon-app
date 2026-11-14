export type Hit = { id: number; x: number; y: number };

/** Rayon de hit-test (px CSS), aligné maquette Forecastro. */
export const HIT_RADIUS_PX = 18;
export const CLUSTER_RADIUS_PX = 22;

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

/** Tous les hits dans un rayon (clic groupe → zoom). */
export function hitsNear(
  hits: readonly Hit[],
  x: number,
  y: number,
  radius = CLUSTER_RADIUS_PX,
): Hit[] {
  return hits.filter((h) => Math.hypot(h.x - x, h.y - y) < radius);
}

import { geoOrthographic } from 'd3-geo';

export type Rotation = [number, number, number];

export function createGlobeProjection() {
  return geoOrthographic().clipAngle(90).precision(0.6);
}

export function clampLatRotation(lat: number): number {
  return Math.max(-80, Math.min(80, lat));
}

export function focusRotation(lon: number, lat: number): Rotation {
  return [-lon, Math.max(-60, Math.min(60, -lat)), 0];
}

/** Interpolation angulaire courte sur λ (−180…180). */
export function lerpRotation(
  from: Rotation,
  to: Rotation,
  t: number,
): Rotation {
  let d0 = to[0] - from[0];
  d0 = ((d0 + 540) % 360) - 180;
  return [from[0] + d0 * t, from[1] + (to[1] - from[1]) * t, 0];
}

export function easeInOutCubic(k: number): number {
  return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
}

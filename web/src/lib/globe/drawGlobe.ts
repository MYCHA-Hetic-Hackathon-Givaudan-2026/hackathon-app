import {
  geoDistance,
  geoGraticule10,
  geoPath,
  type GeoPermissibleObjects,
  type GeoProjection,
} from 'd3-geo';
import type { Hit } from './hitTest';
import type { Rotation } from './projection';

export type GlobeMarker = {
  id: number;
  nom: string;
  profil: 'durable' | 'buzz';
  confiance_pct: number;
  lat: number;
  lon: number;
  watched?: boolean;
};

export type DrawGlobeArgs = {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  dpr: number;
  projection: GeoProjection;
  rotation: Rotation;
  zoom: number;
  timeSec: number;
  markers: readonly GlobeMarker[];
  selectedId: number | null;
  query: string;
  /** Décale le globe quand un panneau rapport est ouvert (T5). */
  shiftX?: number;
  land?: GeoPermissibleObjects | null;
  borders?: GeoPermissibleObjects | null;
};

const COL_T = '52,211,153';
const COL_B = '251,113,133';

export function drawGlobe(args: DrawGlobeArgs): Hit[] {
  const {
    ctx,
    width: W,
    height: H,
    dpr,
    projection,
    rotation,
    zoom,
    timeSec: t,
    markers,
    selectedId,
    query,
    shiftX = 0,
    land,
    borders,
  } = args;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);

  const cx = W / 2 + shiftX;
  const cy = H / 2 + 34;
  const R = Math.min(W, H) * 0.34 * zoom;
  projection.translate([cx, cy]).scale(R).rotate(rotation);
  const path = geoPath(projection, ctx);
  const grat = geoGraticule10();

  for (let k = 0; k < 90; k++) {
    const sx = (k * 137.5) % W;
    const sy = (k * 89.3 + 40) % H;
    const tw = 0.25 + 0.25 * Math.sin(t * 1.3 + k);
    ctx.fillStyle = `rgba(203,213,225,${tw.toFixed(3)})`;
    ctx.fillRect(sx, sy, 1.2, 1.2);
  }

  const atm = ctx.createRadialGradient(cx, cy, R * 0.92, cx, cy, R * 1.32);
  atm.addColorStop(0, 'rgba(56,189,248,0.28)');
  atm.addColorStop(0.4, 'rgba(59,130,246,0.1)');
  atm.addColorStop(1, 'rgba(59,130,246,0)');
  ctx.fillStyle = atm;
  ctx.beginPath();
  ctx.arc(cx, cy, R * 1.32, 0, Math.PI * 2);
  ctx.fill();

  const ocean = ctx.createRadialGradient(
    cx - R * 0.4,
    cy - R * 0.45,
    R * 0.05,
    cx,
    cy,
    R,
  );
  ocean.addColorStop(0, '#16305A');
  ocean.addColorStop(0.6, '#0B1A33');
  ocean.addColorStop(1, '#060E1E');
  ctx.beginPath();
  path({ type: 'Sphere' });
  ctx.fillStyle = ocean;
  ctx.fill();

  ctx.beginPath();
  path(grat);
  ctx.strokeStyle = 'rgba(125,170,255,0.08)';
  ctx.lineWidth = 0.6;
  ctx.stroke();

  if (land) {
    ctx.beginPath();
    path(land);
    ctx.fillStyle = '#1B2B4A';
    ctx.fill();
  }
  if (borders) {
    ctx.beginPath();
    path(borders);
    ctx.strokeStyle = 'rgba(148,180,240,0.22)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  const shade = ctx.createRadialGradient(
    cx - R * 0.35,
    cy - R * 0.4,
    R * 0.2,
    cx,
    cy,
    R * 1.02,
  );
  shade.addColorStop(0, 'rgba(255,255,255,0.05)');
  shade.addColorStop(0.7, 'rgba(0,0,0,0)');
  shade.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.beginPath();
  path({ type: 'Sphere' });
  ctx.fillStyle = shade;
  ctx.fill();

  ctx.beginPath();
  path({ type: 'Sphere' });
  ctx.strokeStyle = 'rgba(125,211,252,0.35)';
  ctx.lineWidth = 1;
  ctx.stroke();

  const center: [number, number] = [-rotation[0], -rotation[1]];
  const q = query.trim().toLowerCase();
  const hits: Hit[] = [];
  let label: {
    x: number;
    y: number;
    base: number;
    n: string;
    rgb: string;
  } | null = null;

  for (const r of markers) {
    const ll: [number, number] = [r.lon, r.lat];
    const dist = geoDistance(ll, center);
    if (dist > Math.PI / 2 - 0.04) continue;
    const p = projection(ll);
    if (!p) continue;
    const [x, y] = p;
    const fade = Math.min(1, (Math.PI / 2 - dist) / 0.35);
    const isT = r.profil === 'durable';
    const rgb = isT ? COL_T : COL_B;
    const base =
      (2.6 + (r.confiance_pct - 50) / 14) * Math.min(1.4, Math.max(0.85, zoom));
    hits.push({ id: r.id, x, y });

    const glow = ctx.createRadialGradient(x, y, 0, x, y, base * 5);
    glow.addColorStop(0, `rgba(${rgb},${(0.45 * fade).toFixed(3)})`);
    glow.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, base * 5, 0, Math.PI * 2);
    ctx.fill();

    const nRings = isT ? 2 : 1;
    for (let k = 0; k < nRings; k++) {
      const ph = (t * (isT ? 0.45 : 0.9) + r.id * 0.137 + k * 0.5) % 1;
      ctx.strokeStyle = `rgba(${rgb},${((1 - ph) * 0.7 * fade).toFixed(3)})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(x, y, base + ph * (isT ? 20 : 14), 0, Math.PI * 2);
      ctx.stroke();
    }

    const a = isT ? fade : fade * (0.75 + 0.25 * Math.sin(t * 8 + r.id));
    ctx.fillStyle = `rgba(${rgb},${a.toFixed(3)})`;
    ctx.beginPath();
    if (isT) {
      ctx.arc(x, y, base, 0, Math.PI * 2);
    } else {
      const d = base * 1.25;
      ctx.moveTo(x, y - d);
      ctx.lineTo(x + d, y);
      ctx.lineTo(x, y + d);
      ctx.lineTo(x - d, y);
      ctx.closePath();
    }
    ctx.fill();

    ctx.fillStyle = `rgba(255,255,255,${(0.85 * fade).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(x, y, Math.max(1, base * 0.32), 0, Math.PI * 2);
    ctx.fill();

    if (r.watched) {
      ctx.save();
      ctx.setLineDash([3, 4]);
      ctx.lineDashOffset = -t * 18;
      ctx.strokeStyle = `rgba(125,211,252,${(0.9 * fade).toFixed(3)})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(x, y, base + 9, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (selectedId === r.id) {
      ctx.strokeStyle = 'rgba(255,255,255,0.95)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(x, y, base + 5, 0, Math.PI * 2);
      ctx.stroke();
      label = { x, y, base, n: r.nom, rgb };
    } else if (q && r.nom.toLowerCase().includes(q) && !label) {
      label = { x, y, base, n: r.nom, rgb };
    }
  }

  if (label) {
    ctx.font = '500 13px Inter, system-ui, sans-serif';
    const tw = ctx.measureText(label.n).width;
    const bx = label.x + label.base + 14;
    const by = label.y - 30;
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(label.x + label.base + 4, label.y - 4);
    ctx.lineTo(bx, by + 14);
    ctx.stroke();

    ctx.fillStyle = 'rgba(9,15,29,0.92)';
    ctx.strokeStyle = `rgba(${label.rgb},0.7)`;
    const bw = tw + 20;
    const bh = 28;
    const rr = 8;
    ctx.beginPath();
    ctx.moveTo(bx + rr, by);
    ctx.arcTo(bx + bw, by, bx + bw, by + bh, rr);
    ctx.arcTo(bx + bw, by + bh, bx, by + bh, rr);
    ctx.arcTo(bx, by + bh, bx, by, rr);
    ctx.arcTo(bx, by, bx + bw, by, rr);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#F8FAFC';
    ctx.fillText(label.n, bx + 10, by + 18.5);
  }

  return hits;
}

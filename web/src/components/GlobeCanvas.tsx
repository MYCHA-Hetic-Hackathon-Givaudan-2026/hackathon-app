import { useEffect, useRef, useState } from 'react';
import { feature, mesh } from 'topojson-client';
import type { GeometryCollection, Topology } from 'topojson-specification';
import { drawGlobe, type GlobeMarker } from '../lib/globe/drawGlobe';
import { hitAt, hitsNear, type Hit } from '../lib/globe/hitTest';
import {
  clampLatRotation,
  createGlobeProjection,
  easeInOutCubic,
  focusRotation,
  lerpRotation,
  type Rotation,
} from '../lib/globe/projection';

type WorldTopology = Topology<{
  countries: GeometryCollection;
}>;

export type GlobeHover = {
  id: number;
  x: number;
  y: number;
};

type GlobeCanvasProps = {
  markers: readonly GlobeMarker[];
  selectedId: number | null;
  query?: string;
  onSelect: (id: number | null) => void;
  shiftX?: number;
  /** Infos signal pour le tooltip hover (nom, profil, conf…). */
  signalById?: (id: number) => {
    nom: string;
    profil: 'durable' | 'buzz';
    confiance_pct: number;
    famille: string;
    pays: string;
  } | null;
};

type DragState = {
  x: number;
  y: number;
  rot: Rotation;
  moved: boolean;
};

type AnimState = {
  from: Rotation;
  to: Rotation;
  zFrom: number;
  zTo: number;
  start: number;
  dur: number;
};

const WORLD_URL = '/world-countries.json';
const FOCUS_MS = 950;
const IDLE_SPIN_AFTER_MS = 2500;
/** Aligné Forecastro : 0.7 → 8 (molette + boutons). */
const ZOOM_MIN = 0.7;
const ZOOM_MAX = 8;

export function GlobeCanvas({
  markers,
  selectedId,
  query = '',
  onSelect,
  shiftX = 0,
  signalById,
}: GlobeCanvasProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const markersRef = useRef(markers);
  const selectedRef = useRef(selectedId);
  const queryRef = useRef(query);
  const shiftRef = useRef(shiftX);
  const onSelectRef = useRef(onSelect);
  const signalByIdRef = useRef(signalById);

  markersRef.current = markers;
  selectedRef.current = selectedId;
  queryRef.current = query;
  shiftRef.current = shiftX;
  onSelectRef.current = onSelect;
  signalByIdRef.current = signalById;

  const focusIdRef = useRef<number | null>(null);
  const apiRef = useRef<{
    zoomBy: (f: number) => void;
    resetView: () => void;
  } | null>(null);

  const [hover, setHover] = useState<{
    id: number;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const projection = createGlobeProjection();
    let rot: Rotation = [-15, -25, 0];
    let zoom = 1;
    let hits: Hit[] = [];
    let drag: DragState | null = null;
    let anim: AnimState | null = null;
    let lastInteract = 0;
    let land: ReturnType<typeof feature> | null = null;
    let borders: ReturnType<typeof mesh> | null = null;
    let cw = 0;
    let ch = 0;
    let dpr = 1;
    let prevT = performance.now();
    let raf = 0;
    let cancelled = false;
    let hoverId: number | null = null;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cw = wrap.clientWidth;
      ch = wrap.clientHeight;
      canvas.width = Math.round(cw * dpr);
      canvas.height = Math.round(ch * dpr);
    };

    const pointerPos = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const flyTo = (lon: number, lat: number, z: number, dur = 1000) => {
      anim = {
        from: [...rot] as Rotation,
        to: focusRotation(lon, lat),
        zFrom: zoom,
        zTo: Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z)),
        start: performance.now(),
        dur,
      };
      lastInteract = performance.now();
    };

    const zoomBy = (f: number) => {
      anim = {
        from: [...rot] as Rotation,
        to: [...rot] as Rotation,
        zFrom: zoom,
        zTo: Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom * f)),
        start: performance.now(),
        dur: 450,
      };
      lastInteract = performance.now();
    };

    const resetView = () => {
      onSelectRef.current(null);
      anim = {
        from: [...rot] as Rotation,
        to: [rot[0], -20, 0],
        zFrom: zoom,
        zTo: 1,
        start: performance.now(),
        dur: 900,
      };
      lastInteract = performance.now();
      setHover(null);
      hoverId = null;
    };

    apiRef.current = { zoomBy, resetView };

    const onDown = (e: PointerEvent) => {
      setHover(null);
      hoverId = null;
      drag = {
        x: e.clientX,
        y: e.clientY,
        rot: [...rot] as Rotation,
        moved: false,
      };
      anim = null;
      lastInteract = performance.now();
      canvas.style.cursor = 'grabbing';
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    };

    const onMove = (e: PointerEvent) => {
      if (drag) {
        const dx = e.clientX - drag.x;
        const dy = e.clientY - drag.y;
        if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
        const k = 0.28 / zoom;
        rot = [drag.rot[0] + dx * k, clampLatRotation(drag.rot[1] - dy * k), 0];
        lastInteract = performance.now();
        return;
      }
      const { x, y } = pointerPos(e);
      const id = hitAt(hits, x, y);
      canvas.style.cursor = id != null ? 'pointer' : 'grab';
      if (id !== hoverId) {
        hoverId = id;
        if (id == null) {
          setHover(null);
        } else {
          const hp = hits.find((h) => h.id === id);
          if (hp) {
            setHover({
              id,
              x: Math.round(hp.x + 16),
              y: Math.round(hp.y - 20),
            });
            lastInteract = performance.now();
          }
        }
      }
    };

    const onUp = (e: PointerEvent) => {
      if (drag && !drag.moved) {
        const { x, y } = pointerPos(e);
        const near = hitsNear(hits, x, y);
        if (near.length > 1 && zoom < 7.5) {
          const pts = near
            .map((h) => markersRef.current.find((m) => m.id === h.id))
            .filter((m): m is GlobeMarker => m != null);
          if (pts.length) {
            const lon = pts.reduce((a, p) => a + p.lon, 0) / pts.length;
            const lat = pts.reduce((a, p) => a + p.lat, 0) / pts.length;
            flyTo(lon, lat, Math.min(8, Math.max(zoom * 2.4, 3)));
          }
        } else if (near.length) {
          let best = near[0];
          let bd = 1e9;
          for (const h of near) {
            const d = Math.hypot(h.x - x, h.y - y);
            if (d < bd) {
              bd = d;
              best = h;
            }
          }
          onSelectRef.current(best.id);
        }
      }
      drag = null;
      canvas.style.cursor = 'grab';
    };

    const onLeave = () => {
      if (hoverId != null) {
        hoverId = null;
        setHover(null);
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      anim = null;
      if (hoverId != null) {
        hoverId = null;
        setHover(null);
      }
      const f = Math.exp(-e.deltaY * 0.0015);
      const nz = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom * f));
      if (nz > zoom) {
        const rc = canvas.getBoundingClientRect();
        const g = projection.invert([e.clientX - rc.left, e.clientY - rc.top]);
        if (g && !Number.isNaN(g[0])) {
          const k = Math.min(0.35, (nz / zoom - 1) * 1.2);
          let d0 = -g[0] - rot[0];
          d0 = ((d0 + 540) % 360) - 180;
          rot = [
            rot[0] + d0 * k,
            clampLatRotation(rot[1] + (-g[1] - rot[1]) * k),
            0,
          ];
        }
      }
      zoom = nz;
      lastInteract = performance.now();
    };

    const tick = (now: number) => {
      const dt = Math.min(64, now - prevT);
      prevT = now;
      const t = now / 1000;

      const sel = selectedRef.current;
      if (sel != null && focusIdRef.current !== sel) {
        const m = markersRef.current.find((r) => r.id === sel);
        if (m) {
          flyTo(m.lon, m.lat, Math.max(zoom, 1.8), FOCUS_MS);
          lastInteract = now;
        }
        focusIdRef.current = sel;
      } else if (sel == null) {
        focusIdRef.current = null;
      }

      if (anim) {
        const k = Math.min(1, (now - anim.start) / anim.dur);
        const e = easeInOutCubic(k);
        rot = lerpRotation(anim.from, anim.to, e);
        zoom = anim.zFrom + (anim.zTo - anim.zFrom) * e;
        if (k >= 1) anim = null;
      } else if (
        !drag &&
        sel == null &&
        now - lastInteract > IDLE_SPIN_AFTER_MS
      ) {
        rot = [rot[0] + dt * 0.006, rot[1], 0];
      }

      const ctx = canvas.getContext('2d');
      if (ctx && cw > 0) {
        hits = drawGlobe({
          ctx,
          width: cw,
          height: ch,
          dpr,
          projection,
          rotation: rot,
          zoom,
          timeSec: t,
          markers: markersRef.current,
          selectedId: sel,
          query: queryRef.current,
          shiftX: shiftRef.current,
          land,
          borders,
        });
      }

      raf = requestAnimationFrame(tick);
    };

    fetch(WORLD_URL)
      .then((r) => r.json())
      .then((raw: unknown) => {
        if (cancelled) return;
        const world = raw as WorldTopology;
        land = feature(world, world.objects.countries);
        borders = mesh(world, world.objects.countries, (a, b) => a !== b);
      })
      .catch(() => {
        /* globe usable without land */
      });

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('pointerleave', onLeave);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();
    raf = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      apiRef.current = null;
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('wheel', onWheel);
    };
  }, []);

  const hoverView = hover ? (signalById?.(hover.id) ?? null) : null;

  return (
    <div ref={wrapRef} className="map-zone__globe">
      <canvas
        ref={canvasRef}
        className="map-zone__globe-canvas"
        role="img"
        aria-label="Globe des signaux : ronds bleus pour les tendances durables, losanges argile pour les buzz"
      />

      {hover && hoverView ? (
        <div
          className="map-zone__hover"
          style={{ left: hover.x, top: hover.y }}
          aria-hidden="true"
        >
          <span className="map-zone__hover-name">{hoverView.nom}</span>
          <span
            className={
              hoverView.profil === 'durable'
                ? 'map-zone__hover-verdict map-zone__hover-verdict--t'
                : 'map-zone__hover-verdict map-zone__hover-verdict--b'
            }
          >
            <span
              className={
                hoverView.profil === 'durable'
                  ? 'map-zone__dot'
                  : 'map-zone__diamond'
              }
            />
            {hoverView.profil === 'durable' ? 'Tendance durable' : 'Buzz'} ·{' '}
            {hoverView.confiance_pct} %
          </span>
          <span className="map-zone__hover-meta">
            {hoverView.famille} · {hoverView.pays}
          </span>
        </div>
      ) : null}

      <div className="map-zone__zoom" role="group" aria-label="Zoom">
        <button
          type="button"
          className="map-zone__zoom-btn"
          aria-label="Zoomer"
          onClick={() => apiRef.current?.zoomBy(1.6)}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
        <button
          type="button"
          className="map-zone__zoom-btn"
          aria-label="Dézoomer"
          onClick={() => apiRef.current?.zoomBy(1 / 1.6)}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M5 12h14" />
          </svg>
        </button>
        <button
          type="button"
          className="map-zone__zoom-btn"
          aria-label="Vue globale"
          onClick={() => apiRef.current?.resetView()}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
          </svg>
        </button>
      </div>
    </div>
  );
}

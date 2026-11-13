import { useEffect, useRef } from 'react';
import { feature, mesh } from 'topojson-client';
import type { GeometryCollection, Topology } from 'topojson-specification';
import { drawGlobe, type GlobeMarker } from '../lib/globe/drawGlobe';
import { hitAt, type Hit } from '../lib/globe/hitTest';
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

type GlobeCanvasProps = {
  markers: readonly GlobeMarker[];
  selectedId: number | null;
  query?: string;
  onSelect: (id: number | null) => void;
  shiftX?: number;
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
  start: number;
  dur: number;
};

const WORLD_URL = '/world-countries.json';
const FOCUS_MS = 950;
const IDLE_SPIN_AFTER_MS = 2500;
const ZOOM_MIN = 0.7;
const ZOOM_MAX = 2.6;

export function GlobeCanvas({
  markers,
  selectedId,
  query = '',
  onSelect,
  shiftX = 0,
}: GlobeCanvasProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const markersRef = useRef(markers);
  const selectedRef = useRef(selectedId);
  const queryRef = useRef(query);
  const shiftRef = useRef(shiftX);
  const onSelectRef = useRef(onSelect);

  markersRef.current = markers;
  selectedRef.current = selectedId;
  queryRef.current = query;
  shiftRef.current = shiftX;
  onSelectRef.current = onSelect;

  const focusIdRef = useRef<number | null>(null);

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

    const onDown = (e: PointerEvent) => {
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
      canvas.style.cursor = hitAt(hits, x, y) != null ? 'pointer' : 'grab';
    };

    const onUp = (e: PointerEvent) => {
      if (drag && !drag.moved) {
        const { x, y } = pointerPos(e);
        const id = hitAt(hits, x, y);
        if (id != null) onSelectRef.current(id);
      }
      drag = null;
      canvas.style.cursor = 'grab';
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoom = Math.max(
        ZOOM_MIN,
        Math.min(ZOOM_MAX, zoom * (1 - e.deltaY * 0.0012)),
      );
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
          anim = {
            from: [...rot] as Rotation,
            to: focusRotation(m.lon, m.lat),
            start: now,
            dur: FOCUS_MS,
          };
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
    canvas.addEventListener('wheel', onWheel, { passive: false });
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();
    raf = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('wheel', onWheel);
    };
  }, []);

  return (
    <div ref={wrapRef} className="map-zone__globe">
      <canvas
        ref={canvasRef}
        className="map-zone__globe-canvas"
        role="img"
        aria-label="Globe terrestre des signaux : points verts pour les tendances durables, losanges roses pour les buzz"
      />
    </div>
  );
}

/** Orbe ASTRA 2D — argile → bleu Forecastro (pas WebGL). */

export function drawOrb(
  canvas: HTMLCanvasElement,
  t: number,
  opts: { busy?: boolean; size?: number } = {},
): void {
  const size = opts.size ?? 88;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const css = size;
  if (canvas.width !== css * dpr || canvas.height !== css * dpr) {
    canvas.width = css * dpr;
    canvas.height = css * dpr;
    canvas.style.width = `${css}px`;
    canvas.style.height = `${css}px`;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, css, css);

  const cx = css / 2;
  const cy = css / 2;
  const R = css * 0.28;
  const sp = opts.busy ? 2.4 : 1;

  const glow = ctx.createRadialGradient(cx, cy, R * 0.5, cx, cy, R * 1.85);
  glow.addColorStop(0, 'rgba(240,153,120,0.45)');
  glow.addColorStop(0.45, 'rgba(134,182,239,0.18)');
  glow.addColorStop(1, 'rgba(57,135,229,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, R * 1.85, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  const N = 96;
  for (let k = 0; k <= N; k++) {
    const a = (k / N) * Math.PI * 2;
    const rr =
      R *
      (1 +
        0.075 * Math.sin(3 * a + t * 1.7 * sp) +
        0.05 * Math.sin(5 * a - t * 2.3 * sp) +
        0.03 * Math.sin(8 * a + t * 3.1 * sp)) *
      (1 + 0.035 * Math.sin(t * 2.2));
    const x = cx + rr * Math.cos(a);
    const y = cy + rr * Math.sin(a);
    if (k === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();

  const fill = ctx.createRadialGradient(
    cx - R * 0.35,
    cy - R * 0.4,
    R * 0.05,
    cx,
    cy,
    R * 1.15,
  );
  fill.addColorStop(0, '#FBF3EC');
  fill.addColorStop(0.28, '#F09978');
  fill.addColorStop(0.62, '#3987E5');
  fill.addColorStop(1, '#19213B');
  ctx.fillStyle = fill;
  ctx.fill();

  ctx.save();
  ctx.clip();
  for (let k = 0; k < 3; k++) {
    ctx.strokeStyle = `rgba(255,255,255,${0.28 - k * 0.07})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(
      cx,
      cy,
      R * (0.95 - k * 0.18),
      R * (0.32 + 0.1 * Math.sin(t * 1.4 + k)),
      t * 0.9 * sp + k * 1.1,
      0,
      Math.PI * 2,
    );
    ctx.stroke();
  }
  ctx.restore();
}

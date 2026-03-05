import type { CanvasTheme } from '../types';

/** Draw a rounded rectangle (fill and/or stroke) */
export function rr(
  ctx: CanvasRenderingContext2D,
  rx: number,
  ry: number,
  rw: number,
  rh: number,
  r: number,
  fill?: string,
  stroke?: string,
  lw?: number,
): void {
  ctx.beginPath();
  ctx.roundRect(rx, ry, rw, rh, r || 4);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw || 1;
    ctx.stroke();
  }
}

/** Draw text on canvas */
export function txt(
  ctx: CanvasRenderingContext2D,
  tx: number,
  ty: number,
  text: string,
  color?: string,
  sz?: number,
  align?: CanvasTextAlign,
  wt?: string,
): void {
  ctx.fillStyle = color || '#7e90b8';
  ctx.font = (wt ? wt + ' ' : '') + (sz || 12) + 'px JetBrains Mono';
  ctx.textAlign = align || 'center';
  ctx.fillText(text, tx, ty);
}

/** Draw a dot, optionally with a radial glow */
export function drawDot(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  color: string,
  glow?: boolean,
): void {
  if (glow) {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2.5);
    g.addColorStop(0, color);
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
}

/** Linear interpolation clamped to [0, 1] */
export function lerp(a: number, b: number, p: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, p));
}

/** Draw the Aerospike cluster bar (shared by both panels) */
export function drawAerospikeCluster(
  ctx: CanvasRenderingContext2D,
  W: number,
  dbY: number,
  dbH: number,
  C: CanvasTheme,
): void {
  rr(ctx, 16, dbY, W - 32, dbH, 6, 'rgba(234,179,8,.05)', 'rgba(234,179,8,.4)', 1.5);
  txt(ctx, W / 2, dbY + 14, 'Aerospike Cluster', C.db, 10, 'center', 'bold');
  for (let i = 0; i < 3; i++) {
    const nw = 35;
    const nx = 28 + i * ((W - 75) / 2);
    rr(ctx, nx, dbY + 20, nw, 12, 3, 'rgba(234,179,8,.06)', 'rgba(234,179,8,.25)', 1.2);
    txt(ctx, nx + nw / 2, dbY + 29, 'N' + (i + 1), C.db, 7, 'center');
  }
}

/** Draw the TCP network line */
export function drawNetworkLine(
  ctx: CanvasRenderingContext2D,
  W: number,
  netY: number,
  C: CanvasTheme,
  label = '── TCP ──',
): void {
  ctx.strokeStyle = 'rgba(59,130,246,.25)';
  ctx.lineWidth = 1.2;
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.moveTo(10, netY);
  ctx.lineTo(W - 10, netY);
  ctx.stroke();
  ctx.setLineDash([]);
  txt(ctx, W / 2, netY - 3, label, C.io, 7, 'center');
}

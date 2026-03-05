import { useRef, useEffect, useCallback } from 'react';
import { useCanvasSetup } from '../../hooks/useCanvasSetup';
import type { CanvasTheme, HitRegion } from '../../types';
import styles from './Visualization.module.css';

interface AnimatedCanvasProps {
  draw: (
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    hitRegions: HitRegion[],
  ) => void;
  time: number;
  C: CanvasTheme;
  canvasHeight?: number;
  ariaLabel: string;
}

export function AnimatedCanvas({
  draw,
  time,
  C,
  canvasHeight = 600,
  ariaLabel,
}: AnimatedCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hitRegionsRef = useRef<HitRegion[]>([]);
  const size = useCanvasSetup(canvasRef, containerRef, canvasHeight);

  // Draw on every time change (driven by rAF from parent)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || size.width === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Save/restore to avoid stale scale transforms
    ctx.save();
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size.width, size.height);

    const regions: HitRegion[] = [];
    draw(ctx, size.width, size.height, regions);
    hitRegionsRef.current = regions;

    ctx.restore();
  }, [time, size.width, size.height, draw, C]);

  // Tooltip on mousemove
  const tooltipRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const tooltip = tooltipRef.current;
    if (!canvas || !tooltip) return;

    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const hit = hitRegionsRef.current.find(
      (r) => mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h,
    );

    if (hit) {
      tooltip.textContent = hit.tooltip;
      tooltip.style.display = 'block';
      tooltip.style.left = `${mx + 10}px`;
      tooltip.style.top = `${my - 28}px`;
    } else {
      tooltip.style.display = 'none';
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    const tooltip = tooltipRef.current;
    if (tooltip) tooltip.style.display = 'none';
  }, []);

  return (
    <div ref={containerRef} className={styles.canvasContainer}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={ariaLabel}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      <div ref={tooltipRef} className={styles.tooltip} />
    </div>
  );
}

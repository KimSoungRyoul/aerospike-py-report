import { useEffect, useRef, useState, type RefObject } from 'react';

export interface CanvasSize {
  width: number;
  height: number;
}

/**
 * Sets up a canvas with proper DPR scaling and ResizeObserver.
 * Only re-allocates the canvas buffer on container resize (not every frame).
 */
export function useCanvasSetup(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  containerRef: RefObject<HTMLDivElement | null>,
  canvasHeight: number = 600,
): CanvasSize {
  const [size, setSize] = useState<CanvasSize>({ width: 0, height: canvasHeight });
  const dprRef = useRef(window.devicePixelRatio || 1);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const w = Math.floor(rect.width);
      const dpr = window.devicePixelRatio || 1;
      dprRef.current = dpr;

      canvas.width = w * dpr;
      canvas.height = canvasHeight * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = canvasHeight + 'px';

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }

      setSize({ width: w, height: canvasHeight });
    };

    const ro = new ResizeObserver(updateSize);
    ro.observe(container);

    // Also listen for DPR changes (e.g. moving to external monitor)
    const mql = window.matchMedia(
      `(resolution: ${window.devicePixelRatio}dppx)`,
    );
    const onDprChange = () => updateSize();
    mql.addEventListener('change', onDprChange);

    return () => {
      ro.disconnect();
      mql.removeEventListener('change', onDprChange);
    };
  }, [canvasRef, containerRef, canvasHeight]);

  return size;
}

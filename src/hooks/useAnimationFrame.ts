import { useEffect, useRef } from 'react';

/**
 * Runs a callback on every animation frame when `active` is true.
 * The callback receives the delta time in seconds (clamped to ~33ms max).
 * Automatically cleans up when `active` becomes false or on unmount.
 */
export function useAnimationFrame(
  callback: (dt: number) => void,
  active: boolean,
): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!active) return;

    let lastTs = 0;
    let id: number;

    const loop = (ts: number) => {
      if (lastTs) {
        // Clamp dt to max ~33ms to prevent jumps on tab restore
        const dt = Math.min((ts - lastTs) / 1000, 1 / 30);
        callbackRef.current(dt);
      }
      lastTs = ts;
      id = requestAnimationFrame(loop);
    };

    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [active]);
}

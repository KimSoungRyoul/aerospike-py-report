import { useMemo } from 'react';
import type { Metrics, Schedules } from '../types';
import { GIL_HOLD_BAD, GIL_TOUCH_GOOD } from '../utils/schedule';

/**
 * Compute comparison metrics. Only meaningful after animation completes.
 */
export function useMetrics(
  t: number,
  schedules: Schedules,
): { metrics: Metrics; done: boolean } {
  const { meta } = schedules;
  const done = t >= Math.max(meta.badInferEnd, meta.goodInferEnd);

  const metrics = useMemo((): Metrics => {
    const N = schedules.bad.length;
    const stallBad = meta.badEvStallEnd - meta.badEvStallStart;
    const stallGood = schedules.good.reduce(
      (s, r) => s + (r.gilDoneT - r.gilTouchT),
      0,
    );
    return {
      stallBad,
      stallGood,
      gilSerialBad: N * GIL_HOLD_BAD,
      gilSerialGood: N * GIL_TOUCH_GOOD,
      totalBad: meta.badInferEnd,
      totalGood: meta.goodInferEnd,
      peakGilBad: meta.peakGilBad,
    };
  }, [schedules, meta]);

  return { metrics, done };
}

import { useMemo } from 'react';
import { buildSchedules } from '../utils/schedule';
import type { Schedules } from '../types';

/**
 * Memoized schedule computation. Only recomputes when N or poolSize change.
 */
export function useSimulation(N: number, poolSize: number): Schedules {
  return useMemo(() => buildSchedules(N, poolSize), [N, poolSize]);
}

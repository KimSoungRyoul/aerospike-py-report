import type { BadScheduleItem, GoodScheduleItem, Schedules } from '../types';
import { mulberry32 } from './prng';

const GIL_HOLD_BAD = 0.04; // 40μs — GIL hold per thread (Python dict conversion)
const GIL_TOUCH_GOOD = 0.012; // 12μs — GIL touch per Tokio future
const TOKIO_WORKERS = 4;

export { GIL_HOLD_BAD, GIL_TOUCH_GOOD, TOKIO_WORKERS };

export function buildBadSchedule(
  N: number,
  poolSize: number,
  seed = 42,
): { items: BadScheduleItem[]; peakGilBad: number } {
  const rand = mulberry32(seed);
  const items: BadScheduleItem[] = [];
  let peakGilBad = 0;
  const batchEndTimes: number[] = [];

  for (let i = 0; i < N; i++) {
    const batch = Math.floor(i / poolSize);
    const inBatch = i % poolSize;
    const batchSize = Math.min(N - batch * poolSize, poolSize);

    const queueRelease = batch > 0 ? batchEndTimes[batch - 1] + 0.01 : 0;
    const dispatchT = (batch > 0 ? queueRelease : 0.02) + inBatch * 0.005;

    const gilAcqT = dispatchT + 0.015;
    const gilRelT = gilAcqT + 0.02;
    const ioSendT = gilRelT + 0.01;
    const netT = 0.14 + rand() * 0.015;
    const ioRecvT = ioSendT + netT;

    const gilReAcqT = ioRecvT;
    const gilGotT = gilReAcqT + inBatch * GIL_HOLD_BAD + 0.008;
    const convertT = gilGotT + GIL_HOLD_BAD;
    const doneT = convertT + 0.005;

    if (!batchEndTimes[batch] || doneT > batchEndTimes[batch]) {
      batchEndTimes[batch] = doneT;
    }
    peakGilBad = Math.max(peakGilBad, batchSize);

    items.push({
      i,
      batch,
      inBatch,
      batchSize,
      dispatchT,
      gilAcqT,
      gilRelT,
      ioSendT,
      ioRecvT,
      gilReAcqT,
      gilGotT,
      convertT,
      doneT,
      queueStart: batch > 0 ? 0.02 : -1,
      queueEnd: batch > 0 ? dispatchT : -1,
      queued: batch > 0,
    });
  }
  return { items, peakGilBad };
}

export function buildGoodSchedule(
  N: number,
  seed = 42,
): GoodScheduleItem[] {
  const rand = mulberry32(seed);
  const items: GoodScheduleItem[] = [];

  for (let i = 0; i < N; i++) {
    const dispatchT = 0.012 + i * 0.003;
    const bridgeT = dispatchT + 0.008;
    const spawnT = bridgeT + 0.006;
    const ioSendT = spawnT + 0.006;
    const netT = 0.14 + rand() * 0.015;
    const ioRecvT = ioSendT + netT;
    const rustParseT = ioRecvT + 0.006;
    const gilTouchT = rustParseT + 0.006 + i * GIL_TOUCH_GOOD;
    const gilDoneT = gilTouchT + GIL_TOUCH_GOOD;
    const doneT = gilDoneT + 0.003;
    items.push({
      i,
      dispatchT,
      bridgeT,
      spawnT,
      ioSendT,
      ioRecvT,
      rustParseT,
      gilTouchT,
      gilDoneT,
      doneT,
    });
  }
  return items;
}

export function buildSchedules(N: number, poolSize: number): Schedules {
  const { items: bad, peakGilBad } = buildBadSchedule(N, poolSize);
  const good = buildGoodSchedule(N);

  const badAllDone = Math.max(...bad.map((s) => s.doneT));
  const badInferStart = badAllDone + 0.03;
  const badInferEnd = badInferStart + 0.5;
  const badEvStallStart = Math.min(
    ...bad.filter((s) => s.batch === 0).map((s) => s.gilReAcqT),
  );
  const badEvStallEnd = badAllDone;

  const goodAllDone = Math.max(...good.map((s) => s.doneT));
  const goodInferStart = goodAllDone + 0.02;
  const goodInferEnd = goodInferStart + 0.5;

  const duration =
    Math.max(badInferEnd, goodInferEnd) + 0.12;

  return {
    bad,
    good,
    meta: {
      badAllDone,
      badInferStart,
      badInferEnd,
      badEvStallStart,
      badEvStallEnd,
      goodAllDone,
      goodInferStart,
      goodInferEnd,
      duration,
      peakGilBad,
    },
  };
}

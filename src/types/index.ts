// ── Schedule item for the "bad" (CPython run_in_executor) path ──
export interface BadScheduleItem {
  i: number;
  batch: number;
  inBatch: number;
  batchSize: number;
  dispatchT: number;
  gilAcqT: number;
  gilRelT: number;
  ioSendT: number;
  ioRecvT: number;
  gilReAcqT: number;
  gilGotT: number;
  convertT: number;
  doneT: number;
  queueStart: number;
  queueEnd: number;
  queued: boolean;
}

// ── Schedule item for the "good" (Tokio future_into_py) path ──
export interface GoodScheduleItem {
  i: number;
  dispatchT: number;
  bridgeT: number;
  spawnT: number;
  ioSendT: number;
  ioRecvT: number;
  rustParseT: number;
  gilTouchT: number;
  gilDoneT: number;
  doneT: number;
}

// ── Simulation configuration ──
export interface SimConfig {
  N: number;
  poolSize: number;
  tokioWorkers: number;
}

// ── Computed schedule metadata ──
export interface ScheduleMeta {
  badAllDone: number;
  badInferStart: number;
  badInferEnd: number;
  badEvStallStart: number;
  badEvStallEnd: number;
  goodAllDone: number;
  goodInferStart: number;
  goodInferEnd: number;
  duration: number;
  peakGilBad: number;
}

// ── Full schedule result ──
export interface Schedules {
  bad: BadScheduleItem[];
  good: GoodScheduleItem[];
  meta: ScheduleMeta;
}

// ── Animation state managed by useReducer ──
export interface AnimationState {
  playing: boolean;
  t: number;
  speedMul: number;
  spdIdx: number;
}

export type AnimationAction =
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'TOGGLE' }
  | { type: 'TICK'; dt: number }
  | { type: 'RESET' }
  | { type: 'SET_SPEED'; spdIdx: number; speedMul: number }
  | { type: 'SEEK'; t: number };

// ── Metrics ──
export interface Metrics {
  stallBad: number;
  stallGood: number;
  gilSerialBad: number;
  gilSerialGood: number;
  totalBad: number;
  totalGood: number;
  peakGilBad: number;
}

// ── Layout dimensions computed from canvas size ──
export interface LayoutDims {
  width: number;
  height: number;
  evY: number;
  evH: number;
}

// ── Theme colors for Canvas rendering ──
export interface CanvasTheme {
  bg: string;
  s0: string;
  s1: string;
  s2: string;
  bdr: string;
  tx: string;
  tx2: string;
  tx3: string;
  gil: string;
  io: string;
  ev: string;
  ok: string;
  tokio: string;
  db: string;
  py: string;
  rs: string;
  cpu: string;
  q: string;
}

// ── Hit region for tooltip ──
export interface HitRegion {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  tooltip: string;
}

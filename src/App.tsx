import { useState, useCallback, useEffect } from 'react';

import { ReportSection } from './components/ReportSection';
import { Header } from './components/Header';
import { FlowSummary } from './components/FlowSummary';
import { ControlBar } from './components/ControlBar/ControlBar';
import { Legend } from './components/Legend';
import { ArchPanel } from './components/Visualization/ArchPanel';
import { AnimatedCanvas } from './components/Visualization/AnimatedCanvas';
import { MetricsDashboard } from './components/MetricsDashboard/MetricsDashboard';
import { InsightNotes } from './components/InsightNotes';
import { CodeComparison } from './components/CodeComparison';
import { ErrorBoundary } from './components/ErrorBoundary';

import { useAnimationFrame } from './hooks/useAnimationFrame';
import { useAnimationState } from './hooks/useAnimationState';
import { useSimulation } from './hooks/useSimulation';
import { useMetrics } from './hooks/useMetrics';
import { useFontReady } from './hooks/useFontReady';

import { drawBadFrame, getBadStatus } from './renderers/badFrame';
import { drawGoodFrame, getGoodStatus } from './renderers/goodFrame';

import { darkTheme, lightTheme } from './theme/colors';
import { TOKIO_WORKERS } from './utils/schedule';
import type { HitRegion, CanvasTheme } from './types';

import './styles/global.css';

import vizStyles from './components/Visualization/Visualization.module.css';

const FONT_FAMILIES = ['JetBrains Mono', 'Noto Sans KR'];

export default function App() {
  const [N, setN] = useState(5);
  const [poolSize, setPoolSize] = useState(8);
  const [isDark, setIsDark] = useState(true);
  const C: CanvasTheme = isDark ? darkTheme : lightTheme;

  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
  }, [isDark]);

  const fontReady = useFontReady(FONT_FAMILIES);
  const schedules = useSimulation(N, poolSize);
  const { state, toggle, reset, tick, seek, nextSpeed } = useAnimationState();
  const { metrics, done } = useMetrics(state.t, schedules);

  // Clamp time to duration
  const t = Math.min(state.t, schedules.meta.duration);

  // Auto-stop when animation completes
  useEffect(() => {
    if (state.playing && t >= schedules.meta.duration) {
      toggle();
    }
  }, [t, schedules.meta.duration, state.playing, toggle]);

  // Animation loop
  useAnimationFrame(tick, state.playing);

  // Reset when N or poolSize changes
  const handleSetN = useCallback(
    (n: number) => {
      setN(n);
      reset();
    },
    [reset],
  );

  const handleSetPool = useCallback(
    (p: number) => {
      setPoolSize(p);
      reset();
    },
    [reset],
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        toggle();
      } else if (e.code === 'KeyR') {
        reset();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [toggle, reset]);

  // Draw callbacks (stable references via useCallback)
  const drawBad = useCallback(
    (ctx: CanvasRenderingContext2D, W: number, H: number, hitRegions: HitRegion[]) => {
      drawBadFrame(ctx, W, H, t, schedules.bad, schedules.meta, N, poolSize, C, hitRegions);
    },
    [t, schedules, N, poolSize, C],
  );

  const drawGood = useCallback(
    (ctx: CanvasRenderingContext2D, W: number, H: number, hitRegions: HitRegion[]) => {
      drawGoodFrame(ctx, W, H, t, schedules.good, schedules.meta, N, TOKIO_WORKERS, C, hitRegions);
    },
    [t, schedules, N, C],
  );

  // Status HTML
  const badStatus = getBadStatus(t, schedules.bad, schedules.meta, N, C);
  const goodStatus = getGoodStatus(t, schedules.good, schedules.meta, N, C);

  if (!fontReady) {
    return (
      <div className="page" style={{ textAlign: 'center', paddingTop: '40px' }}>
        <p className="mono" style={{ color: 'var(--tx3)' }}>Loading fonts...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <ReportSection />
      <Header />
      <FlowSummary />

      <ControlBar
        playing={state.playing}
        speedMul={state.speedMul}
        t={t}
        duration={schedules.meta.duration}
        N={N}
        poolSize={poolSize}
        isDark={isDark}
        onToggle={toggle}
        onReset={reset}
        onNextSpeed={nextSpeed}
        onSetN={handleSetN}
        onSetPool={handleSetPool}
        onSeek={seek}
        onToggleTheme={() => setIsDark((d) => !d)}
      />

      <Legend />

      <ErrorBoundary>
      <div className={vizStyles.wrap}>
        <ArchPanel
          variant="bad"
          title={`🔴 OFFICIAL — run_in_executor (pool=${poolSize}, req=${N})`}
          statusHtml={badStatus}
        >
          <AnimatedCanvas
            draw={drawBad}
            time={t}
            C={C}
            ariaLabel={`CPython run_in_executor 아키텍처 애니메이션 — pool=${poolSize}, 요청=${N}`}
          />
        </ArchPanel>

        <ArchPanel
          variant="good"
          title={`🟢 AEROSPIKE-PY — Tokio (workers=${TOKIO_WORKERS}, req=${N})`}
          statusHtml={goodStatus}
        >
          <AnimatedCanvas
            draw={drawGood}
            time={t}
            C={C}
            ariaLabel={`Tokio future_into_py 아키텍처 애니메이션 — workers=${TOKIO_WORKERS}, 요청=${N}`}
          />
        </ArchPanel>
      </div>
      </ErrorBoundary>

      <MetricsDashboard
        metrics={metrics}
        done={done}
        N={N}
        poolSize={poolSize}
        C={C}
      />

      <InsightNotes />
      <CodeComparison />
    </div>
  );
}

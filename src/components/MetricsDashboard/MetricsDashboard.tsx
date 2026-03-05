import styles from './MetricsDashboard.module.css';
import { MetricCard } from './MetricCard';
import type { Metrics, CanvasTheme } from '../../types';

interface MetricsDashboardProps {
  metrics: Metrics;
  done: boolean;
  N: number;
  poolSize: number;
  C: CanvasTheme;
}

export function MetricsDashboard({ metrics, done, N, poolSize, C }: MetricsDashboardProps) {
  return (
    <div className={styles.metrics}>
      <MetricCard
        label="이벤트 루프 STALL"
        value={
          done
            ? `<span style="color:${C.gil}">${metrics.stallBad.toFixed(2)}</span> / <span style="color:${C.ok}">${metrics.stallGood.toFixed(3)}</span>ms`
            : '—'
        }
        subtitle={done ? `${(metrics.stallBad / metrics.stallGood).toFixed(0)}× 차이` : ''}
      />
      <MetricCard
        label="GIL 직렬 처리 시간"
        value={`<span style="color:${C.gil}">${metrics.gilSerialBad.toFixed(2)}</span> / <span style="color:${C.ok}">${metrics.gilSerialGood.toFixed(3)}</span>ms`}
        subtitle={`~40μs×${N} vs ~12μs×${N}`}
      />
      <MetricCard
        label="전체 소요"
        value={
          done
            ? `<span style="color:${C.gil}">${metrics.totalBad.toFixed(2)}</span> / <span style="color:${C.ok}">${metrics.totalGood.toFixed(2)}</span>ms`
            : '—'
        }
        subtitle={done ? `Tokio ${(metrics.totalBad / metrics.totalGood).toFixed(1)}× 빠름` : ''}
      />
      <MetricCard
        label="GIL 경합 peak"
        value={`<span style="color:${C.gil}">${metrics.peakGilBad}</span> / <span style="color:${C.ok}">1</span>`}
        subtitle={`pool=${poolSize}, req=${N}`}
      />
    </div>
  );
}

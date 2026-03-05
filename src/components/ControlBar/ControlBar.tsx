import styles from './ControlBar.module.css';
import { PlayButton } from './PlayButton';
import { SpeedButton } from './SpeedButton';
import { ParamSelector } from './ParamSelector';
import { TimelineScrubber } from './TimelineScrubber';

interface ControlBarProps {
  playing: boolean;
  speedMul: number;
  t: number;
  duration: number;
  N: number;
  poolSize: number;
  isDark: boolean;
  onToggle: () => void;
  onReset: () => void;
  onNextSpeed: () => void;
  onSetN: (n: number) => void;
  onSetPool: (p: number) => void;
  onSeek: (t: number) => void;
  onToggleTheme: () => void;
}

const N_OPTIONS = [5, 10, 20, 50];
const POOL_OPTIONS = [8, 16, 32, 50];

export function ControlBar({
  playing,
  speedMul,
  t,
  duration,
  N,
  poolSize,
  isDark,
  onToggle,
  onReset,
  onNextSpeed,
  onSetN,
  onSetPool,
  onSeek,
  onToggleTheme,
}: ControlBarProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.ctrls}>
        <PlayButton
          playing={playing}
          finished={t >= duration}
          onToggle={onToggle}
        />
        <button className={styles.btn} onClick={onReset}>
          ↺ Reset
        </button>
        <span className={styles.sep}>│</span>
        <SpeedButton speedMul={speedMul} onNextSpeed={onNextSpeed} />
        <span className={styles.sep}>│</span>
        <ParamSelector
          label="요청"
          options={N_OPTIONS}
          value={N}
          onChange={onSetN}
          variant="cyan"
        />
        <span className={styles.sep}>│</span>
        <ParamSelector
          label="Pool"
          options={POOL_OPTIONS}
          value={poolSize}
          onChange={onSetPool}
          variant="red"
        />
        <span className={styles.sep}>│</span>
        <span className={styles.info}>{t.toFixed(3)}ms</span>
        <span className={styles.sep}>│</span>
        <button className={styles.btn} onClick={onToggleTheme} aria-label="테마 전환">
          {isDark ? '☀' : '☾'}
        </button>
      </div>
      <TimelineScrubber
        t={t}
        duration={duration}
        onSeek={onSeek}
      />
    </div>
  );
}

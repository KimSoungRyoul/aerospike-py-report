import { useCallback } from 'react';
import styles from './TimelineScrubber.module.css';

interface TimelineScrubberProps {
  t: number;
  duration: number;
  onSeek: (t: number) => void;
}

export function TimelineScrubber({ t, duration, onSeek }: TimelineScrubberProps) {
  const pct = duration > 0 ? (t / duration) * 100 : 0;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onSeek(parseFloat(e.target.value));
    },
    [onSeek],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const step = 0.01;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onSeek(Math.max(0, t - step));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onSeek(Math.min(duration, t + step));
      }
    },
    [t, duration, onSeek],
  );

  return (
    <div className={styles.scrubber}>
      <input
        type="range"
        className={styles.input}
        min={0}
        max={duration}
        step={0.001}
        value={t}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        aria-label="Timeline scrubber"
      />
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

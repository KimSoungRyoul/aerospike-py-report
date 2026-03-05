import styles from './ControlBar.module.css';

interface PlayButtonProps {
  playing: boolean;
  finished: boolean;
  onToggle: () => void;
}

export function PlayButton({ playing, finished, onToggle }: PlayButtonProps) {
  const label = playing ? '⏸ Pause' : finished ? '▶ Replay' : '▶ Play';
  return (
    <button
      className={`${styles.btn} ${playing ? styles.btnActive : ''}`}
      onClick={onToggle}
      aria-label={label}
    >
      {label}
    </button>
  );
}

import styles from './ControlBar.module.css';

interface SpeedButtonProps {
  speedMul: number;
  onNextSpeed: () => void;
}

export function SpeedButton({ speedMul, onNextSpeed }: SpeedButtonProps) {
  return (
    <button
      className={styles.btn}
      onClick={onNextSpeed}
      aria-label={`Speed ${speedMul}×`}
    >
      {speedMul}×
    </button>
  );
}

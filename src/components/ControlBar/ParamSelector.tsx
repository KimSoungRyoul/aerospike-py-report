import styles from './ControlBar.module.css';

interface ParamSelectorProps {
  label: string;
  options: number[];
  value: number;
  onChange: (v: number) => void;
  variant: 'cyan' | 'red';
}

export function ParamSelector({
  label,
  options,
  value,
  onChange,
  variant,
}: ParamSelectorProps) {
  const activeClass = variant === 'cyan' ? styles.btnCyan : styles.btnRed;

  return (
    <>
      <span className={styles.paramLabel}>{label}:</span>
      {options.map((opt) => (
        <button
          key={opt}
          className={`${styles.btn} ${opt === value ? activeClass : ''}`}
          onClick={() => onChange(opt)}
          aria-pressed={opt === value}
        >
          {opt}
        </button>
      ))}
    </>
  );
}

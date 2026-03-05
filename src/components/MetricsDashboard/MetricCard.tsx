import styles from './MetricsDashboard.module.css';

interface MetricCardProps {
  label: string;
  value: string;
  subtitle: string;
}

export function MetricCard({ label, value, subtitle }: MetricCardProps) {
  return (
    <div className={styles.mc}>
      <div className={styles.mcLabel}>{label}</div>
      <div
        className={styles.mcValue}
        dangerouslySetInnerHTML={{ __html: value }}
      />
      <div className={styles.mcSubtitle}>{subtitle}</div>
    </div>
  );
}

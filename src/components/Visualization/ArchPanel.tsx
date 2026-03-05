import type { ReactNode } from 'react';
import styles from './Visualization.module.css';

interface ArchPanelProps {
  variant: 'bad' | 'good';
  title: ReactNode;
  children: ReactNode;
  statusHtml: string;
}

export function ArchPanel({ variant, title, children, statusHtml }: ArchPanelProps) {
  return (
    <div className={`${styles.panel} ${variant === 'bad' ? styles.bad : styles.good}`}>
      <div className={styles.panelTitle}>{title}</div>
      {children}
      <div
        className={styles.status}
        role="status"
        aria-live="polite"
        dangerouslySetInnerHTML={{ __html: statusHtml }}
      />
    </div>
  );
}

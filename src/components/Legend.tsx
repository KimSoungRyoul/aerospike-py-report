import styles from './Legend.module.css';

const items = [
  { color: 'var(--ev)', label: 'Event Loop' },
  { color: 'var(--io)', label: 'Request' },
  { color: 'var(--db)', label: 'Response' },
  { color: 'var(--gil)', label: 'GIL 경합' },
  { color: 'var(--q)', label: '큐 대기' },
  { color: 'var(--ok)', label: 'GIL 터치' },
  { color: 'var(--tokio)', label: 'Tokio task' },
];

export function Legend() {
  return (
    <div className={styles.lg}>
      {items.map((item) => (
        <span key={item.label}>
          <i style={{ background: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

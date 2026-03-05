import styles from './Header.module.css';

export function Header() {
  return (
    <div className={styles.hd}>
      <h1 className="mono">
        <span className={styles.r}>run_in_executor</span> vs{' '}
        <span className={styles.g}>Tokio future_into_py</span>
      </h1>
      <p>
        동시 요청 수와 ThreadPool 크기를 조절하여, GIL 경합이 이벤트 루프에 미치는
        구조적 영향을 비교 분석합니다.
      </p>
    </div>
  );
}

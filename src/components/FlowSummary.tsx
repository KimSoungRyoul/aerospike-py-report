import styles from './FlowSummary.module.css';

export function FlowSummary() {
  return (
    <div className={styles.flow}>
      <div className={`${styles.flowItem} ${styles.flowBad}`}>
        Official<span className={styles.ar}> → </span>async 껍데기
        <span className={styles.ar}> → </span>멀티스레드
        <span className={styles.ar}> → </span>GIL 경합
        <span className={styles.ar}> → </span>
        <b>사실상 직렬</b>
      </div>
      <div className={`${styles.flowItem} ${styles.flowGood}`}>
        aerospike-py<span className={styles.ar}> → </span>Rust native async
        <span className={styles.ar}> → </span>epoll
        <span className={styles.ar}> → </span>GIL-free
        <span className={styles.ar}> → </span>
        <b>진짜 병렬 I/O</b>
      </div>
    </div>
  );
}

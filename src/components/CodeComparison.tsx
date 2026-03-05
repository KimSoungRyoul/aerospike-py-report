import styles from './CodeComparison.module.css';

export function CodeComparison() {
  return (
    <details className={styles.codeCmp}>
      <summary>코드 비교: &quot;가짜 async&quot; vs &quot;진짜 async&quot;</summary>
      <div className={styles.cmpBody}>
        <div className={`${styles.cmpCol} ${styles.badCol}`}>
          <h4>🔴 Official Client — &quot;가짜 async&quot;</h4>
          <code>
            <span className={styles.kw}>await</span> client.get(key){' '}
            <span className={styles.cm}>← async처럼 보이지만</span>
          </code>
          <code>&nbsp;</code>
          <code>
            <span className={styles.cm}># 실제 내부:</span>
          </code>
          <code>
            loop.<span className={styles.kw}>run_in_executor</span>(
          </code>
          <code>&nbsp;&nbsp;pool, sync_client.get, key</code>
          <code>
            ) <span className={styles.cm}>← OS 스레드에 blocking 호출 위임</span>
          </code>
          <code>&nbsp;</code>
          <code>
            <span className={styles.cm}># 결과:</span>
          </code>
          <code>
            <span className={styles.cm}># N개 스레드 동시 I/O 완료</span>
          </code>
          <code>
            <span className={styles.cm}># → N개 GIL 재획득 시도</span>
          </code>
          <code>
            <span className={styles.cm}># → ~40μs × N 직렬 처리</span>
          </code>
          <code>
            <span className={styles.cm}># → 이벤트 루프 정지</span>
          </code>
        </div>
        <div className={`${styles.cmpCol} ${styles.goodCol}`}>
          <h4>🟢 aerospike-py — &quot;진짜 async&quot;</h4>
          <code>
            <span className={styles.kw}>await</span> async_client.get(key){' '}
            <span className={styles.cm}>← 진짜 async</span>
          </code>
          <code>&nbsp;</code>
          <code>
            <span className={styles.cm}># 실제 내부:</span>
          </code>
          <code>Rust Future (Tokio runtime)</code>
          <code>
            &nbsp;&nbsp;<span className={styles.kw}>epoll_wait</span> 소켓 다중화
          </code>
          <code>&nbsp;&nbsp;GIL 없이 네트워크 처리 + 파싱</code>
          <code>&nbsp;</code>
          <code>
            <span className={styles.cm}># 결과:</span>
          </code>
          <code>
            <span className={styles.cm}># Tokio에서 N개 Future 완료</span>
          </code>
          <code>
            <span className={styles.cm}># → Rust에서 파싱 (GIL 불필요)</span>
          </code>
          <code>
            <span className={styles.cm}># → ~12μs GIL 터치로 결과 전달</span>
          </code>
          <code>
            <span className={styles.cm}># → 이벤트 루프 무중단</span>
          </code>
        </div>
      </div>
    </details>
  );
}

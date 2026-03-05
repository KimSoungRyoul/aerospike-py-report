import styles from './InsightNotes.module.css';

interface NoteProps {
  variant: 'key' | 'warn' | 'insight';
  icon: string;
  children: React.ReactNode;
}

function Note({ variant, icon, children }: NoteProps) {
  return (
    <div className={`${styles.nt} ${styles[variant]}`}>
      <span className={styles.ic}>{icon}</span>
      <div>{children}</div>
    </div>
  );
}

export function InsightNotes() {
  return (
    <>
      <Note variant="key" icon="🔬">
        <b>Pool 크기를 변경하여 비교하십시오.</b> pool=8일 때는 큐 blocking과 GIL
        8-way 경합이 발생하고, pool=50일 때는 큐가 사라지는 대신 GIL 50-way 경합이
        폭발합니다.{' '}
        <b className="mono" style={{ color: 'var(--gil)' }}>
          Pool 크기와 무관하게 이벤트 루프 stall은 해소되지 않습니다.
        </b>
      </Note>
      <Note variant="warn" icon="⚠️">
        <b>run_in_executor는 성능 패턴이 아닙니다.</b> async API처럼 보이지만 내부는
        blocking C client를 OS 스레드에 위임하는 호환성 브릿지입니다. N개 스레드가
        동시에 I/O를 완료하면 GIL 재획득에서{' '}
        <b className="mono" style={{ color: 'var(--gil)' }}>
          ~40μs × N의 직렬 처리
        </b>
        가 발생하며, 이 동안 이벤트 루프는 완전히 정지합니다.
      </Note>
      <Note variant="insight" icon="✅">
        <b>Tokio가 구조적으로 다른 이유.</b> epoll_wait 한 번으로 수백 개 소켓을
        동시에 감시하고, Rust 네이티브 코드로 응답을 파싱합니다. 이 전체 과정에서
        GIL이 불필요합니다. 결과 전달 시에만{' '}
        <b className="mono" style={{ color: 'var(--ok)' }}>
          ~12μs의 GIL 터치
        </b>
        가 발생하며, 이벤트 루프는 한 번도 멈추지 않습니다.
      </Note>
    </>
  );
}

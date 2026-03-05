import styles from './ReportSection.module.css';

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.metaItem}>
      <span className={styles.metaLabel}>{label}</span>
      <span className={styles.metaValue}>{value}</span>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      <div className={styles.sectionBody}>{children}</div>
    </div>
  );
}

export function ReportSection() {
  return (
    <article className={styles.report}>
      {/* ── Title Block ── */}
      <div className={styles.titleBlock}>
        <h1 className={styles.reportTitle}>
          CPython GIL 경합: Aerospike Async Client 성능 문제 개선
        </h1>
        <p className={styles.reportSubtitle}>
          <code className="mono">run_in_executor</code> 기반 공식 클라이언트와
          Tokio 네이티브 런타임 기반 <code className="mono">aerospike-py</code>의
          동시성 모델 비교 연구
        </p>
        <div className={styles.meta}>
          <Meta label="Date" value="2026-03-05" />
          <Meta label="Version" value="v1.0" />
          <Meta label="Status" value="Draft" />
        </div>
      </div>

      {/* ── Table of Contents ── */}
      <Section title="목차">
        <div className={styles.toc}>
          <div className={styles.tocItem}>
            <span className={styles.tocNum}>1</span>
            <span className={styles.tocLabel}>개요 및 배경</span>
          </div>
          <div className={styles.tocItem}>
            <span className={styles.tocNum}>2</span>
            <span className={styles.tocLabel}>아키텍처 비교</span>
          </div>
          <div className={styles.tocItem}>
            <span className={styles.tocNum}>3</span>
            <span className={styles.tocLabel}>시뮬레이션 분석</span>
          </div>
          <div className={styles.tocItem}>
            <span className={styles.tocNum}>4</span>
            <span className={styles.tocLabel}>지표 비교</span>
          </div>
          <div className={styles.tocItem}>
            <span className={styles.tocNum}>5</span>
            <span className={styles.tocLabel}>핵심 인사이트</span>
          </div>
          <div className={styles.tocItem}>
            <span className={styles.tocNum}>6</span>
            <span className={styles.tocLabel}>코드 비교</span>
          </div>
        </div>
      </Section>

      {/* ── Executive Summary ── */}
      <Section title="Executive Summary">
        <p>
          본 보고서는 Python 비동기 환경에서 Aerospike 데이터베이스 클라이언트의
          두 가지 동시성 모델을 비교 분석합니다.
        </p>
        <p>
          공식 Aerospike Python Client는{' '}
          <span className={styles.bad}>run_in_executor</span>를 사용하여
          blocking C 클라이언트를 OS 스레드 풀에 위임하는 방식을 채택하고 있으며,
          Aerospike 팀 역시 이 패턴의 사용을 권장하고 있습니다(
          <a
            href="https://github.com/aerospike/aerospike-client-python/issues/263#issuecomment-2463025139"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.accent}
          >
            관련 이슈 #263
          </a>
          ). 이 접근법은 FastAPI와 같은 비동기 애플리케이션 환경에서 Sync Client로
          인해 프로세스 전체가 block 되는 문제를 해결하여,
          TPS를 효과적으로 개선하는 데 성공적입니다.
        </p>
        <p>
          그러나 이 동시성 모델은 내부적으로 멀티스레딩 방식이며, CPython의{' '}
          <span className={styles.bad}>GIL(Global Interpreter Lock)</span>로 인해
          다중 스레드가 동시에 Python 객체에 접근할 때 직렬화가 발생합니다.
          구체적으로, N개의 요청이 동시에 I/O를 완료하면{' '}
          <span className={styles.bad}>~40μs × N</span> 만큼의 GIL 재획득 대기가
          누적되어 이벤트 루프가 완전히 정지하는 심각한 성능 저하를 초래합니다.
          ThreadPool 크기를 늘려도 이 문제는 해소되지 않으며, 오히려 GIL 경합이
          심화되어{' '}
          <span className={styles.bad}>사실상 직렬 처리</span>에 가까운 성능을
          보입니다.
          이는 Sync Client에 비해 효과적인 개선을 보여주기는 하지만 더 높은 동시성 요구 사항에서는 여전히 심각한 병목으로 작용합니다.
        </p>
        <p>
          <span className={styles.good}>aerospike-py</span>는 이러한 문제를 Rust의 Tokio
          비동기 런타임을 기반으로 하여, <code className="mono">epoll</code> 기반
          소켓 다중화와 GIL-free 네이티브 처리를 통해{' '}
          <span className={styles.good}>진정한 병렬 I/O</span>를 구현하여서 해결합니다.
          전체 네트워크 처리와 응답 파싱이 Rust 영역에서 수행되므로 GIL이
          불필요하며, 결과 전달 시에만{' '}
          <span className={styles.good}>~12μs의 최소 GIL 접근</span>이 발생합니다.
          이로 인해 이벤트 루프는 거의 정지하지 않고, 동시 요청 수가 증가하더라도{' '}
          <b className={styles.good}>훨씬 높은 TPS와 낮은 지연을 안정적으로 유지</b>합니다.
        </p>
      </Section>

      {/* ── Key Findings ── */}
      <Section title="주요 발견">
        <ul className={styles.findings}>
          <li className={styles.finding}>
            <span className={styles.findingIcon}>🔴</span>
            <span>
              <b>GIL 병목:</b> <code className="mono">run_in_executor</code>는 N개
              스레드가 동시에 I/O를 완료하면{' '}
              <span className={styles.bad}>~40μs × N의 GIL 경합</span>이 발생하여
              이벤트 루프가 완전히 정지합니다.
            </span>
          </li>
          <li className={styles.finding}>
            <span className={styles.findingIcon}>🟢</span>
            <span>
              <b>GIL-free I/O:</b> Tokio 런타임은 전체 네트워크 처리를 Rust 영역에서
              수행하며, 결과 전달 시에만{' '}
              <span className={styles.good}>~12μs의 최소 GIL 접근</span>이
              발생합니다.
            </span>
          </li>
          <li className={styles.finding}>
            <span className={styles.findingIcon}>📊</span>
            <span>
              <b>Pool 크기 무관:</b> ThreadPool 크기를 8에서 50으로 증가시켜도
              이벤트 루프 stall은{' '}
              <span className={styles.bad}>해소되지 않으며 오히려 악화</span>됩니다.
            </span>
          </li>
          <li className={styles.finding}>
            <span className={styles.findingIcon}>⚡</span>
            <span>
              <b>구조적 차이:</b> 이 차이는 튜닝으로 해결할 수 없는{' '}
              <span className={styles.accent}>아키텍처 수준의 근본적 차이</span>
              입니다.
            </span>
          </li>
        </ul>
      </Section>

      {/* ── Background ── */}
      <Section title="배경">
        <p>
          Python의 asyncio는 단일 스레드 이벤트 루프 기반으로 동작합니다.
          네이티브 비동기를 지원하지 않는 라이브러리는{' '}
          <code className="mono">loop.run_in_executor()</code>를 통해 별도의 OS
          스레드에서 blocking 호출을 실행하고, 완료 시 이벤트 루프로 결과를 반환하는
          패턴을 사용합니다.
        </p>
        <p>
          이 패턴은 호환성 브릿지로서는 유효하지만, CPython의 GIL로 인해
          다중 스레드가 동시에 Python 객체에 접근할 때 직렬화가 발생합니다.
          아래 인터랙티브 시뮬레이션을 통해 이 구조적 차이를 시각적으로 확인할 수
          있습니다.
        </p>
      </Section>
    </article>
  );
}

import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : String(error);
    return { hasError: true, message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '24px',
          border: '1px solid var(--red)',
          borderRadius: '8px',
          color: 'var(--tx2)',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '13px',
        }}>
          <p style={{ color: 'var(--red)', marginBottom: '8px' }}>시각화 렌더링 오류</p>
          <p>{this.state.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

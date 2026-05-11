import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary]', error, info.componentStack);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: '#000', color: '#fff', fontFamily: 'monospace', padding: '40px',
        }}>
          <div style={{ fontSize: '11px', color: '#4169E1', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '16px' }}>
            NETRA // System Fault
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
            Terminal Unresponsive
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '32px', maxWidth: '480px', textAlign: 'center' }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </div>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
            style={{
              padding: '10px 24px', border: '1px solid #4169E1', background: 'transparent',
              color: '#4169E1', cursor: 'pointer', fontSize: '11px',
              letterSpacing: '0.1em', textTransform: 'uppercase',
            }}
          >
            Reload Terminal
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

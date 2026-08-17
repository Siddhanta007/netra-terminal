import type { ToastType } from '@/types';

type TerminalActivityDockProps = {
  loading?: boolean;
  message: string;
  tone?: ToastType;
};

export function TerminalActivityDock({
  loading = false,
  message,
  tone = 'info',
}: TerminalActivityDockProps) {
  return (
    <div
      className={`terminal-activity-dock is-${loading ? 'loading' : tone}`}
      role="status"
      aria-live={loading ? 'polite' : 'assertive'}
      aria-busy={loading || undefined}
    >
      {loading ? (
        <span className="terminal-multicolor-loader" aria-hidden="true">
          <i /><i /><i /><i />
        </span>
      ) : (
        <span className="terminal-activity-symbol" aria-hidden="true">
          {tone === 'error' ? '×' : tone === 'warning' ? '!' : tone === 'info' ? 'i' : '✓'}
        </span>
      )}
      <span className="terminal-activity-message">{message}</span>
    </div>
  );
}

import type { ToastType } from '@/types';
import { ActionSpinner } from './LoadingSpinners';

type TerminalActivityDockProps = {
  loading?: boolean;
  message: string;
  tone?: ToastType;
  networkActivity?: boolean;
};

export function TerminalActivityDock({
  loading = false,
  message,
  tone = 'info',
  networkActivity = false,
}: TerminalActivityDockProps) {
  return (
    <div
      className={`terminal-activity-dock is-${loading ? 'loading' : tone}`}
      role="status"
      aria-live={loading ? 'polite' : 'assertive'}
      aria-busy={loading || undefined}
    >
      {loading ? (
        <ActionSpinner label={message} showLabel={false} isGlobal={networkActivity} />
      ) : (
        <span className="terminal-activity-symbol" aria-hidden="true">
          {tone === 'error' ? '×' : tone === 'warning' ? '!' : tone === 'info' ? 'i' : '✓'}
        </span>
      )}
      <span className="terminal-activity-message">{message}</span>
    </div>
  );
}

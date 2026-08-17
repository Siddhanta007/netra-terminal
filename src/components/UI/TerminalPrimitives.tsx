import type { ReactNode } from 'react';

type TerminalPhaseCardProps = {
  phase?: string;
  timeframe?: string;
  title?: string;
  subtitle?: string;
  status?: string;
  action?: ReactNode;
  active?: boolean;
  locked?: boolean;
  className?: string;
  compactBody?: boolean;
  children: ReactNode;
};

export function TerminalPhaseCard({
  phase,
  timeframe,
  title,
  subtitle,
  status,
  action,
  active = false,
  locked = false,
  className = '',
  compactBody = false,
  children,
}: TerminalPhaseCardProps) {
  return (
    <section className={`phase-card ${className}`.trim()} data-phase={phase} data-active={active ? 'true' : undefined}>
      <header className="phase-card-header">
        {phase && <span className="phase-card-index">{phase}</span>}
        {phase && timeframe && <span className="phase-card-divider" aria-hidden="true" />}
        {timeframe && <span className="phase-card-timeframe">{timeframe}</span>}
        {timeframe && title && <span className="phase-card-divider" aria-hidden="true" />}
        <span className="phase-card-title">{title}</span>
        <span className={`phase-card-meta ${locked ? 'is-locked' : ''}`.trim()}>
          {locked ? `✓ ${status || 'LOCKED'}` : status || subtitle}
        </span>
        {action && <span className="phase-card-action">{action}</span>}
      </header>
      <div className={`phase-card-body ${compactBody ? 'is-compact' : ''}`.trim()}>{children}</div>
    </section>
  );
}

type TerminalComponentHeaderProps = {
  title: ReactNode;
  count?: ReactNode;
  meta?: ReactNode;
  collapsible?: boolean;
  open?: boolean;
  onToggle?: () => void;
  action?: ReactNode;
  className?: string;
};

export function TerminalComponentHeader({
  title,
  count,
  meta,
  collapsible = false,
  open = false,
  onToggle,
  action,
  className = '',
}: TerminalComponentHeaderProps) {
  return (
    <div
      className={`terminal-component-header ${collapsible ? 'is-collapsible' : ''} ${className}`.trim()}
      onClick={collapsible ? onToggle : undefined}
      role={collapsible ? 'button' : undefined}
      tabIndex={collapsible ? 0 : undefined}
      onKeyDown={collapsible ? event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onToggle?.();
        }
      } : undefined}
    >
      <span className="terminal-component-title">{title}</span>
      {count != null && <span className="terminal-component-count">{count}</span>}
      {meta != null && <span className="terminal-component-meta">{meta}</span>}
      <span className="terminal-component-rule" aria-hidden="true" />
      {action}
      {collapsible && <span className="terminal-component-chevron" aria-hidden="true">{open ? '▾' : '▸'}</span>}
    </div>
  );
}

export function TerminalStatusBadge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
}) {
  return <span className={`terminal-status-badge is-${tone}`}>{children}</span>;
}

export function TerminalEmptyState({
  title,
  description,
}: {
  title: ReactNode;
  description?: ReactNode;
}) {
  return (
    <div className="terminal-empty-state">
      <span className="terminal-empty-mark" aria-hidden="true">◇</span>
      <span className="terminal-empty-title">{title}</span>
      {description && <span className="terminal-empty-description">{description}</span>}
    </div>
  );
}

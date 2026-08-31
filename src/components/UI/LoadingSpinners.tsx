import { LuxuryShapeSpinner } from './LuxuryShapeSpinner';

type PageLoadingSpinnerProps = {
  label?: string;
  overlay?: boolean;
};

type ActionSpinnerProps = {
  label?: string;
  compact?: boolean;
  showLabel?: boolean;
  className?: string;
  isGlobal?: boolean;
};

/** Full-page application loader. This is the only owner of the geometric sequence. */
export function PageLoadingSpinner({ label = 'Loading Terminal', overlay = false }: PageLoadingSpinnerProps) {
  return (
    <div className={`netra-lux-loader ${overlay ? 'netra-page-loader-overlay' : ''}`} aria-busy="true">
      <div className="netra-lux-grain" aria-hidden="true" />
      <div className="netra-lux-frame">
        <LuxuryShapeSpinner label={label} />
      </div>
    </div>
  );
}

/** Compact loader for requests, buttons, cards, and partial page data. */
export function ActionSpinner({
  label = 'Processing',
  compact = false,
  showLabel = true,
  className = '',
  isGlobal = false,
}: ActionSpinnerProps) {
  return (
    <span
      className={`netra-action-spinner ${compact ? 'is-compact' : ''} ${className}`}
      role="status"
      aria-label={label}
      data-netra-local-spinner={isGlobal ? undefined : 'true'}
    >
      <span className="terminal-multicolor-loader" aria-hidden="true">
        <i /><i /><i /><i />
      </span>
      {showLabel && <span className="netra-action-spinner-label">{label}</span>}
    </span>
  );
}

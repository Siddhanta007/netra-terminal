import type { CSSProperties } from 'react';

type LuxuryShapeSpinnerProps = {
  compact?: boolean;
  micro?: boolean;
  className?: string;
  label?: string;
};

const regularPolygon = (sides: number, radius = 62, center = 110): string => {
  return Array.from({ length: sides }, (_, index) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / sides;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
};

const shapeStyle = (index: number, dash: number) => ({
  '--shape-index': index,
  '--shape-dash': dash,
} as CSSProperties);

export function LuxuryShapeSpinner({ compact = false, micro = false, className = '', label = 'App Loading' }: LuxuryShapeSpinnerProps) {
  const polygons = [
    { className: 'netra-lux-triangle', sides: 3, dash: 390 },
    { className: 'netra-lux-square', sides: 4, dash: 420 },
    { className: 'netra-lux-pentagon', sides: 5, dash: 430 },
    { className: 'netra-lux-hexagon', sides: 6, dash: 440 },
    { className: 'netra-lux-heptagon', sides: 7, dash: 450 },
    { className: 'netra-lux-octagon', sides: 8, dash: 460 },
    { className: 'netra-lux-nonagon', sides: 9, dash: 470 },
    { className: 'netra-lux-decagon', sides: 10, dash: 480 },
  ];

  return (
    <div
      className={`netra-lux-spinner ${compact ? 'netra-lux-spinner-compact' : ''} ${micro ? 'netra-lux-spinner-micro' : ''} ${className}`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="netra-lux-title">{label}</div>
      <div className="netra-lux-stage">
        <svg viewBox="0 0 220 220" className="netra-lux-svg" aria-hidden="true">
          <defs>
            <linearGradient id="luxLineGradient" x1="24" y1="110" x2="196" y2="110" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#6b8f8a" />
              <stop offset="50%" stopColor="#d8a15f" />
              <stop offset="100%" stopColor="#8d99ae" />
            </linearGradient>
            <linearGradient id="luxHexGradient" x1="50" y1="44" x2="172" y2="182" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#b7797a" />
              <stop offset="52%" stopColor="#c7b37f" />
              <stop offset="100%" stopColor="#7a8f61" />
            </linearGradient>
          </defs>

          <line className="netra-lux-shape netra-lux-line" style={shapeStyle(0, 136)} x1="42" y1="110" x2="178" y2="110" />
          <path className="netra-lux-shape netra-lux-parallel" style={shapeStyle(1, 260)} d="M46 96H174M46 124H174" />
          {polygons.map((shape, index) => (
            <polygon
              key={shape.className}
              className={`netra-lux-shape ${shape.className}`}
              style={shapeStyle(index + 2, shape.dash)}
              points={regularPolygon(shape.sides)}
            />
          ))}
          <circle className="netra-lux-shape netra-lux-circle" style={shapeStyle(10, 365)} cx="110" cy="110" r="58" />
          <path className="netra-lux-shape netra-lux-infinity" style={shapeStyle(11, 410)} d="M48 110C68 72 92 72 110 110C128 148 152 148 172 110C152 72 128 72 110 110C92 148 68 148 48 110Z" />

          <line className="netra-lux-axis netra-lux-axis-h" x1="28" y1="110" x2="192" y2="110" />
          <line className="netra-lux-axis netra-lux-axis-v" x1="110" y1="28" x2="110" y2="192" />
        </svg>
      </div>
      <div className="netra-lux-timeline" aria-hidden="true">
        <div className="netra-lux-progress" />
      </div>
      <div className="netra-lux-brand">NETRA</div>
    </div>
  );
}

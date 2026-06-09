// A custom-styled range slider used for the generation parameters
// (temperature, frequency penalty) in the AI Labs controls pane.

import { MONO } from './helpers';

export function SliderRow({ label, value, min, max, step, pct, trackColor, onChange }: {
  label: string; value: number; min: number; max: number; step: number; pct: number; trackColor: string; onChange: (v: number) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ ...MONO, fontSize: '8px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.82)' }}>
          {label}
        </span>
        <span style={{ ...MONO, fontSize: '10px', fontWeight: 800, color: trackColor, transition: 'color 300ms' }}>
          {value.toFixed(2)}
        </span>
      </div>
      <div style={{ position: 'relative', height: '14px', display: 'flex', alignItems: 'center', width: '100%' }}>
        {/* Track background */}
        <div style={{ position: 'absolute', left: 0, right: 0, height: '2px', background: 'rgba(255,255,255,0.07)', borderRadius: '1px' }} />
        {/* Track fill */}
        <div style={{
          position: 'absolute', left: 0, height: '2px',
          background: trackColor, width: `${pct}%`, borderRadius: '1px',
          boxShadow: `0 0 8px ${trackColor}55`,
          transition: 'background 300ms, box-shadow 300ms',
        }} />
        {/* Thumb node */}
        <div style={{
          position: 'absolute',
          left: `calc(${pct}% - 5px)`,
          width: '10px', height: '10px',
          borderRadius: '50%',
          background: trackColor,
          boxShadow: `0 0 10px ${trackColor}90, 0 0 0 2px rgba(7,9,15,0.8)`,
          pointerEvents: 'none', zIndex: 1,
          transition: 'background 300ms, box-shadow 300ms, left 60ms',
        }} />
        {/* Invisible range input on top */}
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', zIndex: 2 }}
        />
      </div>
    </div>
  );
}

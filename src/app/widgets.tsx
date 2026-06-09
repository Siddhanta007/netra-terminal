// Small stateless presentational widgets for the terminal shell:
// the trade-logger time/number inputs and the decorative fixed page corners.

export function TimeInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <span style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#ffffff', opacity: 0.7 }}>{label}</span>
      <input
        type="time"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="h-8 px-2 rounded-none bg-[var(--surface-2)] border border-[var(--border)] text-[13px] text-[#ffffff] font-mono focus:border-[#4169E1] outline-none"
      />
    </div>
  );
}

export function NumInput({ label, value, onChange, prefix }: { label: string; value: string; onChange: (v: string) => void; prefix?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#ffffff', opacity: 0.7 }}>{label}</span>
      <div className="flex items-center gap-1">
        {prefix && <span style={{ fontSize: '12px', color: '#ffffff', fontWeight: 700 }}>{prefix}</span>}
        <input
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="h-8 w-full px-2 rounded-none bg-[var(--surface-2)] border border-[var(--border)] text-[13px] text-[#ffffff] font-mono tabular-nums focus:border-[#4169E1] outline-none"
          placeholder="0"
        />
      </div>
    </div>
  );
}

// Shared page corners — blue heptagon (top-right) + amber heptagon (bottom-left).
export function PageCorners() {
  const radii = [80, 150, 220, 295, 370, 445, 520];
  const strokeWidths = [5, 3.5, 2.5, 2, 1.5, 1, 0.7];
  const strokeOpacities = [1, 0.7, 0.5, 0.35, 0.22, 0.14, 0.08];
  return (
    <>
      <div style={{ position: 'fixed', top: 0, right: 0, width: '560px', height: '560px', pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <svg width="560" height="560" viewBox="0 0 560 560" fill="none">
          {radii.map((r, i) => {
            const pts = Array.from({ length: 7 }, (_, k) => { const a = (-90 + k * 360 / 7) * Math.PI / 180; return `${(560 + r * Math.cos(a)).toFixed(1)},${(r * Math.sin(a)).toFixed(1)}`; }).join(' ');
            return <polygon key={r} points={pts} stroke="#2563eb" strokeWidth={strokeWidths[i]} strokeOpacity={strokeOpacities[i]} fill={i < 3 ? `rgba(37,99,235,${[0.1,0.05,0.02][i]})` : 'none'} strokeDasharray={i === 3 || i === 5 ? '10 7' : 'none'} />;
          })}
          <circle cx="560" cy="0" r="9" fill="#2563eb" fillOpacity="0.9" />
          <circle cx="560" cy="0" r="18" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeOpacity="0.4" />
        </svg>
      </div>
      <div style={{ position: 'fixed', bottom: 0, left: 0, width: '500px', height: '500px', pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <svg width="500" height="500" viewBox="0 0 500 500" fill="none">
          {radii.map((r, i) => {
            const pts = Array.from({ length: 7 }, (_, k) => { const a = (90 + k * 360 / 7) * Math.PI / 180; return `${(r * Math.cos(a)).toFixed(1)},${(500 + r * Math.sin(a)).toFixed(1)}`; }).join(' ');
            return <polygon key={r} points={pts} stroke="#f59e0b" strokeWidth={strokeWidths[i]} strokeOpacity={strokeOpacities[i]} fill={i < 3 ? `rgba(245,158,11,${[0.1,0.05,0.02][i]})` : 'none'} strokeDasharray={i === 3 || i === 5 ? '10 7' : 'none'} />;
          })}
          <circle cx="0" cy="500" r="9" fill="#f59e0b" fillOpacity="0.9" />
          <circle cx="0" cy="500" r="18" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeOpacity="0.4" />
        </svg>
      </div>
    </>
  );
}

// Small stateless presentational widgets for the terminal shell:
// the trade-logger time/number inputs and the decorative fixed page corners.

import { PageGraphics } from '../components/UI/PageGraphics';

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
  return <PageGraphics variant="terminal" opacity={0.98} />;
}

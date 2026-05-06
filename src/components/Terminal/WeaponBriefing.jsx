import { useNetra } from '../../context/NetraContext';


export default function WeaponBriefing({ w }) {
  const { notes, setNotes, weaponLocked, setWeaponLocked } = useNetra();
  if (!w) return null;
  return (
    <div className="relative animate-in fade-in slide-in-from-top-4 duration-500 rounded-full-2xl overflow-hidden premium-shadow" style={{ background: 'var(--surface)' }}>
      {/* Large background watermark */}
      <div style={{ position: 'absolute', bottom: '-10px', right: '10px', fontSize: '180px', fontWeight: 900, color: 'rgba(255, 255, 255, 0.015)', pointerEvents: 'none', lineHeight: 1, zIndex: 0, letterSpacing: '-0.05em', textTransform: 'uppercase', fontFamily: 'Impact, sans-serif' }}>
        {w.id}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 relative z-10 p-8">
        
        {/* LEFT COLUMN: Weapon Information (span 7) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Section Header */}
          <div className="flex items-center gap-2 pb-2 border-b border-[var(--border)]">
            <div className="w-2 h-2 rounded-full-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
            <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[var(--text-1)]">Weapon Capabilities</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1 */}
            <div className="flex flex-col h-full p-5 rounded-full-xl bg-[var(--surface-2)] border border-[var(--border)] group hover:border-[var(--accent)] transition-colors">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-4)] mb-3 group-hover:text-[var(--accent)] transition-colors">Mission Logic</div>
              <div className="text-[13px] leading-relaxed text-[var(--text-2)] font-medium font-sans flex-1">
                {w.logic}
              </div>
            </div>
            {/* Card 2 */}
            <div className="flex flex-col h-full p-5 rounded-full-xl bg-[var(--surface-2)] border border-[var(--border)] group hover:border-[var(--accent)] transition-colors">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-4)] mb-3 group-hover:text-[var(--accent)] transition-colors">Activation Protocol</div>
              <div className="text-[13px] leading-relaxed text-[var(--text-1)] font-bold font-sans flex-1">
                {w.activation}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 3 */}
            <div className="flex flex-col h-full p-5 rounded-full-xl bg-[var(--surface-2)] border border-[var(--border)]">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-4)] mb-2">Entry Point</div>
              <div className="text-[14px] font-sans font-extrabold text-[var(--text-1)] flex-1">{w.entry}</div>
            </div>
            {/* Card 4 */}
            <div className="flex flex-col h-full p-5 rounded-full-xl bg-[var(--surface-2)] border border-[var(--border)]">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-4)] mb-2">Stop Loss</div>
              <div className="text-[14px] font-sans font-extrabold text-red-400/90 flex-1">{w.stop}</div>
            </div>
            {/* Card 5 */}
            <div className="flex flex-col h-full p-5 rounded-full-xl bg-[var(--surface-2)] border border-[var(--border)]">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-4)] mb-2">Primary Target</div>
              <div className="text-[14px] font-sans font-extrabold text-[var(--text-1)] flex-1">{w.target}</div>
            </div>
          </div>
          
          {/* Misfire Conditions Card */}
          <div className="p-5 rounded-full-xl bg-red-500/5 border border-red-500/20">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500/80 mb-2">Misfire Conditions (Abort if...)</div>
            <div className="text-[13px] leading-relaxed text-[var(--text-2)] font-sans italic">
              &quot;{w.misfire}&quot;
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Name, Notes, Locking (span 5) */}
        <div className="lg:col-span-5 flex flex-col pt-1">
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '4px' }}>Execution Protocol</div>
            <h2 style={{ fontSize: '22px', fontWeight: 950, letterSpacing: '-0.03em', color: 'var(--text-1)', lineHeight: 1.1 }}>{w.id}</h2>
          </div>
          <div className="flex-1 flex flex-col gap-3 min-h-0">
            <div className="label">Tactical Reasoning</div>
            <textarea
              value={notes.weapon || ''}
              onChange={e => setNotes({ ...notes, weapon: e.target.value })}
              placeholder="Document weapon selection logic..."
              className="field-area flex-1 min-h-[120px]"
              disabled={weaponLocked}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0, marginTop: '8px' }}>
            <button onClick={() => setWeaponLocked(false)} className="btn-reset flex-1"   disabled={!weaponLocked}>Edit</button>
            <button onClick={() => setWeaponLocked(true)} className={`${weaponLocked ? 'btn-confirmed' : 'btn-confirm'} flex-1`}   disabled={weaponLocked || !w.id}>{weaponLocked ? '✓ Armed' : 'Fire'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

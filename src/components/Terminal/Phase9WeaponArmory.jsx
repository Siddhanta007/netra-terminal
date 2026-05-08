import { useNetra } from '../../context/NetraContext';

/**
 * Phase 9: Weapon Armory - Entry Model Selection.
 * Stripped down design to eliminate all forced colors and over-designing.
 * Relies on standard CSS inheritance for high contrast in both light and dark modes.
 */
export default function Phase9WeaponArmory() {
  const {
    SYSTEM_DATA, selectedWeaponId, setSelectedWeaponId,
    weaponLocked, setWeaponLocked,
    finalCommand,
    notes, setNotes,
    highestStep, confirmStep, editStep,
    stepTimestamps,
    weaponPrediction
  } = useNetra();

  const type = (finalCommand || 'STRIKE').toLowerCase();
  const weaponsList = SYSTEM_DATA.weapons ? (SYSTEM_DATA.weapons[type] || []) : [];
  
  const allChoices = [
    ...weaponsList,
    { id: 'MANUAL', name: 'Custom Override', logic: 'Operator manual entry. All parameters defined by ground command.', activation: 'Manual trigger on tactical confirmation.' }
  ];

  const activeWeapon = allChoices.find(w => w.id === selectedWeaponId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 fade-up items-stretch">
      
      {/* LEFT: TACTICAL HARDWARE (STRUCTURED SPECS) */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        <section className="flex flex-col h-full">
          <div className="p-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex flex-col flex-1 min-h-[440px]">
            
            {/* WEAPON SLIDER - INTEGRATED */}
            <div className="flex gap-2 overflow-x-auto pb-6 custom-scrollbar-thin no-scrollbar-at-rest border-b border-[var(--border)]/30 mb-8">
              {allChoices.map((weapon) => {
                const isRec = weaponPrediction && weaponPrediction.weapon === weapon.id;
                const isSelected = selectedWeaponId === weapon.id;
                return (
                  <button
                    key={weapon.id}
                    onClick={() => !weaponLocked && setSelectedWeaponId(weapon.id)}
                    disabled={weaponLocked}
                    className={`flex-shrink-0 w-36 p-3 text-left border transition-all duration-200 relative rounded-xl ${isSelected
                      ? 'border-[#4169E1] bg-[#4169E1]/5 text-[#4169E1] glow-active'
                      : 'border-[var(--border)] hover:border-[var(--border-strong)] bg-[var(--surface-2)]/50 text-[var(--text-3)]'
                    } ${weaponLocked && !isSelected ? 'opacity-30' : ''}`}
                  >
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-black tracking-tight uppercase leading-none">{weapon.id}</h4>
                      <div className="text-[7px] uppercase tracking-widest opacity-40 font-bold truncate">{weapon.name}</div>
                    </div>
                    {isRec && <div className="absolute top-1.5 right-2 w-1 h-1 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.6)]"></div>}
                  </button>
                );
              })}
            </div>

            {/* TECHNICAL SPECIFICATIONS */}
            <div className="flex-1 flex flex-col">
              {activeWeapon ? (
                <div className="precision-container flex-1">
                   {/* Logic Row */}
                   <div className="precision-row py-4 items-start gap-8">
                      <div className="precision-label text-[10px] uppercase tracking-widest whitespace-nowrap pt-1">Logic Analysis</div>
                      <div className="flex-1 text-[11px] font-bold leading-relaxed text-right whitespace-normal break-words">
                         {activeWeapon.logic}
                      </div>
                   </div>

                   {/* Activation Protocol */}
                   <div className="precision-row py-4 items-start gap-8 border-t border-[var(--border)]/10">
                      <div className="precision-label text-[10px] uppercase tracking-widest whitespace-nowrap pt-1">Activation Protocol</div>
                      <div className="flex-1 text-[11px] font-medium leading-relaxed text-right whitespace-normal break-words">
                         {activeWeapon.activation}
                      </div>
                   </div>

                   {/* Parameters Row - No Forced Colors, Inherits Theme Text */}
                   {activeWeapon.id !== 'MANUAL' && (
                     <div className="mt-auto pt-8">
                        <div className="label text-[9px] mb-4 tracking-[0.3em]">Deployment Parameters</div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                           {[
                             { label: 'Entry', val: activeWeapon.entry },
                             { label: 'Stop', val: activeWeapon.stop },
                             { label: 'Target', val: activeWeapon.target },
                             { label: 'Misfire', val: activeWeapon.misfire }
                           ].map((p, idx) => (
                             <div key={idx} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-center">
                                <span className="text-[7px] font-black uppercase tracking-widest block mb-2 opacity-60">{p.label}</span>
                                <span className="text-[10px] font-bold whitespace-normal break-words">{p.val}</span>
                             </div>
                           ))}
                        </div>
                     </div>
                   )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-20 gap-4">
                   <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                   <span className="text-[10px] font-black uppercase tracking-[0.5em]">Awaiting Hardware</span>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* RIGHT: COMMAND CONTEXT */}
      <div className="lg:col-span-5 flex flex-col gap-6 justify-between">
        <div className="space-y-6">
          <div>
            <div className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-500 mb-1">Weapon Armory</div>
            <h2 className="text-[20px] font-black tracking-tight text-[var(--text-1)] uppercase leading-none">Entry Model Selection</h2>
            <p className="text-[9px] font-bold uppercase tracking-widest opacity-40 mt-2" style={{ color: 'var(--text-3)' }}>Doctrine Confirmation Required</p>
          </div>

          <div className="flex-1 flex flex-col gap-3 min-h-0">
            <div className="label" style={{ color: 'var(--text-4)' }}>Mission Briefing Note</div>
            <textarea
              value={notes.weapon_thought || ''}
              onChange={(e) => setNotes({ ...notes, weapon_thought: e.target.value })}
              placeholder="Record tactical thoughts regarding hardware activation..."
              disabled={weaponLocked}
              className="field-area flex-1 min-h-[200px]"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-6 border-t border-[var(--border)]/30">
          <div className="flex gap-2">
            <button onClick={() => { setWeaponLocked(false); editStep(6); }} className="btn-reset flex-1" disabled={!weaponLocked}>Edit</button>
            <button 
              onClick={() => { setWeaponLocked(true); confirmStep(6); }} 
              className={`${highestStep > 6 ? 'btn-confirmed' : 'btn-confirm'} flex-1`} 
              disabled={highestStep > 6 || !selectedWeaponId}
            >
              {highestStep > 6 ? '✓ Armed' : 'Confirm Deployment'}
            </button>
          </div>
          {stepTimestamps.weapon_armory && (
             <div className="text-right text-[9px] font-mono text-[var(--text-4)] opacity-40">Operational Lock: {stepTimestamps.weapon_armory}</div>
          )}
        </div>
      </div>
    </div>
  );
}

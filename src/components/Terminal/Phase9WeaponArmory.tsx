import { useNetra } from '../../context/NetraContext';
import { Weapon } from '../../types';
import { useReduceFlag } from '../../hooks/useReduceFlag';

const MANUAL_WEAPON: Weapon = {
  id: 'MANUAL',
  name: 'Custom Override',
  logic: 'Operator manual entry. All parameters defined by ground command.',
  activation: 'Manual trigger on tactical confirmation.',
};

export default function Phase9WeaponArmory() {
  const {
    SYSTEM_DATA, selectedWeaponId, setSelectedWeaponId,
    weaponLocked, setWeaponLocked,
    finalCommand,
    notes, setNotes,
    highestStep, confirmStep, editStep,
    stepTimestamps,
    weaponPrediction,
  } = useNetra();

  const reduceFlag = useReduceFlag();
  const type = (finalCommand || 'STRIKE').toLowerCase();
  const weaponsList: Weapon[] = SYSTEM_DATA.weapons ? (SYSTEM_DATA.weapons[type] || []) : [];
  const allChoices: Weapon[] = [...weaponsList, MANUAL_WEAPON];
  const activeWeapon = allChoices.find(w => w.id === selectedWeaponId);

  return (
    <div className="flex flex-col fade-up">



      {/* WEAPON SELECTION */}
      <div className="precision-row">
        <div className="precision-label">Entry Model</div>
        <div className="precision-selector">
          {allChoices.map((weapon) => {
            const isRec = weaponPrediction && weaponPrediction.weapon === weapon.id;
            const isSelected = selectedWeaponId === weapon.id;
            return (
              <button
                key={weapon.id}
                onClick={() => !weaponLocked && setSelectedWeaponId(weapon.id)}
                disabled={weaponLocked}
                className={`precision-opt relative ${isSelected ? 'selected' : ''} ${weaponLocked && !isSelected ? 'opacity-30 cursor-not-allowed' : ''}`}
              >
                {weapon.id}
                {isRec && <span className="absolute top-1 right-1 w-1 h-1 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.6)]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* WEAPON DETAILS */}
      {activeWeapon ? (
        <>

          {activeWeapon.id !== 'MANUAL' && (
            <>
              {[
                { label: 'Entry', val: activeWeapon.entry },
                { label: 'Stop', val: activeWeapon.stop },
                { label: 'Target', val: activeWeapon.target },
                { label: 'Misfire', val: activeWeapon.misfire },
              ].map((p) => (
                <div key={p.label} className="precision-row items-start">
                  <div className="precision-label pt-1">{p.label}</div>
                  <div className="flex-1 text-[11px] leading-relaxed text-[var(--text-2)] py-2">{p.val}</div>
                </div>
              ))}
            </>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 opacity-20 gap-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></svg>
          <span className="text-[10px] font-black uppercase tracking-[0.5em]">Awaiting Hardware</span>
        </div>
      )}

      {/* NOTES + ACTIONS */}
      <div className="flex gap-4 items-start pt-4 mt-2 border-t border-[var(--border)]">
        <textarea
          value={notes.weapon_thought || ''}
          onChange={(e) => setNotes({ ...notes, weapon_thought: e.target.value })}
          placeholder="Record tactical thoughts regarding hardware activation..."
          disabled={weaponLocked}
          className="flex-1 bg-transparent outline-none resize-none text-[12px] text-[var(--text-2)] placeholder:text-[var(--text-4)] leading-relaxed min-h-[56px]"
        />
        <div className="flex gap-2 shrink-0">
          <button onClick={() => { setWeaponLocked(false); editStep(5); }} className="btn-reset w-24" disabled={!weaponLocked}>Edit</button>
          <button
            onClick={() => { setWeaponLocked(true); confirmStep(5); }}
            className={`${weaponLocked ? 'btn-confirmed' : 'btn-confirm'} w-40`}
            disabled={weaponLocked || !selectedWeaponId}
          >
            {weaponLocked ? '✓ Armed' : 'Confirm Deployment'}
          </button>
        </div>
      </div>
      {stepTimestamps.weapon_armory && (
        <div className="text-right text-[9px] font-mono text-[var(--text-4)] opacity-40 mt-1">Operational Lock: {stepTimestamps.weapon_armory}</div>
      )}

    </div>
  );
}

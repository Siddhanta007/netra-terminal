import { useNetra } from '../../context/NetraContext';
import NetraAILabs from '../Templates/NetraAILabs';
import ReactMarkdown from 'react-markdown';

/**
 * Phase 8: Weapon Intelligence - Optional AI advice for weapon selection.
 */
export default function Phase8WeaponIntel() {
  const {
    weaponPrediction, isPredictingWeapon, triggerWeaponPrediction, stopWeaponPrediction
  } = useNetra();

  const AdviceContent = (
    <div className="w-full h-full flex flex-col">
      {isPredictingWeapon ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
          <div className="w-12 h-12 rounded-full border-4 border-[var(--accent)]/20 border-t-[var(--accent)] animate-spin"></div>
          <span className="text-[10px] font-bold uppercase tracking-widest animate-pulse" style={{ color: 'var(--accent)' }}>NETRA is Consulting Armory...</span>
        </div>
      ) : weaponPrediction ? (
        <div className="prose prose-sm dark:prose-invert max-w-none text-[var(--text-2)] leading-relaxed markdown-content w-full h-full overflow-y-auto custom-scrollbar pr-4">
           <div className="space-y-6">
              <div className="p-5 rounded-xl bg-[var(--accent-bg)]/10 border border-[var(--accent-border)]/20">
                <p className="text-sm font-bold italic text-[var(--text-1)]">"{weaponPrediction.plan}"</p>
              </div>
              <div className="text-[12px] leading-relaxed text-[var(--text-2)] font-medium">
                {weaponPrediction.reasoning}
              </div>
           </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center opacity-40">
          <div className="w-14 h-14 rounded-full bg-[var(--surface-3)] flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
          </div>
          <p className="text-[11px] font-semibold text-[var(--text-3)] max-w-xs text-[11px] font-mono text-center uppercase tracking-widest">
            Awaiting Tactical Synthesis for Armory Engagement.
          </p>
        </div>
      )}
    </div>
  );

  const IntelligenceStatus = (
    <div className="flex flex-col gap-6">
      {weaponPrediction && (
        <div className={`p-4 rounded-xl border ${weaponPrediction.predictability === 'HIGH' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'}`}>
           <div className="text-[9px] font-bold uppercase tracking-widest opacity-60 mb-1">Confidence Rating</div>
           <div className="text-xl font-black">{weaponPrediction.predictability}</div>
        </div>
      )}
      
      <div className="label" style={{ color: 'var(--text-4)' }}>Intelligence Status</div>
      <div className="flex items-center gap-3 p-3 px-4 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
         <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
         <span className="text-[10px] font-bold tracking-widest text-[var(--text-2)] uppercase">MAYA ENGINE ONLINE</span>
      </div>
    </div>
  );

  return (
    <NetraAILabs 
      phaseId="weapon_intel"
      phaseNum={8}
      title="NETRA AI Labs"
      subheading="MAYA - Weapon Recommendation Engine"
      showUpload={false}
      isEvaluating={isPredictingWeapon}
      output={weaponPrediction}
      onAnalyse={triggerWeaponPrediction}
      onStop={stopWeaponPrediction}
      customStatus={IntelligenceStatus}
    />
  );
}

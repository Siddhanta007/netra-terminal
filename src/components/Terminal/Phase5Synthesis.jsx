import { useNetra } from '../../context/NetraContext';
import NetraAILabs from '../Templates/NetraAILabs';
import ReactMarkdown from 'react-markdown';

/**
 * Phase 5: Synthesis - Optional AI Laboratory for Doctrine Synthesis.
 */
export default function Phase5Synthesis() {
  const {
    netraOutput, isEvaluating, triggerNeuralSynthesis, stopSynthesis
  } = useNetra();

  const AnalysisContent = (
    <div className="w-full h-full flex flex-col">
      {isEvaluating ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
          <div className="w-12 h-12 rounded-full border-4 border-[var(--accent)]/20 border-t-[var(--accent)] animate-spin"></div>
          <span className="text-[10px] font-bold uppercase tracking-widest animate-pulse" style={{ color: 'var(--accent)' }}>NETRA is Analysing...</span>
        </div>
      ) : netraOutput ? (
        <div className="prose prose-sm dark:prose-invert max-w-none text-[var(--text-2)] leading-relaxed markdown-content w-full h-full overflow-y-auto custom-scrollbar pr-4">
           <ReactMarkdown children={typeof netraOutput === 'string' ? netraOutput : netraOutput.analysis} />
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center opacity-40">
          <div className="w-14 h-14 rounded-full bg-[var(--surface-3)] flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
          </div>
          <p className="text-[11px] font-semibold text-[var(--text-3)] max-w-xs text-[11px] font-mono text-center">
            Operational Analysis Standby. Use "Analyse" to initiate tactical synthesis.
          </p>
        </div>
      )}
    </div>
  );

  const LabStatusControls = (
    <div className="flex flex-col gap-6">
      {netraOutput && netraOutput.conviction && (
        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-[9px] font-bold uppercase tracking-widest opacity-50 mb-1">Conviction Level</div>
              <div className={`text-xl font-black ${netraOutput.conviction === 'HIGH' ? 'text-green-500' : netraOutput.conviction === 'MED' ? 'text-amber-500' : 'text-slate-400'}`}>
                  {netraOutput.conviction}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[9px] font-bold uppercase tracking-widest opacity-50 mb-1">Suggested Protocol</div>
              <div className="text-lg font-black text-[var(--accent)] uppercase">{netraOutput.cmd}</div>
            </div>
          </div>
        </div>
      )}
      {/* Removed Mission Lab Status box */}
    </div>
  );

  return (
    <NetraAILabs 
      phaseId="synthesis"
      phaseNum={5}
      title="NETRA AI Labs"
      subheading="MAYA - Market Type Selector"
      showUpload={false}
      isEvaluating={isEvaluating}
      output={netraOutput}
      onAnalyse={triggerNeuralSynthesis}
      onStop={stopSynthesis}
      customStatus={LabStatusControls}
    />
  );
}

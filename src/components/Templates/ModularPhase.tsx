import { useNetra } from '../../context/NetraContext';

interface ModularPhaseProps {
  phaseId: 'realBias' | 'htfStructure' | 'marketPulse' | 'liquidityContext';
  phaseNum: number;
  notesLabel?: string;
}

export default function ModularPhase({ phaseId, phaseNum, notesLabel }: ModularPhaseProps) {
  const {
    SYSTEM_DATA, selections, setSelections, notes, setNotes,
    highestStep, confirmStep, editStep,
  } = useNetra();

  const phaseData = SYSTEM_DATA[phaseId] as { title?: string; dimensions?: Array<{ id: string; name: string; options?: string[] }> } | undefined;

  return (
    <div className={`flex flex-col fade-up phase-theme-${phaseNum}`}>

      {/* DIMENSIONS */}
      <div>
        {phaseData?.dimensions?.map((dim) => (
          <div key={dim.id} className="precision-row">
            <div className="precision-label">{dim.name}</div>
            <div className="precision-selector">
              {(dim.options || []).map(opt => {
                const isSelected = selections[phaseId]?.[dim.id] === opt;
                const isLocked = highestStep > phaseNum;
                return (
                  <button
                    key={opt}
                    onClick={() => !isLocked && setSelections({
                      ...selections,
                      [phaseId]: { ...(selections[phaseId] || {}), [dim.id]: opt },
                    })}
                    disabled={isLocked}
                    className={`precision-opt ${isSelected ? 'selected' : ''} ${isLocked && !isSelected ? 'opacity-30 cursor-not-allowed' : ''}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* NOTES + ACTIONS */}
      <div className="flex gap-4 items-start pt-4 mt-2 border-t border-[var(--border)]">
        <textarea
          value={notes[phaseId] || ''}
          onChange={e => setNotes({ ...notes, [phaseId]: e.target.value })}
          placeholder={notesLabel || 'Tactical notes...'}
          disabled={highestStep > phaseNum}
          className="flex-1 bg-transparent outline-none resize-none text-[12px] text-[var(--text-2)] placeholder:text-[var(--text-4)] leading-relaxed min-h-[56px]"
        />
        <div className="flex gap-2 shrink-0">
          <button onClick={() => editStep(phaseNum)} className="btn-reset w-24" disabled={highestStep <= phaseNum}>Edit</button>
          <button
            onClick={() => confirmStep(phaseNum)}
            className={`${highestStep > phaseNum ? 'btn-confirmed' : 'btn-confirm'} w-28`}
            disabled={highestStep > phaseNum}
          >
            {highestStep > phaseNum ? '✓ Next' : 'Next'}
          </button>
        </div>
      </div>

    </div>
  );
}

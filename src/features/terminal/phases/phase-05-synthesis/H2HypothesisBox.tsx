import { useNetra } from '@/context/NetraContext';
import MayaHypothesisPanel from '@/components/Templates/MayaHypothesisPanel';
import { tradeCardsStorageKey } from '@/features/terminal/phases/phase-10-mission-control/missionControl/helpers';
import { getEditableHypothesisText } from '@/utils/hypothesisText';

export default function H2HypothesisBox({ embedded = false }: { embedded?: boolean }) {
  const {
    SYSTEM_DATA, netraOutput, notes, setNotes, recognitionCheckpoints, setRecognitionCheckpoints,
    selectedNetraState, setSelectedNetraState, setFinalCommand, setSelectedWeaponId,
    setCommandLocked, setInterSelections, setStrikeSelections, setSaturationSelections,
    activeSessionId, editStep, saveSession, showToast,
  } = useNetra();
  const config = SYSTEM_DATA.hypothesisH2;
  const editorIndex = recognitionCheckpoints.findIndex(
    checkpoint => !checkpoint.wait && (checkpoint.output || checkpoint.nodeType === 'HYPOTHESIS'),
  );
  const editorCheckpoint = editorIndex >= 0 ? recognitionCheckpoints[editorIndex] : null;
  const hypothesisConfirmed = Boolean(editorCheckpoint?.hypothesisConfirmed);
  const proposalOutput = editorCheckpoint?.output || netraOutput;
  const mayaHypothesis = getEditableHypothesisText(proposalOutput);
  const hypothesisText = editorCheckpoint?.hypothesisText ?? (mayaHypothesis || notes.command || '');
  const mappingStatus = String(proposalOutput?.mapping_status || '').toUpperCase();

  const updateHypothesis = (value: string) => {
    setNotes({ ...notes, command: value });
    if (editorIndex < 0) return;
    setRecognitionCheckpoints(recognitionCheckpoints.map((checkpoint, index) => index === editorIndex
      ? { ...checkpoint, hypothesisText: value }
      : checkpoint
    ));
  };

  const setConfirmation = async (confirmed: boolean) => {
    const text = (editorCheckpoint?.hypothesisText ?? notes.command ?? '').trim();
    if (confirmed && !text) return;
    let next = editorIndex >= 0
      ? recognitionCheckpoints.map((checkpoint, index) => index === editorIndex
          ? { ...checkpoint, hypothesisText: text, hypothesisConfirmed: confirmed }
          : checkpoint)
      : [...recognitionCheckpoints, {
          id: `hypothesis-manual-${Date.now()}`,
          sequence: recognitionCheckpoints.length + 1,
          createdAt: new Date().toISOString(),
          nodeType: 'HYPOTHESIS' as const,
          output: null,
          evidence: { marketPulse: {}, liquidityContext: {} },
          selectedState: null,
          eligibility: '' as const,
          wait: null,
          hypothesisText: text,
          hypothesisConfirmed: confirmed,
          pathConfirmed: false,
          commandSelected: false,
        }];

    if (!confirmed) {
      next = next.map(checkpoint => ({
        ...checkpoint,
        decisionChoice: undefined,
        pathConfirmed: false,
        commandSelected: false,
        selectedState: null,
      }));
      editStep(4);
      setSelectedNetraState(null);
      setFinalCommand(null);
      setSelectedWeaponId(null);
      setCommandLocked(false);
      setInterSelections({ pattern: '', friction: '', sweep: '', response: '', reversion: '', flip: '' });
      setStrikeSelections({
        impulseQuality: '', continuationZone: '', pullbackDepth: '', pullbackQuality: '',
        zoneReaction: '', continuationTrigger: '', compressionQuality: '', breakoutEnergy: '',
        postBreakoutBehaviour: '', boundaryBreakQuality: '', acceptanceQuality: '', entryPattern: '',
      });
      setSaturationSelections({});
      localStorage.removeItem(tradeCardsStorageKey(activeSessionId));
    }
    if (!confirmed) setRecognitionCheckpoints(next);
    const saved = await saveSession({
      silent: true,
      recognitionCheckpoints: next,
      highestStep: 4,
      ...(!confirmed ? { clearAfter: 'pinaka_state' as const, reopenH2: true, selectedNetraState: null } : {}),
    });
    if (!saved) {
      showToast('H2 hypothesis update has not reached MongoDB', 'error');
      return;
    }
    if (confirmed) setRecognitionCheckpoints(next);
    showToast(confirmed ? 'H2 hypothesis confirmed — choose Command or WAIT' : 'H2 hypothesis reopened', confirmed ? 'success' : 'info');
  };

  const resetHypothesis = () => {
    updateHypothesis(mayaHypothesis || '');
    const hasDownstream = Boolean(selectedNetraState)
      || recognitionCheckpoints.some(checkpoint => checkpoint.commandSelected || checkpoint.decisionChoice);
    if (hypothesisConfirmed || hasDownstream) void setConfirmation(false);
  };

  return (
    <div style={{ background: embedded ? 'transparent' : 'var(--surface)' }}>
      <MayaHypothesisPanel
        phaseLabel={config?.phaseLabel}
        title={config?.editorTitle || 'Market Pulse Hypothesis'}
        fieldLabel={config?.editorFieldLabel || 'Final H2 Hypothesis'}
        value={hypothesisText}
        placeholder={config?.hypothesisPlaceholder}
        editing={!hypothesisConfirmed}
        awaiting={false}
        tag={mappingStatus || undefined}
        tagColor={mappingStatus === 'CONFLICT' ? '#fbbf24' : mappingStatus === 'CANDIDATE' ? '#93c5fd' : '#86efac'}
        onChange={updateHypothesis}
        onEdit={() => void setConfirmation(false)}
        onReset={resetHypothesis}
        onConfirm={() => void setConfirmation(true)}
        editDisabled={!hypothesisConfirmed && !selectedNetraState}
        resetDisabled={false}
        confirmDisabled={hypothesisConfirmed || !hypothesisText.trim()}
        editLabel="Edit"
        resetLabel="Reset"
        confirmLabel="Confirm"
      />
    </div>
  );
}

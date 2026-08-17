// Market Pulse Hypothesis — Maya proposal, optional WAIT resolution and the
// analyst-owned NS hypothesis selection rendered as one continuous box.

import PhaseNetraState from '../phase-06-state-recognition/PhaseNetraState';
import H2HypothesisBox from './H2HypothesisBox';
import RecognitionCheckpointFlow from './RecognitionCheckpointFlow';
import { useNetra } from '@/context/NetraContext';

export default function Phase5Synthesis() {
  const { recognitionCheckpoints, selectedNetraState } = useNetra();
  const latestCheckpoint = recognitionCheckpoints[recognitionCheckpoints.length - 1];
  // The first non-WAIT proposal is the parent H2 hypothesis. Validation
  // proposals created inside later WAIT cycles have their own confirmation.
  const editorIndex = recognitionCheckpoints.findIndex(
    checkpoint => !checkpoint.wait && (checkpoint.output || checkpoint.nodeType === 'HYPOTHESIS'),
  );
  const hypothesisConfirmed = Boolean(
    editorIndex >= 0 && recognitionCheckpoints[editorIndex]?.hypothesisConfirmed,
  );
  const showCommandSelection = latestCheckpoint?.decisionChoice === 'COMMAND'
    || recognitionCheckpoints.some(checkpoint => checkpoint.commandSelected)
    || Boolean(selectedNetraState);

  return (
    <div style={{ display: 'grid', gap: '12px' }}>
      <RecognitionCheckpointFlow section="maya" mayaFooter={<H2HypothesisBox embedded />} />
      {hypothesisConfirmed && <RecognitionCheckpointFlow section="wait" />}
      {hypothesisConfirmed && showCommandSelection && <PhaseNetraState embedded />}
    </div>
  );
}

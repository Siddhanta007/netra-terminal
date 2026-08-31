import { useEffect, useState } from 'react';
import NetraAILabs from '../../../../components/Templates/NetraAILabs';
import { useNetra } from '../../../../context/NetraContext';
import { H1Evidence, H1Hypothesis } from '../../../../types';
import { TraceDisplay } from '../../../../components/Templates/aiLabs/OutputDisplay';
import MayaHypothesisPanel from '../../../../components/Templates/MayaHypothesisPanel';
import { getEditableHypothesisText } from '../../../../utils/hypothesisText';

const mono = 'JetBrains Mono, monospace';
const muted = 'rgba(255,255,255,0.34)';
const text = 'rgba(255,255,255,0.82)';

function EvidenceList({ title, items, color }: { title: string; items: Array<H1Evidence | string>; color: string }) {
  if (!items.length) return null;
  return (
    <section style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 10 }}>
      <div style={{ font: `800 7px ${mono}`, color, letterSpacing: '0.22em', marginBottom: 7 }}>{title}</div>
      <div style={{ display: 'grid', gap: 5 }}>
        {items.map((item, index) => {
          const evidence = typeof item === 'string' ? null : item;
          return (
            <div key={`${title}-${index}`} style={{ display: 'flex', gap: 7, font: `500 9px/1.55 ${mono}`, color: text }}>
              <span style={{ color }}>•</span>
              <span>{evidence?.statement || String(item)}{evidence?.source_id ? <span style={{ color: muted }}> [{evidence.source_id}]</span> : null}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function H1Result({ hypothesis, trace }: { hypothesis: H1Hypothesis; trace: Array<{ agent: string; content: string }> }) {
  const statusColor = hypothesis.status === 'PROPOSED' ? '#22c55e' : hypothesis.status === 'CONFLICTED' ? '#ef4444' : '#f59e0b';
  const references = [
    ['STRUCTURE', [hypothesis.structural_view.direction, hypothesis.structural_view.condition].filter(Boolean).join(' · ')],
    ['OBJECTIVE', [hypothesis.objective.identity, hypothesis.objective.condition].filter(Boolean).join(' · ')],
    ['PULLBACK', [hypothesis.pullback_magnet.identity, hypothesis.pullback_magnet.condition].filter(Boolean).join(' · ')],
  ].filter(([, value]) => value);

  return (
    <div style={{ display: 'grid', gap: 11, padding: '2px 4px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ borderLeft: `3px solid ${statusColor}`, background: `${statusColor}14`, color: statusColor, padding: '5px 10px', font: `900 8px ${mono}`, letterSpacing: '0.18em' }}>{hypothesis.status}</span>
        <span style={{ color: muted, font: `700 7px ${mono}` }}>REV {hypothesis.revision}</span>
        <div style={{ flex: 1 }} />
        <span style={{ color: statusColor, font: `900 16px ${mono}` }}>{hypothesis.confidence.score}</span>
        <span style={{ color: muted, font: `700 7px ${mono}`, letterSpacing: '0.14em' }}>{hypothesis.confidence.band}</span>
      </div>

      <div>
        <div style={{ color: muted, font: `700 7px ${mono}`, letterSpacing: '0.22em', marginBottom: 5 }}>H1 CLAIM</div>
        <div style={{ color: 'rgba(255,255,255,0.94)', font: `700 11px/1.65 ${mono}` }}>{hypothesis.claim || 'Incomplete hypothesis'}</div>
      </div>

      {hypothesis.expected_path && (
        <div style={{ borderLeft: '2px solid #4169E1', paddingLeft: 10 }}>
          <div style={{ color: muted, font: `700 7px ${mono}`, letterSpacing: '0.22em', marginBottom: 4 }}>EXPECTED PATH</div>
          <div style={{ color: text, font: `500 9px/1.6 ${mono}` }}>{hypothesis.expected_path}</div>
        </div>
      )}

      {references.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 6 }}>
          {references.map(([label, value]) => (
            <div key={label} style={{ border: '1px solid rgba(255,255,255,0.07)', padding: 8 }}>
              <div style={{ color: muted, font: `700 6px ${mono}`, letterSpacing: '0.18em', marginBottom: 4 }}>{label}</div>
              <div style={{ color: text, font: `600 8px/1.45 ${mono}` }}>{value}</div>
            </div>
          ))}
        </div>
      )}

      <EvidenceList title="SUPPORTING EVIDENCE" items={hypothesis.evidence.supporting} color="#22c55e" />
      <EvidenceList title="CONTRADICTING EVIDENCE" items={hypothesis.evidence.contradicting} color="#ef4444" />
      <EvidenceList title="MISSING EVIDENCE" items={hypothesis.evidence.missing} color="#f59e0b" />
      <EvidenceList title="CONFIRM H1 IF" items={hypothesis.confirmation_conditions} color="#22c55e" />
      <EvidenceList title="INVALIDATE H1 IF" items={hypothesis.invalidation_conditions} color="#ef4444" />
      <EvidenceList title="H2 MUST TEST" items={hypothesis.handoff.must_test} color="#60a5fa" />
      <TraceDisplay trace={trace} />

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 8, color: muted, font: `600 7px ${mono}`, letterSpacing: '0.08em' }}>
        {hypothesis.hypothesis_id} · {hypothesis.provenance.source_count} SOURCES
      </div>
    </div>
  );
}

function FinalHypothesisBox({ embedded = false }: { embedded?: boolean }) {
  const {
    SYSTEM_DATA, h1Proposal, h1Hypothesis, isConfirmingH1, confirmFinalH1Hypothesis,
    editFinalH1Hypothesis,
  } = useNetra();
  const config = SYSTEM_DATA.mayaHypothesisH1?.editor;
  const [draftClaim, setDraftClaim] = useState('');
  const [editing, setEditing] = useState(true);
  const confirmedForProposal = Boolean(
    h1Proposal && h1Hypothesis?.status === 'CONFIRMED'
    && (h1Hypothesis.source_proposal_id === h1Proposal.hypothesis_id || h1Hypothesis.hypothesis_id === h1Proposal.hypothesis_id),
  );

  useEffect(() => {
    if (!h1Proposal) {
      if (h1Hypothesis?.status === 'CONFIRMED') {
        setDraftClaim(getEditableHypothesisText(h1Hypothesis));
        setEditing(false);
        return;
      }
      setDraftClaim('');
      setEditing(true);
      return;
    }
    // A fresh Maya proposal owns the editor seed. Use the confirmed analyst
    // revision only when it belongs to this exact proposal.
    const source = confirmedForProposal ? h1Hypothesis : h1Proposal;
    setDraftClaim(getEditableHypothesisText(source));
    setEditing(!confirmedForProposal);
  }, [confirmedForProposal, h1Hypothesis, h1Proposal]);

  const confirm = async () => {
    if (!draftClaim.trim()) return;
    const basis = h1Proposal || h1Hypothesis || {};
    const finalHypothesis = await confirmFinalH1Hypothesis({ ...basis, claim: draftClaim.trim() } as H1Hypothesis);
    if (finalHypothesis) {
      setDraftClaim(finalHypothesis.claim);
      setEditing(false);
    }
  };

  return (
    <div style={{ background: embedded ? 'transparent' : 'var(--surface)' }}>
      <MayaHypothesisPanel
        phaseLabel={config?.phaseLabel}
        title={config?.title || 'HTF Hypothesis'}
        fieldLabel="Final H1 Hypothesis"
        value={draftClaim}
        editing={editing}
        awaiting={false}
        busy={isConfirmingH1}
        onChange={setDraftClaim}
        onEdit={() => {
          if (h1Hypothesis?.status === 'CONFIRMED') editFinalH1Hypothesis(() => setEditing(true));
          else setEditing(true);
        }}
        onReset={() => {
          const resetEditor = () => {
            setDraftClaim(getEditableHypothesisText(h1Proposal));
            setEditing(true);
          };
          if (h1Hypothesis?.status === 'CONFIRMED') editFinalH1Hypothesis(resetEditor);
          else resetEditor();
        }}
        onConfirm={() => void confirm()}
        editDisabled={false}
        resetDisabled={false}
        confirmDisabled={!editing || !draftClaim.trim()}
        editLabel="Edit"
        resetLabel="Reset"
        confirmLabel="Confirm"
      />
    </div>
  );
}

export default function PhaseMayaH1() {
  const {
    SYSTEM_DATA,
    h1Proposal,
    h1AgentTrace,
    isGeneratingH1,
    triggerH1Hypothesis,
    stopH1Hypothesis,
  } = useNetra();

  return (
    <NetraAILabs
        phaseId="hypothesis-h1"
        title={SYSTEM_DATA.mayaHypothesisH1?.title || 'Macro Mapping Hypothesis'}
        subheading="MAYA — Higher Timeframe Proposal"
        isEvaluating={isGeneratingH1}
        output={h1Proposal}
        customStatus={h1Proposal ? <H1Result hypothesis={h1Proposal} trace={h1AgentTrace} /> : undefined}
        onAnalyse={() => { void triggerH1Hypothesis(); }}
        onStop={stopH1Hypothesis}
        bottomPanel={<FinalHypothesisBox embedded />}
      />
  );
}

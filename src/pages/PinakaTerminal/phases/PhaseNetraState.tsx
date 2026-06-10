// NETRA State phase — the recognised state + forward-transition graph, with a
// manual state-override picker. Reads the recognition output produced by the
// Synthesis phase (shared via the store), so it updates as soon as analyse runs.

import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNetra } from '../../../context/NetraContext';
import StateGraph, { RecognizedState, TransitionBranch } from '../../../components/Templates/StateGraph';
import { setNetraOutput } from '../../../store/slices/analysisSlice';
import { API_BASE } from '../../../utils/constants';

const MONO = 'JetBrains Mono, Consolas, monospace';

interface StateOption { id: string; name: string; mode: string }

export default function PhaseNetraState() {
  const dispatch = useDispatch();
  const { netraOutput, isEvaluating } = useNetra();

  // netraOutput may arrive flat ({recognized_state,...}) or enveloped ({data:{...}}).
  const out = (netraOutput || {}) as Record<string, unknown>;
  const inner = (out.data && typeof out.data === 'object' ? out.data : out) as Record<string, unknown>;
  const recognizedState = inner.recognized_state as RecognizedState | undefined;
  const transitions = (inner.possible_transitions || []) as TransitionBranch[];
  const isOverride = !!inner.state_override;

  // ── state catalog for the override picker ──
  const [catalog, setCatalog] = useState<StateOption[]>([]);
  const [switching, setSwitching] = useState(false);
  useEffect(() => {
    fetch(`${API_BASE}/api/states`)
      .then(r => r.ok ? r.json() : { states: [] })
      .then(d => setCatalog(d.states || []))
      .catch(() => {});
  }, []);

  // ── override: fetch the chosen state's projection, replace the recognised state ──
  const selectState = (id: string) => {
    if (!id) return;
    setSwitching(true);
    fetch(`${API_BASE}/api/states/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(proj => {
        if (!proj?.recognized_state) return;
        const rec = proj.recognized_state;
        dispatch(setNetraOutput({
          ...inner,
          recognized_state: rec,
          possible_transitions: proj.possible_transitions || [],
          state_id: rec.state_id,
          cmd: rec.command,
          posture: rec.posture,
          state_override: true,
        } as unknown as Parameters<typeof setNetraOutput>[0]));
      })
      .finally(() => setSwitching(false));
  };

  return (
    <div style={{ background: '#030608', border: '1px solid rgba(255,255,255,0.07)', padding: '18px', minHeight: '340px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <span style={{ fontFamily: MONO, fontSize: '11px', fontWeight: 900, letterSpacing: '0.3em', color: 'rgba(255,255,255,0.92)', textTransform: 'uppercase' }}>
          NETRA STATE
        </span>
        {isOverride && (
          <span style={{ fontFamily: MONO, fontSize: '7px', fontWeight: 800, letterSpacing: '0.15em', color: '#f59e0b', border: '1px solid #f59e0b66', padding: '2px 6px', textTransform: 'uppercase' }}>
            overridden
          </span>
        )}
        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />

        {/* state picker — analyst overrides the recognised state */}
        <select
          value={recognizedState?.state_id || ''}
          onChange={e => selectState(e.target.value)}
          disabled={switching || catalog.length === 0}
          title="Override the recognised state"
          style={{ fontFamily: MONO, fontSize: '10px', fontWeight: 700, color: '#4169E1', background: 'rgba(65,105,225,0.08)', border: '1px solid rgba(65,105,225,0.4)', padding: '4px 8px', cursor: 'pointer', maxWidth: '210px' }}
        >
          <option value="" disabled>{switching ? 'loading…' : 'select state ▾'}</option>
          {catalog.map(s => (
            <option key={s.id} value={s.id} style={{ color: '#000' }}>
              {s.id} · {s.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {recognizedState ? (
          <StateGraph state={recognizedState} transitions={transitions} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '56px 0', opacity: 0.4 }}>
            <div style={{ position: 'relative', width: '40px', height: '40px' }}>
              <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'rgba(255,255,255,0.5)' }} />
              <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '1px', background: 'rgba(255,255,255,0.5)' }} />
              <div style={{ position: 'absolute', inset: '8px', border: '1px solid rgba(255,255,255,0.5)', borderRadius: '50%' }} />
            </div>
            <span style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>
              {isEvaluating ? 'Recognizing State…' : 'Run Analyse — or pick a state above'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

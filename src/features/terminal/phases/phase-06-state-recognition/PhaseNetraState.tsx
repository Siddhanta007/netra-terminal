// NETRA State phase — user-owned state selection + forward-transition graph.
// This phase is deliberately independent from P5 AI text. P5 suggests; this
// phase stores the user's chosen state/command.

import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNetra } from '@/context/NetraContext';
import StateGraph, { RecognizedState, TransitionBranch } from '@/components/Templates/StateGraph';
import { appendStateRecognition } from '@/store/slices/analysisSlice';
import { API_BASE } from '@/utils/constants';

const MONO = 'JetBrains Mono, Consolas, monospace';

interface StateOption { id: string; name: string; mode: string }

function normalizeCommand(value: unknown) {
  if (!value) return null;
  const normalized = String(value).trim().toUpperCase().replace(/_/g, ' ');
  return normalized || null;
}

export default function PhaseNetraState() {
  const dispatch = useDispatch();
  const { selectedNetraState, setSelectedNetraState, setFinalCommand, setCommandLocked } = useNetra();

  const inner = (selectedNetraState || {}) as Record<string, unknown>;
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
        setSelectedNetraState({
          recognized_state: rec,
          possible_transitions: proj.possible_transitions || [],
          child_states: proj.child_states || [],
          state_id: rec.state_id,
          cmd: rec.command,
          posture: rec.posture,
          state_override: true,
        });
        setFinalCommand(normalizeCommand(rec.command));
        setCommandLocked(false);
        if (rec.state_id) dispatch(appendStateRecognition(rec.state_id));
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

        {/* state override widget */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', border: `1px solid ${isOverride ? '#f59e0b' : '#38bdf8'}`, background: 'rgba(0,0,0,0.4)', padding: '2px 8px', borderRadius: '3px', boxShadow: `0 0 8px ${isOverride ? 'rgba(245,158,11,0.1)' : 'rgba(56,189,248,0.15)'}` }}>
          <span style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 800, letterSpacing: '0.12em', color: isOverride ? '#f59e0b' : '#38bdf8', textTransform: 'uppercase', marginRight: '4px' }}>
            OVERRIDE:
          </span>
          <select
            value={recognizedState?.state_id || ''}
            onChange={e => selectState(e.target.value)}
            disabled={switching || catalog.length === 0}
            title="Override the recognised state"
            style={{
              fontFamily: MONO,
              fontSize: '10px',
              fontWeight: 800,
              color: '#ffffff',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              cursor: 'pointer',
              paddingRight: '12px',
              appearance: 'none',
              WebkitAppearance: 'none',
              backgroundImage: 'url("data:image/svg+xml;utf8,<svg fill=\'white\' height=\'24\' viewBox=\'0 0 24 24\' width=\'24\' xmlns=\'http://www.w3.org/2000/svg\'><path d=\'M7 10l5 5 5-5z\'/><path d=\'M0 0h24v24H0z\' fill=\'none\'/></svg>")',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right center',
              backgroundSize: '12px',
            }}
          >
            <option value="" disabled style={{ color: '#000' }}>{switching ? 'loading…' : 'SELECT STATE'}</option>
            {catalog.map(s => (
              <option key={s.id} value={s.id} style={{ color: '#000' }}>
                {s.id} · {s.name}
              </option>
            ))}
          </select>
        </div>
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
              Read P5 suggestion — then pick a state above
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

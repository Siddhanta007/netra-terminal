// WeaponPanel — left rail of the hybrid trade card.
// Flow: trader thought → Maya entry-model suggestion → command-filtered
// selector → colour-coded doctrine dossier → manual override.

import { useState } from 'react';
import type { CSSProperties } from 'react';
import { useNetra } from '../../../../context/NetraContext';
import { Weapon, WeaponPrediction } from '../../../../types';
import type { TradeCard } from './types';
import { MONO, sep, SEP6, BOX_H } from './helpers';

// Colour-coded dossier box (same palette the Weapon Armory used for fast read).
function DossierBox({ label, value, bg, fg }: { label: string; value?: string; bg: string; fg: string }) {
  if (!value) return null;
  return (
    <div style={{ background: bg, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '6px', minHeight: '74px' }}>
      <span style={{ fontFamily: MONO, fontSize: '9px', fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', color: fg }}>{label}</span>
      <span style={{ fontFamily: MONO, fontSize: '13px', color: '#ffffff', lineHeight: 1.6 }}>{value}</span>
    </div>
  );
}

function stanceHex(s?: string): string {
  switch ((s || '').toUpperCase()) {
    case 'ENTER':       return '#22c55e';
    case 'WAIT':        return '#f59e0b';
    case 'STAND_ASIDE': return '#ef4444';
    default:            return '#a78bfa';
  }
}

// Extract readable text from an agent-trace step's content (string | blocks | obj).
function stepText(c: unknown): string {
  if (Array.isArray(c) && c[0] && typeof c[0] === 'object' && 'text' in (c[0] as object)) {
    return String((c[0] as { text: string }).text);
  }
  if (typeof c === 'object' && c !== null) return JSON.stringify(c, null, 2);
  return String(c ?? '');
}

// Compact label : value row for Maya's structural read.
function SugRow({ label, value, color = '#e8eaed' }: { label: string; value?: string; color?: string }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', gap: '10px', padding: '4px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', width: '70px', flexShrink: 0, paddingTop: '2px' }}>{label}</span>
      <span style={{ fontFamily: MONO, fontSize: '12px', color, lineHeight: 1.55 }}>{value}</span>
    </div>
  );
}

export default function WeaponPanel({ card, onChange, isLocked }: {
  card: TradeCard;
  onChange: (updates: Partial<TradeCard>) => void;
  isLocked: boolean;
}) {
  const {
    SYSTEM_DATA, triggerWeaponPrediction, stopWeaponPrediction, finalCommand,
  } = useNetra();

  // entry models are constrained by the command (doctrine law)
  const type        = (finalCommand || 'strike').toLowerCase();
  const weaponsList = ((SYSTEM_DATA.weapons as Record<string, Weapon[]> | undefined)?.[type] || []) as Weapon[];
  const MANUAL: Weapon = { id: 'MANUAL', name: 'Custom Override', logic: 'Operator-defined entry — no catalog model fits. Write the strategy you will actually run.', activation: '' };
  const choices     = [...weaponsList, MANUAL];
  const selected    = choices.find(w => w.id === card.weapon);
  const isManual    = card.weapon === 'MANUAL';
  const [thinkOpen, setThinkOpen] = useState(false);
  const [traceOpen, setTraceOpen] = useState(false);
  const [predicting, setPredicting] = useState(false);   // per-card, not the shared store

  // Maya's prediction FOR THIS card (per-trade, never shared across cards)
  const wp       = (card.weaponPrediction || {}) as WeaponPrediction;
  const aiPick   = (wp.weapon || wp.name || '') as string;
  const hasPred  = !!(wp.stance || wp.name || wp.weapon);
  const stance   = String(wp.stance || '').toUpperCase();
  const sColor   = stanceHex(stance);
  const trace    = (wp.agent_trace as Array<{ agent: string; content: unknown }> | undefined) || [];

  // Ask Maya for THIS card and store the result on THIS card.
  const askMaya = async () => {
    setPredicting(true);
    try {
      const result = await triggerWeaponPrediction(card.weaponThought);
      if (result) onChange({ weaponPrediction: result as WeaponPrediction });
    } finally {
      setPredicting(false);
    }
  };
  const applyPick = () => {
    if (wp.type === 'custom') {
      onChange({ weapon: 'MANUAL', weaponNote: [wp.name, wp.entry, wp.reasoning].filter(Boolean).join(' — ') });
    } else {
      const m = choices.find(w => w.id.toLowerCase() === aiPick.toLowerCase() || (w.name || '').toLowerCase() === aiPick.toLowerCase());
      onChange({ weapon: m ? m.id : aiPick });
    }
  };

  const chip = (active: boolean, accent: string): CSSProperties => ({
    fontFamily: MONO, fontSize: '11px', fontWeight: 800, letterSpacing: '0.06em',
    padding: '7px 13px', cursor: isLocked ? 'default' : 'pointer', position: 'relative',
    border: active ? `1px solid ${accent}` : '1px solid rgba(255,255,255,0.2)',
    background: active ? `${accent}22` : 'transparent',
    color: active ? accent : '#ffffff',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0, height: BOX_H, overflowY: 'auto', border: sep, background: '#05070c' }}>

      {/* header — weapon + the command it's constrained by */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderBottom: SEP6, background: 'rgba(167,139,250,0.06)' }}>
        <span style={{ fontSize: '15px' }}>⚔</span>
        <span style={{ fontFamily: MONO, fontSize: '13px', fontWeight: 900, letterSpacing: '0.3em', color: '#ffffff', textTransform: 'uppercase' }}>Weapon</span>
        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
        {finalCommand && (
          <span style={{ fontFamily: MONO, fontSize: '10px', fontWeight: 900, letterSpacing: '0.18em', color: '#a78bfa', textTransform: 'uppercase' }}>{finalCommand}</span>
        )}
      </div>

      {/* trader thought → ask Maya */}
      <div style={{ padding: '14px 16px', borderBottom: SEP6, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <span style={{ fontFamily: MONO, fontSize: '9px', fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.82)', textTransform: 'uppercase' }}>
          Your thought
        </span>
        <textarea
          value={card.weaponThought}
          onChange={e => onChange({ weaponThought: e.target.value })}
          placeholder="Your read on this entry before asking Maya…"
          disabled={isLocked}
          rows={2}
          style={{ fontFamily: MONO, width: '100%', fontSize: '12px', color: '#e8eaed', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '5px', padding: '9px 10px', resize: 'vertical', lineHeight: 1.6 }}
        />
        <div style={{ display: 'flex' }}>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => predicting ? stopWeaponPrediction() : askMaya()}
            disabled={isLocked}
            style={{ fontFamily: MONO, fontSize: '10px', fontWeight: 900, letterSpacing: '0.16em', textTransform: 'uppercase', color: predicting ? '#ef4444' : '#ffffff', background: predicting ? 'transparent' : '#7c5cff', border: predicting ? '1px solid rgba(239,68,68,0.5)' : 'none', borderRadius: '4px', padding: '8px 14px', cursor: isLocked ? 'not-allowed' : 'pointer', flexShrink: 0 }}>
            {predicting ? 'Abort' : '⚔ Ask Maya'}
          </button>
        </div>

        {/* live spinner while the agents reason */}
        {predicting && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 2px' }}>
            <div className="animate-spin" style={{ width: '15px', height: '15px', border: '2px solid rgba(167,139,250,0.25)', borderTopColor: '#a78bfa', borderRadius: '50%' }} />
            <span style={{ fontFamily: MONO, fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', color: '#a78bfa', textTransform: 'uppercase' }}>Maya is reasoning…</span>
          </div>
        )}

        {/* Maya's full suggestion — stance, structure, why, and thinking */}
        {!predicting && hasPred && (
          <div style={{ border: `1px solid ${sColor}44`, borderLeft: `3px solid ${sColor}`, background: `${sColor}10`, borderRadius: '4px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {stance && <span style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 900, letterSpacing: '0.14em', color: sColor, border: `1px solid ${sColor}`, padding: '2px 7px' }}>{stance.replace('_', ' ')}</span>}
              <span style={{ fontFamily: MONO, fontSize: '14px', fontWeight: 900, color: '#a78bfa' }}>{aiPick || '—'}</span>
              {wp.type === 'custom' && <span style={{ fontFamily: MONO, fontSize: '7px', fontWeight: 800, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase' }}>custom</span>}
              {wp.confidence && <span style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>{wp.confidence}</span>}
              <div style={{ flex: 1 }} />
              {!isLocked && (
                <button onClick={applyPick} title="Use this entry model"
                  style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 800, letterSpacing: '0.05em', color: sColor, background: `${sColor}1e`, border: `1px solid ${sColor}66`, borderRadius: '3px', padding: '3px 9px', cursor: 'pointer' }}>
                  use
                </button>
              )}
            </div>

            {/* structure — WAIT shows the trigger; otherwise the entry plan */}
            {stance === 'WAIT' ? (
              <>
                <SugRow label="Wait for" value={wp.wait_for} color={sColor} />
                <SugRow label="Becomes"  value={wp.becomes} />
              </>
            ) : (
              <>
                <SugRow label="Entry"  value={wp.entry}  color="#86efac" />
                <SugRow label="Stop"   value={wp.stop}   color="#fca5a5" />
                <SugRow label="Target" value={wp.target} color="#67e8f9" />
              </>
            )}
            <SugRow label="Expect" value={wp.expected} />

            {/* WHY — the reasoning, shown by default (this is what you wanted surfaced) */}
            {wp.reasoning && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px' }}>
                <span style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 800, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase' }}>Why</span>
                <p style={{ fontFamily: MONO, fontSize: '12px', color: '#e8eaed', lineHeight: 1.7, margin: '5px 0 0' }}>{wp.reasoning}</p>
              </div>
            )}

            {/* Maya's thinking — collapsible chain-of-thought */}
            {wp.thinking && (
              <div>
                <button onClick={() => setThinkOpen(v => !v)} style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  {thinkOpen ? '▾' : '▸'} Maya's thinking
                </button>
                {thinkOpen && <p style={{ fontFamily: MONO, fontSize: '11px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, margin: '6px 0 0', whiteSpace: 'pre-wrap' }}>{wp.thinking}</p>}
              </div>
            )}

            {/* agent reasoning — the Theory → Historian → Suggestion → Critique trace */}
            {trace.length > 0 && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px' }}>
                <button onClick={() => setTraceOpen(v => !v)} style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  {traceOpen ? '▾' : '▸'} Agent reasoning ({trace.length})
                </button>
                {traceOpen && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px', maxHeight: '240px', overflowY: 'auto' }}>
                    {trace.map((s, i) => (
                      <div key={i} style={{ borderLeft: '2px solid rgba(255,255,255,0.1)', paddingLeft: '9px' }}>
                        <div style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 900, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase' }}>{s.agent}</div>
                        <p style={{ fontFamily: MONO, fontSize: '11px', color: 'rgba(255,255,255,0.62)', lineHeight: 1.65, margin: '3px 0 0', whiteSpace: 'pre-wrap' }}>{stepText(s.content)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* command-filtered entry-model selector */}
      <div style={{ padding: '14px 16px', borderBottom: SEP6 }}>
        <div style={{ fontFamily: MONO, fontSize: '9px', fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.82)', textTransform: 'uppercase', marginBottom: '10px' }}>
          Entry model{finalCommand ? ` · ${type}` : ''}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
          {choices.map(w => {
            const active = card.weapon === w.id;
            const isRec  = !!aiPick && (w.id === aiPick || w.name === aiPick);
            const accent = w.id === 'MANUAL' ? '#f59e0b' : '#a78bfa';
            return (
              <button key={w.id} onClick={() => !isLocked && onChange({ weapon: w.id })} disabled={isLocked} title={w.name} style={chip(active, accent)}>
                {w.id}
                {isRec && <span style={{ position: 'absolute', top: '4px', right: '4px', width: '6px', height: '6px', borderRadius: '50%', background: '#a78bfa', boxShadow: '0 0 6px #a78bfa' }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* dossier on selection — or the manual strategy box */}
      <div style={{ padding: '14px 16px', flex: 1, minHeight: 0 }}>
        {!card.weapon ? (
          <div style={{ fontFamily: MONO, fontSize: '11px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', lineHeight: 1.8, textAlign: 'center', padding: '22px 0' }}>
            Pick an entry model to load its dossier
          </div>
        ) : isManual ? (
          <>
            <div style={{ fontFamily: MONO, fontSize: '11px', fontWeight: 900, letterSpacing: '0.16em', color: '#f59e0b', textTransform: 'uppercase', marginBottom: '8px' }}>✦ Custom Override</div>
            <p style={{ fontFamily: MONO, fontSize: '12px', color: '#e8eaed', lineHeight: 1.7, margin: '0 0 10px' }}>{MANUAL.logic}</p>
            <textarea
              value={card.weaponNote}
              onChange={e => onChange({ weaponNote: e.target.value })}
              placeholder="Your entry strategy — what you'll actually run…"
              disabled={isLocked}
              rows={5}
              style={{ fontFamily: MONO, width: '100%', fontSize: '13px', color: '#e8eaed', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.12)', padding: '10px', resize: 'vertical', lineHeight: 1.7 }}
            />
          </>
        ) : selected ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* identity */}
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: MONO, fontSize: '18px', fontWeight: 900, color: '#a78bfa', letterSpacing: '0.05em' }}>{selected.name}</span>
                {selected.type && <span style={{ fontFamily: MONO, fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>{selected.type}</span>}
              </div>
              {selected.logic && <p style={{ fontFamily: MONO, fontSize: '13px', color: '#e8eaed', lineHeight: 1.8, margin: 0 }}>{selected.logic}</p>}
            </div>

            {/* colour-coded entry protocols */}
            {(selected.entryPrimary || selected.entry || selected.entryAlternative || selected.entryAggressive) && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '7px' }}>
                <DossierBox label="Entry · Primary" value={selected.entryPrimary || selected.entry} bg="#1a4535" fg="#86efac" />
                <DossierBox label="Entry · Alt"     value={selected.entryAlternative} bg="#1a2f52" fg="#93c5fd" />
                <DossierBox label="Entry · Aggr"    value={selected.entryAggressive} bg="#4a2c0a" fg="#fcd34d" />
              </div>
            )}

            {/* colour-coded stop / targets / misfire */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '7px' }}>
              <DossierBox label="Stop"      value={selected.stop} bg="#4a1515" fg="#fca5a5" />
              <DossierBox label="Targets"   value={[selected.targetPrimary || selected.target, selected.targetSecondary].filter(Boolean).join('  ·  ')} bg="#0f3540" fg="#67e8f9" />
              <DossierBox label="⚠ Misfire" value={(selected.misfireList?.length ? selected.misfireList : [selected.misfire]).filter(Boolean).join('  ·  ')} bg="#4a2010" fg="#fdba74" />
            </div>
          </div>
        ) : (
          <div style={{ fontFamily: MONO, fontSize: '13px', color: '#a78bfa', fontWeight: 800 }}>{card.weapon}</div>
        )}
      </div>
    </div>
  );
}

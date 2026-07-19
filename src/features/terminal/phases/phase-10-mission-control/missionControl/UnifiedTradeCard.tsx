import { useState, useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { useNetra } from '@/context/NetraContext';
import { WeaponPrediction } from '@/types';
import type { TradeCard } from './types';
import { mkCard, computeCardStats, autoTimeSeconds, localDateStr, MONO, StatCell, Field, sep, SEP6, bare, SAVE_TRADE_CARDS_EVENT, type SaveTradeCardsRequest } from './helpers';
import { RecognizedState, TransitionBranch } from '@/components/Templates/StateGraph';
import { API_BASE } from '@/utils/constants';
import { SliderRow } from '@/components/Templates/aiLabs/SliderRow';
import { tempColor } from '@/components/Templates/aiLabs/helpers';
import { LuxuryShapeSpinner } from '@/components/UI/LuxuryShapeSpinner';
import { buildPhase9TradeBlock, buildTradeMetadata } from '@/types/tradeStorageSchema';

// ─── Weapon Name Mapping (Child States to Weapon / Identity) ──────────────────
const WEAPON_NAME_MAP: Record<string, string> = {
  // STRIKE
  'NS-03-CS01': 'Astra',
  'NS-03-CS02': 'BrahMos',
  'NS-03-CS03': 'Agni',
  'NS-03-CS04': 'Nirbhay',
  'NS-03-CS05': 'Akash',
  'NS-03-CS06': 'Pralay',
  // INTERCEPTION
  'NS-04-CS01': 'Rafale',
  'NS-04-CS02': 'Su-30 MKI',
  'NS-04-CS03': 'Tejas',
  'NS-04-CS04': 'Mirage-2000',
  'NS-04-CS05': 'MiG-29',
  // SATURATION
  'NS-02-CS01': 'HAL Dhruv',
  'NS-02-CS02': 'HAL Rudra',
  'NS-02-CS03': 'HAL Prachand',
  'NS-02-CS04': 'HAL Cheetah',
  // NO ENGAGEMENT
  'NS-01-CS01': 'Info Void',
  'NS-01-CS02': 'Liq Trap',
  'NS-01-CS03': 'Collapse',
  'NS-01-CS04': 'Constraint',
  'NS-01-CS05': 'Transition',
};

const splitToLines = (s: string | string[] | null | undefined): string[] => {
  if (!s) return [];
  if (Array.isArray(s)) return s;
  return s.split('\n').map(l => l.trim()).filter(Boolean);
};

const STATIC_CHILD_STATES: Record<string, Array<{ id: string; name: string; description: string; transitions: string[] }>> = {
  STRIKE: [
    { id: 'NS-03-CS01', name: 'Initiative Relocation', description: 'Trend Expansion. Missile: Astra.', transitions: ['NS-03-CS02', 'NS-03-CS03', 'NS-03-CS04', 'NS-03-CS05', 'NS-03-CS06', 'NS-04'] },
    { id: 'NS-03-CS02', name: 'Reload Relocation', description: 'Pullback Continuation. Missile: BrahMos.', transitions: ['NS-03-CS01', 'NS-03-CS03', 'NS-03-CS04', 'NS-03-CS05', 'NS-01', 'NS-04'] },
    { id: 'NS-03-CS03', name: 'Compression Loading', description: 'Trend Compression. Missile: Agni.', transitions: ['NS-03-CS01', 'NS-03-CS02', 'NS-03-CS05', 'NS-01', 'NS-04'] },
    { id: 'NS-03-CS04', name: 'Accepted Continuation', description: 'Acceptance Continuation. Missile: Nirbhay.', transitions: ['NS-03-CS01', 'NS-03-CS02', 'NS-03-CS05', 'NS-03-CS06', 'NS-01', 'NS-04'] },
    { id: 'NS-03-CS05', name: 'Objective Pursuit', description: 'Objective Driven Continuation. Missile: Akash.', transitions: ['NS-03-CS01', 'NS-03-CS02', 'NS-03-CS04', 'NS-03-CS06', 'NS-04'] },
    { id: 'NS-03-CS06', name: 'Terminal Continuation', description: 'Campaign Exhaustion. Missile: Pralay.', transitions: ['NS-03-CS05', 'NS-01', 'NS-02', 'NS-04'] },
  ],
  INTERCEPTION: [
    { id: 'NS-04-CS01', name: 'Continuation Trap', description: 'Failed Continuation. Aircraft: Rafale.', transitions: ['NS-04-CS03', 'NS-04-CS05', 'NS-03', 'NS-01'] },
    { id: 'NS-04-CS02', name: 'Rejection Trap', description: 'Failed Rejection. Aircraft: Su-30 MKI.', transitions: ['NS-04-CS03', 'NS-04-CS04', 'NS-04-CS05', 'NS-01'] },
    { id: 'NS-04-CS03', name: 'Liquidity Extraction Trap', description: 'Inventory Harvest. Aircraft: Tejas.', transitions: ['NS-04-CS01', 'NS-04-CS02', 'NS-04-CS04', 'NS-04-CS05', 'NS-01'] },
    { id: 'NS-04-CS04', name: 'Narrative Inversion Trap', description: 'Control Transfer Deception. Aircraft: Mirage-2000.', transitions: ['NS-04-CS01', 'NS-04-CS02', 'NS-04-CS03', 'NS-04-CS05', 'NS-01'] },
    { id: 'NS-04-CS05', name: 'Exhaustion Trap', description: 'False Completion. Aircraft: MiG-29.', transitions: ['NS-04-CS01', 'NS-04-CS02', 'NS-04-CS03', 'NS-03', 'NS-01'] },
  ],
  SATURATION: [
    { id: 'NS-02-CS01', name: 'Value Rotation', description: 'Value Rotation. Aircraft: HAL Dhruv.', transitions: ['NS-02-CS02', 'NS-02-CS03', 'NS-02-CS04', 'NS-03', 'NS-04'] },
    { id: 'NS-02-CS02', name: 'Compression Loading', description: 'Contracting Equilibrium. Aircraft: HAL Rudra.', transitions: ['NS-02-CS01', 'NS-02-CS03', 'NS-02-CS04', 'NS-03', 'NS-04'] },
    { id: 'NS-02-CS03', name: 'Boundary Expansion', description: 'Expanding Equilibrium. Aircraft: HAL Prachand.', transitions: ['NS-02-CS01', 'NS-02-CS02', 'NS-02-CS04', 'NS-03', 'NS-04'] },
    { id: 'NS-02-CS04', name: 'Equilibrium Collapse', description: 'Failing Equilibrium. Aircraft: HAL Cheetah.', transitions: ['NS-01', 'NS-03', 'NS-04'] },
  ],
  NO_ENGAGEMENT: [
    { id: 'NS-01-CS01', name: 'Information Void', description: 'The auction fails to communicate a coherent structural narrative.', transitions: ['NS-01-CS02', 'NS-01-CS05', 'NS-02', 'NS-03', 'NS-04'] },
    { id: 'NS-01-CS02', name: 'Liquidity Entrapment', description: 'The auction intentionally harvests liquidity while concealing genuine ownership.', transitions: ['NS-01-CS01', 'NS-01-CS03', 'NS-01-CS05', 'NS-02', 'NS-03', 'NS-04'] },
    { id: 'NS-01-CS03', name: 'Participation Collapse', description: 'The auction can no longer facilitate efficient price discovery.', transitions: ['NS-01-CS01', 'NS-01-CS04', 'NS-02', 'NS-03'] },
    { id: 'NS-01-CS04', name: 'Mechanical Constraint', description: 'External mechanisms dominate auction behaviour.', transitions: ['NS-01-CS01', 'NS-01-CS05', 'NS-02', 'NS-03', 'NS-04'] },
    { id: 'NS-01-CS05', name: 'Structural Transition', description: 'The auction is changing operational identity.', transitions: ['NS-01-CS01', 'NS-02', 'NS-03', 'NS-04'] },
  ],
};

function stanceHex(s?: string): string {
  switch ((s || '').toUpperCase()) {
    case 'ENTER':       return MATTE.success;
    case 'WAIT':        return MATTE.accent;
    case 'STAND_ASIDE': return MATTE.danger;
    default:            return MATTE.blueGrey;
  }
}

function stepText(c: unknown): string {
  if (Array.isArray(c)) {
    return c.map(item => stepText(item)).filter(Boolean).join('\n');
  }
  if (typeof c === 'object' && c !== null) {
    const obj = c as Record<string, unknown>;
    for (const key of ['text', 'content', 'analysis', 'raw_model_response', 'raw', 'reasoning']) {
      if (obj[key]) return stepText(obj[key]);
    }
    return JSON.stringify(c, null, 2);
  }
  return String(c ?? '');
}

function SugRow({ label, value, color = MATTE.inkSoft }: { label: string; value?: string; color?: string }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', gap: '10px', padding: '5px 0', borderTop: `1px solid ${MATTE.line}` }}>
      <span style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 850, letterSpacing: '0.14em', textTransform: 'uppercase', color: MATTE.muted, width: '70px', flexShrink: 0, paddingTop: '2px' }}>{label}</span>
      <span style={{ fontFamily: MONO, fontSize: '12px', color, lineHeight: 1.55 }}>{value}</span>
    </div>
  );
}

function tacticalHex(v?: string | null): string {
  switch ((v || '').toUpperCase()) {
    case 'STRIKE':        return MATTE.accent;
    case 'INTERCEPTION':  return MATTE.blueGrey;
    case 'SATURATION':    return MATTE.inkSoft;
    case 'WATCH':         return MATTE.muted;
    case 'NO_ENGAGEMENT': return MATTE.danger;
    default:              return MATTE.accent;
  }
}

const DEFAULT_EXIT_TYPES = [
  'Target 1 Hit',
  'Target 2 Hit',
  'Target 3 Hit',
  'Target 4 Hit',
  'Stop Loss Hit',
  'Breakeven Exit',
  'Manual Exit',
  'Time-Based Exit',
  'Partial Profit Exit',
  'Trailing Stop Exit',
  'Setup Invalidated',
];

function holdingMinutes(entryDate: string | undefined, entryTime: string | undefined, exitDate: string | undefined, exitTime: string | undefined): number | undefined {
  if (!entryTime || !exitTime) return undefined;
  const startDate = entryDate || localDateStr();
  const endDate = exitDate || startDate;
  const start = new Date(`${startDate}T${entryTime}`);
  const end = new Date(`${endDate}T${exitTime}`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return undefined;
  const mins = Math.floor((end.getTime() - start.getTime()) / 60000);
  return mins > 0 ? mins : undefined;
}

function actionMinutesFromEntry(
  entryDate: string | undefined,
  entryTime: string | undefined,
  actionDate: string | undefined,
  actionTime: string | undefined,
): number | undefined {
  if (!entryTime || !actionTime) return undefined;
  const startDate = entryDate || localDateStr();
  const endDate = actionDate || startDate;
  const start = new Date(`${startDate}T${entryTime}`);
  const end = new Date(`${endDate}T${actionTime}`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return undefined;
  const mins = Math.floor((end.getTime() - start.getTime()) / 60000);
  return mins >= 0 ? mins : undefined;
}

function firstActionMinutesFromEntry<T extends { date?: string; time?: string }>(
  entryDate: string | undefined,
  entryTime: string | undefined,
  actions: T[],
): number | undefined {
  const first = actions.find(action => action.time);
  if (!first) return undefined;
  return actionMinutesFromEntry(entryDate, entryTime, first.date, first.time);
}

function tradeTimestamp(date: string | undefined, time: string | undefined): string | undefined {
  if (!date || !time) return undefined;
  return `${date}T${time}`;
}

const hasValue = (value: unknown): boolean => String(value ?? '').trim().length > 0;

const fmtMoney = (value: number | null | undefined): string => {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';
  return `${sign}₹${Math.abs(value).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

const fmtPoints = (value: number | null | undefined): string => {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}`;
};

const fmtDuration = (mins: number | undefined): string => {
  if (mins === undefined || mins === null || !Number.isFinite(mins)) return '—';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const LEDGER_FIELD_H = 32;
const LEDGER_LABEL_H = 9;

const MATTE = {
  shell: '#050608',
  paper: '#0d1116',
  paper2: '#121820',
  paper3: '#18202a',
  field: '#070a0e',
  ink: '#f4f6f8',
  inkSoft: 'rgba(244,246,248,0.78)',
  muted: 'rgba(205,213,222,0.58)',
  faint: 'rgba(244,246,248,0.08)',
  line: 'rgba(244,246,248,0.12)',
  lineStrong: 'rgba(244,246,248,0.24)',
  accent: '#f4f6f8',
  accentSoft: 'rgba(244,246,248,0.08)',
  buy: '#9fb8a8',
  sell: '#c39a96',
  exit: '#c8cfd6',
  danger: '#c39a96',
  success: '#9fb8a8',
  blueGrey: '#aeb8c2',
  phase2Base: '#111820',
  phase2Left: 'rgba(73, 90, 116, 0.18)',
  phase2Right: 'rgba(72, 96, 86, 0.16)',
  phase2Readiness: 'rgba(104, 112, 126, 0.16)',
  phase1Left: 'rgba(70, 78, 92, 0.18)',
  phase1Right: 'rgba(53, 64, 78, 0.18)',
  phase3Base: '#101821',
  phase3Identity: 'rgba(70, 84, 98, 0.16)',
  phase3Ledger: 'rgba(50, 65, 77, 0.16)',
  phase3Stats: 'rgba(80, 86, 94, 0.14)',
  phase4Base: 'rgba(63, 72, 84, 0.15)',
};

const ledgerMiniLabel = (color?: string): CSSProperties => ({
  fontFamily: MONO,
  fontSize: '9px',
  fontWeight: 900,
  color: color || MATTE.muted,
  letterSpacing: '0.11em',
  textTransform: 'uppercase',
});

function LedgerDisplay({ label, value, color }: { label: string; value: string; color?: string }) {
  const isType = label.toLowerCase() === 'type';
  const isExitType = String(value).toLowerCase() === 'exit';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
      <span style={{ ...ledgerMiniLabel(color), height: `${LEDGER_LABEL_H}px`, display: 'block', lineHeight: `${LEDGER_LABEL_H}px`, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
      <div style={{
        height: `${LEDGER_FIELD_H}px`,
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        background: 'transparent',
        border: 'none',
        borderBottom: isType ? `2px solid ${isExitType ? MATTE.exit : MATTE.blueGrey}` : `1px solid ${MATTE.lineStrong}`,
        padding: isType ? '0 8px' : '0 2px',
        minWidth: 0,
      }}>
        <span style={{ fontFamily: MONO, color: color || MATTE.ink, fontSize: isType ? '11px' : '13px', fontWeight: 900, letterSpacing: isType ? '0.12em' : '0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textTransform: isType ? 'uppercase' : 'none' }}>{value || '—'}</span>
      </div>
    </div>
  );
}

function LedgerNumber({ label, value, onValue, disabled, color, placeholder }: { label: string; value: string | number; onValue: (value: string) => void; disabled?: boolean; color?: string; placeholder?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
      <span style={{ ...ledgerMiniLabel(color), height: `${LEDGER_LABEL_H}px`, display: 'block', lineHeight: `${LEDGER_LABEL_H}px`, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
      <input
        type="number"
        value={String(value ?? '')}
        onChange={e => onValue(e.target.value)}
        placeholder={placeholder || '0.00'}
        disabled={disabled}
        className="ledger-line-input"
        style={{ ...bare, height: `${LEDGER_FIELD_H}px`, boxSizing: 'border-box', fontSize: '13px', fontWeight: 900, color: color || MATTE.ink, minHeight: `${LEDGER_FIELD_H}px`, background: 'transparent', border: 'none', borderBottom: disabled ? `1px solid ${MATTE.lineStrong}` : `1px solid ${color || 'rgba(244,246,248,0.28)'}`, padding: '7px 2px 6px', opacity: disabled ? 0.86 : 1 }}
      />
    </div>
  );
}

function LedgerDateTimeBox({ label, date, time, onValue, disabled }: { label: string; date?: string; time?: string; onValue: (date: string, time: string) => void; disabled?: boolean }) {
  const dateTimeValue = (inputDate?: string, inputTime?: string) => {
    if (!inputDate) return '';
    const safeTime = (inputTime || '00:00:00').slice(0, 8);
    return `${inputDate}T${safeTime.length === 5 ? `${safeTime}:00` : safeTime}`;
  };
  const splitDateTimeValue = (value: string) => {
    const [inputDate = '', rawTime = ''] = value.split('T');
    const nextTime = rawTime.length === 5 ? `${rawTime}:00` : rawTime.slice(0, 8);
    return { date: inputDate, time: nextTime };
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
      <span style={{ ...ledgerMiniLabel(), height: `${LEDGER_LABEL_H}px`, display: 'block', lineHeight: `${LEDGER_LABEL_H}px`, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
      <input
        type="datetime-local"
        step={1}
        value={dateTimeValue(date, time)}
        onChange={e => {
          const next = splitDateTimeValue(e.target.value);
          onValue(next.date, next.time);
        }}
        disabled={disabled}
        className="ledger-line-input"
        style={{ fontFamily: MONO, fontSize: '11px', fontWeight: 900, padding: '7px 2px 6px', background: 'transparent', border: 'none', borderBottom: disabled ? `1px solid ${MATTE.lineStrong}` : `1px solid rgba(244,246,248,0.28)`, borderRadius: '0px', color: MATTE.ink, outline: 'none', colorScheme: 'dark', minWidth: 0, height: `${LEDGER_FIELD_H}px`, boxSizing: 'border-box' }}
      />
    </div>
  );
}

function LedgerSelect({ label, value, onValue, options, disabled }: { label: string; value: string; onValue: (value: string) => void; options: string[]; disabled?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
      <span style={{ ...ledgerMiniLabel(), height: `${LEDGER_LABEL_H}px`, display: 'block', lineHeight: `${LEDGER_LABEL_H}px`, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
      <select
        value={value}
        onChange={e => onValue(e.target.value)}
        disabled={disabled}
        className="ledger-line-input"
        style={{ ...bare, height: `${LEDGER_FIELD_H}px`, boxSizing: 'border-box', minHeight: `${LEDGER_FIELD_H}px`, fontSize: '11px', fontWeight: 900, color: MATTE.ink, background: 'transparent', border: 'none', borderBottom: disabled ? `1px solid ${MATTE.lineStrong}` : `1px solid rgba(244,246,248,0.28)`, padding: '7px 2px' }}
      >
        {options.map(option => (
          <option key={option} value={option} style={{ background: '#05070c', color: '#fff' }}>{option}</option>
        ))}
      </select>
    </div>
  );
}

function LedgerButton({ label, onClick, disabled, tone = 'neutral' }: { label: string; onClick: () => void; disabled?: boolean; tone?: 'neutral' | 'entry' | 'exit' | 'danger' }) {
  const fillColor = tone === 'entry'
    ? '#8eb59a'
    : tone === 'exit' || tone === 'danger'
      ? '#c78383'
      : '#8aa4b2';
  const toneStyle = tone === 'entry'
    ? { background: 'rgba(142,181,154,0.07)', border: '1px solid rgba(142,181,154,0.22)', color: '#b7d1bf' }
    : tone === 'exit'
      ? { background: 'rgba(199,131,131,0.07)', border: '1px solid rgba(199,131,131,0.22)', color: '#d8adad' }
      : tone === 'danger'
        ? { background: 'transparent', border: '1px solid rgba(199,131,131,0.28)', color: '#d8adad' }
        : { background: 'transparent', border: `1px solid ${MATTE.line}`, color: '#a8bdc8' };
  return (
    <button
      className="ledger-row-button"
      onClick={onClick}
      disabled={disabled}
      style={{
        '--ledger-row-fill': fillColor,
        height: '25px',
        alignSelf: 'end',
        boxSizing: 'border-box',
        fontFamily: MONO,
        fontSize: '7.5px',
        fontWeight: 900,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        cursor: disabled ? 'default' : 'pointer',
        borderRadius: '0px',
        whiteSpace: 'nowrap',
        padding: '0 6px',
        opacity: disabled ? 0.38 : 1,
        boxShadow: 'none',
        ...toneStyle,
      } as CSSProperties}
    >
      {label}
    </button>
  );
}

const optionScore = (item: any, value: string, options: string[]): number => {
  const explicit = item?.weights?.[value] ?? item?.scores?.[value];
  if (typeof explicit === 'number' && Number.isFinite(explicit)) {
    return explicit <= 1 ? Math.max(0, Math.min(1, explicit)) : Math.max(0, Math.min(1, explicit / 10));
  }

  const text = value.toLowerCase();
  if (/(not ready|no candidate|absent|undefined|insufficient|failed|lost|critical|deteriorating|chaotic|collapsed|poor|dominant|invalid|rejected)/.test(text)) return 0;
  if (/(limited|weak|weakening|immature|undeveloped|ambiguous|conflicted|significant|low)/.test(text)) return 0.35;
  if (/(developing|approaching|moderate|adequate|recovering|mixed|neutral)/.test(text)) return 0.58;
  if (/(ready|confirmed|complete|clear|mature|reliable|healthy|established|resolving|stable|building|emerging|suitable|aligned|accepted|valid|strong|probable|none)/.test(text)) return 1;

  const idx = options.findIndex(opt => opt === value);
  if (idx < 0 || options.length <= 1) return 0.5;
  return Math.max(0, Math.min(1, 1 - idx / (options.length - 1)));
};

function DateTimeStamp({
  label,
  date,
  time,
  onStamp,
  onDate,
  onTime,
  disabled,
}: {
  label: string;
  date: string;
  time: string;
  onStamp: () => void;
  onDate: (value: string) => void;
  onTime: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0, gridColumn: 'span 2' }}>
      <span style={{ fontFamily: MONO, fontSize: '10px', fontWeight: 900, color: 'rgba(248,250,252,0.78)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) 58px', gap: '4px', minWidth: 0 }}>
        <input
          type="date"
          value={date}
          onChange={e => onDate(e.target.value)}
          disabled={disabled}
          style={{ ...bare, boxSizing: 'border-box', padding: '9px 10px', fontSize: '12px', fontWeight: 800, color: MATTE.ink, colorScheme: 'dark', minWidth: 0, borderRadius: '0px', background: MATTE.field, border: `1px solid ${MATTE.lineStrong}` }}
        />
        <input
          type="time"
          step={1}
          value={time}
          onChange={e => onTime(e.target.value)}
          disabled={disabled}
          style={{ ...bare, boxSizing: 'border-box', padding: '9px 10px', fontSize: '12px', fontWeight: 800, color: MATTE.ink, colorScheme: 'dark', minWidth: 0, borderRadius: '0px', background: MATTE.field, border: `1px solid ${MATTE.lineStrong}` }}
        />
        <button
          onClick={onStamp}
          disabled={disabled}
          title={`Stamp current ${label.toLowerCase()}`}
          style={{
            fontFamily: MONO,
            fontSize: '9px',
            fontWeight: 900,
            cursor: disabled ? 'default' : 'pointer',
            background: MATTE.paper3,
            border: `1px solid ${MATTE.lineStrong}`,
            borderRadius: '0px',
            color: MATTE.ink,
            letterSpacing: '0.08em'
          }}
        >
          NOW
        </button>
      </div>
    </div>
  );
}

export default function UnifiedTradeCard({
  card, tradeIndex, assetPrefix, username, terminalSessionId, onChange, onRemove, canRemove, isLocked, getAuthHeaders,
}: {
  card: TradeCard;
  tradeIndex: number;
  assetPrefix: string;
  username: string;
  terminalSessionId: string | null;
  onChange: (updates: Partial<TradeCard>) => void;
  onRemove: () => void;
  canRemove: boolean;
  isLocked: boolean;
  getAuthHeaders: (extra?: Record<string, string>) => Record<string, string>;
}) {
  const saveToDbRef = useRef<() => Promise<string | null>>(async () => null);
  const shouldSaveToDbRef = useRef(false);

  useEffect(() => {
    const handleSaveAll = (event: Event) => {
      const request = (event as CustomEvent<SaveTradeCardsRequest>).detail;
      if (shouldSaveToDbRef.current) request?.tasks.push(saveToDbRef.current().then(Boolean));
    };
    window.addEventListener(SAVE_TRADE_CARDS_EVENT, handleSaveAll);
    return () => window.removeEventListener(SAVE_TRADE_CARDS_EVENT, handleSaveAll);
  }, []);
  const {
    SYSTEM_DATA, triggerWeaponPrediction, stopWeaponPrediction, finalCommand, netraOutput, selectedNetraState,
    AVAILABLE_MODELS, selectedModel, setSelectedModel, modelConfig, setModelConfig, session,
    selections, notes, sysRecommendation, selectedWeaponId,
    strikeSelections, interSelections, saturationSelections
  } = useNetra();

  const type = finalCommand || 'STRIKE';
  const tacticalAccent = tacticalHex(type);

  // ── Database & UI states ──
  const exitTypes = SYSTEM_DATA.exitTypes?.length ? SYSTEM_DATA.exitTypes : DEFAULT_EXIT_TYPES;

  const [addingPos,   setAddingPos]   = useState(false);
  const [subtractPos, setSubtractPos] = useState(false);
  const [newAdd,     setNewAdd]       = useState({ price: '', stop: '', qty: '65', cost: '10', date: '', time: '', assetEntry: '', assetStop: '' });
  const [newPartial, setNewPartial]   = useState({ qty: '', price: '', date: '', time: '', assetExit: '', exitType: 'Partial Exit' });
  const [actionHint, setActionHint] = useState('');
  const [saving,     setSaving]       = useState(false);
  const [committing, setCommitting]   = useState(false);
  const [deletingCard, setDeletingCard] = useState(false);
  const [saved,      setSaved]        = useState(false);
  const [saveError,  setSaveError]    = useState('');
  shouldSaveToDbRef.current = Boolean(
    card.dbId || card.entry || card.assetSuffix || card.weapon || card.notes ||
    card.addEntries.length || card.partialExits.length,
  );

  const [thinkOpen, setThinkOpen] = useState(false);
  const [traceOpen, setTraceOpen] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [completeExitOpen, setCompleteExitOpen] = useState(false);
  const [transitionMapOpen, setTransitionMapOpen] = useState(false);
  const [editingAddIds, setEditingAddIds] = useState<number[]>([]);
  const [editingPartialIds, setEditingPartialIds] = useState<number[]>([]);
  const [closedEditMode, setClosedEditMode] = useState(false);

  useEffect(() => {
    if (!card.closed && closedEditMode) setClosedEditMode(false);
  }, [card.closed, closedEditMode]);

  // ── Auto SL and decision targets calculation ──
  useEffect(() => {
    if (!card.entryLocked) return;
    const price = parseFloat(String(card.instrumentKind === 'CONTRACT' ? card.underlyingEntry : card.entry));
    if (!price || price <= 0 || card.slManual) return;
    onChange({ sl: (price * 0.95).toFixed(2), t4: (price * 2).toFixed(2) });
  }, [card.entryLocked, card.entry, card.underlyingEntry, card.instrumentKind]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!card.entryLocked) return;
    const price = parseFloat(String(card.instrumentKind === 'CONTRACT' ? card.underlyingEntry : card.entry));
    if (!price || price <= 0) return;
    const t4 = (price * 2).toFixed(2);
    let cancelled = false;
    fetch(`${API_BASE}/api/decision/trade-targets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entry_price: price, side: card.side }),
    })
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        if (data.t1) onChange({ t1: String(data.t1), t2: String(data.t2), t3: String(data.t3), t4 });
        else onChange({ t4 });
      })
      .catch(() => { if (!cancelled) onChange({ t4 }); });
    return () => { cancelled = true; };
  }, [card.entryLocked, card.entry, card.underlyingEntry, card.instrumentKind, card.side]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Retrieve child states from the P6 user-selected state, not P5 AI text ──
  const selectedState = (selectedNetraState || {}) as Record<string, unknown>;
  const recognizedState = selectedState.recognized_state as Record<string, unknown> | undefined;
  const childStatesFromSelection = (selectedState.child_states || []) as Array<{ id: string; name: string; description: string; transitions?: string[] }>;

  const [enrichedChildStates, setEnrichedChildStates] = useState<any[]>([]);

  useEffect(() => {
    const stateId = recognizedState?.state_id || selectedState.state_id || (finalCommand === 'STRIKE' ? 'NS-03' : finalCommand === 'INTERCEPTION' ? 'NS-04' : finalCommand === 'SATURATION' ? 'NS-02' : 'NS-01');
    if (!stateId) return;

    let active = true;
    setEnrichedChildStates([]);
    fetch(`${API_BASE}/api/states/${stateId}`)
      .then(r => r.ok ? r.json() : null)
      .then(proj => {
        if (proj && proj.child_states && active) {
          setEnrichedChildStates(proj.child_states);
        } else if (active) {
          setEnrichedChildStates([]);
        }
      })
      .catch(() => { if (active) setEnrichedChildStates([]); });
    return () => { active = false; };
  }, [recognizedState?.state_id, selectedState.state_id, finalCommand]);

  const staticList = STATIC_CHILD_STATES[type] || STATIC_CHILD_STATES['STRIKE'];
  const sourceList = enrichedChildStates.length > 0 ? enrichedChildStates : (childStatesFromSelection.length > 0 ? childStatesFromSelection : staticList);
  const choices = sourceList.map(cs => ({
    id: cs.id,
    displayName: WEAPON_NAME_MAP[cs.id] || cs.name,
    originalName: cs.name,
    description: cs.description || (cs as any).market_name || '',
    transitions: ((cs as any).transitions || []).map((t: any) => {
      if (!t) return null;
      if (typeof t === 'string') return t;
      const rawId = t.child_state_id || t.parent_state_id || t.target || '';
      const match = rawId.match(/^(NS-\d{2}(?:-CS\d{2})?)/);
      return match ? match[1] : null;
    }).filter(Boolean),
    transition_reasons: ((cs as any).transitions || []).reduce((acc: Record<string, string>, t: any) => {
      if (t && typeof t === 'object') {
        const rawId = t.child_state_id || t.parent_state_id || t.target || '';
        const match = rawId.match(/^(NS-\d{2}(?:-CS\d{2})?)/);
        if (match && t.reason) {
          acc[match[1]] = t.reason;
        }
      }
      return acc;
    }, {}),
    entry_logic:  Array.isArray((cs as any).entry_logic)  ? (cs as any).entry_logic  : splitToLines((cs as any).entry_logic),
    stop_logic:   Array.isArray((cs as any).stop_logic)   ? (cs as any).stop_logic   : splitToLines((cs as any).stop_logic),
    target_logic: Array.isArray((cs as any).target_logic) ? (cs as any).target_logic : splitToLines((cs as any).target_logic),
    failure_conditions: (cs as any).failure_conditions || [],
    dimensions: (cs as any).dimensions || [],
    execution_mapping: Array.isArray((cs as any).execution_mapping)
      ? (cs as any).execution_mapping
      : splitToLines((cs as any).execution_mapping),
    observation_mapping: Array.isArray((cs as any).observation_mapping)
      ? (cs as any).observation_mapping
      : splitToLines((cs as any).observation_mapping),
    events: (cs as any).events || []
  }));

  const MANUAL_CHOICE = {
    id: 'MANUAL',
    displayName: 'Custom Override',
    originalName: 'Custom Override',
    description: 'Operator-defined entry — no catalog model fits. Write the strategy you will actually run.',
    transitions: [],
    transition_reasons: {},
    entry_logic: [],
    stop_logic: [],
    target_logic: [],
    failure_conditions: [],
    dimensions: [],
    execution_mapping: [],
    events: []
  };

  const allChoices = [...choices, MANUAL_CHOICE];
  const selected = allChoices.find(w => w.id === card.weapon);
  const isManual = card.weapon === 'MANUAL';
  const instrumentKind: 'CONTRACT' | 'UNDERLYING' = String(card.instrumentKind || 'UNDERLYING') === 'CONTRACT' ? 'CONTRACT' : 'UNDERLYING';
  const isContractInstrument = instrumentKind === 'CONTRACT';
  const instrumentLabel = isContractInstrument ? 'CONTRACT' : 'ASSET';
  const isUnderlyingInstrument = instrumentKind === 'UNDERLYING';
  const fullAsset = isContractInstrument
    ? ([assetPrefix, card.assetSuffix].filter(Boolean).join(' ') || '—')
    : (card.underlyingAsset || assetPrefix || '—');
  const weaponSelections = ((card as any).weaponSelections || {}) as Record<string, string>;
  const selectableDimensions = selected?.dimensions?.filter((d: any) => ((d.outputs || d.options || []) as string[]).length > 0) || [];
  const selectableEvents = selected?.events?.filter((e: any) => ((e.outputs || e.options || []) as string[]).length > 0) || [];
  const selectedDimensionCount = selectableDimensions.filter((d: any) => weaponSelections[d.id]).length;
  const selectedEventCount = selectableEvents.filter((e: any) => weaponSelections[e.id]).length;
  const setWeaponSelection = (id: string, value: string, active: boolean) => {
    const next = { ...weaponSelections };
    if (active) delete next[id]; else next[id] = value;
    onChange({ weaponSelections: next });
  };

  const readinessSelected = selectedDimensionCount + selectedEventCount;
  const readinessTotal = selectableDimensions.length + selectableEvents.length;
  const readinessScore = readinessTotal > 0 ? Math.round((readinessSelected / readinessTotal) * 100) : 0;
  const readinessStatus = `${readinessSelected}/${readinessTotal} marked`;
  const readinessColor = readinessScore >= 85 ? '#d8efe2' : readinessScore >= 70 ? '#9fc7aa' : readinessScore >= 40 ? '#c5aa76' : '#c58a8a';

  // Select first weapon by default if none is set
  useEffect(() => {
    if (!card.weapon && choices.length > 0) {
      onChange({ weapon: choices[0].id });
    }
  }, [card.weapon, choices, onChange]);

  // Maya's prediction
  const wp       = (card.weaponPrediction || {}) as WeaponPrediction;
  const aiPick   = (wp.weapon || wp.name || '') as string;
  const aiNarrative = stepText(wp.analysis || wp.raw_model_response || wp.raw || wp.plan || wp.reasoning || '');
  const hasPred  = !!(wp.name || wp.weapon || aiNarrative);
  const canApplyAiPick = !!aiPick && !['WAIT_FOR_MODEL_CLARITY', 'WAIT', 'STAND_ASIDE', 'ENTER', 'UNCLEAR'].includes(aiPick.toUpperCase());
  const trace    = (wp.agent_trace as Array<{ agent: string; content: unknown }> | undefined) || [];

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
      const m = allChoices.find(w =>
        w.id.toLowerCase() === aiPick.toLowerCase() ||
        w.displayName.toLowerCase() === aiPick.toLowerCase() ||
        w.originalName.toLowerCase() === aiPick.toLowerCase()
      );
      onChange({ weapon: m ? m.id : aiPick });
    }
  };

  const buildWeaponTransitionTree = (tId: string, depth = 1, seen = new Set<string>()): TransitionBranch[] => {
    if (depth <= 0 || seen.has(tId)) return [];
    seen.add(tId);

    const item = choices.find(c => c.id === tId);
    if (!item) {
      const isMaster = tId.startsWith('NS-') && !tId.includes('-CS');
      return [{
        target_state: tId,
        target_name: isMaster ? (tId === 'NS-01' ? 'No Engagement' : tId === 'NS-02' ? 'Saturation' : tId === 'NS-03' ? 'Strike' : tId === 'NS-04' ? 'Interception' : tId) : tId,
        target_command: isMaster ? (tId === 'NS-01' ? 'NO_ENGAGEMENT' : tId === 'NS-02' ? 'SATURATION' : tId === 'NS-03' ? 'STRIKE' : tId === 'NS-04' ? 'INTERCEPTION' : null) : type,
        target_posture: isMaster ? (tId === 'NS-01' ? 'STAND_DOWN' : 'ENGAGE') : 'ENGAGE',
        children: []
      }];
    }

    const transitions = item.transitions || [];
    return transitions.map((nextId: string) => {
      const nextCs = choices.find(c => c.id === nextId);
      const isNextMaster = nextId.startsWith('NS-') && !nextId.includes('-CS');
      return {
        target_state: nextId,
        target_name: WEAPON_NAME_MAP[nextId] || (isNextMaster ? (nextId === 'NS-01' ? 'No Engagement' : nextId === 'NS-02' ? 'Saturation' : nextId === 'NS-03' ? 'Strike' : nextId === 'NS-04' ? 'Interception' : nextId) : nextId),
        target_command: isNextMaster ? (nextId === 'NS-01' ? 'NO_ENGAGEMENT' : nextId === 'NS-02' ? 'SATURATION' : nextId === 'NS-03' ? 'STRIKE' : nextId === 'NS-04' ? 'INTERCEPTION' : null) : type,
        target_posture: isNextMaster ? (nextId === 'NS-01' ? 'STAND_DOWN' : 'ENGAGE') : 'ENGAGE',
        children: buildWeaponTransitionTree(nextId, depth - 1, new Set(seen))
      };
    });
  };

  const weaponStateProps: RecognizedState = selected ? {
    state_id: selected.displayName,
    state_name: selected.originalName,
    mode: 'Weapon Path',
    command: type,
    posture: 'ENGAGE',
    meaning: selected.description,
  } : {};

  const weaponTransitions: TransitionBranch[] = selected ? selected.transitions.map((tId: string) => {
    const isMaster = tId.startsWith('NS-') && !tId.includes('-CS');
    return {
      target_state: tId,
      target_name: WEAPON_NAME_MAP[tId] || (isMaster ? (tId === 'NS-01' ? 'No Engagement' : tId === 'NS-02' ? 'Saturation' : tId === 'NS-03' ? 'Strike' : tId === 'NS-04' ? 'Interception' : tId) : tId),
      target_command: isMaster ? (tId === 'NS-01' ? 'NO_ENGAGEMENT' : tId === 'NS-02' ? 'SATURATION' : tId === 'NS-03' ? 'STRIKE' : tId === 'NS-04' ? 'INTERCEPTION' : null) : type,
      target_posture: isMaster ? (tId === 'NS-01' ? 'STAND_DOWN' : 'ENGAGE') : 'ENGAGE',
      children: buildWeaponTransitionTree(tId, 1, new Set([selected.id]))
    };
  }) : [];

  // ── Database Save Payload ──
  const isBuy   = card.side === 'BUY';
  const accent  = isBuy ? MATTE.buy : MATTE.sell;
  const statsCard = card.entryLocked
    ? card
    : {
        ...card,
        entry: '',
        sl: '',
        qty: '65',
        cost: '10',
        underlyingEntry: '',
        underlyingExit: '',
        exitPrice: '',
        addEntries: [],
        partialExits: [],
        closed: false,
      };
  const stats   = computeCardStats(statsCard);
  const closedReadOnly = Boolean(card.closed && !closedEditMode);
  const tradeEditLocked = isLocked || closedReadOnly;
  const paperBg = closedReadOnly
    ? 'linear-gradient(135deg, rgba(78,84,92,0.18), rgba(13,17,22,0.94))'
    : `linear-gradient(135deg, ${MATTE.phase3Ledger}, rgba(13,17,22,0.94))`;
  const paperRowBg = closedReadOnly ? 'rgba(244,246,248,0.055)' : MATTE.phase3Identity;
  const entryRowLocked = tradeEditLocked || (Boolean(card.entryLocked) && !closedEditMode);
  const executionMode = card.executionMode || 'LIVE';
  const calculationEnabled = Boolean(card.entryLocked);
  const underlyingAsset = card.underlyingAsset || assetPrefix;
  const underlyingEntry = calculationEnabled
    ? parseFloat(isUnderlyingInstrument ? statsCard.entry : statsCard.underlyingEntry || '')
    : 0;
  const underlyingExit = calculationEnabled
    ? parseFloat(isUnderlyingInstrument ? statsCard.exitPrice : statsCard.underlyingExit || '')
    : 0;
  const underlyingMove = Number.isFinite(underlyingEntry) && Number.isFinite(underlyingExit) && underlyingEntry > 0 && underlyingExit > 0
    ? underlyingExit - underlyingEntry
    : null;
  const underlyingMovePct = underlyingMove !== null && underlyingEntry > 0 ? (underlyingMove / underlyingEntry) * 100 : null;
  const analysisEntryPrice = calculationEnabled ? (isContractInstrument ? underlyingEntry : stats.wPrice) : 0;
  const analysisStopPrice = calculationEnabled ? (isContractInstrument ? (parseFloat(statsCard.sl) || 0) : stats.latestSl) : 0;
  const analysisStopDist = analysisEntryPrice > 0 && analysisStopPrice > 0 ? Math.abs(analysisEntryPrice - analysisStopPrice) : 0;
  const primaryEntryStarted = Boolean(
    card.entryLocked ||
    card.entry ||
    card.sl ||
    card.entryTime ||
    card.qty !== '65' ||
    card.cost !== '10' ||
    (isContractInstrument && (card.underlyingEntry || card.assetSuffix))
  );
  const showPrimaryEntryRow = primaryEntryStarted || addingPos;
  const showAdditionalEntryDraft = addingPos && primaryEntryStarted;
  const hasNoOpenQuantity = calculationEnabled && stats.entryQty > 0 && stats.remainingQty <= 0;
  const hasCompleteExitData = Boolean(card.exitPrice && (!isContractInstrument || card.underlyingExit));
  const canCloseTrade = Boolean(calculationEnabled && stats.entryQty > 0 && (hasNoOpenQuantity || hasCompleteExitData));
  const canCommitTrade = Boolean(card.closed);

	  const buildPayload = (overrides: Partial<TradeCard> = {}) => {
	    const c = { ...card, ...overrides };
	    const cStats = computeCardStats(c);
	    const payloadInstrumentKind: 'CONTRACT' | 'UNDERLYING' = String(c.instrumentKind || 'UNDERLYING') === 'CONTRACT' ? 'CONTRACT' : 'UNDERLYING';
    const executionInstrument = payloadInstrumentKind === 'CONTRACT'
      ? ([assetPrefix, c.assetSuffix].filter(Boolean).join(' ') || undefined)
      : (c.underlyingAsset || assetPrefix || undefined);
    const holdMinutes = holdingMinutes(c.date, c.entryTime, c.exitDate, c.exitTime);
    const firstAddMinutes = firstActionMinutesFromEntry(c.date, c.entryTime, c.addEntries);
    const firstPartialExitMinutes = firstActionMinutesFromEntry(c.date, c.entryTime, c.partialExits);
    const primaryEntryTimestamp = tradeTimestamp(c.date, c.entryTime);
    const completeExitTimestamp = tradeTimestamp(c.exitDate, c.exitTime);
    const totalInvestment = cStats.wPrice > 0 && cStats.entryQty > 0
      ? cStats.wPrice * cStats.entryQty
      : 0;
    const teamId = session?.allowedTeams?.[0] || 'default';
    const pathDimensions =
      c.weaponSelections ||
      (type === 'STRIKE' ? strikeSelections : type === 'SATURATION' ? saturationSelections : interSelections);
    return {
      username,
      model_id: selectedModel || 'pinaka',
      terminal_session_id: terminalSessionId || undefined,
      metadata:        buildTradeMetadata(username, selectedModel || 'pinaka', teamId),
      phase_9: {
        trade_1: buildPhase9TradeBlock({
          weaponId: c.weapon || selectedWeaponId || undefined,
          selectedDimensions: pathDimensions || {},
          thought: c.weaponThought || undefined,
          strategy: c.weaponNote || undefined,
          prediction: c.weaponPrediction || undefined,
          mode: c.executionMode || 'LIVE',
          assetClass: 'Index',
          instrumentType: payloadInstrumentKind,
          thesisAsset: c.underlyingAsset || assetPrefix || undefined,
          executionInstrument,
          side: c.side,
          entry: {
            date: c.date,
            time: c.entryTime || undefined,
            price: c.entry || undefined,
            stop_loss: c.sl || undefined,
            quantity: c.qty || undefined,
            additional_cost: c.cost || undefined,
          },
          targets: { t1: c.t1 || undefined, t2: c.t2 || undefined, t3: c.t3 || undefined, t4: c.t4 || undefined },
          managementActions: {
            breakeven_triggered: c.beTriggered,
            add_entries: c.addEntries,
            partial_exits: c.partialExits,
          },
          exit: {
            date: c.exitDate || undefined,
            time: c.exitTime || undefined,
            price: c.exitPrice || undefined,
            type: c.exitType || undefined,
            status: c.tradeStatus || undefined,
            closed: c.closed,
          },
          temporal: {
            primary_entry_at: primaryEntryTimestamp,
            additional_entry_times: c.addEntries
              .map(entry => tradeTimestamp(entry.date || c.date, entry.time))
              .filter(Boolean),
            partial_exit_times: c.partialExits
              .map(exit => tradeTimestamp(exit.date || c.date, exit.time))
              .filter(Boolean),
            complete_exit_at: completeExitTimestamp,
            holding_time_minutes: holdMinutes,
            time_to_first_add_minutes: firstAddMinutes,
            time_to_first_partial_exit_minutes: firstPartialExitMinutes,
            time_to_complete_exit_minutes: holdMinutes,
          },
	          stats: {
	            status: c.closed ? 'committed' : 'pending_until_commit',
	            pnl: cStats.finalPnL,
	            gross_pnl: cStats.grossPnL,
	            brokerage: cStats.brokerage,
	            risk_amount: cStats.riskAmount,
	            r_multiple: cStats.rMultiple,
	            weighted_avg_price: cStats.wPrice,
	            average_sl: cStats.avgSl,
	            average_asset_entry_price: cStats.avgAssetEntry,
	            entry_quantity: cStats.entryQty,
	            remaining_quantity: cStats.remainingQty,
	            total_investment: totalInvestment,
	            realized_points: cStats.realizedPoints,
	            breakeven: cStats.be,
	            taken_profit: cStats.partialPnL,
	            holding_duration_minutes: holdMinutes,
	            time_to_first_add_minutes: firstAddMinutes,
	            time_to_first_partial_exit_minutes: firstPartialExitMinutes,
	            time_to_complete_exit_minutes: holdMinutes,
	          },
          notes: { user: c.notes || undefined },
        }),
      },
      asset:           executionInstrument,
      side:            c.side,
      netra_command:   type,
      execution_mode:  c.executionMode || 'LIVE',
      instrument_kind: payloadInstrumentKind,
      underlying_asset: c.underlyingAsset || assetPrefix || undefined,
      underlying_entry_price: payloadInstrumentKind !== 'CONTRACT' ? c.entry || undefined : c.underlyingEntry || undefined,
      underlying_exit_price: payloadInstrumentKind !== 'CONTRACT' ? c.exitPrice || undefined : c.underlyingExit || undefined,
      weapon:          c.weapon         || undefined,
      weapon_selections: c.weaponSelections || undefined,
      weapon_thought:  c.weaponThought  || undefined,
      weapon_strategy: c.weaponNote     || undefined,
      entry_price:     c.entry         || undefined,
      stop_loss:       c.sl            || undefined,
      quantity:        c.qty           || undefined,
      additional_cost: c.cost          || undefined,
      t1: c.t1 || undefined, t2: c.t2 || undefined,
      t3: c.t3 || undefined, t4: c.t4 || undefined,
      exit_price:            c.exitPrice     || undefined,
      notes:                 c.notes         || undefined,
      entry_time:            c.entryTime     || undefined,
      exit_date:             c.exitDate      || undefined,
      exit_time:             c.exitTime      || undefined,
      be_triggered:          c.beTriggered,
      date:                  c.date,
      closed:                c.closed,
      trade_status:          c.tradeStatus   || undefined,
      exit_type:             c.exitType      || undefined,
      holding_time_minutes:  holdMinutes,
      add_entries:           c.addEntries,
      partial_exits:         c.partialExits,
      path_context: {
        phase2: { selections: selections.preSessionContext || {}, note: notes.preSessionContext || null },
        phase3: { selections: selections.htfStructure || {}, note: notes.htfStructure || null },
        phase4: {
          marketPulse: selections.marketPulse || {},
          liquidityContext: selections.liquidityContext || {},
          marketPulse_note: notes.marketPulse || null,
          liquidityContext_note: notes.liquidityContext || null,
        },
        phase5: netraOutput || null,
        phase6: { command: type, recommendation: sysRecommendation || null },
        phase8: { weapon_id: c.weapon || selectedWeaponId || undefined, dimensions: pathDimensions || {} },
      },
    };
  };

  const saveToDb = async (overrides: Partial<TradeCard> = {}): Promise<string | null> => {
    setSaving(true);
    try {
      const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
      let savedId = card.dbId;
      const createTrade = async (): Promise<string | null> => {
        const res = await fetch(`${API_BASE}/api/terminal-trade`, {
          method: 'POST',
          headers,
          body: JSON.stringify(buildPayload(overrides)),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.detail || `HTTP ${res.status}`);
        }
        const data = await res.json();
        if (data?.id) {
          onChange({ dbId: data.id });
          return data.id;
        }
        return null;
      };

      if (card.dbId) {
        const res = await fetch(`${API_BASE}/api/terminal-trade/${encodeURIComponent(card.dbId)}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(buildPayload(overrides)),
        });
        if (res.status === 404) {
          savedId = await createTrade();
        } else if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.detail || `HTTP ${res.status}`);
        }
      } else {
        savedId = await createTrade();
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      return savedId;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Save failed';
      setSaveError(msg);
      setTimeout(() => setSaveError(''), 3000);
      return null;
    } finally {
      setSaving(false);
    }
  };
  saveToDbRef.current = () => saveToDb();

  const commitToLearning = async (overrides: Partial<TradeCard> = {}) => {
    setCommitting(true);
    try {
      const savedId = await saveToDb(overrides);
      if (!savedId) throw new Error('Save before commit failed');
      const res = await fetch(`${API_BASE}/api/learning/commit-trade/${encodeURIComponent(savedId)}`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.detail || `HTTP ${res.status}`);
      }
      const data = await res.json().catch(() => ({}));
      const learningId =
        data?.learning_episodes?.episodes?.[0]?.learning_id ||
        data?.learning_episodes?.episodes?.[0]?.episode_id ||
        null;
      if (learningId) onChange({ learningId });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Commit failed';
      setSaveError(msg);
      setTimeout(() => setSaveError(''), 3000);
    } finally {
      setCommitting(false);
    }
  };

	  const handleAddPos = () => {
    const price = parseFloat(newAdd.price) || 0;
    const qty   = parseFloat(newAdd.qty)   || 0;
    if (!price || !qty) {
      setActionHint('Enter add price and quantity before logging the position.');
      setTimeout(() => setActionHint(''), 2500);
      return;
    }
    const date = newAdd.date || localDateStr();
    const time = newAdd.time || autoTimeSeconds();
    onChange({ addEntries: [...card.addEntries, { id: Date.now(), price, stop: parseFloat(newAdd.stop) || 0, qty, cost: parseFloat(newAdd.cost) || 0, date, time, assetEntry: newAdd.assetEntry, assetStop: newAdd.assetStop }] });
    setNewAdd({ price: '', stop: '', qty: '65', cost: '10', date: '', time: '', assetEntry: '', assetStop: '' });
    setAddingPos(false);
    setActionHint('Position added.');
	    setTimeout(() => setActionHint(''), 1800);
	  };

	  const updateAddEntry = (id: number, updates: Partial<{ price: number; stop: number; qty: number; cost: number; date?: string; time: string; assetEntry: string; assetStop: string }>) => {
	    onChange({ addEntries: card.addEntries.map(entry => entry.id === id ? { ...entry, ...updates } : entry) });
	  };

	  const removeAddEntry = (id: number) => {
	    onChange({ addEntries: card.addEntries.filter(entry => entry.id !== id) });
	    setEditingAddIds(ids => ids.filter(x => x !== id));
	  };

	  const handleSubtract = () => {
	    const qty   = parseFloat(newPartial.qty)   || 0;
	    const price = parseFloat(newPartial.price) || 0;
	    if (!qty || !price) {
	      setActionHint('Enter exit quantity and price before booking profit.');
	      setTimeout(() => setActionHint(''), 2500);
	      return;
	    }
	    const date = newPartial.date || localDateStr();
	    const time = newPartial.time || autoTimeSeconds();
	    onChange({ partialExits: [...card.partialExits, { id: Date.now(), qty, price, date, time, assetExit: newPartial.assetExit, exitType: newPartial.exitType || 'Partial Exit' }] });
	    setNewPartial({ qty: '', price: '', date: '', time: '', assetExit: '', exitType: 'Partial Exit' });
	    setSubtractPos(false);
	    setActionHint('Profit booked.');
	    setTimeout(() => setActionHint(''), 1800);
	  };

	  const updatePartialExit = (id: number, updates: Partial<{ qty: number; price: number; date?: string; time: string; assetExit: string; exitType: string }>) => {
	    onChange({ partialExits: card.partialExits.map(exit => exit.id === id ? { ...exit, ...updates } : exit) });
	  };

	  const removePartialExit = (id: number) => {
	    onChange({ partialExits: card.partialExits.filter(exit => exit.id !== id) });
	    setEditingPartialIds(ids => ids.filter(x => x !== id));
	  };

	  const resetPrimaryExecution = () => {
	    setAddingPos(false);
	    setSubtractPos(false);
	    setCompleteExitOpen(false);
	    setEditingAddIds([]);
	    setEditingPartialIds([]);
	    setClosedEditMode(false);
	    onChange({
	      entry: '',
	      qty: '65',
	      sl: '',
	      slManual: false,
	      cost: '10',
	      underlyingEntry: '',
	      underlyingExit: '',
	      entryTime: '',
	      exitPrice: '',
	      exitDate: '',
	      exitTime: '',
	      exitType: '',
	      closed: false,
	      tradeStatus: '',
	      entryLocked: false,
	      addEntries: [],
	      partialExits: [],
	      t1: '',
	      t2: '',
	      t3: '',
	      t4: '',
	    });
	  };

  const handleDeleteCard = async () => {
    if (deletingCard || isLocked) return;
    setDeletingCard(true);

    try {
      // A saved card is its own terminal-trade record. Removing it only from
      // localStorage leaves that record (and its statistics) behind.
      if (card.dbId) {
        const response = await fetch(`${API_BASE}/api/logs/${encodeURIComponent(card.dbId)}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error(`Trade delete failed (${response.status})`);
      }
      onRemove();
    } catch {
      setSaveError('Could not delete this trade. Please try again.');
      setDeletingCard(false);
    }
  };

  const handleConfigChange = (key: string, val: number) => {
    if (isLocked) return;
    setModelConfig({
      ...modelConfig,
      [key]: val
    });
  };

  const catHeaderStyle = (title: string): CSSProperties => ({
    position: 'relative',
    fontFamily: MONO,
    fontSize: '10px',
    fontWeight: 950,
    letterSpacing: '0.18em',
    color: MATTE.inkSoft,
    textTransform: 'uppercase',
    padding: '18px 0 9px',
    background: 'transparent',
    borderLeft: 'none',
    borderTop: 'none',
    marginBottom: '0',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    borderRadius: '0px'
  });

	  const dossierSectionStyle: CSSProperties = {
	    position: 'relative',
	    margin: '0 18px 14px',
	    padding: '0',
	    display: 'flex',
	    flexDirection: 'column',
	  };

	  const dossierNodeStyle: CSSProperties = {
	    position: 'absolute',
	    left: '-5px',
	    top: '21px',
	    width: '9px',
	    height: '9px',
	    background: MATTE.shell,
	    border: `1px solid ${MATTE.accent}`,
	    boxShadow: `0 0 0 3px ${MATTE.shell}, 0 0 14px rgba(244,246,248,0.12)`,
	  };

	  const dossierPanelStyle: CSSProperties = {
	    border: 'none',
	    background: 'transparent',
	    boxShadow: 'none',
	  };

	  const DossierNode = () => null;

	  const lbl = (): CSSProperties => ({
	    fontFamily: MONO, fontSize: '9px', fontWeight: 700, letterSpacing: '0.15em',
	    textTransform: 'uppercase', marginBottom: '5px', color: MATTE.ink,
	  });

	  const ledgerGrid = 'minmax(180px, 1.15fr) repeat(4, minmax(112px, 0.75fr)) minmax(300px, 1.35fr) 76px';
	  const ledgerLineStyle: CSSProperties = {
	    borderTop: `1px solid rgba(244,246,248,0.075)`,
	    background: 'rgba(12,18,24,0.58)',
	    marginTop: '8px',
	    padding: '8px 12px',
	    display: 'grid',
	    gridTemplateColumns: ledgerGrid,
	    gap: '12px',
	    alignItems: 'end',
	  };
	  const entryRowBg = 'rgba(74, 96, 82, 0.14)';
	  const entryRowLockedBg = 'rgba(83, 112, 94, 0.18)';
	  const entryRowBorder = 'rgba(159, 184, 168, 0.24)';
	  const exitRowBg = 'rgba(96, 69, 69, 0.14)';
	  const exitRowLockedBg = 'rgba(112, 76, 76, 0.18)';
	  const exitRowBorder = 'rgba(195, 154, 150, 0.24)';
	  const miniLabel = ledgerMiniLabel;
	  const exitPreview = (priceValue: string | number, qtyValue: string | number) => {
	    const price = parseFloat(String(priceValue)) || 0;
	    const qty = parseFloat(String(qtyValue)) || 0;
	    if (!price || !qty || !stats.wPrice) return '—';
	    return fmtMoney((stats.isShort ? stats.wPrice - price : price - stats.wPrice) * qty);
	  };

	  const holdMins = holdingMinutes(card.date, card.entryTime, card.exitDate, card.exitTime);
	  const firstAddMins = firstActionMinutesFromEntry(card.date, card.entryTime, card.addEntries);
	  const firstPartialExitMins = firstActionMinutesFromEntry(card.date, card.entryTime, card.partialExits);
	  const entryAt = card.entryTime ? `${card.date || localDateStr()} ${card.entryTime}` : '—';
	  const firstAddAt = card.addEntries.find(entry => entry.time);
	  const firstPartialExitAt = card.partialExits.find(exit => exit.time);
	  const completeExitAt = card.exitTime ? `${card.exitDate || card.date || localDateStr()} ${card.exitTime}` : '—';
	  const totalInvestment = stats.wPrice > 0 && stats.entryQty > 0
	    ? stats.wPrice * stats.entryQty
	    : 0;
  const netColor = stats.finalPnL === null ? MATTE.muted : stats.finalPnL >= 0 ? MATTE.success : MATTE.danger;
  const grossColor = stats.grossPnL === null ? MATTE.muted : stats.grossPnL >= 0 ? MATTE.success : MATTE.danger;
  const rColor = stats.rMultiple === null ? MATTE.muted : stats.rMultiple >= 0 ? MATTE.success : MATTE.danger;
	  const ledgerActions = [
	    {
	      key: 'plus',
	      label: '+',
	      title: primaryEntryStarted ? 'Add Position' : 'Log Entry',
	      active: addingPos,
	      color: '#8eb59a',
	      onClick: () => {
	        const opening = !addingPos;
	        setAddingPos(opening);
	        setSubtractPos(false);
	        setCompleteExitOpen(false);
	        if (opening && primaryEntryStarted) {
	          setActionHint('');
	          setNewAdd(p => ({
	            ...p,
	            price: p.price || card.entry || '',
	            stop: p.stop || card.sl || '',
	            qty: p.qty || card.qty || '65',
	            cost: p.cost || card.cost || '10',
	            assetEntry: p.assetEntry || card.underlyingEntry || '',
	            assetStop: p.assetStop || card.sl || '',
	          }));
	        }
	      },
	    },
	    {
	      key: 'minus',
	      label: '-',
	      title: 'Partial Exit',
	      active: subtractPos,
	      color: '#c2a15f',
	      onClick: () => {
	        const opening = !subtractPos;
	        setSubtractPos(opening);
	        setAddingPos(false);
	        setCompleteExitOpen(false);
	        if (opening) setNewPartial(p => ({ ...p, qty: p.qty || String(stats.remainingQty || ''), exitType: p.exitType || 'Partial Exit', assetExit: p.assetExit || card.underlyingExit || '' }));
	      },
	    },
	    {
	      key: 'exit',
	      label: 'X',
	      title: card.closed && card.exitPrice ? `Exit @ ${card.exitPrice}` : 'Complete Exit',
	      active: completeExitOpen || card.closed,
	      color: '#c78383',
	      onClick: () => {
	        setCompleteExitOpen(!completeExitOpen);
	        setAddingPos(false);
	        setSubtractPos(false);
	        if (!card.exitType) onChange({ exitType: 'Complete Exit' });
	      },
	    },
	  ];

  // ── Unified Vertical Layout ──
  return (
    <div className="unified-trade-card" style={{
      position: 'relative',
      border: `1px solid rgba(244,246,248,0.16)`,
      background: `linear-gradient(180deg, ${MATTE.paper2} 0%, ${MATTE.paper} 42%, ${MATTE.shell} 100%)`,
      boxShadow: '0 18px 46px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.03)',
      borderRadius: '0px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      gap: '0',
      paddingBottom: '16px'
    }}>
      {deletingCard && (
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 80,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(8,11,15,0.82)',
          backdropFilter: 'blur(6px)',
          border: '1px solid rgba(244,246,248,0.16)',
        }}>
          <LuxuryShapeSpinner compact label="Deleting Trade" />
        </div>
      )}

      {/* ── Unified Top Control Header ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        borderBottom: `1px solid rgba(244,246,248,0.10)`,
        background: 'rgba(244,246,248,0.035)'
      }}>
        <span style={{ fontFamily: MONO, fontSize: '12px', fontWeight: 900, color: tacticalAccent, letterSpacing: '0.2em' }}>T{tradeIndex + 1}</span>
        <div style={{ width: '1px', height: '14px', background: MATTE.lineStrong }} />
        <span style={{ fontFamily: MONO, fontSize: '10px', fontWeight: 700, color: MATTE.muted, letterSpacing: '0.06em' }}>{card.dbId || 'DRAFT'}</span>
        
        {/* Remove Card button */}
        {canRemove && !isLocked && (
          <button
            onClick={handleDeleteCard}
            disabled={deletingCard}
            style={{ background: 'none', border: 'none', cursor: deletingCard ? 'wait' : 'pointer', color: MATTE.danger, fontSize: '18px', padding: '0 4px', marginLeft: 'auto', outline: 'none', opacity: deletingCard ? 0.5 : 1 }}
            title={deletingCard ? 'Deleting trade...' : 'Delete this Trade Card'}
          >
            {deletingCard ? '…' : '✕'}
          </button>
        )}
      </div>

      {/* ── PHASE 1: MAYA SUGGESTION ── */}
      <div style={dossierSectionStyle}>
        <DossierNode />
        <div style={catHeaderStyle('Phase - 1 MAYA Suggestion')}>Phase - 1 MAYA Suggestion</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 7fr) minmax(320px, 5fr)', gap: '18px', alignItems: 'stretch', height: '520px', minHeight: 0 }}>
          <div style={{ ...dossierPanelStyle, background: `linear-gradient(135deg, ${MATTE.phase1Left}, rgba(13,17,22,0.86))`, border: `1px solid ${MATTE.lineStrong}`, height: '520px', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{
              borderLeft: 'none',
              background: 'transparent',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              flex: 1,
              minHeight: 0,
              overflowY: 'auto'
            }}>
                  {predicting ? (
                    <div className="netra-ai-spinner-shell" style={{ minHeight: '320px' }}>
                      <LuxuryShapeSpinner compact className="netra-lux-inline" label="Weapon AI" />
                    </div>
                  ) : !hasPred ? (
                    <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', height: '100%', padding: '20px 0' }}>
                      <span style={{ fontFamily: MONO, fontSize: '10.5px', fontWeight: 800, color: MATTE.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Maya Answer Box</span>
                      <span style={{ fontFamily: MONO, fontSize: '9.5px', color: 'rgba(217,208,190,0.42)', textAlign: 'center', maxWidth: '280px' }}>Awaiting operator context. Click Execute to select an entry model.</span>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: MONO, fontSize: '13px', fontWeight: 900, color: MATTE.accent }}>{aiPick || 'MAYA RESPONSE'}</span>
                        <div style={{ flex: 1 }} />
                        {!isLocked && canApplyAiPick && (
                          <button onClick={applyPick} style={{ fontFamily: MONO, fontSize: '9px', fontWeight: 900, color: MATTE.shell, background: MATTE.accent, border: 'none', borderRadius: '0px', padding: '3px 8px', cursor: 'pointer' }}>
                            APPLY
                          </button>
                        )}
                      </div>
                      {aiNarrative && (
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                          <p style={{ fontFamily: MONO, fontSize: '12px', color: 'rgba(255,255,255,0.84)', lineHeight: 1.72, margin: 0, whiteSpace: 'pre-wrap' }}>{aiNarrative}</p>
                        </div>
                      )}
                      {wp.thinking && (
                        <div>
                          <button onClick={() => setThinkOpen(v => !v)} style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                            {thinkOpen ? '▾' : '▸'} Deep Reasoning Block
                          </button>
                          {thinkOpen && <p style={{ fontFamily: MONO, fontSize: '10.5px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, margin: '4px 0 0', whiteSpace: 'pre-wrap' }}>{wp.thinking}</p>}
                        </div>
                      )}
                      {trace.length > 0 && (
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '6px' }}>
                          <button onClick={() => setTraceOpen(v => !v)} style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                            {traceOpen ? '▾' : '▸'} Full Agent Trace ({trace.length})
                          </button>
                          {traceOpen && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                              {trace.map((s, i) => (
                                <div key={i} style={{ borderLeft: '1.5px solid rgba(255,255,255,0.1)', paddingLeft: '8px' }}>
                                  <div style={{ fontFamily: MONO, fontSize: '9px', fontWeight: 900, color: 'rgba(255,255,255,0.78)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.agent}</div>
                                  <p style={{ fontFamily: MONO, fontSize: '10.5px', color: 'rgba(255,255,255,0.62)', lineHeight: 1.6, margin: '4px 0 0', whiteSpace: 'pre-wrap' }}>{stepText(s.content)}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
            </div>
          </div>

          <div style={{ ...dossierPanelStyle, background: `linear-gradient(135deg, ${MATTE.phase1Right}, rgba(13,17,22,0.9))`, border: `1px solid ${MATTE.lineStrong}`, height: '520px', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: `1px solid rgba(244,246,248,0.08)`, display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
              <span style={{ fontFamily: MONO, fontSize: '13px', fontWeight: 900, letterSpacing: '0.3em', color: MATTE.ink, textTransform: 'uppercase' }}>MAYA</span>
              <div style={{ flex: 1, height: '1px', background: MATTE.line }} />
            </div>
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${MATTE.line}` }}>
                <div style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 700, letterSpacing: '0.2em', color: MATTE.inkSoft, textTransform: 'uppercase', marginBottom: '10px' }}>User Input</div>
                <textarea
                  value={card.weaponThought}
                  onChange={e => onChange({ weaponThought: e.target.value })}
                  placeholder="State your analysis or findings on the current chart setup..."
                  disabled={isLocked}
                  style={{
                    fontFamily: MONO, width: '100%', minHeight: '122px', fontSize: '11px',
                    color: MATTE.ink, background: MATTE.field,
                    border: `1px solid ${MATTE.lineStrong}`, padding: '10px 12px',
                    resize: 'vertical', lineHeight: 1.55, outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${MATTE.line}` }}>
                <div style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 700, letterSpacing: '0.2em', color: MATTE.inkSoft, textTransform: 'uppercase', marginBottom: '8px' }}>Model Selection</div>
                <select
                  value={selectedModel}
                  onChange={e => setSelectedModel(e.target.value)}
                  disabled={isLocked}
                  style={{
                    fontFamily: MONO, fontSize: '10px', fontWeight: 700, color: MATTE.ink,
                    background: 'transparent', border: 'none', borderBottom: `1px solid ${MATTE.lineStrong}`,
                    padding: '4px 0', outline: 'none', width: '100%', cursor: isLocked ? 'default' : 'pointer'
                  }}
                >
                  {(() => {
                    const allowedModels = session?.allowedModels || [];
                    let filtered = AVAILABLE_MODELS.filter(m => {
                      if (allowedModels.includes('*')) return true;
                      return allowedModels.some(am => m.id.toLowerCase().includes(am.toLowerCase()));
                    });
                    if (filtered.length === 0) {
                      filtered = AVAILABLE_MODELS;
                    }
                    return filtered.map(m => (
                      <option key={m.id} value={m.id} style={{ background: '#05070c', color: '#fff' }}>
                        {m.name}
                      </option>
                    ));
                  })()}
                </select>
              </div>

              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${MATTE.line}`, display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <SliderRow
                  label="Inference Temp"
                  value={modelConfig.temperature}
                  min={0}
                  max={1}
                  step={0.05}
                  pct={modelConfig.temperature * 100}
                  trackColor={tempColor(modelConfig.temperature)}
                  onChange={v => handleConfigChange('temperature', v)}
                />
                <SliderRow
                  label="Freq Penalty"
                  value={modelConfig.frequency_penalty || 0}
                  min={0}
                  max={2}
                  step={0.1}
                  pct={((modelConfig.frequency_penalty || 0) / 2) * 100}
                  trackColor={MATTE.accent}
                  onChange={v => handleConfigChange('frequency_penalty', v)}
                />
              </div>
            </div>

            <div style={{ padding: '12px 16px', borderTop: `1px solid ${MATTE.line}`, display: 'flex', gap: '8px', flexShrink: 0 }}>
                <button
                  onClick={() => stopWeaponPrediction()}
                  disabled={isLocked || !predicting}
                  style={{
                    flex: 1, height: '36px', fontFamily: MONO, fontSize: '9px', fontWeight: 900,
                    textTransform: 'uppercase', letterSpacing: '0.22em',
                    color: MATTE.ink, background: predicting ? 'rgba(200,143,135,0.14)' : MATTE.paper2,
                    border: predicting ? `1px solid ${MATTE.danger}` : `1px solid ${MATTE.lineStrong}`,
                    cursor: predicting && !isLocked ? 'pointer' : 'default',
                    outline: 'none', transition: 'all 120ms'
                  }}
                >
                  Abort
                </button>
                <button
                  onClick={() => askMaya()}
                  disabled={isLocked || predicting}
                  style={{
                    flex: 1, height: '36px', fontFamily: MONO, fontSize: '9px', fontWeight: 900,
                    textTransform: 'uppercase', letterSpacing: '0.22em',
                    color: MATTE.shell, background: MATTE.accent, border: 'none',
                    cursor: isLocked || predicting ? 'default' : 'pointer',
                    outline: 'none', transition: 'all 120ms'
                  }}
                >
                  {predicting ? 'Running…' : 'Execute'}
                </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── PHASE 2: WEAPON SELECTION & DOSSIER ── */}
      <div style={dossierSectionStyle}>
        <DossierNode />
        <div style={catHeaderStyle('Phase - 2 Weapon Selection & Dossier')}>Phase - 2 Weapon Selection & Dossier</div>
        <div style={{ ...dossierPanelStyle, background: MATTE.paper, padding: '0 0 4px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px', scrollbarWidth: 'thin' }}>
              {allChoices.map(w => {
                const active = card.weapon === w.id;
                const isRec = !!aiPick && (w.id === aiPick || w.displayName === aiPick || w.originalName === aiPick);
                return (
                  <button
                    key={w.id}
                    onClick={() => !isLocked && onChange({ weapon: w.id })}
                    title={`${w.displayName} (${w.originalName})`}
                    style={{
                      minWidth: '172px',
                      maxWidth: '172px',
                      minHeight: '46px',
                      flexShrink: 0,
                      cursor: isLocked ? 'default' : 'pointer',
                      background: active ? 'rgba(244,246,248,0.92)' : MATTE.paper2,
                      border: active ? `1px solid rgba(244,246,248,0.92)` : `1px solid ${MATTE.line}`,
                      padding: '7px 10px',
                      textAlign: 'left',
                      outline: 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                      {isRec && <span style={{ fontFamily: MONO, fontSize: '8.5px', fontWeight: 900, color: active ? MATTE.shell : MATTE.accent, letterSpacing: '0.1em', marginLeft: 'auto' }}>MAYA</span>}
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: '12.5px', fontWeight: 900, color: active ? MATTE.shell : MATTE.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.displayName}</div>
                    <div style={{ fontFamily: MONO, fontSize: '10px', color: active ? 'rgba(5,6,8,0.72)' : MATTE.inkSoft, marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.originalName}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {card.weapon && (
            isManual ? (
              <div style={{ border: `1px solid ${MATTE.lineStrong}`, borderLeft: `3px solid ${MATTE.exit}`, background: `linear-gradient(135deg, ${MATTE.accentSoft}, rgba(17,22,28,0.78))`, padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <div style={{ fontFamily: MONO, fontSize: '15px', fontWeight: 900, color: MATTE.exit }}>Operator Override</div>
                  <p style={{ fontFamily: MONO, fontSize: '11px', color: MATTE.inkSoft, lineHeight: 1.6, margin: '4px 0 0' }}>{MANUAL_CHOICE.description}</p>
                </div>
                <textarea
                  value={card.weaponNote}
                  onChange={e => onChange({ weaponNote: e.target.value })}
                  placeholder="Record custom setup, trigger, invalidation, and target logic..."
                  disabled={isLocked}
                  rows={5}
                  style={{ fontFamily: MONO, width: '100%', fontSize: '12px', color: MATTE.ink, background: MATTE.field, border: `1px solid ${MATTE.lineStrong}`, padding: '10px 12px', resize: 'vertical', lineHeight: 1.6, outline: 'none', borderRadius: '0px', boxSizing: 'border-box' }}
                />
              </div>
            ) : selected ? (
              <div style={{
                position: 'relative',
                display: 'grid',
                gridTemplateColumns: 'minmax(320px, 0.9fr) minmax(0, 1.1fr)',
                gap: '18px',
                alignItems: 'stretch',
                border: 'none',
                background: 'transparent',
              }}>
                <div style={{
                  gridColumn: '1',
                  gridRow: '1',
                  padding: '16px',
                  border: `1px solid ${MATTE.lineStrong}`,
                  height: '100%',
                  boxSizing: 'border-box',
                  background: `
                    repeating-linear-gradient(to bottom, transparent 0, transparent 63px, rgba(244,246,248,0.055) 64px),
                    linear-gradient(135deg, ${MATTE.phase2Left}, rgba(17,24,32,0.86))
                  `,
                }}>
                  {[
                    {
                      label: 'Identity',
                      color: MATTE.accent,
                      content: (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
                            <span style={{ fontFamily: MONO, fontSize: '20px', fontWeight: 900, color: MATTE.ink }}>{selected.displayName}</span>
                            <span style={{ fontFamily: MONO, fontSize: '10px', color: MATTE.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{selected.originalName} · {selected.id}</span>
                          </div>
                          {selected.description && <p style={{ fontFamily: MONO, fontSize: '12.5px', color: MATTE.inkSoft, lineHeight: 1.55, margin: '7px 0 0' }}>{selected.description}</p>}
                        </div>
                      )
                    },
                    { label: 'Entry', color: MATTE.buy, rows: selected.entry_logic },
                    { label: 'Protection', color: MATTE.sell, rows: selected.stop_logic },
                    { label: 'Target', color: MATTE.blueGrey, rows: selected.target_logic },
                    { label: 'Failure', color: MATTE.exit, rows: selected.failure_conditions },
                  ].map((row, idx) => (
                    <div key={row.label} style={{
                      display: 'grid',
                      gridTemplateColumns: '132px minmax(0, 1fr)',
                      gap: '14px',
                      minHeight: idx === 0 ? '96px' : '64px',
                      padding: idx === 0 ? '0 0 12px' : '9px 0',
                      alignItems: 'start'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minHeight: '20px' }}>
                        <span style={{ fontFamily: MONO, fontSize: '10px', fontWeight: 900, color: row.color, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{row.label}</span>
                      </div>
                      <div>
                        {'content' in row ? row.content : (
                          row.rows.length > 0 ? (
                            <ul style={{ margin: 0, paddingLeft: '14px', listStyleType: 'square' }}>
                              {row.rows.slice(0, 4).map((line: string, lineIdx: number) => (
                                <li key={lineIdx} style={{ fontFamily: MONO, fontSize: '12px', color: MATTE.inkSoft, lineHeight: 1.55, marginBottom: '4px' }}>{line}</li>
                              ))}
                              {row.rows.length > 4 && (
                                <li style={{ fontFamily: MONO, fontSize: '10.5px', color: MATTE.muted, lineHeight: 1.55 }}>+{row.rows.length - 4} more</li>
                              )}
                            </ul>
                          ) : <span style={{ fontFamily: MONO, fontSize: '10.5px', color: MATTE.muted }}>No rules defined</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {((selected.dimensions && selected.dimensions.length > 0) || (selected.events && selected.events.length > 0)) && (
                  <div style={{
                    gridColumn: '2',
                    gridRow: '1',
                    border: `1px solid ${MATTE.lineStrong}`,
                    padding: '16px',
                    height: '100%',
                    boxSizing: 'border-box',
                    background: `
                      repeating-linear-gradient(to bottom, transparent 0, transparent 63px, rgba(244,246,248,0.055) 64px),
                      linear-gradient(135deg, ${MATTE.phase2Right}, rgba(17,24,32,0.88))
                    `
                  }}>
                    {selected.dimensions && selected.dimensions.length > 0 && (
                      <>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '0 0 10px',
                        }}>
                          <span style={{ fontFamily: MONO, fontSize: '12px', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: MATTE.ink }}>Weapon Identification</span>
                          <span style={{ fontFamily: MONO, fontSize: '10px', fontWeight: 800, color: MATTE.muted }}>{selectedDimensionCount}/{selectableDimensions.length} marked</span>
                          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '82px', height: '4px', background: MATTE.field, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${readinessScore}%`, background: readinessColor, transition: 'width 180ms ease' }} />
                            </div>
                            <span style={{ fontFamily: MONO, fontSize: '10px', fontWeight: 950, color: readinessColor, letterSpacing: '0.08em' }}>{readinessScore}/100</span>
                          </div>
                        </div>
                        <div>
                        {selected.dimensions.map((d: any) => {
                          const curVal = weaponSelections[d.id] || '';
                          const options = d.outputs || d.options || [];
                          return (
                            <div key={d.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 0.36fr) minmax(0, 1fr)', gap: '16px', minHeight: '64px', padding: '9px 0', alignItems: 'center' }}>
                              <div>
                                <div style={{ fontFamily: MONO, fontSize: '13px', fontWeight: 900, color: MATTE.ink, lineHeight: 1.35 }}>{d.name}</div>
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {options.length > 0 ? options.map((opt: string) => {
                                  const active = curVal === opt;
                                  return (
                                    <button key={opt} disabled={isLocked} onClick={() => {
                                      setWeaponSelection(d.id, opt, active);
                                    }} style={{ minHeight: '34px', fontFamily: MONO, fontSize: '11px', fontWeight: active ? 900 : 750, padding: '7px 11px', background: active ? 'rgba(244,246,248,0.92)' : 'rgba(7,10,14,0.42)', border: active ? `1px solid rgba(244,246,248,0.92)` : `1px solid rgba(244,246,248,0.08)`, color: active ? MATTE.shell : MATTE.inkSoft, cursor: isLocked ? 'default' : 'pointer', borderRadius: '0px', outline: 'none', boxShadow: 'none' }}>{opt}</button>
                                  );
                                }) : <span style={{ fontFamily: MONO, fontSize: '10px', color: MATTE.muted }}>No operator input required</span>}
                              </div>
                            </div>
                          );
                        })}
                        </div>
                      </>
                    )}

                    {selected.events && selected.events.length > 0 && (
                      <>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: selected.dimensions && selected.dimensions.length > 0 ? '14px 0 10px' : '0 0 10px',
                          borderTop: selected.dimensions && selected.dimensions.length > 0 ? `1px solid rgba(244,246,248,0.075)` : 'none',
                        }}>
                          <span style={{ fontFamily: MONO, fontSize: '12px', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: MATTE.ink }}>Target Events</span>
                          <span style={{ fontFamily: MONO, fontSize: '10px', fontWeight: 800, color: MATTE.muted }}>{selectedEventCount}/{selectableEvents.length} marked</span>
                        </div>
                        <div>
                        {selected.events.map((e: any) => {
                          const curVal = weaponSelections[e.id] || '';
                          const options = e.outputs || e.options || [];
                          return (
                            <div key={e.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 0.36fr) minmax(0, 1fr)', gap: '16px', minHeight: '64px', padding: '9px 0', alignItems: 'center' }}>
                              <div>
                                <div style={{ fontFamily: MONO, fontSize: '13px', fontWeight: 900, color: MATTE.ink, lineHeight: 1.35 }}>{e.name}</div>
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {options.length > 0 ? options.map((opt: string) => {
                                  const active = curVal === opt;
                                  return (
                                    <button key={opt} disabled={isLocked} onClick={() => {
                                      setWeaponSelection(e.id, opt, active);
                                    }} style={{ minHeight: '34px', fontFamily: MONO, fontSize: '11px', fontWeight: active ? 900 : 750, padding: '7px 11px', background: active ? 'rgba(244,246,248,0.92)' : 'rgba(7,10,14,0.42)', border: active ? `1px solid rgba(244,246,248,0.92)` : `1px solid rgba(244,246,248,0.08)`, color: active ? MATTE.shell : MATTE.inkSoft, cursor: isLocked ? 'default' : 'pointer', borderRadius: '0px', outline: 'none', boxShadow: 'none' }}>{opt}</button>
                                  );
                                }) : <span style={{ fontFamily: MONO, fontSize: '10px', color: MATTE.muted }}>No operator input required</span>}
                              </div>
                            </div>
                          );
                        })}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ) : null
          )}
        </div>
      </div>

      {/* ── PHASE 3: EXECUTION RECORD & MANAGEMENT ── */}
      <div style={dossierSectionStyle}>
        <DossierNode />
        <div style={catHeaderStyle('Phase - 3 Fast Execution Ticket')}>Phase - 3 Fast Execution Ticket</div>
        
	        <div style={{ ...dossierPanelStyle, background: 'transparent', border: 'none', padding: '0', borderRadius: '0px', display: 'flex', flexDirection: 'column', gap: '0', boxShadow: 'none' }}>
          
	          {/* Row 1: Trade identity */}
		          <div style={{ order: 10, display: 'grid', gridTemplateColumns: 'minmax(220px, 1.1fr) minmax(150px, 0.75fr) minmax(180px, 0.9fr) minmax(140px, 0.7fr)', gap: '14px', borderBottom: 'none', background: 'transparent', padding: '12px', alignItems: 'stretch' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0, padding: '0', borderRight: 'none' }}>
              <span style={{ ...ledgerMiniLabel(), height: `${LEDGER_LABEL_H}px`, display: 'block', lineHeight: `${LEDGER_LABEL_H}px` }}>Asset Name</span>
              <input
                type="text"
                value={card.underlyingAsset || assetPrefix || ''}
                onChange={e => onChange({ underlyingAsset: e.target.value })}
                placeholder="NIFTY 50"
                disabled={tradeEditLocked}
                style={{ height: `${LEDGER_FIELD_H}px`, boxSizing: 'border-box', background: tradeEditLocked ? 'transparent' : MATTE.field, border: 'none', borderBottom: tradeEditLocked ? `1px solid ${MATTE.line}` : `2px solid ${MATTE.lineStrong}`, outline: 'none', fontFamily: MONO, color: MATTE.ink, fontSize: '13px', fontWeight: 900, padding: '7px 3px 6px', width: '100%', minWidth: 0 }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '0', borderRight: 'none' }}>
              <span style={{ ...ledgerMiniLabel(), height: `${LEDGER_LABEL_H}px`, display: 'block', lineHeight: `${LEDGER_LABEL_H}px` }}>Trading Mode</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                {(['LIVE', 'BACKTEST'] as const).map(mode => {
                  const active = executionMode === mode;
                  return (
                    <button
                      key={mode}
                      onClick={() => !tradeEditLocked && onChange({ executionMode: mode })}
                      disabled={tradeEditLocked}
                      style={{
                        height: `${LEDGER_FIELD_H}px`, boxSizing: 'border-box', border: 'none',
                        background: active ? MATTE.ink : 'rgba(7,10,14,0.48)',
                        color: active ? MATTE.shell : MATTE.inkSoft, fontFamily: MONO,
                        fontSize: '9px', fontWeight: 900, letterSpacing: '0.08em', cursor: tradeEditLocked ? 'default' : 'pointer',
                      }}
                    >
                      {mode}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '0', borderRight: 'none' }}>
              <span style={{ ...ledgerMiniLabel(), height: `${LEDGER_LABEL_H}px`, display: 'block', lineHeight: `${LEDGER_LABEL_H}px` }}>Instrument</span>
	              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
	                {(['UNDERLYING', 'CONTRACT'] as const).map(kind => {
	                  const active = instrumentKind === kind;
	                  const label = kind === 'CONTRACT' ? 'CONTRACT' : 'ASSET';
	                  return (
	                    <button
	                      key={kind}
	                      onClick={() => !tradeEditLocked && onChange({ instrumentKind: kind, ...(kind !== 'CONTRACT' ? { underlyingAsset: assetPrefix, assetSuffix: '', underlyingEntry: '', underlyingExit: '' } : {}) })}
                      disabled={tradeEditLocked}
                      style={{
                        height: `${LEDGER_FIELD_H}px`, boxSizing: 'border-box', border: 'none',
                        background: active ? MATTE.ink : 'rgba(7,10,14,0.48)',
                        color: active ? MATTE.shell : MATTE.inkSoft, fontFamily: MONO,
                        fontSize: '9px', fontWeight: 900, letterSpacing: '0.06em', cursor: tradeEditLocked ? 'default' : 'pointer',
                      }}
                    >
		                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '0' }}>
              <span style={{ ...ledgerMiniLabel(), height: `${LEDGER_LABEL_H}px`, display: 'block', lineHeight: `${LEDGER_LABEL_H}px` }}>Type</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                {(['BUY', 'SELL'] as const).map(side => {
                  const active = card.side === side;
                  return (
                    <button
                      key={side}
                      onClick={() => !tradeEditLocked && onChange({ side })}
                      disabled={tradeEditLocked}
                      style={{
                        height: `${LEDGER_FIELD_H}px`,
                        boxSizing: 'border-box',
                        border: 'none',
                        background: active ? (side === 'BUY' ? MATTE.buy : MATTE.sell) : 'rgba(7,10,14,0.48)',
                        color: active ? MATTE.shell : MATTE.inkSoft,
                        fontFamily: MONO,
                        fontSize: '9px',
                        fontWeight: 900,
                        letterSpacing: '0.08em',
                        cursor: tradeEditLocked ? 'default' : 'pointer',
                      }}
                    >
                      {side}
                    </button>
                  );
                })}
              </div>
            </div>

		          </div>
          {/* Execution ledger */}
	          <div style={{ order: 40, borderBottom: `1px solid rgba(244,246,248,0.075)`, background: 'transparent', padding: '0', display: 'flex', flexDirection: 'column', gap: '0' }}>
	            <div style={{
	              display: 'flex',
	              alignItems: 'center',
	              justifyContent: 'space-between',
	              gap: '12px',
	              padding: '8px 12px',
	              background: 'transparent',
	              borderBottom: `1px solid rgba(244,246,248,0.055)`,
	            }}>
	              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
	                <span style={{ width: '18px', height: '2px', background: accent, display: 'inline-block', opacity: 0.9 }} />
	                <span style={{ fontFamily: MONO, fontSize: '11px', fontWeight: 950, letterSpacing: '0.16em', color: MATTE.ink, textTransform: 'uppercase' }}>Execution Ledger</span>
	                <span style={{ fontFamily: MONO, fontSize: '10px', fontWeight: 850, color: MATTE.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
	                  {closedReadOnly ? 'Written record' : card.entryLocked ? 'Entry logged' : 'Entry awaiting confirmation'}
	                </span>
	              </div>
	              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
	                <span style={{ fontFamily: MONO, fontSize: '10px', fontWeight: 850, color: card.closed ? MATTE.sell : MATTE.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginRight: '4px' }}>
	                  {card.closed ? 'Closed' : stats.remainingQty > 0 ? `${stats.remainingQty} qty open` : 'No open qty'}
	                </span>
	                {ledgerActions.map(action => (
	                  <button
	                    key={action.key}
	                    title={action.title}
	                    onClick={() => !tradeEditLocked && action.onClick()}
	                    disabled={tradeEditLocked}
	                    style={{
	                      width: '24px',
	                      height: '24px',
	                      boxSizing: 'border-box',
	                      border: `1px solid ${action.color}`,
	                      borderBottom: action.active ? `2px solid ${MATTE.ink}` : `1px solid ${action.color}`,
	                      background: action.active ? action.color : `${action.color}22`,
	                      color: action.active ? MATTE.shell : action.color,
	                      fontFamily: MONO,
	                      fontSize: '11px',
	                      fontWeight: 950,
	                      cursor: tradeEditLocked ? 'default' : 'pointer',
	                      borderRadius: '999px',
	                      lineHeight: 1,
	                      opacity: tradeEditLocked ? 0.35 : 1,
	                      boxShadow: action.active ? `0 0 0 1px ${action.color}33 inset` : 'none',
	                    }}
	                  >
	                    {action.label}
	                  </button>
	                ))}
	              </div>
	            </div>
	            {showPrimaryEntryRow && (!isContractInstrument ? (
	              <div style={{ ...ledgerLineStyle, gridTemplateColumns: '80px repeat(4, minmax(80px, 0.8fr)) minmax(190px, 1.15fr) 40px 46px 46px', background: card.entryLocked ? entryRowLockedBg : entryRowBg, border: `1px solid ${entryRowBorder}` }}>
	                <LedgerDisplay label="Type" value="Entry" color={MATTE.accent} />
	                <LedgerNumber label="Price" value={card.entry} onValue={value => onChange({ entry: value })} disabled={entryRowLocked} />
	                <LedgerNumber label="Qty" value={card.qty} onValue={value => onChange({ qty: value })} disabled={entryRowLocked} placeholder="65" />
	                <LedgerNumber label="SL" value={card.sl} onValue={value => onChange({ sl: value, slManual: true })} disabled={entryRowLocked} color={MATTE.danger} />
	                <LedgerNumber label="Cost" value={card.cost} onValue={value => onChange({ cost: value })} disabled={entryRowLocked} placeholder="10" />
	                <LedgerDateTimeBox label={executionMode === 'BACKTEST' ? 'Backtest Date & Time' : 'Date & Time'} date={card.date} time={card.entryTime} onValue={(date, time) => onChange({ date, entryTime: time })} disabled={entryRowLocked} />
	                <LedgerButton label="Now" onClick={() => onChange({ date: localDateStr(), entryTime: autoTimeSeconds() })} disabled={entryRowLocked} />
	                <LedgerButton label={card.entryLocked ? 'Edit' : 'Enter'} onClick={() => {
	                  if (tradeEditLocked) return;
	                  if (!card.entryLocked) setAddingPos(false);
	                  onChange({ entryLocked: !card.entryLocked });
	                }} disabled={tradeEditLocked || (!card.entryLocked && (!card.entry || !card.qty))} tone="entry" />
	                <LedgerButton label="Delete" onClick={() => {
	                  if (tradeEditLocked) return;
	                  resetPrimaryExecution();
	                }} disabled={tradeEditLocked} tone="danger" />
	              </div>
	            ) : (
	              <div style={{ marginTop: '8px', border: `1px solid ${entryRowBorder}`, background: card.entryLocked ? entryRowLockedBg : entryRowBg }}>
	                <div style={{ display: 'grid', gridTemplateColumns: '80px minmax(130px, 1fr) minmax(130px, 1fr) minmax(190px, 1.15fr) 50px', gap: '10px', alignItems: 'end', padding: '10px 12px 5px' }}>
	                  <LedgerDisplay label="Type" value="Entry" color={MATTE.accent} />
	                  <LedgerNumber label="Asset Entry" value={card.underlyingEntry || ''} onValue={value => onChange({ underlyingEntry: value })} disabled={entryRowLocked} />
	                  <LedgerNumber label="Asset SL" value={card.sl} onValue={value => onChange({ sl: value, slManual: true })} disabled={entryRowLocked} color={MATTE.danger} />
	                  <LedgerDateTimeBox label={executionMode === 'BACKTEST' ? 'Backtest Date & Time' : 'Date & Time'} date={card.date} time={card.entryTime} onValue={(date, time) => onChange({ date, entryTime: time })} disabled={entryRowLocked} />
	                  <LedgerButton label="Now" onClick={() => onChange({ date: localDateStr(), entryTime: autoTimeSeconds() })} disabled={entryRowLocked} />
	                </div>
	                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(190px, 1.25fr) minmax(110px, 0.8fr) minmax(80px, 0.65fr) minmax(110px, 0.8fr) 46px 46px', gap: '10px', alignItems: 'end', padding: '5px 12px 10px' }}>
	                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 }}>
	                    <span style={{ ...miniLabel(), height: `${LEDGER_LABEL_H}px`, display: 'block', lineHeight: `${LEDGER_LABEL_H}px`, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Derivative Name</span>
	                    <input className="ledger-line-input" type="text" value={card.assetSuffix} onChange={e => onChange({ assetSuffix: e.target.value })} placeholder="Expiry, strike, CE/PE..." disabled={entryRowLocked} style={{ height: `${LEDGER_FIELD_H}px`, boxSizing: 'border-box', background: 'transparent', border: 'none', borderBottom: entryRowLocked ? `1px solid ${MATTE.lineStrong}` : `1px solid rgba(244,246,248,0.28)`, outline: 'none', fontFamily: MONO, color: MATTE.ink, fontSize: '13px', fontWeight: 900, padding: '7px 2px 6px', width: '100%', minWidth: 0 }} />
	                  </div>
	                  <LedgerNumber label="Price" value={card.entry} onValue={value => onChange({ entry: value })} disabled={entryRowLocked} />
	                  <LedgerNumber label="Qty" value={card.qty} onValue={value => onChange({ qty: value })} disabled={entryRowLocked} placeholder="65" />
	                  <LedgerNumber label="Cost" value={card.cost} onValue={value => onChange({ cost: value })} disabled={entryRowLocked} placeholder="10" />
	                  <LedgerButton label={card.entryLocked ? 'Edit' : 'Enter'} onClick={() => {
	                    if (tradeEditLocked) return;
	                    if (!card.entryLocked) setAddingPos(false);
	                    onChange({ entryLocked: !card.entryLocked });
	                  }} disabled={tradeEditLocked || (!card.entryLocked && (!card.entry || !card.qty))} tone="entry" />
	                  <LedgerButton label="Delete" onClick={() => {
	                    if (tradeEditLocked) return;
	                    resetPrimaryExecution();
	                  }} disabled={tradeEditLocked} tone="danger" />
	                </div>
	              </div>
	            ))}

	            {!showPrimaryEntryRow && card.addEntries.length === 0 && card.partialExits.length === 0 && !subtractPos && !completeExitOpen && !card.closed && (
	              <div style={{
	                minHeight: '86px',
	                display: 'flex',
	                alignItems: 'center',
	                justifyContent: 'center',
	                marginTop: '8px',
	                borderTop: `1px solid rgba(244,246,248,0.055)`,
	                background: 'transparent',
	              }}>
	                <span style={{ fontFamily: MONO, fontSize: '11px', fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', color: MATTE.muted }}>
	                  No execution logged
	                </span>
	              </div>
	            )}

	            {showAdditionalEntryDraft && (!isContractInstrument ? (
	              <div style={{ ...ledgerLineStyle, order: 20, gridTemplateColumns: '80px repeat(4, minmax(80px, 0.8fr)) minmax(190px, 1.15fr) 40px 46px 46px', background: entryRowBg, border: `1px solid ${entryRowBorder}` }}>
	                <LedgerDisplay label="Type" value="Entry" color={MATTE.accent} />
	                <LedgerNumber label="Price" value={newAdd.price} onValue={value => setNewAdd(p => ({ ...p, price: value }))} />
	                <LedgerNumber label="Qty" value={newAdd.qty} onValue={value => setNewAdd(p => ({ ...p, qty: value }))} placeholder="65" />
	                <LedgerNumber label="SL" value={newAdd.stop} onValue={value => setNewAdd(p => ({ ...p, stop: value }))} color={MATTE.danger} />
	                <LedgerNumber label="Cost" value={newAdd.cost} onValue={value => setNewAdd(p => ({ ...p, cost: value }))} placeholder="10" />
	                <LedgerDateTimeBox label="Date & Time" date={newAdd.date} time={newAdd.time} onValue={(date, time) => setNewAdd(p => ({ ...p, date, time }))} />
	                <LedgerButton label="Now" onClick={() => setNewAdd(p => ({ ...p, date: localDateStr(), time: autoTimeSeconds() }))} />
	                <LedgerButton label="Enter" onClick={handleAddPos} disabled={!newAdd.price || !newAdd.qty || tradeEditLocked} tone="entry" />
	                <LedgerButton label="Cancel" onClick={() => setAddingPos(false)} disabled={tradeEditLocked} tone="danger" />
	              </div>
	            ) : (
	              <div style={{ order: 20, marginTop: '8px', border: `1px solid ${entryRowBorder}`, background: entryRowBg }}>
	                <div style={{ display: 'grid', gridTemplateColumns: '80px minmax(130px, 1fr) minmax(130px, 1fr) minmax(190px, 1.15fr) 50px', gap: '10px', alignItems: 'end', padding: '10px 12px 5px' }}>
	                  <LedgerDisplay label="Type" value="Entry" color={MATTE.accent} />
	                  <LedgerNumber label="Asset Entry" value={newAdd.assetEntry} onValue={value => setNewAdd(p => ({ ...p, assetEntry: value }))} />
	                  <LedgerNumber label="Asset SL" value={newAdd.assetStop} onValue={value => setNewAdd(p => ({ ...p, assetStop: value, stop: value }))} color={MATTE.danger} />
	                  <LedgerDateTimeBox label="Date & Time" date={newAdd.date} time={newAdd.time} onValue={(date, time) => setNewAdd(p => ({ ...p, date, time }))} />
	                  <LedgerButton label="Now" onClick={() => setNewAdd(p => ({ ...p, date: localDateStr(), time: autoTimeSeconds() }))} />
	                </div>
	                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(190px, 1.25fr) minmax(110px, 0.8fr) minmax(80px, 0.65fr) minmax(110px, 0.8fr) 46px 46px', gap: '10px', alignItems: 'end', padding: '5px 12px 10px' }}>
	                  <LedgerDisplay label="Derivative Name" value={fullAsset || 'CONTRACT'} />
	                  <LedgerNumber label="Price" value={newAdd.price} onValue={value => setNewAdd(p => ({ ...p, price: value }))} />
	                  <LedgerNumber label="Qty" value={newAdd.qty} onValue={value => setNewAdd(p => ({ ...p, qty: value }))} placeholder="65" />
	                  <LedgerNumber label="Cost" value={newAdd.cost} onValue={value => setNewAdd(p => ({ ...p, cost: value }))} placeholder="10" />
	                  <LedgerButton label="Enter" onClick={handleAddPos} disabled={!newAdd.price || !newAdd.qty || tradeEditLocked} tone="entry" />
	                  <LedgerButton label="Cancel" onClick={() => setAddingPos(false)} disabled={tradeEditLocked} tone="danger" />
	                </div>
	              </div>
	            ))}

	            {actionHint && (
	              <div style={{ order: 90, padding: '8px 0', borderTop: `1px solid ${MATTE.line}`, color: MATTE.ink, fontFamily: MONO, fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
	                {actionHint}
	              </div>
	            )}

	            {card.addEntries.map((entry) => {
	              const editing = editingAddIds.includes(entry.id);
	              return !isContractInstrument ? (
	                <div key={entry.id} style={{ ...ledgerLineStyle, order: 10, gridTemplateColumns: '80px repeat(4, minmax(80px, 0.8fr)) minmax(190px, 1.15fr) 40px 46px 46px', background: editing ? entryRowBg : entryRowLockedBg, border: `1px solid ${entryRowBorder}` }}>
	                  <LedgerDisplay label="Type" value="Entry" color={MATTE.accent} />
	                  <LedgerNumber label="Price" value={entry.price} onValue={value => updateAddEntry(entry.id, { price: parseFloat(value) || 0 })} disabled={tradeEditLocked || (!editing && !closedEditMode)} />
	                  <LedgerNumber label="Qty" value={entry.qty} onValue={value => updateAddEntry(entry.id, { qty: parseFloat(value) || 0 })} disabled={tradeEditLocked || (!editing && !closedEditMode)} />
	                  <LedgerNumber label="SL" value={entry.stop} onValue={value => updateAddEntry(entry.id, { stop: parseFloat(value) || 0 })} disabled={tradeEditLocked || (!editing && !closedEditMode)} color={MATTE.danger} />
	                  <LedgerNumber label="Cost" value={entry.cost} onValue={value => updateAddEntry(entry.id, { cost: parseFloat(value) || 0 })} disabled={tradeEditLocked || (!editing && !closedEditMode)} />
	                  <LedgerDateTimeBox label="Date & Time" date={entry.date || ''} time={entry.time || ''} onValue={(date, time) => updateAddEntry(entry.id, { date, time })} disabled={tradeEditLocked || (!editing && !closedEditMode)} />
	                  <LedgerButton label="Now" onClick={() => updateAddEntry(entry.id, { date: localDateStr(), time: autoTimeSeconds() })} disabled={tradeEditLocked || (!editing && !closedEditMode)} />
	                  <LedgerButton label={editing ? 'Enter' : 'Edit'} onClick={() => setEditingAddIds(ids => editing ? ids.filter(x => x !== entry.id) : [...ids, entry.id])} disabled={tradeEditLocked} tone="entry" />
	                  <LedgerButton label="Delete" onClick={() => removeAddEntry(entry.id)} disabled={tradeEditLocked} tone="danger" />
	                </div>
	              ) : (
	                <div key={entry.id} style={{ order: 10, marginTop: '8px', border: `1px solid ${entryRowBorder}`, background: editing ? entryRowBg : entryRowLockedBg }}>
	                  <div style={{ display: 'grid', gridTemplateColumns: '80px minmax(130px, 1fr) minmax(130px, 1fr) minmax(190px, 1.15fr) 50px', gap: '10px', alignItems: 'end', padding: '10px 12px 5px' }}>
	                    <LedgerDisplay label="Type" value="Entry" color={MATTE.accent} />
	                    <LedgerNumber label="Asset Entry" value={entry.assetEntry || ''} onValue={value => updateAddEntry(entry.id, { assetEntry: value })} disabled={tradeEditLocked || (!editing && !closedEditMode)} />
	                    <LedgerNumber label="Asset SL" value={entry.assetStop || entry.stop} onValue={value => updateAddEntry(entry.id, { assetStop: value, stop: parseFloat(value) || 0 })} disabled={tradeEditLocked || (!editing && !closedEditMode)} color={MATTE.danger} />
	                    <LedgerDateTimeBox label="Date & Time" date={entry.date || ''} time={entry.time || ''} onValue={(date, time) => updateAddEntry(entry.id, { date, time })} disabled={tradeEditLocked || (!editing && !closedEditMode)} />
	                    <LedgerButton label="Now" onClick={() => updateAddEntry(entry.id, { date: localDateStr(), time: autoTimeSeconds() })} disabled={tradeEditLocked || (!editing && !closedEditMode)} />
	                  </div>
	                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(190px, 1.25fr) minmax(110px, 0.8fr) minmax(80px, 0.65fr) minmax(110px, 0.8fr) 46px 46px', gap: '10px', alignItems: 'end', padding: '5px 12px 10px' }}>
	                    <LedgerDisplay label="Derivative Name" value={fullAsset || 'CONTRACT'} />
	                    <LedgerNumber label="Price" value={entry.price} onValue={value => updateAddEntry(entry.id, { price: parseFloat(value) || 0 })} disabled={tradeEditLocked || (!editing && !closedEditMode)} />
	                    <LedgerNumber label="Qty" value={entry.qty} onValue={value => updateAddEntry(entry.id, { qty: parseFloat(value) || 0 })} disabled={tradeEditLocked || (!editing && !closedEditMode)} />
	                    <LedgerNumber label="Cost" value={entry.cost} onValue={value => updateAddEntry(entry.id, { cost: parseFloat(value) || 0 })} disabled={tradeEditLocked || (!editing && !closedEditMode)} />
	                    <LedgerButton label={editing ? 'Enter' : 'Edit'} onClick={() => setEditingAddIds(ids => editing ? ids.filter(x => x !== entry.id) : [...ids, entry.id])} disabled={tradeEditLocked} tone="entry" />
	                    <LedgerButton label="Delete" onClick={() => removeAddEntry(entry.id)} disabled={tradeEditLocked} tone="danger" />
	                  </div>
	                </div>
	              );
	            })}

	            {subtractPos && (!isContractInstrument ? (
	              <div style={{ ...ledgerLineStyle, order: 40, gridTemplateColumns: '80px minmax(110px, 0.9fr) minmax(80px, 0.7fr) minmax(130px, 0.9fr) minmax(190px, 1.15fr) 40px 46px 46px', background: exitRowBg, border: `1px solid ${exitRowBorder}` }}>
	                <LedgerDisplay label="Type" value="Exit" color={MATTE.exit} />
	                <LedgerNumber label="Price" value={newPartial.price} onValue={value => setNewPartial(p => ({ ...p, price: value }))} />
	                <LedgerNumber label="Qty" value={newPartial.qty} onValue={value => setNewPartial(p => ({ ...p, qty: value }))} placeholder="0" />
	                <LedgerSelect label="Exit Type" value={newPartial.exitType} onValue={value => setNewPartial(p => ({ ...p, exitType: value }))} options={['Partial Exit', ...exitTypes.filter(t => t !== 'Partial Exit')]} />
	                <LedgerDateTimeBox label="Date & Time" date={newPartial.date} time={newPartial.time} onValue={(date, time) => setNewPartial(p => ({ ...p, date, time }))} />
	                <LedgerButton label="Now" onClick={() => setNewPartial(p => ({ ...p, date: localDateStr(), time: autoTimeSeconds() }))} />
	                <LedgerButton label="Exit" onClick={handleSubtract} disabled={!newPartial.qty || !newPartial.price || tradeEditLocked} tone="exit" />
	                <LedgerButton label="Cancel" onClick={() => setSubtractPos(false)} disabled={tradeEditLocked} tone="danger" />
	              </div>
	            ) : (
	              <div style={{ order: 40, marginTop: '8px', border: `1px solid ${exitRowBorder}`, background: exitRowBg }}>
	                <div style={{ display: 'grid', gridTemplateColumns: '80px minmax(130px, 1fr) minmax(150px, 0.95fr) minmax(190px, 1.15fr) 50px', gap: '10px', alignItems: 'end', padding: '10px 12px 5px' }}>
	                  <LedgerDisplay label="Type" value="Exit" color={MATTE.exit} />
	                  <LedgerNumber label="Asset Exit" value={newPartial.assetExit} onValue={value => setNewPartial(p => ({ ...p, assetExit: value }))} />
	                  <LedgerSelect label="Exit Type" value={newPartial.exitType} onValue={value => setNewPartial(p => ({ ...p, exitType: value }))} options={['Partial Exit', ...exitTypes.filter(t => t !== 'Partial Exit')]} />
	                  <LedgerDateTimeBox label="Date & Time" date={newPartial.date} time={newPartial.time} onValue={(date, time) => setNewPartial(p => ({ ...p, date, time }))} />
	                  <LedgerButton label="Now" onClick={() => setNewPartial(p => ({ ...p, date: localDateStr(), time: autoTimeSeconds() }))} />
	                </div>
	                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(190px, 1.25fr) minmax(110px, 0.8fr) minmax(80px, 0.65fr) 46px 46px', gap: '10px', alignItems: 'end', padding: '5px 12px 10px' }}>
	                  <LedgerDisplay label="Derivative Name" value={fullAsset || 'CONTRACT'} />
	                  <LedgerNumber label="Price" value={newPartial.price} onValue={value => setNewPartial(p => ({ ...p, price: value }))} />
	                  <LedgerNumber label="Qty" value={newPartial.qty} onValue={value => setNewPartial(p => ({ ...p, qty: value }))} placeholder={String(stats.remainingQty || '')} />
	                  <LedgerButton label="Exit" onClick={handleSubtract} disabled={!newPartial.qty || !newPartial.price || tradeEditLocked} tone="exit" />
	                  <LedgerButton label="Cancel" onClick={() => setSubtractPos(false)} disabled={tradeEditLocked} tone="danger" />
	                </div>
	              </div>
	            ))}

	            {card.partialExits.map((exit) => {
	              const editing = editingPartialIds.includes(exit.id);
	              return !isContractInstrument ? (
	                <div key={exit.id} style={{ ...ledgerLineStyle, order: 30, gridTemplateColumns: '80px minmax(110px, 0.9fr) minmax(80px, 0.7fr) minmax(130px, 0.9fr) minmax(190px, 1.15fr) 40px 46px 46px', background: editing ? exitRowBg : exitRowLockedBg, border: `1px solid ${exitRowBorder}` }}>
	                  <LedgerDisplay label="Type" value="Exit" color={MATTE.exit} />
	                  <LedgerNumber label="Price" value={exit.price} onValue={value => updatePartialExit(exit.id, { price: parseFloat(value) || 0 })} disabled={tradeEditLocked || (!editing && !closedEditMode)} />
	                  <LedgerNumber label="Qty" value={exit.qty} onValue={value => updatePartialExit(exit.id, { qty: parseFloat(value) || 0 })} disabled={tradeEditLocked || (!editing && !closedEditMode)} />
	                  <LedgerSelect label="Exit Type" value={exit.exitType || 'Partial Exit'} onValue={value => updatePartialExit(exit.id, { exitType: value })} options={['Partial Exit', ...exitTypes.filter(t => t !== 'Partial Exit')]} disabled={tradeEditLocked || (!editing && !closedEditMode)} />
	                  <LedgerDateTimeBox label="Date & Time" date={exit.date || ''} time={exit.time || ''} onValue={(date, time) => updatePartialExit(exit.id, { date, time })} disabled={tradeEditLocked || (!editing && !closedEditMode)} />
	                  <LedgerButton label="Now" onClick={() => updatePartialExit(exit.id, { date: localDateStr(), time: autoTimeSeconds() })} disabled={tradeEditLocked || (!editing && !closedEditMode)} />
	                  <LedgerButton label={editing ? 'Exit' : 'Edit'} onClick={() => setEditingPartialIds(ids => editing ? ids.filter(x => x !== exit.id) : [...ids, exit.id])} disabled={tradeEditLocked} tone="exit" />
	                  <LedgerButton label="Delete" onClick={() => removePartialExit(exit.id)} disabled={tradeEditLocked} tone="danger" />
	                </div>
	              ) : (
	                <div key={exit.id} style={{ order: 30, marginTop: '8px', border: `1px solid ${exitRowBorder}`, background: editing ? exitRowBg : exitRowLockedBg }}>
	                  <div style={{ display: 'grid', gridTemplateColumns: '80px minmax(130px, 1fr) minmax(150px, 0.95fr) minmax(190px, 1.15fr) 50px', gap: '10px', alignItems: 'end', padding: '10px 12px 5px' }}>
	                    <LedgerDisplay label="Type" value="Exit" color={MATTE.exit} />
	                    <LedgerNumber label="Asset Exit" value={exit.assetExit || ''} onValue={value => updatePartialExit(exit.id, { assetExit: value })} disabled={tradeEditLocked || (!editing && !closedEditMode)} />
	                    <LedgerSelect label="Exit Type" value={exit.exitType || 'Partial Exit'} onValue={value => updatePartialExit(exit.id, { exitType: value })} options={['Partial Exit', ...exitTypes.filter(t => t !== 'Partial Exit')]} disabled={tradeEditLocked || (!editing && !closedEditMode)} />
	                    <LedgerDateTimeBox label="Date & Time" date={exit.date || ''} time={exit.time || ''} onValue={(date, time) => updatePartialExit(exit.id, { date, time })} disabled={tradeEditLocked || (!editing && !closedEditMode)} />
	                    <LedgerButton label="Now" onClick={() => updatePartialExit(exit.id, { date: localDateStr(), time: autoTimeSeconds() })} disabled={tradeEditLocked || (!editing && !closedEditMode)} />
	                  </div>
	                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(190px, 1.25fr) minmax(110px, 0.8fr) minmax(80px, 0.65fr) 46px 46px', gap: '10px', alignItems: 'end', padding: '5px 12px 10px' }}>
	                    <LedgerDisplay label="Derivative Name" value={fullAsset || 'CONTRACT'} />
	                    <LedgerNumber label="Price" value={exit.price} onValue={value => updatePartialExit(exit.id, { price: parseFloat(value) || 0 })} disabled={tradeEditLocked || (!editing && !closedEditMode)} />
	                    <LedgerNumber label="Qty" value={exit.qty} onValue={value => updatePartialExit(exit.id, { qty: parseFloat(value) || 0 })} disabled={tradeEditLocked || (!editing && !closedEditMode)} />
	                    <LedgerButton label={editing ? 'Exit' : 'Edit'} onClick={() => setEditingPartialIds(ids => editing ? ids.filter(x => x !== exit.id) : [...ids, exit.id])} disabled={tradeEditLocked} tone="exit" />
	                    <LedgerButton label="Delete" onClick={() => removePartialExit(exit.id)} disabled={tradeEditLocked} tone="danger" />
	                  </div>
	                </div>
	              );
	            })}

	            {(completeExitOpen || card.closed) && (!isContractInstrument ? (
	              <div style={{ ...ledgerLineStyle, order: 50, gridTemplateColumns: '80px minmax(110px, 0.9fr) minmax(80px, 0.7fr) minmax(130px, 0.9fr) minmax(190px, 1.15fr) 40px 46px 46px', background: card.closed && !completeExitOpen ? exitRowLockedBg : exitRowBg, border: `1px solid ${exitRowBorder}` }}>
	                <LedgerDisplay label="Type" value="Exit" color={MATTE.exit} />
	                <LedgerNumber label="Price" value={card.exitPrice || ''} onValue={value => onChange({ exitPrice: value })} disabled={tradeEditLocked || (card.closed && !completeExitOpen)} />
	                <LedgerDisplay label="Qty" value={stats.remainingQty ? `${stats.remainingQty}` : '—'} />
	                <LedgerSelect label="Exit Type" value={card.exitType || 'Complete Exit'} onValue={value => onChange({ exitType: value })} options={['Complete Exit', ...exitTypes.filter(t => t !== 'Complete Exit')]} disabled={tradeEditLocked || (card.closed && !completeExitOpen)} />
	                <LedgerDateTimeBox label="Date & Time" date={card.exitDate || ''} time={card.exitTime || ''} onValue={(date, time) => onChange({ exitDate: date, exitTime: time })} disabled={tradeEditLocked || (card.closed && !completeExitOpen)} />
	                <LedgerButton label="Now" onClick={() => onChange({ exitDate: localDateStr(), exitTime: autoTimeSeconds() })} disabled={tradeEditLocked || (card.closed && !completeExitOpen)} />
	                <LedgerButton label={card.closed && !completeExitOpen ? 'Edit' : 'Exit'} onClick={() => {
	                  if (card.closed && !completeExitOpen) {
	                    setCompleteExitOpen(true);
	                    return;
	                  }
	                  const xd = card.exitDate || localDateStr();
	                  const xt = card.exitTime || autoTimeSeconds();
                  onChange({ closed: true, exitDate: xd, exitTime: xt, tradeStatus: 'Closed', exitType: card.exitType || 'Complete Exit' });
	                  setCompleteExitOpen(false);
	                }} disabled={tradeEditLocked || (!card.exitPrice && (!card.closed || completeExitOpen))} tone="danger" />
	                <LedgerButton label="Delete" onClick={() => {
	                  if (tradeEditLocked) return;
	                  setCompleteExitOpen(false);
	                  onChange({ closed: false, exitPrice: '', exitDate: '', exitTime: '', exitType: '', tradeStatus: '' });
	                }} disabled={tradeEditLocked} tone="danger" />
	              </div>
	            ) : (
	              <div style={{ order: 50, marginTop: '8px', border: `1px solid ${exitRowBorder}`, background: card.closed && !completeExitOpen ? exitRowLockedBg : exitRowBg }}>
	                <div style={{ display: 'grid', gridTemplateColumns: '80px minmax(130px, 1fr) minmax(150px, 0.95fr) minmax(190px, 1.15fr) 50px', gap: '10px', alignItems: 'end', padding: '10px 12px 5px' }}>
	                  <LedgerDisplay label="Type" value="Exit" color={MATTE.exit} />
	                  <LedgerNumber label="Asset Exit" value={card.underlyingExit || ''} onValue={value => onChange({ underlyingExit: value })} disabled={tradeEditLocked || (card.closed && !completeExitOpen)} />
	                  <LedgerSelect label="Exit Type" value={card.exitType || 'Complete Exit'} onValue={value => onChange({ exitType: value })} options={['Complete Exit', ...exitTypes.filter(t => t !== 'Complete Exit')]} disabled={tradeEditLocked || (card.closed && !completeExitOpen)} />
	                  <LedgerDateTimeBox label="Date & Time" date={card.exitDate || ''} time={card.exitTime || ''} onValue={(date, time) => onChange({ exitDate: date, exitTime: time })} disabled={tradeEditLocked || (card.closed && !completeExitOpen)} />
	                  <LedgerButton label="Now" onClick={() => onChange({ exitDate: localDateStr(), exitTime: autoTimeSeconds() })} disabled={tradeEditLocked || (card.closed && !completeExitOpen)} />
	                </div>
	                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(190px, 1.25fr) minmax(110px, 0.8fr) minmax(80px, 0.65fr) 46px 46px', gap: '10px', alignItems: 'end', padding: '5px 12px 10px' }}>
	                  <LedgerDisplay label="Derivative Name" value={fullAsset || 'CONTRACT'} />
	                  <LedgerNumber label="Price" value={card.exitPrice || ''} onValue={value => onChange({ exitPrice: value })} disabled={tradeEditLocked || (card.closed && !completeExitOpen)} />
	                  <LedgerDisplay label="Qty" value={stats.remainingQty ? `${stats.remainingQty}` : '—'} />
	                  <LedgerButton label={card.closed && !completeExitOpen ? 'Edit' : 'Exit'} onClick={() => {
	                    if (card.closed && !completeExitOpen) {
	                      setCompleteExitOpen(true);
	                      return;
	                    }
	                    const xd = card.exitDate || localDateStr();
	                    const xt = card.exitTime || autoTimeSeconds();
	                    onChange({ closed: true, exitDate: xd, exitTime: xt, tradeStatus: 'Closed', exitType: card.exitType || 'Complete Exit' });
	                    setCompleteExitOpen(false);
	                  }} disabled={tradeEditLocked || (!card.exitPrice && (!card.closed || completeExitOpen))} tone="danger" />
	                  <LedgerButton label="Delete" onClick={() => {
	                    if (tradeEditLocked) return;
	                    setCompleteExitOpen(false);
	                    onChange({ closed: false, exitPrice: '', exitDate: '', exitTime: '', exitType: '', tradeStatus: '', underlyingExit: '' });
	                  }} disabled={tradeEditLocked} tone="danger" />
	                </div>
	              </div>
	            ))}
	          </div>

	          {/* Targets */}
	          <div style={{ order: 50, marginTop: '12px', borderBottom: '1px solid rgba(226,232,240,0.055)', background: 'transparent', padding: '0' }}>
	            <div style={{
	              display: 'flex',
	              alignItems: 'center',
	              gap: '10px',
	              padding: '8px 12px',
	              background: 'transparent',
	              borderBottom: '1px solid rgba(244,246,248,0.055)',
	            }}>
	              <span style={{ width: '18px', height: '2px', background: accent, display: 'inline-block', opacity: 0.9 }} />
	              <span style={{ fontFamily: MONO, fontSize: '11px', fontWeight: 950, letterSpacing: '0.16em', color: MATTE.ink, textTransform: 'uppercase' }}>Trade Stats</span>
	            </div>
		            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: '0' }}>
		              {[
		                { label: 'Average Entry Price', value: stats.wPrice > 0 ? stats.wPrice.toFixed(2) : '—', color: MATTE.ink, bg: 'transparent' },
		                { label: 'Total Volume', value: stats.entryQty ? `${stats.entryQty} total / ${stats.remainingQty} open` : '—', color: MATTE.ink, bg: 'transparent' },
		                { label: 'Average SL', value: stats.avgSl > 0 ? stats.avgSl.toFixed(2) : '—', color: MATTE.danger, bg: 'rgba(195,154,150,0.025)' },
		                { label: 'Breakeven', value: stats.be > 0 ? stats.be.toFixed(2) : '—', color: MATTE.success, bg: 'rgba(127,167,139,0.025)' },
		                { label: 'Total Investment', value: totalInvestment > 0 ? fmtMoney(totalInvestment).replace('+', '') : '—', color: MATTE.ink, bg: 'transparent' },
		                { label: 'Taken Profit', value: fmtMoney(stats.partialPnL), color: stats.partialPnL >= 0 ? MATTE.success : MATTE.danger, bg: 'rgba(244,246,248,0.025)' },
		              ].map(item => (
		                <div key={item.label} style={{ background: item.bg, borderRight: '1px solid rgba(226,232,240,0.045)', borderBottom: '1px solid rgba(226,232,240,0.045)', padding: '7px 9px', borderRadius: '0px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
		                  <div style={{ fontFamily: MONO, fontSize: '8.5px', color: 'rgba(226,232,240,0.68)', fontWeight: 900 }}>{item.label}</div>
		                  <div style={{ fontFamily: MONO, fontSize: '13px', fontWeight: 900, color: item.color, padding: '4px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
		                    {item.value}
		                  </div>
		                </div>
		              ))}
	              {(['t1', 't2', 't3', 't4'] as const).map((key) => {
	                const label = key.toUpperCase();
	                const tVal = parseFloat(card[key]) || 0;
	                const tgtDist = tVal > 0 && analysisEntryPrice > 0 ? (stats.isShort ? analysisEntryPrice - tVal : tVal - analysisEntryPrice) : 0;
	                const rr = analysisStopDist > 0 && tgtDist > 0 ? tgtDist / analysisStopDist : 0;
	                const profit = tgtDist > 0 && stats.entryQty > 0 ? tgtDist * stats.entryQty - stats.brokerage : 0;
                return (
                  <div key={key} style={{ background: 'transparent', borderRight: '1px solid rgba(226,232,240,0.045)', borderBottom: '1px solid rgba(226,232,240,0.045)', padding: '7px 9px', borderRadius: '0px' }}>
                    <div style={{ fontFamily: MONO, fontSize: '8.5px', color: 'rgba(226,232,240,0.62)', fontWeight: 900 }}>{label}</div>
                    <input
                      type="number" value={card[key]} onChange={e => onChange({ [key]: e.target.value })} placeholder="—" disabled={tradeEditLocked}
                      style={{ background: 'transparent', border: 'none', outline: 'none', fontFamily: MONO, fontSize: '13px', fontWeight: 900, color: '#ffffff', width: '100%', padding: '4px 0' }}
                    />
                    {rr > 0 && (
                      <div style={{ marginTop: '2px', borderTop: '1px dashed rgba(255,255,255,0.06)', paddingTop: '2px' }}>
	                        <div style={{ fontFamily: MONO, fontSize: '9px', color: MATTE.success, fontWeight: 900 }}>1:{rr.toFixed(1)}R</div>
	                        <div style={{ fontFamily: MONO, fontSize: '8.5px', color: 'rgba(226,232,240,0.58)', fontWeight: 800 }}>{isContractInstrument ? `${tgtDist.toFixed(2)} asset pts` : `+₹${profit.toFixed(0)}`}</div>
	                      </div>
                    )}
                  </div>
                );
              })}

		              {[
		                { label: 'Net P/L', value: fmtMoney(stats.finalPnL), color: netColor, bg: 'transparent', border: 'rgba(226,232,240,0.045)' },
		                { label: 'Gross P/L', value: fmtMoney(stats.grossPnL), color: grossColor, bg: 'transparent', border: 'rgba(226,232,240,0.045)' },
		                { label: 'R Multiple', value: stats.rMultiple === null ? '—' : `${stats.rMultiple >= 0 ? '+' : ''}${stats.rMultiple.toFixed(2)}R`, color: rColor, bg: 'transparent', border: 'rgba(226,232,240,0.045)' },
		                { label: 'Risk', value: stats.riskAmount > 0 ? fmtMoney(-stats.riskAmount) : '—', color: MATTE.danger, bg: 'rgba(195,154,150,0.025)', border: 'rgba(226,232,240,0.045)' },
		              ].map(item => (
		                <div key={item.label} style={{ background: item.bg, borderRight: `1px solid ${item.border}`, borderBottom: `1px solid ${item.border}`, padding: '7px 9px', borderRadius: '0px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
		                  <div style={{ fontFamily: MONO, fontSize: '8.5px', color: 'rgba(226,232,240,0.68)', fontWeight: 900 }}>{item.label}</div>
		                  <div style={{ fontFamily: MONO, fontSize: '13px', fontWeight: 900, color: item.color, padding: '4px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
		                    {item.value}
		                  </div>
		                </div>
		              ))}
		            </div>
		            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: '0' }}>
		              {[
		                { label: 'Entry Time', value: entryAt, color: MATTE.inkSoft, bg: 'transparent' },
		                { label: 'First Add', value: firstAddAt ? `${fmtDuration(firstAddMins)} after` : '—', color: MATTE.inkSoft, bg: 'rgba(127,167,139,0.018)' },
		                { label: 'First Partial Exit', value: firstPartialExitAt ? `${fmtDuration(firstPartialExitMins)} after` : '—', color: MATTE.inkSoft, bg: 'rgba(244,246,248,0.018)' },
		                { label: 'Complete Exit', value: completeExitAt, color: MATTE.inkSoft, bg: 'rgba(195,154,150,0.018)' },
		                { label: 'Hold', value: fmtDuration(holdMins), color: MATTE.inkSoft, bg: 'transparent' },
		                { label: 'Temporal Actions', value: `${card.addEntries.length} add / ${card.partialExits.length} partial`, color: MATTE.inkSoft, bg: 'transparent' },
		              ].map(item => (
		                <div key={item.label} style={{ background: item.bg, borderRight: '1px solid rgba(226,232,240,0.045)', borderBottom: '1px solid rgba(226,232,240,0.045)', padding: '7px 9px', borderRadius: '0px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
		                  <div style={{ fontFamily: MONO, fontSize: '8.5px', color: 'rgba(226,232,240,0.68)', fontWeight: 900 }}>{item.label}</div>
		                  <div style={{ fontFamily: MONO, fontSize: '12.5px', fontWeight: 900, color: item.color, padding: '4px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
		                    {item.value}
		                  </div>
		                </div>
		              ))}
		            </div>
		          </div>

          {/* Execution Journal Notes */}
	          <div style={{ order: 60, borderBottom: '1px solid rgba(226,232,240,0.075)', background: 'transparent', padding: '0' }}>
            <textarea
              value={card.notes} onChange={e => !tradeEditLocked && onChange({ notes: e.target.value })} placeholder="Execution detail, trigger behavior, operator mindset journal..." disabled={tradeEditLocked}
              style={{ width: '100%', boxSizing: 'border-box', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(226,232,240,0.30)', outline: 'none', resize: 'vertical', fontFamily: MONO, fontSize: '12.5px', color: '#ffffff', lineHeight: 1.5, minHeight: '82px', padding: '12px 0', borderRadius: '0px' }}
            />
          </div>

          {/* Action buttons (Explicit save/close/commit only) */}
	          <div style={{ order: 60, display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '12px 0 0', background: 'transparent' }}>
            {closedReadOnly ? (
              <>
                <button
                  className="trade-footer-button trade-footer-button-neutral"
                  onClick={() => {
                    setClosedEditMode(true);
                    setCompleteExitOpen(true);
                    onChange({ closed: false, tradeStatus: 'Open' });
                  }}
                  disabled={isLocked}
                  style={{
                    width: '128px', height: '28px', fontFamily: MONO, fontSize: '8px', fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase',
                    cursor: isLocked ? 'not-allowed' : 'pointer', border: `1px solid ${MATTE.lineStrong}`,
                    background: 'transparent', color: MATTE.ink, borderRadius: '0px', transition: 'all 150ms', outline: 'none'
                  }}
                >
                  Edit
                </button>
                <button
                  className="trade-footer-button trade-footer-button-commit"
                  onClick={() => {
                    commitToLearning();
                  }}
                  disabled={!canCommitTrade || isLocked || committing}
                  style={{
                    width: '128px', height: '28px', fontFamily: MONO, fontSize: '8px', fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase',
                    cursor: canCommitTrade && !isLocked && !committing ? 'pointer' : 'not-allowed', border: canCommitTrade ? `1px solid ${MATTE.ink}` : `1px solid ${MATTE.line}`,
                    background: canCommitTrade ? 'rgba(244,246,248,0.08)' : 'transparent', color: MATTE.ink, opacity: canCommitTrade ? 1 : 0.4, borderRadius: '0px', transition: 'all 150ms', outline: 'none'
                  }}
                >
                  {committing ? 'Commit…' : 'Commit'}
                </button>
              </>
            ) : (
              <>
                <button
                  className={`trade-footer-button ${saveError ? 'trade-footer-button-danger' : 'trade-footer-button-neutral'}`}
                  onClick={async () => {
                    const savedId = await saveToDb();
                    if (savedId && card.closed) setClosedEditMode(false);
                  }}
                  disabled={tradeEditLocked || saving}
                  style={{
                    width: '128px', height: '28px', fontFamily: MONO, fontSize: '8px', fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase',
                    cursor: tradeEditLocked || saving ? 'not-allowed' : 'pointer', border: saveError ? `1px solid ${MATTE.danger}` : saved ? `1px solid ${MATTE.ink}` : `1px solid ${MATTE.lineStrong}`,
                    background: saveError ? 'rgba(195,154,150,0.06)' : 'transparent', color: MATTE.ink, borderRadius: '0px', transition: 'all 150ms', outline: 'none'
                  }}
                >
                  {saving ? 'Saving…' : saveError ? 'Failed' : saved ? '✓ Saved' : card.dbId ? 'Update' : 'Save Draft'}
                </button>
                <button
                  className="trade-footer-button trade-footer-button-danger"
                  onClick={async () => {
                    const xd = card.exitDate || localDateStr();
                    const xt = card.exitTime || autoTimeSeconds();
                    const updates = { closed: true, exitDate: xd, exitTime: xt, tradeStatus: 'Closed' };
                    const savedId = await saveToDb(updates);
                    if (savedId) {
                      onChange(updates);
                      setClosedEditMode(false);
                      setCompleteExitOpen(false);
                    }
                  }}
                  disabled={!canCloseTrade || tradeEditLocked || saving}
                  style={{
                    width: '128px', height: '28px', fontFamily: MONO, fontSize: '8px', fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase',
                    cursor: canCloseTrade && !tradeEditLocked && !saving ? 'pointer' : 'not-allowed', border: canCloseTrade ? `1px solid ${MATTE.danger}` : `1px solid ${MATTE.line}`,
                    background: canCloseTrade ? 'rgba(195,154,150,0.10)' : 'transparent', color: canCloseTrade ? MATTE.danger : MATTE.ink, opacity: canCloseTrade ? 1 : 0.55, borderRadius: '0px', transition: 'all 150ms', outline: 'none'
                  }}
                >
                  {saving ? 'Closing…' : 'Close Trade'}
                </button>
                <button
                  className="trade-footer-button trade-footer-button-commit"
                  onClick={() => {
                    commitToLearning();
                  }}
                  disabled={!canCommitTrade || isLocked || committing}
                  style={{
                    width: '128px', height: '28px', fontFamily: MONO, fontSize: '8px', fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase',
                    cursor: canCommitTrade && !isLocked && !committing ? 'pointer' : 'not-allowed', border: canCommitTrade ? `1px solid ${MATTE.ink}` : `1px solid ${MATTE.line}`,
                    background: canCommitTrade ? 'rgba(244,246,248,0.08)' : 'transparent', color: MATTE.ink, opacity: canCommitTrade ? 1 : 0.4, borderRadius: '0px', transition: 'all 150ms', outline: 'none'
                  }}
                >
                  {committing ? 'Commit…' : 'Commit'}
                </button>
              </>
            )}
          </div>

        </div>
      </div>

      {/* ── PHASE 4: WEAPON TRANSITION MAP ── */}
      {selected && selected.transitions.length > 0 && (
        <div style={{ ...dossierSectionStyle, paddingBottom: '2px' }}>
          <DossierNode />
          <button
            type="button"
            onClick={() => setTransitionMapOpen(open => !open)}
            style={{
              width: '100%',
              minHeight: '44px',
              display: 'grid',
              gridTemplateColumns: 'minmax(180px, 0.75fr) minmax(0, 1.3fr) auto',
              alignItems: 'center',
              gap: '14px',
              padding: '0 14px',
              background: `linear-gradient(135deg, ${MATTE.phase4Base}, rgba(13,17,22,0.72))`,
              border: `1px solid ${MATTE.lineStrong}`,
              borderRadius: '0px',
              cursor: 'pointer',
              textAlign: 'left',
              outline: 'none',
            }}
          >
            <span style={{ fontFamily: MONO, fontSize: '10px', fontWeight: 950, letterSpacing: '0.18em', textTransform: 'uppercase', color: MATTE.inkSoft }}>
              Phase - 4 Transition Rail
            </span>
            <span style={{ fontFamily: MONO, fontSize: '11px', fontWeight: 900, color: MATTE.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selected.displayName} <span style={{ color: MATTE.muted, margin: '0 8px' }}>→</span> {selected.transitions.length} possible transition{selected.transitions.length === 1 ? '' : 's'}
            </span>
            <span style={{ fontFamily: MONO, fontSize: '10px', fontWeight: 950, color: transitionMapOpen ? MATTE.ink : MATTE.muted, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              {transitionMapOpen ? 'Hide' : 'Open'} {transitionMapOpen ? '−' : '+'}
            </span>
          </button>

          {transitionMapOpen && (
            <div style={{ ...dossierPanelStyle, marginTop: '10px', background: `linear-gradient(135deg, ${MATTE.phase4Base}, rgba(13,17,22,0.9))`, padding: '12px', borderRadius: '0px', display: 'flex', flexDirection: 'column', gap: '8px', border: `1px solid ${MATTE.line}` }}>
              {selected.transitions.map((tId: string) => {
                  const targetName = WEAPON_NAME_MAP[tId] || tId;
                  const reason = selected.transition_reasons?.[tId] || 'No transition rationale defined.';

                  let borderLeftColor = MATTE.lineStrong;
                  if (tId.startsWith('NS-01')) borderLeftColor = MATTE.danger;
                  if (tId.startsWith('NS-02')) borderLeftColor = MATTE.muted;
                  if (tId.startsWith('NS-03')) borderLeftColor = MATTE.ink;
                  if (tId.startsWith('NS-04')) borderLeftColor = MATTE.blueGrey;

                  const isMasterState = tId.startsWith('NS-') && !tId.includes('-CS');

                  return (
                    <div
                      key={tId}
                      style={{
                        background: 'rgba(244,246,248,0.025)',
                        border: `1px solid rgba(244,246,248,0.07)`,
                        borderLeft: `2px solid ${borderLeftColor}`,
                        padding: '8px 12px',
                        borderRadius: '0px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                        <span style={{ fontFamily: MONO, fontSize: '11px', fontWeight: 900, color: '#ffffff', letterSpacing: '0.05em' }}>
                          {selected.displayName} <span style={{ color: 'rgba(255,255,255,0.4)', margin: '0 4px' }}>→</span> {targetName}
                        </span>
                        <span style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 700, color: borderLeftColor, background: `${borderLeftColor}12`, border: `1px solid ${borderLeftColor}30`, padding: '2px 6px', borderRadius: '0px' }}>
                          {isMasterState ? 'PARENT COMMAND' : tId}
                        </span>
                      </div>
                      <div style={{ fontFamily: MONO, fontSize: '11px', color: 'rgba(255, 255, 255, 0.65)', lineHeight: 1.5 }}>
                        {reason}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
          </div>
      )}

    </div>
  );
}

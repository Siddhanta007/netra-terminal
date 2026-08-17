const MONO = 'JetBrains Mono, Consolas, monospace';

interface MayaHypothesisPanelProps {
  phaseLabel?: string;
  title?: string;
  fieldLabel: string;
  value: string;
  placeholder?: string;
  editing: boolean;
  awaiting?: boolean;
  busy?: boolean;
  tag?: string;
  tagColor?: string;
  onChange: (value: string) => void;
  onEdit: () => void;
  onReset: () => void;
  onConfirm: () => void;
  editDisabled?: boolean;
  resetDisabled?: boolean;
  confirmDisabled?: boolean;
  editLabel?: string;
  resetLabel?: string;
  confirmLabel?: string;
}

export default function MayaHypothesisPanel({
  phaseLabel,
  title,
  fieldLabel,
  value,
  placeholder,
  editing,
  awaiting = false,
  busy = false,
  tag,
  tagColor = '#93c5fd',
  onChange,
  onEdit,
  onReset,
  onConfirm,
  editDisabled = false,
  resetDisabled = false,
  confirmDisabled = false,
  editLabel = 'Edit',
  resetLabel = 'Reset',
  confirmLabel = 'Confirm',
}: MayaHypothesisPanelProps) {
  return (
    <section style={{ padding: '18px 20px 16px', background: 'linear-gradient(180deg, rgba(12,17,27,0.98), rgba(6,9,15,0.98))' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 13 }}>
        {phaseLabel && (
          <span style={{ color: 'var(--accent)', font: `900 7px ${MONO}`, letterSpacing: '0.2em' }}>{phaseLabel}</span>
        )}
        <span style={{ color: 'rgba(248,250,252,0.92)', font: `900 9px ${MONO}`, letterSpacing: '0.16em', textTransform: 'uppercase' }}>{title}</span>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.075)' }} />
        {tag && (
          <span style={{ color: tagColor, font: `800 7px ${MONO}`, letterSpacing: '0.13em', textTransform: 'uppercase' }}>{tag}</span>
        )}
      </div>

      <label style={{ display: 'grid', gap: 7, minWidth: 0 }}>
        <span style={{ color: 'rgba(203,213,225,0.42)', font: `800 7px ${MONO}`, letterSpacing: '0.15em', textTransform: 'uppercase' }}>{fieldLabel}</span>
        <textarea
          rows={4}
          value={value}
          disabled={!editing || awaiting}
          onChange={event => onChange(event.target.value)}
          placeholder={awaiting ? 'Awaiting Maya proposal…' : placeholder}
          style={{
            width: '100%', minHeight: 96, resize: 'vertical', outline: 'none',
            border: `1px solid ${editing && !awaiting ? 'rgba(65,105,225,0.28)' : 'rgba(255,255,255,0.075)'}`,
            background: editing && !awaiting ? 'rgba(65,105,225,0.035)' : 'rgba(0,0,0,0.16)',
            color: 'rgba(241,245,249,0.9)', padding: '13px 14px',
            font: `500 11px/1.7 ${MONO}`, opacity: awaiting ? 0.48 : 1,
            transition: 'border-color 150ms ease, background 150ms ease',
          }}
        />
      </label>

      <div className="terminal-action-bar" style={{ marginTop: 13, paddingTop: 13 }}>
        <div className="terminal-action-buttons">
          <button type="button" className="btn-edit w-24" disabled={editDisabled} onClick={onEdit}>{editLabel}</button>
          <button type="button" className="btn-reset w-24" disabled={resetDisabled} onClick={onReset}>{resetLabel}</button>
          <button type="button" className="btn-confirm w-40" disabled={confirmDisabled || busy} onClick={onConfirm}>{busy ? 'Confirming…' : confirmLabel}</button>
        </div>
      </div>
    </section>
  );
}

import React, { useEffect, useState } from 'react';
import { TerminalComponentHeader } from '@/components/UI/TerminalPrimitives';
import { useNetra } from '@/context/NetraContext';
import { SystemDimension } from '@/types';

const MONO: React.CSSProperties = { fontFamily: 'Space Grotesk, Inter, sans-serif' };

type SelectionTarget = 'marketPulse' | 'liquidityContext';

function ChecklistRows({
  open,
  options,
  checked,
  onToggle,
}: {
  open: boolean;
  options: string[];
  checked: Record<string, boolean>;
  onToggle: (id: string) => void;
}) {
  if (!open) return null;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      border: '1px solid var(--border-strong)',
      marginBottom: '4px', overflow: 'hidden',
    }}>
      {options.map((label, index) => {
        const id = `drawing_${index + 1}`;
        const isDone = !!checked[id];
        return (
          <div
            key={id}
            onClick={event => { event.stopPropagation(); onToggle(id); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '12px 16px', cursor: 'pointer',
              background: isDone ? 'var(--accent-bg)' : 'transparent',
              borderBottom: index === options.length - 1 ? 'none' : '1px solid var(--border)',
              transition: 'background 120ms',
            }}
          >
            <div style={{
              width: '12px', height: '12px', flexShrink: 0,
              border: `1.5px solid ${isDone ? 'var(--phase-accent)' : 'var(--border-strong)'}`,
              background: isDone ? 'var(--phase-accent)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {isDone && <span style={{ fontSize: '8px', color: 'white', fontWeight: 900, lineHeight: 1 }}>✓</span>}
            </div>
            <span style={{
              ...MONO, fontSize: '10px', fontWeight: 600, flex: 1, lineHeight: 1.4,
              color: isDone ? 'var(--text-3)' : 'var(--text-1)',
              textDecoration: isDone ? 'line-through' : 'none',
              textDecorationColor: 'var(--text-4)',
            }}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function Phase3MarketPulse() {
  const {
    SYSTEM_DATA, selections, setSelections,
    notes, setNotes,
    highestStep, stepTimestamps,
    confirmMarketPulse, editStep,
  } = useNetra();

  const [editing, setEditing] = useState(false);
  const [openComponents, setOpenComponents] = useState<Record<string, boolean>>({});
  const [checklists, setChecklists] = useState<Record<string, Record<string, boolean>>>({});

  const components = SYSTEM_DATA.marketPulse?.dimensions || [];
  const marketPulse = (selections.marketPulse || {}) as Record<string, string>;
  const liquidityContext = (selections.liquidityContext || {}) as Record<string, string>;
  const isLocked = highestStep > 3 && !editing;
  const checklistSelectionSignature = components
    .filter(component => component.display === 'checklist')
    .map(component => {
      const source = component.selectionTarget === 'liquidityContext' ? liquidityContext : marketPulse;
      return source[component.selectionIdKey || ''] || '';
    })
    .join('|');

  useEffect(() => {
    const restored = Object.fromEntries(
      components
        .filter(component => component.display === 'checklist')
        .map(component => {
          const idKey = component.selectionIdKey || '';
          const source = component.selectionTarget === 'liquidityContext' ? liquidityContext : marketPulse;
          const selectedIds = String(source[idKey] || '')
            .split(',')
            .map(value => value.trim())
            .filter(Boolean);
          return [component.id, Object.fromEntries(selectedIds.map(id => [id, true]))];
        }),
    );
    setChecklists(restored);
  }, [components, checklistSelectionSignature]);

  const targetState = (target: SelectionTarget) => (
    target === 'liquidityContext' ? liquidityContext : marketPulse
  );

  const setDimensionValue = (target: SelectionTarget, dimension: SystemDimension, value: string) => {
    if (isLocked) return;
    const current = targetState(target);
    const updates = Object.fromEntries(
      [dimension.id, ...(dimension.selectionAliases || [])].map(key => [key, value]),
    );
    setSelections({ ...selections, [target]: { ...current, ...updates } });
  };

  const selectedValue = (target: SelectionTarget, dimension: SystemDimension) => {
    const current = targetState(target);
    return current[dimension.id]
      || (dimension.selectionAliases || []).map(alias => current[alias]).find(Boolean)
      || '';
  };

  const toggleMultiselect = (target: SelectionTarget, dimension: SystemDimension, option: string) => {
    const currentValues = selectedValue(target, dimension).split(', ').filter(Boolean);
    const exclusiveOptions = dimension.exclusiveOptions || [];
    let nextValues: string[];

    if (exclusiveOptions.includes(option)) {
      nextValues = [option];
    } else {
      const withoutExclusive = currentValues.filter(value => !exclusiveOptions.includes(value));
      nextValues = withoutExclusive.includes(option)
        ? withoutExclusive.filter(value => value !== option)
        : [...withoutExclusive, option];
    }
    setDimensionValue(target, dimension, nextValues.join(', '));
  };

  const toggleChecklist = (component: SystemDimension, id: string) => {
    if (isLocked) return;
    const currentForComponent = checklists[component.id] || {};
    const nextForComponent = { ...currentForComponent, [id]: !currentForComponent[id] };
    const selectedItems = (component.options || [])
      .map((label, index) => ({ id: `drawing_${index + 1}`, label }))
      .filter(item => nextForComponent[item.id]);
    const idKey = component.selectionIdKey;
    const valueKey = component.selectionValueKey;
    const updates: Record<string, string> = {};
    if (idKey) updates[idKey] = selectedItems.map(item => item.id).join(', ');
    if (valueKey) updates[valueKey] = selectedItems.map(item => item.label).join(' | ');
    const target = component.selectionTarget === 'liquidityContext' ? 'liquidityContext' : 'marketPulse';
    setChecklists({ ...checklists, [component.id]: nextForComponent });
    setSelections({ ...selections, [target]: { ...targetState(target), ...updates } });
  };

  const renderDimension = (
    dimension: SystemDimension,
    target: SelectionTarget,
    forceMultiselect: boolean,
  ) => {
    const value = selectedValue(target, dimension);
    const selectedValues = value.split(', ').filter(Boolean);
    const isMultiselect = forceMultiselect || !!dimension.multiselect;

    return (
      <div key={dimension.id} className="precision-row">
        <div className="precision-label">{dimension.name}</div>
        <div className="precision-selector">
          {(dimension.options || []).map(option => {
            const isSelected = isMultiselect ? selectedValues.includes(option) : value === option;
            return (
              <button
                key={option}
                onClick={() => isMultiselect
                  ? toggleMultiselect(target, dimension, option)
                  : setDimensionValue(target, dimension, option)}
                disabled={isLocked}
                className={`precision-opt ${isSelected ? 'selected' : ''} ${isLocked && !isSelected ? 'opacity-30 cursor-not-allowed' : ''}`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col fade-up phase-theme-3">
      {components.map((component, index) => {
        const display = component.display || 'dimensions';
        const isChecklist = display === 'checklist';
        const target: SelectionTarget = component.selectionTarget === 'liquidityContext'
          ? 'liquidityContext'
          : 'marketPulse';
        const nestedDimensions = component.dimensions || [];
        const options = component.options || [];
        const checked = checklists[component.id] || {};
        const done = options.filter((_, optionIndex) => checked[`drawing_${optionIndex + 1}`]).length;
        const isOpen = !!openComponents[component.id];

        return (
          <div key={component.id}>
            <TerminalComponentHeader
              title={component.name}
              count={isChecklist ? `${done}/${options.length}` : undefined}
              meta={component.duration}
              collapsible={isChecklist}
              open={isOpen}
              onToggle={() => setOpenComponents(current => ({ ...current, [component.id]: !current[component.id] }))}
              className={index > 0 ? 'is-spaced' : ''}
            />

            {isChecklist ? (
              <ChecklistRows
                open={isOpen}
                options={options}
                checked={checked}
                onToggle={id => toggleChecklist(component, id)}
              />
            ) : (
              nestedDimensions.map(dimension => renderDimension(dimension, target, display === 'multiselect'))
            )}
          </div>
        );
      })}

      <div className="terminal-action-bar">
        <textarea
          value={notes.marketPulse || ''}
          onChange={event => setNotes({ ...notes, marketPulse: event.target.value })}
          placeholder="Record Market Pulse observations…"
          disabled={isLocked}
          className="terminal-note flex-1"
        />
        <div className="terminal-action-buttons">
          <button onClick={() => { setEditing(true); editStep(3); }} className="btn-edit w-20" disabled={!isLocked}>Edit</button>
          <button
            onClick={() => {
              if (isLocked) return;
              setChecklists({});
              setSelections({ ...selections, marketPulse: {}, liquidityContext: {} });
            }}
            className="btn-reset w-20"
            disabled={isLocked || (Object.keys(marketPulse).length === 0 && Object.keys(liquidityContext).length === 0)}
          >
            Reset
          </button>
          <button
            onClick={() => {
              if (editing) setEditing(false);
              confirmMarketPulse();
            }}
            className={`${isLocked ? 'btn-confirmed' : 'btn-confirm'} w-40`}
            disabled={isLocked}
          >
            {isLocked ? '✓ Confirmed' : editing ? 'Save' : 'Confirm Pulse'}
          </button>
        </div>
      </div>
      {stepTimestamps.marketPulse && (
        <div className="text-right text-[9px] font-mono text-[var(--text-4)] mt-1">
          Locked: {stepTimestamps.marketPulse}
        </div>
      )}
    </div>
  );
}

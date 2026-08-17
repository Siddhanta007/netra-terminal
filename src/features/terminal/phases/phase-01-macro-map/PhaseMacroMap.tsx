// Hypothesis H1 — Super HTF and HTF evidence rendered from the shared system configuration.

import React, { useEffect, useMemo, useState } from 'react';
import { TerminalComponentHeader } from '@/components/UI/TerminalPrimitives';
import { useNetra } from '@/context/NetraContext';
import { SystemDimension } from '@/types';

const MONO: React.CSSProperties = { fontFamily: 'Space Grotesk, Inter, sans-serif' };

type H1SelectionTarget = 'preSessionContext' | 'htfStructure';

type SupplementalInput = {
  id: string;
  placeholder?: string;
  width?: string;
};

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
      marginBottom: '4px',
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
              background: isDone ? 'var(--phase-accent-bg)' : 'transparent',
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
            <span style={{ ...MONO, fontSize: '8px', fontWeight: 800, letterSpacing: '0.1em', color: isDone ? 'var(--phase-accent)' : 'var(--text-4)', flexShrink: 0 }}>
              {String(index + 1).padStart(2, '0')}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function HypothesisH1Components() {
  const { SYSTEM_DATA, selections, setSelections, highestStep, stepTimestamps } = useNetra();
  const components = useMemo(
    () => SYSTEM_DATA.hypothesisH1?.dimensions || [],
    [SYSTEM_DATA.hypothesisH1?.dimensions],
  );
  const [openComponents, setOpenComponents] = useState<Record<string, boolean>>({});
  const [checklists, setChecklists] = useState<Record<string, Record<string, boolean>>>({});

  const preSessionContext = selections.preSessionContext || {};
  const htfStructure = selections.htfStructure || {};
  const isLocked = highestStep > 2 || Boolean(
    stepTimestamps.hypothesisH1
    || stepTimestamps.htfStructure
    || stepTimestamps.preSessionContext
  );
  const checklistSelectionSignature = components
    .filter(component => component.display === 'checklist')
    .map(component => {
      const source = component.selectionTarget === 'preSessionContext' ? preSessionContext : htfStructure;
      return source[component.selectionIdKey || ''] || '';
    })
    .join('|');

  useEffect(() => {
    setChecklists(Object.fromEntries(
      components
        .filter(component => component.display === 'checklist')
        .map(component => {
          const source = component.selectionTarget === 'preSessionContext' ? preSessionContext : htfStructure;
          const selectedIds = String(source[component.selectionIdKey || ''] || '')
            .split(',')
            .map(value => value.trim())
            .filter(Boolean);
          return [component.id, Object.fromEntries(selectedIds.map(id => [id, true]))];
        }),
    ));
  }, [components, checklistSelectionSignature]);

  const sourceFor = (target: H1SelectionTarget) => (
    target === 'preSessionContext' ? preSessionContext : htfStructure
  );

  const setTargetValues = (target: H1SelectionTarget, values: Record<string, string>) => {
    if (isLocked) return;
    setSelections({ ...selections, [target]: { ...sourceFor(target), ...values } });
  };

  const selectedValue = (target: H1SelectionTarget, dimension: SystemDimension) => {
    const source = sourceFor(target);
    return source[dimension.id]
      || (dimension.selectionAliases || []).map(alias => source[alias]).find(Boolean)
      || '';
  };

  const setDimensionValue = (target: H1SelectionTarget, dimension: SystemDimension, value: string) => {
    const aliases = dimension.selectionAliases || [];
    setTargetValues(target, Object.fromEntries([dimension.id, ...aliases].map(key => [key, value])));
  };

  const toggleMultiselect = (target: H1SelectionTarget, dimension: SystemDimension, option: string) => {
    const currentValues = selectedValue(target, dimension).split(', ').filter(Boolean);
    const exclusiveOptions = dimension.exclusiveOptions || [];
    const nextValues = exclusiveOptions.includes(option)
      ? [option]
      : currentValues
          .filter(value => !exclusiveOptions.includes(value))
          .filter(value => value !== option)
          .concat(currentValues.includes(option) ? [] : option);
    setDimensionValue(target, dimension, nextValues.join(', '));
  };

  const toggleChecklist = (component: SystemDimension, id: string) => {
    if (isLocked) return;
    const current = checklists[component.id] || {};
    const next = { ...current, [id]: !current[id] };
    const selectedItems = (component.options || [])
      .map((label, index) => ({ id: `drawing_${index + 1}`, label }))
      .filter(item => next[item.id]);
    const values: Record<string, string> = {};
    if (component.selectionIdKey) values[component.selectionIdKey] = selectedItems.map(item => item.id).join(', ');
    if (component.selectionValueKey) values[component.selectionValueKey] = selectedItems.map(item => item.label).join(' | ');
    const target: H1SelectionTarget = component.selectionTarget === 'preSessionContext'
      ? 'preSessionContext'
      : 'htfStructure';
    setChecklists({ ...checklists, [component.id]: next });
    setTargetValues(target, values);
  };

  const renderDimension = (
    dimension: SystemDimension,
    target: H1SelectionTarget,
    forceMultiselect: boolean,
  ) => {
    const value = selectedValue(target, dimension);
    const selectedValues = value.split(', ').filter(Boolean);
    const isMultiselect = forceMultiselect || !!dimension.multiselect;
    const inputs = Array.isArray(dimension.inputs) ? dimension.inputs as SupplementalInput[] : [];

    return (
      <div key={dimension.id} className="precision-row flex items-center">
        <div className="precision-label">{dimension.name}</div>
        <div className="precision-selector flex-1">
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
        {inputs.length > 0 && (
          <div className="flex gap-2 ml-4">
            {inputs.map(input => (
              <input
                key={input.id}
                type="text"
                placeholder={input.placeholder}
                value={sourceFor(target)[input.id] || ''}
                onChange={event => setTargetValues(target, { [input.id]: event.target.value })}
                disabled={isLocked}
                className="terminal-inline-input"
                style={{ width: input.width || '80px' }}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col fade-up phase-theme-1">
      {components.map((component, index) => {
        const display = component.display || 'dimensions';
        const isChecklist = display === 'checklist';
        const target: H1SelectionTarget = component.selectionTarget === 'preSessionContext'
          ? 'preSessionContext'
          : 'htfStructure';
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
    </div>
  );
}

export function HypothesisH1Actions() {
  const {
    SYSTEM_DATA,
    selections, setSelections,
    notes, setNotes,
    highestStep, stepTimestamps,
    confirmHypothesisH1, editHypothesisH1,
  } = useNetra();

  const config = SYSTEM_DATA.hypothesisH1;
  const lockedAt = stepTimestamps.hypothesisH1
    || stepTimestamps.htfStructure
    || stepTimestamps.preSessionContext;
  const isLocked = highestStep > 2 || Boolean(lockedAt);
  const hasAnyData = Object.keys(selections.preSessionContext || {}).length > 0
    || Object.keys(selections.htfStructure || {}).length > 0;

  const handleReset = () => {
    if (isLocked) return;
    setSelections({ ...selections, preSessionContext: {}, htfStructure: {} });
    setNotes({ ...notes, preSessionContext: '', htfStructure: '' });
  };

  return (
    <>
      <div className="terminal-action-bar">
        <div className="flex-1 min-w-0">
          {(config?.notes || []).map(noteConfig => (
            <textarea
              key={noteConfig.selectionTarget}
              value={notes[noteConfig.selectionTarget] || ''}
              onChange={event => setNotes({ ...notes, [noteConfig.selectionTarget]: event.target.value })}
              placeholder={noteConfig.placeholder}
              disabled={isLocked}
              className="terminal-note"
            />
          ))}
        </div>
        <div className="terminal-action-buttons">
          <button onClick={editHypothesisH1} className="btn-edit w-20">Edit</button>
          <button onClick={handleReset} className="btn-reset w-20" disabled={isLocked || !hasAnyData}>Reset</button>
          <button
            onClick={confirmHypothesisH1}
            className={`${isLocked ? 'btn-confirmed' : 'btn-confirm'} w-44`}
            disabled={isLocked}
          >
            {isLocked ? `✓ ${config?.confirmedLabel || 'H1 Confirmed'}` : config?.confirmLabel || 'Confirm H1'}
          </button>
        </div>
      </div>
      {isLocked && lockedAt && (
        <div className="text-right text-[9px] font-mono text-[var(--text-4)] mt-1">
          Locked: {lockedAt}
        </div>
      )}
    </>
  );
}

import { Middleware } from '@reduxjs/toolkit';
import { saveState } from '../../utils/storage';

// Maps action type → localStorage key. Only listed keys are persisted.
const PERSIST_MAP: Record<string, string> = {
  'analysis/setHighestStep': 'highestStep',
  'analysis/setSelections': 'selections',
  'analysis/setNotes': 'notes',
  'analysis/setFinalCommand': 'finalCommand',
  'analysis/setCommandLocked': 'commandLocked',
  'analysis/setWeaponLocked': 'weaponLocked',
  'analysis/setInterSelections': 'interSelections',
  'analysis/setStrikeSelections': 'strikeSelections',
  'analysis/setSelectedWeaponId': 'selectedWeaponId',
  'analysis/setImageDescription': 'imageDescription',
  'analysis/setStepTimestamps': 'stepTimestamps',
  'model/setSelectedModel': 'selectedModel',
  'model/setVisionModel': 'visionModel',
  'model/setModelConfig': 'modelConfig',
  'session/setSession': 'session',
  'session/setActiveSessionId': 'activeSessionId',
  'ui/setDarkMode': 'darkMode',
};

export const localStorageMiddleware: Middleware = () => (next) => (action) => {
  const result = next(action);
  const actionType = (action as { type: string }).type;
  const key = PERSIST_MAP[actionType];
  if (key) {
    const payload = (action as { type: string; payload: unknown }).payload;
    saveState(key, payload);
  }
  return result;
};

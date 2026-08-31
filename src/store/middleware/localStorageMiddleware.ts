// Redux middleware — persists whitelisted analysis/session state to localStorage after each mapped action.

import { Middleware } from '@reduxjs/toolkit';
import { saveState } from '../../utils/storage';
import { SessionMeta } from '../../types';

interface RegistrySlice {
  sessions: SessionMeta[];
  activeId: string | null;
}
type StateWithRegistry = { sessionRegistry: RegistrySlice };
type StateWithChat = { chat: { sources: string[] } };

// Maps global/user-preference actions → localStorage keys. Terminal analysis
// belongs to the active Mongo session and must not leak through browser-global
// keys when the user switches sessions.
const PERSIST_MAP: Record<string, string> = {
  'model/setSelectedModel': 'selectedModel',
  'model/setVisionModel': 'visionModel',
  'model/setModelConfig': 'modelConfig',
  'session/setSession': 'session',
  'session/setActiveSessionId': 'activeSessionId',
  'ui/setDarkMode': 'darkMode',
  'chat/setSources': 'chatSources',
  'chat/setChatId': 'chatId',
};

// These actions persist the full derived state slice, not just the payload.
const REGISTRY_ACTIONS = new Set([
  'sessionRegistry/registerSession',
  'sessionRegistry/updateSession',
  'sessionRegistry/removeSession',
]);

export const localStorageMiddleware: Middleware = (storeAPI) => (next) => (action) => {
  const result = next(action);
  const actionType = (action as { type: string }).type;

  if (REGISTRY_ACTIONS.has(actionType)) {
    const state = storeAPI.getState() as StateWithRegistry;
    saveState('sessionRegistry', state.sessionRegistry.sessions);
    return result;
  }
  if (actionType === 'sessionRegistry/setActiveRegistryId') {
    const state = storeAPI.getState() as StateWithRegistry;
    saveState('sessionRegistryActiveId', state.sessionRegistry.activeId);
    saveState('sessionRegistry', state.sessionRegistry.sessions);
    return result;
  }
  if (actionType === 'chat/toggleSource') {
    const state = storeAPI.getState() as StateWithChat;
    saveState('chatSources', state.chat.sources);
    return result;
  }
  const key = PERSIST_MAP[actionType];
  if (key) {
    const payload = (action as { type: string; payload: unknown }).payload;
    saveState(key, payload);
  }
  return result;
};

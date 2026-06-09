// Redux slice — the registry of saved trade sessions (the fork/branch tree) and the active one.

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SessionMeta } from '../../types';
import { loadState } from '../../utils/storage';

interface SessionRegistryState {
  sessions: SessionMeta[];
  activeId: string | null;
}

const initialState: SessionRegistryState = {
  sessions: loadState<SessionMeta[]>('sessionRegistry', []),
  activeId: loadState<string | null>('sessionRegistryActiveId', null),
};

const sessionRegistrySlice = createSlice({
  name: 'sessionRegistry',
  initialState,
  reducers: {
    registerSession(state, action: PayloadAction<SessionMeta>) {
      const exists = state.sessions.findIndex(s => s.id === action.payload.id);
      if (exists >= 0) {
        state.sessions[exists] = action.payload;
      } else {
        state.sessions.unshift(action.payload);
      }
    },
    updateSession(state, action: PayloadAction<Partial<SessionMeta> & { id: string }>) {
      const idx = state.sessions.findIndex(s => s.id === action.payload.id);
      if (idx >= 0) {
        state.sessions[idx] = { ...state.sessions[idx], ...action.payload };
      }
    },
    removeSession(state, action: PayloadAction<string>) {
      state.sessions = state.sessions.filter(s => s.id !== action.payload);
    },
    setActiveRegistryId(state, action: PayloadAction<string | null>) {
      state.activeId = action.payload;
      // Mark formerly-active sessions as open
      state.sessions.forEach(s => {
        if (s.status === 'active' && s.id !== action.payload) {
          s.status = 'open';
        }
      });
      // Mark newly-active session
      const idx = state.sessions.findIndex(s => s.id === action.payload);
      if (idx >= 0) state.sessions[idx].status = 'active';
    },
  },
});

export const { registerSession, updateSession, removeSession, setActiveRegistryId } = sessionRegistrySlice.actions;
export default sessionRegistrySlice.reducer;

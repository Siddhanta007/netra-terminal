// Redux slice — the active trading session: asset/user metadata, login + guest flags, and the session input form.

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { loadState } from '../../utils/storage';
import { Session, SessionInput } from '../../types';

interface TokenClaims {
  sub?: string;
  role?: string;
  allowed_models?: string[];
  allowed_tiers?: string[];
  allowed_pages?: string[];
  allowed_teams?: string[];
}

interface SessionState {
  session: Session | null;
  activeSessionId: string | null;
  isLoggingIn: boolean;
  sessionInput: SessionInput;
}

const decodeTokenClaims = (): TokenClaims | null => {
  try {
    const token = localStorage.getItem('netra_token');
    const payload = token?.split('.')[1];
    if (!payload) return null;

    const padded = payload.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(payload.length / 4) * 4, '=');
    return JSON.parse(atob(padded)) as TokenClaims;
  } catch {
    return null;
  }
};

const pickArray = (
  nextValue: string[] | undefined,
  previousValue: string[] | undefined,
  claimValue: string[] | undefined,
): string[] | undefined => {
  if (Array.isArray(nextValue) && nextValue.length > 0) return nextValue;
  if (Array.isArray(previousValue) && previousValue.length > 0) return previousValue;
  if (Array.isArray(claimValue) && claimValue.length > 0) return claimValue;
  if (Array.isArray(nextValue)) return nextValue;
  if (Array.isArray(previousValue)) return previousValue;
  return claimValue;
};

const normalizeSession = (next: Session | null, previous?: Session | null): Session | null => {
  if (!next) return null;

  const claims = decodeTokenClaims();
  const claimModels = claims?.allowed_models || claims?.allowed_tiers;

  return {
    ...previous,
    ...next,
    userName: next.userName || previous?.userName || claims?.sub || 'User',
    displayName: next.displayName || previous?.displayName,
    email: next.email || previous?.email,
    phone: next.phone || previous?.phone,
    broker: next.broker || previous?.broker,
    groups: next.groups || previous?.groups,
    role: next.role || previous?.role || claims?.role,
    allowedModels: pickArray(next.allowedModels, previous?.allowedModels, claimModels),
    allowedPages: pickArray(next.allowedPages, previous?.allowedPages, claims?.allowed_pages),
    allowedTeams: pickArray(next.allowedTeams, previous?.allowedTeams, claims?.allowed_teams),
  };
};

const persistedSession = loadState<Session | null>('session', null);
const persistedActiveSessionId = loadState<string | number | null>('activeSessionId', null);

const initialState: SessionState = {
  session: normalizeSession(persistedSession),
  activeSessionId: persistedActiveSessionId == null ? null : String(persistedActiveSessionId),
  isLoggingIn: false,
  sessionInput: {
    userName: '',
    password: '',
    assetName: '',
    tradeName: '',
    marketType: 'TRENDING',
    modelName: 'pinaka',
    assetClass: 'Index',
  },
};

export const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setSession: (state, action: PayloadAction<Session | null>) => {
      state.session = normalizeSession(action.payload, state.session);
    },
    setActiveSessionId: (state, action: PayloadAction<string | null>) => {
      state.activeSessionId = action.payload;
    },
    setIsLoggingIn: (state, action: PayloadAction<boolean>) => {
      state.isLoggingIn = action.payload;
    },
    setSessionInput: (state, action: PayloadAction<SessionInput>) => {
      state.sessionInput = action.payload;
    },
  },
});

export const {
  setSession,
  setActiveSessionId,
  setIsLoggingIn,
  setSessionInput,
} = sessionSlice.actions;

export default sessionSlice.reducer;

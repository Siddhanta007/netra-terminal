import { createSlice } from '@reduxjs/toolkit';
import { loadState, saveState } from '../../utils/storage';

const getInitialPrepStep = () => {
  const s = loadState('session', null);
  if (!s) return 0;
  const activeId = loadState('activeSessionId', null);
  return activeId ? 2 : 1;
};

const initialState = {
  darkMode: loadState('darkMode', false),
  activeView: 'terminal',
  isProfileOpen: false,
  isMobileMenuOpen: false,
  isAiPaneOpen: false,
  toast: null,
  confirmModal: null,
  prepStep: getInitialPrepStep(),
  isLoggerOpen: false,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setDarkMode: (state, action) => {
      state.darkMode = action.payload;
      saveState('darkMode', action.payload);
    },
    setActiveView: (state, action) => {
      state.activeView = action.payload;
    },
    setProfileOpen: (state, action) => {
      state.isProfileOpen = action.payload;
    },
    setMobileMenuOpen: (state, action) => {
      state.isMobileMenuOpen = action.payload;
    },
    setAiPaneOpen: (state, action) => {
      state.isAiPaneOpen = action.payload;
    },
    setToast: (state, action) => {
      state.toast = action.payload;
    },
    setConfirmModal: (state, action) => {
      state.confirmModal = action.payload;
    },
    setPrepStep: (state, action) => {
      state.prepStep = action.payload;
    },
    setIsLoggerOpen: (state, action) => {
      state.isLoggerOpen = action.payload;
    },
  },
});

export const { 
  setDarkMode, 
  setActiveView, 
  setProfileOpen, 
  setMobileMenuOpen, 
  setAiPaneOpen, 
  setToast, 
  setConfirmModal, 
  setPrepStep,
  setIsLoggerOpen
} = uiSlice.actions;

export default uiSlice.reducer;

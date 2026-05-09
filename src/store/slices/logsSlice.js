import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  tradeLogs: [],
  logSearchTerm: '',
  logFilterOutcome: 'ALL',
  logSortOrder: 'DESC',
  activeEditLog: null,
  editFormData: {},
  tradeName: '',
  auditData: null,
  isAuditing: false,
};

export const logsSlice = createSlice({
  name: 'logs',
  initialState,
  reducers: {
    setTradeLogs: (state, action) => {
      state.tradeLogs = action.payload;
    },
    setLogSearchTerm: (state, action) => {
      state.logSearchTerm = action.payload;
    },
    setLogFilterOutcome: (state, action) => {
      state.logFilterOutcome = action.payload;
    },
    setLogSortOrder: (state, action) => {
      state.logSortOrder = action.payload;
    },
    setActiveEditLog: (state, action) => {
      state.activeEditLog = action.payload;
    },
    setEditFormData: (state, action) => {
      state.editFormData = action.payload;
    },
    setTradeName: (state, action) => {
      state.tradeName = action.payload;
    },
    setAuditData: (state, action) => {
      state.auditData = action.payload;
    },
    setIsAuditing: (state, action) => {
      state.isAuditing = action.payload;
    },
  },
});

export const { 
  setTradeLogs, 
  setLogSearchTerm, 
  setLogFilterOutcome, 
  setLogSortOrder, 
  setActiveEditLog, 
  setEditFormData, 
  setTradeName,
  setAuditData,
  setIsAuditing
} = logsSlice.actions;

export default logsSlice.reducer;

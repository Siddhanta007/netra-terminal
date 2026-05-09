import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  chatHistory: [
    { role: 'ai', text: 'Tactical Uplink Established. Standing by for parameters.' }
  ],
  chatInput: '',
  isAiLoading: false,
  includeData: false,
  includeDoctrine: false,
};

export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setChatHistory: (state, action) => {
      state.chatHistory = action.payload;
    },
    appendChatMessage: (state, action) => {
      state.chatHistory.push(action.payload);
    },
    setChatInput: (state, action) => {
      state.chatInput = action.payload;
    },
    setIsAiLoading: (state, action) => {
      state.isAiLoading = action.payload;
    },
    setIncludeData: (state, action) => {
      state.includeData = action.payload;
    },
    setIncludeDoctrine: (state, action) => {
      state.includeDoctrine = action.payload;
    },
  },
});

export const { 
  setChatHistory, 
  appendChatMessage, 
  setChatInput, 
  setIsAiLoading, 
  setIncludeData, 
  setIncludeDoctrine 
} = chatSlice.actions;

export default chatSlice.reducer;

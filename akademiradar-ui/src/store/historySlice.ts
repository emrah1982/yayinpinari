import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SearchHistory, ViewedDocument } from '../types';

interface HistoryState {
    searchHistory: SearchHistory[];
    viewedDocuments: ViewedDocument[];
}

const initialState: HistoryState = {
    searchHistory: [],
    viewedDocuments: []
};

const historySlice = createSlice({
    name: 'history',
    initialState,
    reducers: {
        addSearchHistory: (state, action: PayloadAction<SearchHistory>) => {
            state.searchHistory.unshift(action.payload);
        },
        addViewedDocument: (state, action: PayloadAction<ViewedDocument>) => {
            state.viewedDocuments.unshift(action.payload);
        },
        clearSearchHistory: (state) => {
            state.searchHistory = [];
        },
        clearViewedDocuments: (state) => {
            state.viewedDocuments = [];
        }
    }
});

export const { 
    addSearchHistory, 
    addViewedDocument, 
    clearSearchHistory, 
    clearViewedDocuments 
} = historySlice.actions;

export default historySlice.reducer;

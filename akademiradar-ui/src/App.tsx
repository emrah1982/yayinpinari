import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Provider } from 'react-redux';
import { store } from './store';
import Navbar from './components/Navbar';
import HomePage from './components/HomePage';
import SearchHistoryPage from './components/SearchHistoryPage';
import ViewedDocumentsPage from './components/ViewedDocumentsPage';
import CitationTest from './components/CitationTest';
import TrendAnalysis from './pages/TrendAnalysis';
import AuthorSearch from './pages/AuthorSearch';
import LiteratureGapAnalysis from './pages/LiteratureGapAnalysis';
import LibrarySearch from './pages/LibrarySearch';

// Türkçe karakterleri destekleyen modern bir tema
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Navbar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/search-history" element={<SearchHistoryPage />} />
            <Route path="/viewed-documents" element={<ViewedDocumentsPage />} />
            <Route path="/citation-test" element={<CitationTest />} />
            <Route path="/trend-analysis" element={<TrendAnalysis />} />
            <Route path="/author-search" element={<AuthorSearch />} />
            <Route path="/literature-gap" element={<LiteratureGapAnalysis />} />
            <Route path="/library-search" element={<LibrarySearch />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </Provider>
  );
}

export default App;

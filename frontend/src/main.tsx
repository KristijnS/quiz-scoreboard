import React, { useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { BrowserRouter } from 'react-router-dom';

function Main() {
  const [darkMode, setDarkMode] = useState(true);
  const theme = useMemo(() => createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      ...(darkMode ? {
        primary: {
          main: '#90caf9',  // Lighter, more vibrant blue
          dark: '#42a5f5',
          light: '#e3f2fd',
        },
        secondary: {
          main: '#ce93d8',  // Vibrant purple
          dark: '#ab47bc',
          light: '#f3e5f5',
        },
        background: {
          default: '#1a1a1a',  // Slightly darker than default
          paper: '#2d2d2d',    // Slightly darker than default
        },
        success: {
          main: '#81c784',  // Brighter green
          dark: '#388e3c',
        },
        error: {
          main: '#f48fb1',  // Softer red
          dark: '#d81b60',
        },
        info: {
          main: '#64b5f6',  // Brighter blue
          dark: '#1976d2',
        },
        warning: {
          main: '#ffb74d',  // Brighter orange
          dark: '#f57c00',
        },
        text: {
          primary: '#ffffff',
          secondary: 'rgba(255, 255, 255, 0.7)',
        },
        divider: 'rgba(255, 255, 255, 0.12)',
      } : {}),
    },
    components: {
      ...(darkMode ? {
        MuiButton: {
          styleOverrides: {
            contained: {
              backgroundColor: '#90caf9',
              color: '#000000',
              '&:hover': {
                backgroundColor: '#42a5f5',
              },
            },
            outlined: {
              borderColor: '#90caf9',
              color: '#90caf9',
              '&:hover': {
                borderColor: '#42a5f5',
                color: '#42a5f5',
              },
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: 'none',
            },
          },
        },
        MuiTableCell: {
          styleOverrides: {
            root: {
              borderColor: 'rgba(255, 255, 255, 0.12)',
            },
          },
        },
      } : {}),
    },
  }), [darkMode]);

  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <App darkMode={darkMode} setDarkMode={setDarkMode} />
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>
);

import { AppBar, Toolbar, Typography, Switch, Box, Button, Menu, MenuItem, IconButton } from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useState, MouseEvent, useEffect, useCallback } from 'react';
import StartQuiz from './pages/StartQuiz';
import CreateQuiz from './pages/CreateQuiz';
import LoadQuiz from './pages/LoadQuiz';
import Scoreboard from './pages/Scoreboard';
import QuizManagement from './pages/QuizManagement';
import AddScore from './pages/AddScore';
import ChartView from './pages/ChartView';
import { quizApi } from './services/api';
import { Quiz } from './types';

interface AppProps {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
}

// Import app icon from the electron folder (bundled during build)
import appIcon from '../../electron/scoreboard_icon_crown.svg';

function App({ darkMode, setDarkMode }: AppProps) {
  // Get current quiz id from URL if present
  const location = useLocation();
  const match = location.pathname.match(/\/quiz\/(\d+)/);
  const quizId = match ? match[1] : '';
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);
  const [quiz, setQuiz] = useState<Quiz | null>(null);

  // Load quiz data when quizId changes
  useEffect(() => {
    if (quizId) {
      quizApi.get(parseInt(quizId, 10)).then(setQuiz).catch(() => setQuiz(null));
    } else {
      setQuiz(null);
    }
  }, [quizId]);

  const handleMenuClick = useCallback((event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleMenuNavigate = useCallback((path: string) => {
    navigate(path);
    setAnchorEl(null);
  }, [navigate]);

  // Helper to check if route is active
  const isActive = (path: string) => location.pathname === path;

  return (
    <Box>
      <AppBar 
        position="sticky" 
        color={darkMode ? 'transparent' : 'primary'}
        sx={{
          bgcolor: darkMode ? '#2d2d2d' : undefined,
          backgroundImage: 'none'
        }}
      >
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box component="img" src={appIcon} alt="App icon" sx={{ width: 28, height: 28, display: 'block' }} />
            <Typography variant="h6" sx={{ mr: 2, color: darkMode ? '#90caf9' : undefined }}>
              {quiz ? quiz.name : 'Quiz Scoreboard'}
            </Typography>
            <Button
              color={darkMode ? 'primary' : 'inherit'}
              disabled={!quizId}
              variant={isActive(`/quiz/${quizId}`) ? 'contained' : 'text'}
              onClick={() => navigate(`/quiz/${quizId}`)}
              sx={{
                borderRadius: 0,
                ...(isActive(`/quiz/${quizId}`) && darkMode && { 
                  bgcolor: 'rgba(144, 202, 249, 0.2)',
                  color: '#90caf9',
                  boxShadow: 'none'
                }),
                ...(isActive(`/quiz/${quizId}`) && !darkMode && { 
                  bgcolor: '#e3f2fd',
                  color: '#1976d2',
                  boxShadow: 'none'
                }),
                '&:hover': darkMode ? {
                  bgcolor: 'rgba(144, 202, 249, 0.2)',
                  color: '#90caf9'
                } : {
                  bgcolor: '#e3f2fd',
                  color: '#1976d2'
                }
              }}
            >Scoreboard</Button>
            <Button
              color={darkMode ? 'primary' : 'inherit'}
              disabled={!quizId}
              variant={isActive(`/quiz/${quizId}/score`) ? 'contained' : 'text'}
              onClick={() => navigate(`/quiz/${quizId}/score`)}
              sx={{
                borderRadius: 0,
                ...(isActive(`/quiz/${quizId}/score`) && darkMode && { 
                  bgcolor: 'rgba(144, 202, 249, 0.2)',
                  color: '#90caf9',
                  boxShadow: 'none'
                }),
                ...(isActive(`/quiz/${quizId}/score`) && !darkMode && { 
                  bgcolor: '#e3f2fd',
                  color: '#1976d2',
                  boxShadow: 'none'
                }),
                '&:hover': darkMode ? {
                  bgcolor: 'rgba(144, 202, 249, 0.2)',
                  color: '#90caf9'
                } : {
                  bgcolor: '#e3f2fd',
                  color: '#1976d2'
                }
              }}
            >Manage Score</Button>
            <Button
              color={darkMode ? 'primary' : 'inherit'}
              disabled={!quizId}
              variant={isActive(`/quiz/${quizId}/chart`) ? 'contained' : 'text'}
              onClick={() => navigate(`/quiz/${quizId}/chart`)}
              sx={{
                borderRadius: 0,
                ...(isActive(`/quiz/${quizId}/chart`) && darkMode && { 
                  bgcolor: 'rgba(144, 202, 249, 0.2)',
                  color: '#90caf9',
                  boxShadow: 'none'
                }),
                ...(isActive(`/quiz/${quizId}/chart`) && !darkMode && { 
                  bgcolor: '#e3f2fd',
                  color: '#1976d2',
                  boxShadow: 'none'
                }),
                '&:hover': darkMode ? {
                  bgcolor: 'rgba(144, 202, 249, 0.2)',
                  color: '#90caf9'
                } : {
                  bgcolor: '#e3f2fd',
                  color: '#1976d2'
                }
              }}
            >Chart</Button>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton
            onClick={handleMenuClick}
            color={darkMode ? 'primary' : 'inherit'}
            sx={{
              color: darkMode ? '#90caf9' : undefined,
              '&:hover': darkMode ? {
                bgcolor: 'rgba(144, 202, 249, 0.2)'
              } : undefined
            }}
          >
            <SettingsIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={menuOpen}
            onClose={handleMenuClose}
            PaperProps={{
              sx: {
                bgcolor: darkMode ? '#2d2d2d' : undefined,
                color: darkMode ? '#90caf9' : undefined
              }
            }}
          >
            <MenuItem 
              onClick={() => handleMenuNavigate('/create')}
              sx={darkMode ? {
                '&:hover': {
                  bgcolor: 'rgba(144, 202, 249, 0.2)'
                }
              } : {}}
            >
              Create New Quiz
            </MenuItem>
            <MenuItem 
              onClick={() => handleMenuNavigate('/load')}
              sx={darkMode ? {
                '&:hover': {
                  bgcolor: 'rgba(144, 202, 249, 0.2)'
                }
              } : {}}
            >
              Load Quiz
            </MenuItem>
            {quizId && (
              <MenuItem 
                onClick={() => handleMenuNavigate(`/quiz/${quizId}/manage`)}
                sx={darkMode ? {
                  '&:hover': {
                    bgcolor: 'rgba(144, 202, 249, 0.2)'
                  }
                } : {}}
              >
                Manage Quiz
              </MenuItem>
            )}
            <MenuItem 
              onClick={(e) => {
                e.stopPropagation();
              }}
              sx={darkMode ? {
                '&:hover': {
                  bgcolor: 'rgba(144, 202, 249, 0.2)'
                },
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              } : {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Typography variant="body2">
                {darkMode ? 'Dark' : 'Light'} mode
              </Typography>
              <Switch
                checked={darkMode}
                onChange={e => setDarkMode(e.target.checked)}
                onClick={(e) => e.stopPropagation()}
                color={darkMode ? 'primary' : 'default'}
                inputProps={{ 'aria-label': 'toggle dark mode' }}
                sx={{
                  ml: 2,
                  '& .MuiSwitch-thumb': {
                    color: darkMode ? '#90caf9' : undefined,
                  },
                  '& .MuiSwitch-track': {
                    backgroundColor: darkMode ? '#90caf9 !important' : undefined,
                    opacity: darkMode ? 0.3 : undefined,
                  },
                }}
              />
            </MenuItem>
            <MenuItem 
              onClick={(e) => { e.stopPropagation(); }}
              sx={darkMode ? {
                '&:hover': { bgcolor: 'rgba(144, 202, 249, 0.2)' },
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              } : { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <Typography variant="body2">Developer Tools</Typography>
              <Switch
                checked={(() => {
                  try { return localStorage.getItem('devToolsEnabled') === 'true'; } catch { return false; }
                })()}
                onChange={(e) => {
                  const enabled = e.target.checked;
                  try { localStorage.setItem('devToolsEnabled', enabled ? 'true' : 'false'); } catch {}
                  // Call into preload to toggle devtools
                  if ((window as any).electron && typeof (window as any).electron.toggleDevTools === 'function') {
                    (window as any).electron.toggleDevTools(enabled);
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                color={darkMode ? 'primary' : 'default'}
                inputProps={{ 'aria-label': 'toggle devtools' }}
              />
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Routes>
        <Route path="/" element={<StartQuiz />} />
        <Route path="/create" element={<CreateQuiz />} />
        <Route path="/load" element={<LoadQuiz />} />
        <Route path="/quiz/:id" element={<Scoreboard />} />
        <Route path="/quiz/:id/manage" element={<QuizManagement />} />
        <Route path="/quiz/:id/score" element={<AddScore />} />
        <Route path="/quiz/:id/chart" element={<ChartView />} />
      </Routes>
    </Box>
  );
}

export default App;
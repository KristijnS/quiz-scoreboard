import { useState } from 'react';
import { Box, Typography, TextField, Button, Switch, FormControlLabel, Container, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { mockApi } from '../services/api';

/**
 * GenerateMockQuiz Page
 *
 * Allows users to generate a mock quiz with specified parameters:
 * - Number of teams (default: 8)
 * - Number of rounds (default: 5)
 * - Whether to generate random scores for each team/round combination
 * 
 * When generated, the user is automatically navigated to the new quiz scoreboard.
 */
export default function GenerateMockQuiz() {
  const [teams, setTeams] = useState<number>(8);
  const [rounds, setRounds] = useState<number>(5);
  const [withScores, setWithScores] = useState<boolean>(true);
  const [useStandardScale, setUseStandardScale] = useState<boolean>(false);
  const [standardScale, setStandardScale] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  /**
   * Create mock quiz by calling backend API
   * POST /api/mock/generate with { teams, rounds, withScores, useStandardScale, standardScale }
   */
  const createMock = async () => {
    setLoading(true);
    try {
      const data = await mockApi.generate(teams, rounds, withScores, useStandardScale, standardScale);
      
      // Navigate to the newly created quiz scoreboard
      if (data && data.quizId) {
        navigate(`/quiz/${data.quizId}`);
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to create mock quiz. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Generate Mock Quiz
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Create a test quiz with random teams and rounds for demonstration or testing purposes.
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 3 }}>
          <TextField 
            label="Number of Teams" 
            type="number" 
            value={teams} 
            onChange={e => setTeams(Math.max(1, Number(e.target.value)))}
            helperText="How many teams should participate?"
            fullWidth
          />
          
          <TextField 
            label="Number of Rounds" 
            type="number" 
            value={rounds} 
            onChange={e => setRounds(Math.max(1, Number(e.target.value)))}
            helperText="How many rounds/questions in the quiz?"
            fullWidth
          />
          
          <FormControlLabel 
            control={
              <Switch 
                checked={withScores} 
                onChange={e => setWithScores(e.target.checked)} 
              />
            } 
            label="Generate random scores for each team" 
          />
          
          <FormControlLabel 
            control={
              <Switch 
                checked={useStandardScale} 
                onChange={e => setUseStandardScale(e.target.checked)} 
              />
            } 
            label="Use variable max scores with standard scale conversion" 
          />
          
          {useStandardScale && (
            <TextField 
              label="Standard Scale" 
              type="number" 
              value={standardScale} 
              onChange={e => setStandardScale(Math.max(1, Number(e.target.value)))}
              helperText="Rounds will have variable max scores (e.g., 5, 10, 15, 20)"
              fullWidth
            />
          )}
          
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button 
              variant="contained" 
              onClick={createMock}
              disabled={loading}
              fullWidth
            >
              {loading ? 'Generating...' : 'Generate Mock Quiz'}
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => navigate('/')}
              disabled={loading}
              fullWidth
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}

import { useEffect, useState, useMemo, useCallback, memo } from 'react';
import {
    Container,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField
} from '@mui/material';
import { Round } from '../types';
import { scoreApi } from '../services/api';
import { useQuiz } from '../context/QuizContext';

function AddScore() {
    const { quiz } = useQuiz();
    const [selectedRound, setSelectedRound] = useState<Round | null>(null);
    const [scores, setScores] = useState<{ [key: string]: string }>({});
    const [errors, setErrors] = useState<{ [key: string]: string | null }>({});

    // Set initial round when quiz loads
    useEffect(() => {
        if (!quiz) return;
        const sortedRounds = (quiz.rounds || []).slice().sort((a, b) => a.nr - b.nr);
        if (sortedRounds.length > 0 && !selectedRound) {
            const key = `lastRound_quiz_${quiz.id}`;
            const saved = localStorage.getItem(key);
            const savedRound = saved ? sortedRounds.find(r => r.id === parseInt(saved, 10)) : null;
            setSelectedRound(savedRound || sortedRounds[0]);
        }
    }, [quiz, selectedRound]);

    useEffect(() => {
        if (selectedRound) loadScores();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedRound]);

    const loadScores = useCallback(async () => {
        if (!selectedRound || !quiz) return;
        const data = await scoreApi.getForRound(selectedRound.id);
        const newScores: { [key: string]: string } = {};
        quiz.teamQuizzes.forEach(tq => {
            const score = data.find(s => s.teamQuiz.id === tq.id);
            newScores[tq.id] = score ? score.points.toString() : '0';
        });
        setScores(newScores);
    }, [selectedRound, quiz]);

    const handleScoreChange = useCallback(async (teamQuizId: number, value: string) => {
        if (!selectedRound) return;
        const points = parseInt(value, 10);

        // empty or invalid numeric input -> treat as 0 locally but don't submit
        if (Number.isNaN(points)) {
            setScores(prev => ({ ...prev, [teamQuizId]: value }));
            setErrors(prev => ({ ...prev, [teamQuizId]: null }));
            return;
        }

        if (points < 0) {
            setErrors(prev => ({ ...prev, [teamQuizId]: 'Points cannot be negative' }));
            setScores(prev => ({ ...prev, [teamQuizId]: value }));
            return;
        }

        if (points > selectedRound.maxScore) {
            setErrors(prev => ({ ...prev, [teamQuizId]: `Cannot exceed max (${selectedRound.maxScore})` }));
            setScores(prev => ({ ...prev, [teamQuizId]: value }));
            return;
        }

        // valid value
        setErrors(prev => ({ ...prev, [teamQuizId]: null }));
        try {
            await scoreApi.update(selectedRound.id, teamQuizId, points);
            setScores(prev => ({ ...prev, [teamQuizId]: value }));
        } catch (err) {
            // show generic error on failure
            setErrors(prev => ({ ...prev, [teamQuizId]: 'Failed to save score' }));
        }
    }, [selectedRound]);

    // persist selected round for this quiz so returning restores last choice
    useEffect(() => {
        if (!selectedRound || !quiz) return;
        const key = `lastRound_quiz_${quiz.id}`;
        try {
            localStorage.setItem(key, String(selectedRound.id));
        } catch (e) {
            // ignore storage errors
        }
    }, [selectedRound, quiz]);

    // Memoize sorted rounds to avoid sorting on every render
    const sortedRounds = useMemo(() => {
        if (!quiz) return [];
        return [...quiz.rounds].sort((a, b) => a.nr - b.nr);
    }, [quiz]);

    // Memoize sorted teams to avoid sorting on every render
    const sortedTeams = useMemo(() => {
        if (!quiz) return [];
        return [...quiz.teamQuizzes].sort((a, b) => a.nr - b.nr);
    }, [quiz]);

    // Memoize min/max round numbers
    const roundBounds = useMemo(() => {
        if (!sortedRounds.length) return { min: 0, max: 0 };
        return {
            min: Math.min(...sortedRounds.map(r => r.nr)),
            max: Math.max(...sortedRounds.map(r => r.nr))
        };
    }, [sortedRounds]);

    // Memoize previous/next round handlers
    const handlePrevRound = useCallback(() => {
        if (!selectedRound) return;
        const idx = sortedRounds.findIndex(r => r.id === selectedRound.id);
        if (idx > 0) setSelectedRound(sortedRounds[idx - 1]);
    }, [selectedRound, sortedRounds]);

    const handleNextRound = useCallback(() => {
        if (!selectedRound) return;
        const idx = sortedRounds.findIndex(r => r.id === selectedRound.id);
        if (idx < sortedRounds.length - 1) setSelectedRound(sortedRounds[idx + 1]);
    }, [selectedRound, sortedRounds]);

    const handleRoundChange = useCallback((roundId: number) => {
        const round = sortedRounds.find(r => r.id === roundId);
        setSelectedRound(round || null);
    }, [sortedRounds]);

    if (!quiz) return null;

    return (
        <Container maxWidth="md">
            <Box sx={{ mt: 4, mb: 4 }}>
                <Box sx={{ mb: 3, display: 'flex', alignItems: 'stretch', gap: 1 }}>
                    <Button
                        variant="outlined"
                        disabled={!sortedRounds.length || !selectedRound || selectedRound.nr === roundBounds.min}
                        onClick={handlePrevRound}
                        sx={{ minWidth: '56px', height: '56px' }}
                    >&lt;</Button>

                    <FormControl fullWidth>
                        <InputLabel>Select Round</InputLabel>
                        <Select
                            value={selectedRound?.id || ''}
                            onChange={(e) => handleRoundChange(e.target.value as number)}
                            label="Select Round"
                        >
                            {sortedRounds.map((round) => (
                                <MenuItem key={round.id} value={round.id}>
                                    {`Round ${round.nr}: ${round.title} (max: ${round.maxScore})`}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Button
                        variant="outlined"
                        disabled={!sortedRounds.length || !selectedRound || selectedRound.nr === roundBounds.max}
                        onClick={handleNextRound}
                        sx={{ minWidth: '56px', height: '56px' }}
                    >&gt;</Button>
                </Box>

                {selectedRound && (
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell width="8%">Nr</TableCell>
                                    <TableCell>Team</TableCell>
                                    <TableCell align="right">Score</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {sortedTeams.map((teamQuiz) => (
                                    <TableRow key={teamQuiz.id}>
                                        <TableCell>{teamQuiz.nr}</TableCell>
                                        <TableCell>{teamQuiz.team.name}</TableCell>
                                        <TableCell align="right">
                                            <TextField
                                                type="number"
                                                size="small"
                                                value={scores[teamQuiz.id] || '0'}
                                                onChange={(e) => handleScoreChange(teamQuiz.id, e.target.value)}
                                                inputProps={{
                                                    min: 0,
                                                    max: selectedRound.maxScore
                                                }}
                                                error={!!errors[teamQuiz.id]}
                                                helperText={errors[teamQuiz.id] || ''}
                                                sx={{ width: 120 }}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Box>
        </Container>
    );
}

export default memo(AddScore);
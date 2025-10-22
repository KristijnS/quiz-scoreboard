import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
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
import { Quiz, Round } from '../types';
import { quizApi, scoreApi } from '../services/api';

export default function AddScore() {
    const { id } = useParams();
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [selectedRound, setSelectedRound] = useState<Round | null>(null);
    const [scores, setScores] = useState<{ [key: string]: string }>({});
    const [errors, setErrors] = useState<{ [key: string]: string | null }>({});

    useEffect(() => {
        if (id) loadQuiz();
    }, [id]);

    useEffect(() => {
        if (selectedRound) loadScores();
    }, [selectedRound]);

    const loadQuiz = async () => {
        if (!id) return;
        const quizId = parseInt(id, 10);
        if (isNaN(quizId)) {
            console.error('Invalid quiz ID');
            return;
        }
        const data = await quizApi.get(quizId);
        setQuiz(data);
        // restore last selected round for this quiz from localStorage, or default to first round
        const sortedRounds = (data.rounds || []).slice().sort((a, b) => a.nr - b.nr);
        if (sortedRounds.length > 0) {
            const key = `lastRound_quiz_${data.id}`;
            const saved = localStorage.getItem(key);
            const savedRound = saved ? sortedRounds.find(r => r.id === parseInt(saved, 10)) : null;
            setSelectedRound(savedRound || sortedRounds[0]);
        }
    };

    const loadScores = async () => {
        if (!selectedRound) return;
        const data = await scoreApi.getForRound(selectedRound.id);
        const newScores: { [key: string]: string } = {};
        quiz?.teamQuizzes.forEach(tq => {
            const score = data.find(s => s.teamQuiz.id === tq.id);
            newScores[tq.id] = score ? score.points.toString() : '0';
        });
        setScores(newScores);
    };

    const handleScoreChange = async (teamQuizId: number, value: string) => {
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
    };

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

    if (!quiz) return null;

    return (
        <Container maxWidth="md">
            <Box sx={{ mt: 4, mb: 4 }}>
                <Box sx={{ mb: 3, display: 'flex', alignItems: 'stretch', gap: 1 }}>
                    <Button
                        variant="outlined"
                        disabled={!quiz.rounds.length || !selectedRound || selectedRound.nr === Math.min(...quiz.rounds.map(r => r.nr))}
                        onClick={() => {
                            if (!selectedRound) return;
                            const sorted = [...quiz.rounds].sort((a, b) => a.nr - b.nr);
                            const idx = sorted.findIndex(r => r.id === selectedRound.id);
                            if (idx > 0) setSelectedRound(sorted[idx - 1]);
                        }}
                        sx={{ minWidth: '56px', height: '56px' }}
                    >&lt;</Button>

                    <FormControl fullWidth>
                        <InputLabel>Select Round</InputLabel>
                        <Select
                            value={selectedRound?.id || ''}
                            onChange={(e) => {
                                const round = quiz.rounds.find(r => r.id === e.target.value);
                                setSelectedRound(round || null);
                            }}
                            label="Select Round"
                        >
                            {quiz.rounds
                                .sort((a, b) => a.nr - b.nr)
                                .map((round) => (
                                    <MenuItem key={round.id} value={round.id}>
                                        {`Round ${round.nr}: ${round.title} (max: ${round.maxScore})`}
                                    </MenuItem>
                                ))}
                        </Select>
                    </FormControl>

                    <Button
                        variant="outlined"
                        disabled={!quiz.rounds.length || !selectedRound || selectedRound.nr === Math.max(...quiz.rounds.map(r => r.nr))}
                        onClick={() => {
                            if (!selectedRound) return;
                            const sorted = [...quiz.rounds].sort((a, b) => a.nr - b.nr);
                            const idx = sorted.findIndex(r => r.id === selectedRound.id);
                            if (idx < sorted.length - 1) setSelectedRound(sorted[idx + 1]);
                        }}
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
                                {quiz.teamQuizzes
                                    .sort((a, b) => a.team.nr - b.team.nr)
                                    .map((teamQuiz) => (
                                        <TableRow key={teamQuiz.id}>
                                            <TableCell>{teamQuiz.team.nr}</TableCell>
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
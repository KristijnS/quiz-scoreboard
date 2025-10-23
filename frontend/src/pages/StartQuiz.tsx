import { useState, useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Button, 
    TextField, 
    Container, 
    Typography, 
    Box, 
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Grid
} from '@mui/material';
import { Quiz } from '../types';
import { quizApi } from '../services/api';

function StartQuiz() {
    const [quizName, setQuizName] = useState('');
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        loadQuizzes();
    }, []);

    const loadQuizzes = async () => {
        const data = await quizApi.getAll();
        setQuizzes(data);
    };

    const handleCreate = async () => {
        if (!quizName.trim()) return;
        const quiz = await quizApi.create(quizName);
        navigate(`/quiz/${quiz.id}/manage`);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString();
    };

    return (
        <Container maxWidth="lg">
            <Box sx={{ mt: 4, mb: 4 }}>
                <Grid container spacing={4}>
                    {/* Create New Quiz Section */}
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h5" gutterBottom>
                                Create New Quiz
                            </Typography>
                            <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField
                                    fullWidth
                                    label="Quiz Name"
                                    value={quizName}
                                    onChange={(e) => setQuizName(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter' && quizName.trim()) {
                                            handleCreate();
                                        }
                                    }}
                                />
                                <Button 
                                    variant="contained" 
                                    onClick={handleCreate}
                                    disabled={!quizName.trim()}
                                    fullWidth
                                >
                                    Create Quiz
                                </Button>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Existing Quizzes Section */}
                    <Grid item xs={12} md={8}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h5" gutterBottom>
                                Existing Quizzes
                            </Typography>
                            <TableContainer sx={{ mt: 2 }}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Quiz Name</TableCell>
                                            <TableCell>Creation Date</TableCell>
                                            <TableCell>Action</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {quizzes.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} align="center">
                                                    <Typography variant="body2" color="text.secondary">
                                                        No quizzes found. Create a new quiz to get started!
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            quizzes.map((quiz) => (
                                                <TableRow key={quiz.id}>
                                                    <TableCell>{quiz.name}</TableCell>
                                                    <TableCell>{formatDate(quiz.creationDate)}</TableCell>
                                                    <TableCell>
                                                        <Button
                                                            variant="contained"
                                                            onClick={() => navigate(`/quiz/${quiz.id}`)}
                                                        >
                                                            Open
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
        </Container>
    );
}

export default memo(StartQuiz);
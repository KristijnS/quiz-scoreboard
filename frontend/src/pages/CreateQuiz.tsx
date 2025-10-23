import { useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, TextField, Container, Typography, Box, Paper } from '@mui/material';
import { quizApi } from '../services/api';

function CreateQuiz() {
    const [quizName, setQuizName] = useState('');
    const navigate = useNavigate();

    const handleCreate = async () => {
        if (!quizName.trim()) return;
        const quiz = await quizApi.create(quizName);
        navigate(`/quiz/${quiz.id}/manage`);
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ mt: 8, display: 'flex', justifyContent: 'center' }}>
                <Paper sx={{ p: 4, width: '100%' }}>
                    <Typography variant="h4" gutterBottom align="center">
                        Create New Quiz
                    </Typography>
                    <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
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
                            autoFocus
                        />
                        
                        <Button 
                            variant="contained" 
                            onClick={handleCreate}
                            disabled={!quizName.trim()}
                            size="large"
                            fullWidth
                        >
                            Create Quiz
                        </Button>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
}

export default memo(CreateQuiz);

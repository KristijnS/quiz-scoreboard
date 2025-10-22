import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { Quiz } from '../types';
import { quizApi } from '../services/api';

export default function LoadQuiz() {
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [quizToDelete, setQuizToDelete] = useState<Quiz | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        loadQuizzes();
    }, []);

    const loadQuizzes = async () => {
        const data = await quizApi.getAll();
        setQuizzes(data);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString();
    };

    const handleDeleteClick = (quiz: Quiz) => {
        setQuizToDelete(quiz);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!quizToDelete) return;
        try {
            await quizApi.delete(quizToDelete.id);
            setDeleteDialogOpen(false);
            setQuizToDelete(null);
            loadQuizzes();
        } catch (error) {
            console.error('Error deleting quiz:', error);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
        setQuizToDelete(null);
    };

    const hasTeams = (quiz: Quiz) => {
        return quiz.teamQuizzes && quiz.teamQuizzes.length > 0;
    };

    return (
        <Container maxWidth="md">
            <Box sx={{ mt: 4, mb: 4 }}>
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Quiz Name</TableCell>
                                <TableCell>Creation Date</TableCell>
                                <TableCell>Teams</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {quizzes.map((quiz) => (
                                <TableRow key={quiz.id}>
                                    <TableCell>{quiz.name}</TableCell>
                                    <TableCell>{formatDate(quiz.creationDate)}</TableCell>
                                    <TableCell>{quiz.teamQuizzes?.length || 0}</TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Button
                                                variant="contained"
                                                onClick={() => navigate(`/quiz/${quiz.id}`)}
                                            >
                                                Open
                                            </Button>
                                            <IconButton
                                                onClick={() => handleDeleteClick(quiz)}
                                                color="error"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Delete Confirmation Dialog */}
                <Dialog
                    open={deleteDialogOpen}
                    onClose={handleDeleteCancel}
                >
                    <DialogTitle>Delete Quiz</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            {quizToDelete && hasTeams(quizToDelete) ? (
                                <>
                                    <strong>Warning:</strong> This quiz has {quizToDelete.teamQuizzes.length} team(s) with scores.
                                    Deleting this quiz will permanently remove all teams, rounds, and scores associated with it.
                                    <br /><br />
                                    Are you sure you want to delete "{quizToDelete.name}"?
                                </>
                            ) : (
                                <>
                                    Are you sure you want to delete "{quizToDelete?.name}"?
                                </>
                            )}
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleDeleteCancel}>Cancel</Button>
                        <Button onClick={handleDeleteConfirm} color="error" variant="contained">
                            Delete
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Container>
    );
}
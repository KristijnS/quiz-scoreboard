import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    Container,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Box,
    TextField,
    IconButton,
    useTheme,
    Checkbox,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, ArrowUpward, ArrowDownward, Edit as EditIcon, Check as CheckIcon, Close as CloseIcon, Gradient as GradientIcon, Transform as TransformIcon } from '@mui/icons-material';
import { Quiz, CreateRoundData } from '../types';
import { quizApi, teamApi, roundApi } from '../services/api';

export default function QuizManagement() {
    const { id } = useParams();
    const theme = useTheme();
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [newTeamName, setNewTeamName] = useState('');
    const [newRoundTitle, setNewRoundTitle] = useState('');
    const [newRoundMaxScore, setNewRoundMaxScore] = useState('10');
    
    // Edit state for teams
    const [editingTeamId, setEditingTeamId] = useState<number | null>(null);
    const [editTeamName, setEditTeamName] = useState('');
    const [editTeamError, setEditTeamError] = useState<string | null>(null);
    
    // Edit state for rounds
    const [editingRoundId, setEditingRoundId] = useState<number | null>(null);
    const [editRoundTitle, setEditRoundTitle] = useState('');
    const [editRoundMaxScore, setEditRoundMaxScore] = useState('');
    const [editRoundError, setEditRoundError] = useState<string | null>(null);
    
    // Scale conversion state
    const [scaleConversionEnabled, setScaleConversionEnabled] = useState(false);
    const [standardScale, setStandardScale] = useState('100');
    const [gradientEnabled, setGradientEnabled] = useState(true);

    // Delete confirmation state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ type: 'team' | 'round'; id: number; name: string; hasDependencies: boolean; dependencyCount?: number } | null>(null);

    useEffect(() => {
        if (id) loadQuiz();
    }, [id]);

    const loadQuiz = async () => {
        if (!id) return;
        const data = await quizApi.get(parseInt(id));
        setQuiz(data);
        setScaleConversionEnabled(data.scaleConversionEnabled || false);
        setStandardScale(data.standardScale?.toString() || '100');
        setGradientEnabled(data.gradientEnabled !== undefined ? data.gradientEnabled : true);
    };

    const [teamError, setTeamError] = useState<string | null>(null);

    const handleAddTeam = async () => {
        if (!id || !newTeamName.trim()) return;
        try {
            setTeamError(null);
            await teamApi.addToQuiz(parseInt(id), newTeamName);
            setNewTeamName('');
            loadQuiz();
        } catch (error: any) {
            if (error.response?.data?.message) {
                setTeamError(error.response.data.message);
            } else {
                setTeamError('Failed to add team');
            }
        }
    };

    const handleDeleteTeamClick = (teamId: number, teamName: string) => {
        if (!quiz) return;
        const teamQuiz = quiz.teamQuizzes.find(tq => tq.team.id === teamId);
        const hasScores = teamQuiz ? teamQuiz.scores.length > 0 : false;
        setItemToDelete({
            type: 'team',
            id: teamId,
            name: teamName,
            hasDependencies: hasScores,
            dependencyCount: teamQuiz?.scores.length || 0
        });
        setDeleteDialogOpen(true);
    };

    const handleDeleteTeam = async (teamId: number) => {
        if (!id) return;
        await teamApi.removeFromQuiz(parseInt(id), teamId);
        loadQuiz();
    };

    const [roundError, setRoundError] = useState<string | null>(null);

    const handleAddRound = async () => {
        if (!id || !newRoundTitle.trim()) return;
        try {
            setRoundError(null);
            const maxScore = parseInt(newRoundMaxScore) || 10;
            const nextNr = quiz?.rounds.length ? Math.max(...quiz.rounds.map(r => r.nr)) + 1 : 1;
            
            await roundApi.create({
                title: newRoundTitle,
                nr: nextNr,
                maxScore,
                quizId: parseInt(id)
            } as CreateRoundData);
            
            setNewRoundTitle('');
            setNewRoundMaxScore('10');
            loadQuiz();
        } catch (error: any) {
            if (error.response?.data?.message) {
                setRoundError(error.response.data.message);
            } else {
                setRoundError('Failed to add round');
            }
        }
    };

    const handleDeleteRoundClick = (roundId: number, roundTitle: string) => {
        if (!quiz) return;
        // Count scores for this round across all teams
        let scoreCount = 0;
        for (const teamQuiz of quiz.teamQuizzes) {
            if (teamQuiz.scores) {
                scoreCount += teamQuiz.scores.filter(score => score.round.id === roundId).length;
            }
        }
        const hasScores = scoreCount > 0;
        setItemToDelete({
            type: 'round',
            id: roundId,
            name: roundTitle,
            hasDependencies: hasScores,
            dependencyCount: scoreCount
        });
        setDeleteDialogOpen(true);
    };

    const handleDeleteRound = async (roundId: number) => {
        await roundApi.delete(roundId);
        loadQuiz();
    };

    const handleMoveRound = async (roundId: number, direction: 'up' | 'down') => {
        if (!quiz) return;
        
        const rounds = [...quiz.rounds].sort((a, b) => a.nr - b.nr);
        const index = rounds.findIndex(r => r.id === roundId);
        if (index === -1) return;
        
        if (direction === 'up' && index > 0) {
            const temp = rounds[index].nr;
            rounds[index].nr = rounds[index - 1].nr;
            rounds[index - 1].nr = temp;
            await roundApi.updateOrder(rounds[index].id, rounds[index].nr);
            await roundApi.updateOrder(rounds[index - 1].id, rounds[index - 1].nr);
        } else if (direction === 'down' && index < rounds.length - 1) {
            const temp = rounds[index].nr;
            rounds[index].nr = rounds[index + 1].nr;
            rounds[index + 1].nr = temp;
            await roundApi.updateOrder(rounds[index].id, rounds[index].nr);
            await roundApi.updateOrder(rounds[index + 1].id, rounds[index + 1].nr);
        }
        
        loadQuiz();
    };

    const handleMoveTeam = async (teamId: number, direction: 'up' | 'down') => {
        if (!quiz) return;
        
        const teams = quiz.teamQuizzes
            .sort((a, b) => a.team.nr - b.team.nr)
            .map(tq => tq.team);
            
        const index = teams.findIndex(t => t.id === teamId);
        if (index === -1) return;
        
        if (direction === 'up' && index > 0) {
            const temp = teams[index].nr;
            teams[index].nr = teams[index - 1].nr;
            teams[index - 1].nr = temp;
            await teamApi.updateOrder(teams[index].id, teams[index].nr, parseInt(id!));
            await teamApi.updateOrder(teams[index - 1].id, teams[index - 1].nr, parseInt(id!));
        } else if (direction === 'down' && index < teams.length - 1) {
            const temp = teams[index].nr;
            teams[index].nr = teams[index + 1].nr;
            teams[index + 1].nr = temp;
            await teamApi.updateOrder(teams[index].id, teams[index].nr, parseInt(id!));
            await teamApi.updateOrder(teams[index + 1].id, teams[index + 1].nr, parseInt(id!));
        }
        
        loadQuiz();
    };

    const handleStartEditTeam = (teamId: number, currentName: string) => {
        setEditingTeamId(teamId);
        setEditTeamName(currentName);
        setEditTeamError(null);
    };

    const handleCancelEditTeam = () => {
        setEditingTeamId(null);
        setEditTeamName('');
        setEditTeamError(null);
    };

    const handleSaveTeam = async (teamId: number) => {
        if (!id || !editTeamName.trim()) return;
        try {
            setEditTeamError(null);
            await teamApi.update(teamId, editTeamName, parseInt(id));
            setEditingTeamId(null);
            setEditTeamName('');
            loadQuiz();
        } catch (error: any) {
            if (error.response?.data?.message) {
                setEditTeamError(error.response.data.message);
            } else {
                setEditTeamError('Failed to update team');
            }
        }
    };

    const handleStartEditRound = (roundId: number, currentTitle: string, currentMaxScore: number) => {
        setEditingRoundId(roundId);
        setEditRoundTitle(currentTitle);
        setEditRoundMaxScore(currentMaxScore.toString());
        setEditRoundError(null);
    };

    const handleCancelEditRound = () => {
        setEditingRoundId(null);
        setEditRoundTitle('');
        setEditRoundMaxScore('');
        setEditRoundError(null);
    };

    const handleSaveRound = async (roundId: number) => {
        if (!editRoundTitle.trim()) return;
        try {
            setEditRoundError(null);
            const maxScore = parseInt(editRoundMaxScore) || 10;
            await roundApi.update(roundId, { title: editRoundTitle, maxScore });
            setEditingRoundId(null);
            setEditRoundTitle('');
            setEditRoundMaxScore('');
            loadQuiz();
        } catch (error: any) {
            if (error.response?.data?.message) {
                setEditRoundError(error.response.data.message);
            } else {
                setEditRoundError('Failed to update round');
            }
        }
    };

    const handleScaleConversionChange = async (enabled: boolean) => {
        if (!id) return;
        setScaleConversionEnabled(enabled);
        await quizApi.update(parseInt(id), { scaleConversionEnabled: enabled });
        loadQuiz();
    };

    const handleStandardScaleChange = async (value: string) => {
        if (!id) return;
        setStandardScale(value);
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && numValue > 0) {
            await quizApi.update(parseInt(id), { standardScale: numValue });
            loadQuiz();
        }
    };

    const handleToggleExcludeFromScale = async (roundId: number, currentValue: boolean) => {
        await roundApi.update(roundId, { 
            title: quiz!.rounds.find(r => r.id === roundId)!.title,
            maxScore: quiz!.rounds.find(r => r.id === roundId)!.maxScore,
            excludeFromScale: !currentValue 
        });
        loadQuiz();
    };

    const handleGradientChange = async (enabled: boolean) => {
        if (!id) return;
        setGradientEnabled(enabled);
        await quizApi.update(parseInt(id), { gradientEnabled: enabled });
        loadQuiz();
    };

    const handleDeleteConfirm = async () => {
        if (!itemToDelete) return;
        if (itemToDelete.type === 'team') {
            await handleDeleteTeam(itemToDelete.id);
        } else {
            await handleDeleteRound(itemToDelete.id);
        }
        setDeleteDialogOpen(false);
        setItemToDelete(null);
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
        setItemToDelete(null);
    };

    if (!quiz) return null;

    return (
        <Container maxWidth="xl">
            <Box sx={{ mt: 4, mb: 4 }}>
                {/* Scale Conversion Settings */}
                <Paper sx={{ p: 2, mb: 3 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Tooltip title="Convert scores to a standard scale for fair comparison across rounds with different max scores. Rounds can be excluded from scaling with the exclude checkbox">
                                <TransformIcon sx={{ fontSize: 20, cursor: 'help' }} />
                            </Tooltip>
                            <Checkbox
                                checked={scaleConversionEnabled}
                                onChange={(e) => handleScaleConversionChange(e.target.checked)}
                            />
                            {scaleConversionEnabled && (
                                <TextField
                                    label="Standard Scale"
                                    type="number"
                                    size="small"
                                    value={standardScale}
                                    onChange={(e) => setStandardScale(e.target.value)}
                                    onBlur={(e) => handleStandardScaleChange(e.target.value)}
                                    sx={{ width: 150 }}
                                    inputProps={{ min: 1, step: 0.1 }}
                                />
                            )}
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Tooltip title="Display gradient colors on scoreboard and chart based on team rankings">
                                <GradientIcon sx={{ fontSize: 20, cursor: 'help' }} />
                            </Tooltip>
                            <Checkbox
                                checked={gradientEnabled}
                                onChange={(e) => handleGradientChange(e.target.checked)}
                            />
                        </Box>
                    </Box>
                </Paper>

                <Box sx={{ display: 'flex', gap: 4 }}>
                    {/* Teams Management */}
                    <Box sx={{ flex: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Teams
                        </Typography>
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell width="10%">Nr</TableCell>
                                        <TableCell width="70%">Team Name</TableCell>
                                        <TableCell align="right" width="20%">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {quiz.teamQuizzes
                                        .sort((a, b) => a.team.nr - b.team.nr)
                                        .map((teamQuiz, index, sortedTeams) => (
                                            <TableRow key={teamQuiz.id}>
                                                <TableCell width="10%">{teamQuiz.team.nr}</TableCell>
                                                <TableCell width="70%">
                                                    {editingTeamId === teamQuiz.team.id ? (
                                                        <TextField
                                                            size="small"
                                                            value={editTeamName}
                                                            onChange={(e) => {
                                                                setEditTeamName(e.target.value);
                                                                setEditTeamError(null);
                                                            }}
                                                            fullWidth
                                                            autoFocus
                                                        />
                                                    ) : (
                                                        teamQuiz.team.name
                                                    )}
                                                </TableCell>
                                                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                                                    <Box component="span" sx={{ display: 'inline-flex', gap: 0.5 }}>
                                                        {editingTeamId === teamQuiz.team.id ? (
                                                            <>
                                                                <IconButton
                                                                    onClick={() => handleSaveTeam(teamQuiz.team.id)}
                                                                    disabled={!editTeamName.trim()}
                                                                    sx={{
                                                                        color: theme.palette.mode === 'dark' ? '#90caf9' : 'primary.main',
                                                                        '&:hover': {
                                                                            backgroundColor: theme.palette.mode === 'dark' 
                                                                                ? 'rgba(144, 202, 249, 0.1)' 
                                                                                : undefined
                                                                        }
                                                                    }}
                                                                >
                                                                    <CheckIcon />
                                                                </IconButton>
                                                                <IconButton
                                                                    onClick={handleCancelEditTeam}
                                                                    sx={{
                                                                        color: theme.palette.mode === 'dark' ? '#cf386aff' : 'error.main',
                                                                        '&:hover': {
                                                                            backgroundColor: theme.palette.mode === 'dark' 
                                                                                ? 'rgba(244, 143, 177, 0.1)' 
                                                                                : undefined
                                                                        }
                                                                    }}
                                                                >
                                                                    <CloseIcon />
                                                                </IconButton>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <IconButton
                                                                    onClick={() => handleStartEditTeam(teamQuiz.team.id, teamQuiz.team.name)}
                                                                    sx={{
                                                                        color: theme.palette.mode === 'dark' ? '#90caf9' : 'primary.main',
                                                                        '&:hover': {
                                                                            backgroundColor: theme.palette.mode === 'dark' 
                                                                                ? 'rgba(144, 202, 249, 0.1)' 
                                                                                : undefined
                                                                        }
                                                                    }}
                                                                >
                                                                    <EditIcon />
                                                                </IconButton>
                                                                <IconButton
                                                                    onClick={() => handleMoveTeam(teamQuiz.team.id, 'up')}
                                                                    disabled={index === 0}
                                                                    sx={{
                                                                        color: theme.palette.mode === 'dark' ? '#90caf9' : 'primary.main',
                                                                        '&:hover': {
                                                                            backgroundColor: theme.palette.mode === 'dark' 
                                                                                ? 'rgba(144, 202, 249, 0.1)' 
                                                                                : undefined
                                                                        }
                                                                    }}
                                                                >
                                                                    <ArrowUpward />
                                                                </IconButton>
                                                                <IconButton
                                                                    onClick={() => handleMoveTeam(teamQuiz.team.id, 'down')}
                                                                    disabled={index === sortedTeams.length - 1}
                                                                    sx={{
                                                                        color: theme.palette.mode === 'dark' ? '#90caf9' : 'primary.main',
                                                                        '&:hover': {
                                                                            backgroundColor: theme.palette.mode === 'dark' 
                                                                                ? 'rgba(144, 202, 249, 0.1)' 
                                                                                : undefined
                                                                        }
                                                                    }}
                                                                >
                                                                    <ArrowDownward />
                                                                </IconButton>
                                                                <IconButton
                                                                    onClick={() => handleDeleteTeamClick(teamQuiz.team.id, teamQuiz.team.name)}
                                                                    sx={{
                                                                        color: theme.palette.mode === 'dark' ? '#cf386aff' : 'error.main',
                                                                        '&:hover': {
                                                                            backgroundColor: theme.palette.mode === 'dark' 
                                                                                ? 'rgba(244, 143, 177, 0.1)' 
                                                                                : undefined
                                                                        }
                                                                    }}
                                                                >
                                                                    <DeleteIcon />
                                                                </IconButton>
                                                            </>
                                                        )}
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    {editTeamError && (
                                        <TableRow>
                                            <TableCell colSpan={3} sx={{ py: 0 }}>
                                                <Typography variant="caption" color="error" sx={{ pl: 1 }}>
                                                    {editTeamError}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    <TableRow>
                                        <TableCell width="10%">New</TableCell>
                                        <TableCell width="70%">
                                            <TextField
                                                size="small"
                                                placeholder="New team name"
                                                value={newTeamName}
                                                onChange={(e) => {
                                                    setNewTeamName(e.target.value);
                                                    setTeamError(null);
                                                }}
                                                fullWidth
                                            />
                                        </TableCell>
                                        <TableCell align="right" width="20%">
                                            <IconButton
                                                onClick={handleAddTeam}
                                                disabled={!newTeamName.trim()}
                                                sx={{
                                                    color: theme.palette.mode === 'dark' ? '#90caf9' : 'primary.main',
                                                    '&:hover': {
                                                        backgroundColor: theme.palette.mode === 'dark' 
                                                            ? 'rgba(144, 202, 249, 0.1)' 
                                                            : undefined
                                                    }
                                                }}
                                            >
                                                <AddIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                    {teamError && (
                                        <TableRow>
                                            <TableCell colSpan={3} sx={{ py: 0 }}>
                                                <Typography variant="caption" color="error" sx={{ pl: 1 }}>
                                                    {teamError}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>

                    {/* Rounds Management */}
                    <Box sx={{ flex: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Rounds
                        </Typography>
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell width="5%">Order</TableCell>
                                        <TableCell width="60%">Round Title</TableCell>
                                        <TableCell width="10%">Max Score</TableCell>
                                        <TableCell width="5%">Exclude</TableCell>
                                        <TableCell align="right" width="20%">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {quiz.rounds
                                        .sort((a, b) => a.nr - b.nr)
                                        .map((round, index, sortedRounds) => (
                                            <TableRow key={round.id}>
                                                <TableCell>{round.nr}</TableCell>
                                                <TableCell>
                                                    {editingRoundId === round.id ? (
                                                        <TextField
                                                            size="small"
                                                            value={editRoundTitle}
                                                            onChange={(e) => {
                                                                setEditRoundTitle(e.target.value);
                                                                setEditRoundError(null);
                                                            }}
                                                            fullWidth
                                                            autoFocus
                                                        />
                                                    ) : (
                                                        round.title
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {editingRoundId === round.id ? (
                                                        <TextField
                                                            size="small"
                                                            type="number"
                                                            value={editRoundMaxScore}
                                                            onChange={(e) => setEditRoundMaxScore(e.target.value)}
                                                            sx={{ width: 80 }}
                                                        />
                                                    ) : (
                                                        round.maxScore
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Checkbox
                                                        checked={round.excludeFromScale || false}
                                                        onChange={() => handleToggleExcludeFromScale(round.id, round.excludeFromScale)}
                                                        size="small"
                                                        disabled={!scaleConversionEnabled}
                                                    />
                                                </TableCell>
                                                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                                                    <Box component="span" sx={{ display: 'inline-flex', gap: 0.5 }}>
                                                        {editingRoundId === round.id ? (
                                                            <>
                                                                <IconButton
                                                                onClick={() => handleSaveRound(round.id)}
                                                                disabled={!editRoundTitle.trim()}
                                                                sx={{
                                                                    color: theme.palette.mode === 'dark' ? '#3a79adff' : 'primary.main',
                                                                    '&:hover': {
                                                                        backgroundColor: theme.palette.mode === 'dark' 
                                                                            ? 'rgba(144, 202, 249, 0.1)' 
                                                                            : undefined
                                                                    }
                                                                }}
                                                            >
                                                                <CheckIcon />
                                                            </IconButton>
                                                            <IconButton
                                                                onClick={handleCancelEditRound}
                                                                sx={{
                                                                    color: theme.palette.mode === 'dark' ? '#cf386aff' : 'error.main',
                                                                    '&:hover': {
                                                                        backgroundColor: theme.palette.mode === 'dark' 
                                                                            ? 'rgba(244, 143, 177, 0.1)' 
                                                                            : undefined
                                                                    }
                                                                }}
                                                            >
                                                                <CloseIcon />
                                                            </IconButton>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <IconButton
                                                                onClick={() => handleStartEditRound(round.id, round.title, round.maxScore)}
                                                                sx={{
                                                                    color: theme.palette.mode === 'dark' ? '#3a79adff' : 'primary.main',
                                                                    '&:hover': {
                                                                        backgroundColor: theme.palette.mode === 'dark' 
                                                                            ? 'rgba(144, 202, 249, 0.1)' 
                                                                            : undefined
                                                                    }
                                                                }}
                                                            >
                                                                <EditIcon />
                                                            </IconButton>
                                                            <IconButton
                                                                onClick={() => handleMoveRound(round.id, 'up')}
                                                                disabled={index === 0}
                                                                sx={{
                                                                    color: theme.palette.mode === 'dark' ? '#3a79adff' : 'primary.main',
                                                                    '&:hover': {
                                                                        backgroundColor: theme.palette.mode === 'dark' 
                                                                            ? 'rgba(144, 202, 249, 0.1)' 
                                                                            : undefined
                                                                    }
                                                                }}
                                                            >
                                                                <ArrowUpward />
                                                            </IconButton>
                                                            <IconButton
                                                                onClick={() => handleMoveRound(round.id, 'down')}
                                                                disabled={index === sortedRounds.length - 1}
                                                                sx={{
                                                                    color: theme.palette.mode === 'dark' ? '#3a79adff' : 'primary.main',
                                                                    '&:hover': {
                                                                        backgroundColor: theme.palette.mode === 'dark' 
                                                                            ? 'rgba(144, 202, 249, 0.1)' 
                                                                            : undefined
                                                                    }
                                                                }}
                                                            >
                                                                <ArrowDownward />
                                                            </IconButton>
                                                            <IconButton
                                                                onClick={() => handleDeleteRoundClick(round.id, round.title)}
                                                                sx={{
                                                                    color: theme.palette.mode === 'dark' ? '#cf386aff' : 'error.main',
                                                                    '&:hover': {
                                                                        backgroundColor: theme.palette.mode === 'dark' 
                                                                            ? 'rgba(244, 143, 177, 0.1)' 
                                                                            : undefined
                                                                    }
                                                                }}
                                                            >
                                                                <DeleteIcon />
                                                            </IconButton>
                                                        </>
                                                    )}
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    {editRoundError && (
                                        <TableRow>
                                            <TableCell colSpan={5} sx={{ py: 0 }}>
                                                <Typography variant="caption" color="error" sx={{ pl: 1 }}>
                                                    {editRoundError}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    <TableRow>
                                        <TableCell>New</TableCell>
                                        <TableCell>
                                            <TextField
                                                size="small"
                                                placeholder="Round title"
                                                value={newRoundTitle}
                                                onChange={(e) => {
                                                    setNewRoundTitle(e.target.value);
                                                    setRoundError(null);
                                                }}
                                                fullWidth
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                size="small"
                                                type="number"
                                                value={newRoundMaxScore}
                                                onChange={(e) => setNewRoundMaxScore(e.target.value)}
                                                sx={{ width: 80 }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Checkbox
                                                checked={false}
                                                disabled
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton
                                                onClick={handleAddRound}
                                                disabled={!newRoundTitle.trim()}
                                                sx={{
                                                    color: theme.palette.mode === 'dark' ? '#90caf9' : 'primary.main',
                                                    '&:hover': {
                                                        backgroundColor: theme.palette.mode === 'dark' 
                                                            ? 'rgba(144, 202, 249, 0.1)' 
                                                            : undefined
                                                    }
                                                }}
                                            >
                                                <AddIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                    {roundError && (
                                        <TableRow>
                                            <TableCell colSpan={5} sx={{ py: 0 }}>
                                                <Typography variant="caption" color="error" sx={{ pl: 1 }}>
                                                    {roundError}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                </Box>
            </Box>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={handleDeleteCancel}
            >
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {itemToDelete && (
                            <>
                                Are you sure you want to delete {itemToDelete.type} "{itemToDelete.name}"?
                                {itemToDelete.hasDependencies && (
                                    <>
                                        <br /><br />
                                        <strong>Warning:</strong> This {itemToDelete.type} has {itemToDelete.dependencyCount} score(s). 
                                        Deleting this {itemToDelete.type} will permanently remove all associated scores.
                                    </>
                                )}
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
        </Container>
    );
}
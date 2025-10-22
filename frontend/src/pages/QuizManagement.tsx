import { useEffect, useState, useMemo, useCallback, memo } from 'react';
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
import { CreateRoundData } from '../types';
import { quizApi, teamApi, roundApi } from '../services/api';
import { useQuiz } from '../context/QuizContext';

function QuizManagement() {
    const theme = useTheme();
    const { quiz, refreshQuiz } = useQuiz();
    const id = quiz?.id;
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

    // Initialize settings when quiz loads
    useEffect(() => {
        if (!quiz) return;
        setScaleConversionEnabled(quiz.scaleConversionEnabled || false);
        setStandardScale(quiz.standardScale?.toString() || '100');
        setGradientEnabled(quiz.gradientEnabled !== undefined ? quiz.gradientEnabled : true);
    }, [quiz]);

    // Replace loadQuiz with refreshQuiz from context
    const loadQuiz = useCallback(async () => {
        await refreshQuiz();
    }, [refreshQuiz]);

    const [teamError, setTeamError] = useState<string | null>(null);

    // Memoize sorted teams to avoid sorting on every render
    const sortedTeams = useMemo(() => {
        if (!quiz) return [];
        return [...quiz.teamQuizzes].sort((a, b) => a.nr - b.nr);
    }, [quiz]);

    // Memoize sorted rounds to avoid sorting on every render
    const sortedRounds = useMemo(() => {
        if (!quiz) return [];
        return [...quiz.rounds].sort((a, b) => a.nr - b.nr);
    }, [quiz]);

    const handleAddTeam = useCallback(async () => {
        if (!id || !newTeamName.trim()) return;
        try {
            setTeamError(null);
            await teamApi.addToQuiz(id, newTeamName);
            setNewTeamName('');
            loadQuiz();
        } catch (error: any) {
            if (error.response?.data?.message) {
                setTeamError(error.response.data.message);
            } else {
                setTeamError('Failed to add team');
            }
        }
    }, [id, newTeamName, loadQuiz]);

    const handleDeleteTeamClick = useCallback((teamId: number, teamName: string) => {
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
    }, [quiz]);

    const handleDeleteTeam = useCallback(async (teamId: number) => {
        if (!id) return;
        await teamApi.removeFromQuiz(id, teamId);
        loadQuiz();
    }, [id, loadQuiz]);

    const [roundError, setRoundError] = useState<string | null>(null);

    const handleAddRound = useCallback(async () => {
        if (!id || !newRoundTitle.trim()) return;
        try {
            setRoundError(null);
            const maxScore = parseInt(newRoundMaxScore, 10) || 10;
            const nextNr = quiz?.rounds.length ? Math.max(...quiz.rounds.map(r => r.nr)) + 1 : 1;
            
            await roundApi.create({
                title: newRoundTitle,
                nr: nextNr,
                maxScore,
                quizId: id
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
    }, [id, newRoundTitle, newRoundMaxScore, quiz, loadQuiz]);

    const handleDeleteRoundClick = useCallback((roundId: number, roundTitle: string) => {
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
    }, [quiz]);

    const handleDeleteRound = useCallback(async (roundId: number) => {
        await roundApi.delete(roundId);
        loadQuiz();
    }, [loadQuiz]);

    const handleMoveRound = useCallback(async (roundId: number, direction: 'up' | 'down') => {
        if (!quiz) return;
        
        const rounds = sortedRounds;
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
    }, [quiz, sortedRounds, loadQuiz]);

    const handleMoveTeam = useCallback(async (teamId: number, direction: 'up' | 'down') => {
        if (!quiz) return;
        
        const index = sortedTeams.findIndex(tq => tq.team.id === teamId);
        if (index === -1) return;
        
        if (direction === 'up' && index > 0) {
            const temp = sortedTeams[index].nr;
            sortedTeams[index].nr = sortedTeams[index - 1].nr;
            sortedTeams[index - 1].nr = temp;
            await teamApi.updateOrder(sortedTeams[index].team.id, sortedTeams[index].nr, id!);
            await teamApi.updateOrder(sortedTeams[index - 1].team.id, sortedTeams[index - 1].nr, id!);
        } else if (direction === 'down' && index < sortedTeams.length - 1) {
            const temp = sortedTeams[index].nr;
            sortedTeams[index].nr = sortedTeams[index + 1].nr;
            sortedTeams[index + 1].nr = temp;
            await teamApi.updateOrder(sortedTeams[index].team.id, sortedTeams[index].nr, id!);
            await teamApi.updateOrder(sortedTeams[index + 1].team.id, sortedTeams[index + 1].nr, id!);
        }
        
        loadQuiz();
    }, [quiz, sortedTeams, id, loadQuiz]);

    const handleStartEditTeam = useCallback((teamId: number, currentName: string) => {
        setEditingTeamId(teamId);
        setEditTeamName(currentName);
        setEditTeamError(null);
    }, []);

    const handleCancelEditTeam = useCallback(() => {
        setEditingTeamId(null);
        setEditTeamName('');
        setEditTeamError(null);
    }, []);

    const handleSaveTeam = useCallback(async (teamId: number) => {
        if (!id || !editTeamName.trim()) return;
        try {
            setEditTeamError(null);
            await teamApi.update(teamId, editTeamName, id);
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
    }, [id, editTeamName, loadQuiz]);

    const handleStartEditRound = useCallback((roundId: number, currentTitle: string, currentMaxScore: number) => {
        setEditingRoundId(roundId);
        setEditRoundTitle(currentTitle);
        setEditRoundMaxScore(currentMaxScore.toString());
        setEditRoundError(null);
    }, []);

    const handleCancelEditRound = useCallback(() => {
        setEditingRoundId(null);
        setEditRoundTitle('');
        setEditRoundMaxScore('');
        setEditRoundError(null);
    }, []);

    const handleSaveRound = useCallback(async (roundId: number) => {
        if (!editRoundTitle.trim()) return;
        try {
            setEditRoundError(null);
            const maxScore = parseInt(editRoundMaxScore, 10) || 10;
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
    }, [editRoundTitle, editRoundMaxScore, loadQuiz]);

    const handleScaleConversionChange = useCallback(async (enabled: boolean) => {
        if (!id) return;
        setScaleConversionEnabled(enabled);
        await quizApi.update(id, { scaleConversionEnabled: enabled });
        loadQuiz();
    }, [id, loadQuiz]);

    const handleStandardScaleChange = useCallback(async (value: string) => {
        if (!id) return;
        setStandardScale(value);
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && numValue > 0) {
            await quizApi.update(id, { standardScale: numValue });
            loadQuiz();
        }
    }, [id, loadQuiz]);

    const handleToggleExcludeFromScale = useCallback(async (roundId: number, currentValue: boolean) => {
        const round = quiz?.rounds.find(r => r.id === roundId);
        if (!round) return;
        
        await roundApi.update(roundId, { 
            title: round.title,
            maxScore: round.maxScore,
            excludeFromScale: !currentValue 
        });
        loadQuiz();
    }, [quiz, loadQuiz]);

    const handleGradientChange = useCallback(async (enabled: boolean) => {
        if (!id) return;
        setGradientEnabled(enabled);
        await quizApi.update(id, { gradientEnabled: enabled });
        loadQuiz();
    }, [id, loadQuiz]);

    const handleCloseDialog = useCallback(() => {
        setDeleteDialogOpen(false);
        setItemToDelete(null);
    }, []);

    const handleConfirmDelete = useCallback(async () => {
        if (!itemToDelete) return;
        
        if (itemToDelete.type === 'team') {
            await handleDeleteTeam(itemToDelete.id);
        } else {
            await handleDeleteRound(itemToDelete.id);
        }
        
        setDeleteDialogOpen(false);
        setItemToDelete(null);
    }, [itemToDelete, handleDeleteTeam, handleDeleteRound]);

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
                                    {sortedTeams
                                        .map((teamQuiz, index, sortedTeams) => (
                                            <TableRow key={teamQuiz.id}>
                                                <TableCell width="10%">{teamQuiz.nr}</TableCell>
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
                                    {sortedRounds
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
                onClose={handleCloseDialog}
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
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleConfirmDelete} color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}

export default memo(QuizManagement);
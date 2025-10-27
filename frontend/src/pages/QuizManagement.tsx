import { useEffect, useState, useMemo, useCallback, memo, useRef } from 'react';
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
    Switch,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, ArrowUpward, ArrowDownward, Edit as EditIcon, Check as CheckIcon, Close as CloseIcon, Gradient as GradientIcon, Transform as TransformIcon, Balance as BalanceIcon } from '@mui/icons-material';
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
    const [newRoundExcludeFromScale, setNewRoundExcludeFromScale] = useState(false);
    
    // Refs for auto-focusing inputs after adding items
    const newTeamInputRef = useRef<HTMLInputElement>(null);
    const newRoundInputRef = useRef<HTMLInputElement>(null);
    
    // Edit state for teams
    const [editingTeamId, setEditingTeamId] = useState<number | null>(null);
    const [editTeamName, setEditTeamName] = useState('');
    const [editTeamError, setEditTeamError] = useState<string | null>(null);
    const [originalTeamName, setOriginalTeamName] = useState('');
    
    // Edit state for rounds
    const [editingRoundId, setEditingRoundId] = useState<number | null>(null);
    const [editRoundTitle, setEditRoundTitle] = useState('');
    const [editRoundMaxScore, setEditRoundMaxScore] = useState('');
    const [editRoundError, setEditRoundError] = useState<string | null>(null);
    const [originalRoundTitle, setOriginalRoundTitle] = useState('');
    const [originalRoundMaxScore, setOriginalRoundMaxScore] = useState('');
    
    // Unsaved changes confirmation state
    const [unsavedChangesDialogOpen, setUnsavedChangesDialogOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
    
    // Scale conversion state
    const [scaleConversionEnabled, setScaleConversionEnabled] = useState(false);
    const [standardScale, setStandardScale] = useState('100');
    const [gradientEnabled, setGradientEnabled] = useState(true);

    // Ex Aequo tiebreaker state
    const [exAequoEnabled, setExAequoEnabled] = useState(false);
    const [exAequoValue, setExAequoValue] = useState('');

    // Delete confirmation state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ type: 'team' | 'round'; id: number; name: string; hasDependencies: boolean; dependencyCount?: number } | null>(null);

    // Initialize settings when quiz loads
    useEffect(() => {
        if (!quiz) return;
        setScaleConversionEnabled(quiz.scaleConversionEnabled || false);
        setStandardScale(quiz.standardScale?.toString() || '100');
        setGradientEnabled(quiz.gradientEnabled !== undefined ? quiz.gradientEnabled : true);
        setExAequoEnabled(quiz.exAequoEnabled || false);
        setExAequoValue(quiz.exAequoValue?.toString() || '');
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
    // Ex Aequo round always appears last
    const sortedRounds = useMemo(() => {
        if (!quiz) return [];
        const rounds = [...quiz.rounds];
        const exAequoRound = rounds.find(r => r.isExAequo === true);
        const normalRounds = rounds.filter(r => r.isExAequo !== true).sort((a, b) => a.nr - b.nr);
        return exAequoRound ? [...normalRounds, exAequoRound] : normalRounds;
    }, [quiz]);

    const handleAddTeam = useCallback(async () => {
        if (!id || !newTeamName.trim()) return;
        try {
            setTeamError(null);
            await teamApi.addToQuiz(id, newTeamName);
            setNewTeamName('');
            loadQuiz();
            // Refocus the input field after adding for faster entry
            setTimeout(() => newTeamInputRef.current?.focus(), 100);
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

    const handleToggleExcluded = useCallback(async (teamId: number, currentExcluded: boolean) => {
        if (!id) return;
        try {
            await teamApi.toggleExcluded(teamId, !currentExcluded, id);
            loadQuiz();
        } catch (error) {
            console.error('Failed to toggle excluded status:', error);
        }
    }, [id, loadQuiz]);

    const [roundError, setRoundError] = useState<string | null>(null);

    const handleAddRound = useCallback(async () => {
        if (!id || !newRoundTitle.trim()) return;
        try {
            setRoundError(null);
            const maxScore = parseInt(newRoundMaxScore, 10) || 10;
            
            // Calculate nextNr, excluding Ex Aequo round
            const normalRounds = quiz?.rounds.filter(r => r.isExAequo !== true) || [];
            const nextNr = normalRounds.length ? Math.max(...normalRounds.map(r => r.nr)) + 1 : 1;
            
            await roundApi.create({
                title: newRoundTitle,
                nr: nextNr,
                maxScore,
                quizId: id,
                excludeFromScale: newRoundExcludeFromScale
            } as CreateRoundData);
            
            setNewRoundTitle('');
            setNewRoundMaxScore('10');
            setNewRoundExcludeFromScale(false);
            loadQuiz();
            // Refocus the input field after adding for faster entry
            setTimeout(() => newRoundInputRef.current?.focus(), 100);
        } catch (error: any) {
            if (error.response?.data?.message) {
                setRoundError(error.response.data.message);
            } else {
                setRoundError('Failed to add round');
            }
        }
    }, [id, newRoundTitle, newRoundMaxScore, newRoundExcludeFromScale, quiz, loadQuiz]);

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
        
        // Prevent moving Ex Aequo round
        if (rounds[index].isExAequo === true) return;
        
        // Prevent moving rounds past Ex Aequo (Ex Aequo is always last)
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex >= 0 && targetIndex < rounds.length && rounds[targetIndex].isExAequo === true) {
            return;
        }
        
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
        setOriginalTeamName(currentName);
        setEditTeamError(null);
    }, []);

    const handleCancelEditTeam = useCallback(() => {
        // Check if there are unsaved changes
        if (editTeamName !== originalTeamName) {
            setPendingAction(() => () => {
                setEditingTeamId(null);
                setEditTeamName('');
                setOriginalTeamName('');
                setEditTeamError(null);
            });
            setUnsavedChangesDialogOpen(true);
        } else {
            setEditingTeamId(null);
            setEditTeamName('');
            setOriginalTeamName('');
            setEditTeamError(null);
        }
    }, [editTeamName, originalTeamName]);

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
        setOriginalRoundTitle(currentTitle);
        setOriginalRoundMaxScore(currentMaxScore.toString());
        setEditRoundError(null);
    }, []);

    const handleCancelEditRound = useCallback(() => {
        // Check if there are unsaved changes
        if (editRoundTitle !== originalRoundTitle || editRoundMaxScore !== originalRoundMaxScore) {
            setPendingAction(() => () => {
                setEditingRoundId(null);
                setEditRoundTitle('');
                setEditRoundMaxScore('');
                setOriginalRoundTitle('');
                setOriginalRoundMaxScore('');
                setEditRoundError(null);
            });
            setUnsavedChangesDialogOpen(true);
        } else {
            setEditingRoundId(null);
            setEditRoundTitle('');
            setEditRoundMaxScore('');
            setOriginalRoundTitle('');
            setOriginalRoundMaxScore('');
            setEditRoundError(null);
        }
    }, [editRoundTitle, originalRoundTitle, editRoundMaxScore, originalRoundMaxScore]);

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

    const handleExAequoEnabledChange = useCallback(async (enabled: boolean) => {
        if (!id) return;
        setExAequoEnabled(enabled);
        
        try {
            // Update quiz with new exAequoEnabled value
            await quizApi.update(id, { exAequoEnabled: enabled });
            
            // If enabling, create the Ex Aequo round
            if (enabled) {
                const nextNr = quiz?.rounds.length ? Math.max(...quiz.rounds.map(r => r.nr)) + 1 : 1;
                console.log('Creating Ex Aequo round with nr:', nextNr);
                await roundApi.create({
                    quizId: id,
                    title: 'Ex Aequo',
                    nr: nextNr,
                    maxScore: 999999,
                    excludeFromScale: true,
                    isExAequo: true
                } as CreateRoundData);
            } else {
                // If disabling, delete the Ex Aequo round
                const exAequoRound = quiz?.rounds.find(r => r.isExAequo);
                if (exAequoRound) {
                    console.log('Deleting Ex Aequo round:', exAequoRound.id);
                    await roundApi.delete(exAequoRound.id);
                }
            }
            
            await loadQuiz();
        } catch (error) {
            console.error('Error handling Ex Aequo change:', error);
        }
    }, [id, quiz, loadQuiz]);

    const handleExAequoValueChange = useCallback(async (value: string) => {
        if (!id) return;
        setExAequoValue(value);
        
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
            await quizApi.update(id, { exAequoValue: numValue });
            loadQuiz();
        }
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

    const handleDiscardChanges = useCallback(() => {
        if (pendingAction) {
            pendingAction();
            setPendingAction(null);
        }
        setUnsavedChangesDialogOpen(false);
    }, [pendingAction]);

    const handleKeepEditing = useCallback(() => {
        setPendingAction(null);
        setUnsavedChangesDialogOpen(false);
    }, []);

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
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Tooltip title="Enable Ex Aequo tiebreaker question for ranking teams with equal scores">
                                <BalanceIcon sx={{ fontSize: 20, cursor: 'help' }} />
                            </Tooltip>
                            <Checkbox
                                checked={exAequoEnabled}
                                onChange={(e) => handleExAequoEnabledChange(e.target.checked)}
                            />
                            {exAequoEnabled && (
                                <TextField
                                    label="Target Value"
                                    type="number"
                                    size="small"
                                    value={exAequoValue}
                                    onChange={(e) => setExAequoValue(e.target.value)}
                                    onBlur={(e) => handleExAequoValueChange(e.target.value)}
                                    sx={{ width: 150 }}
                                />
                            )}
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
                                        <TableCell width="8%">Nr</TableCell>
                                        <TableCell sx={{ width: '80px', maxWidth: '80px', padding: '8px 4px', whiteSpace: 'nowrap' }}>Active</TableCell>
                                        <TableCell>Team Name</TableCell>
                                        <TableCell align="right" width="20%">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {sortedTeams
                                        .map((teamQuiz, index, sortedTeams) => (
                                            <TableRow key={teamQuiz.id} sx={{ opacity: teamQuiz.excluded ? 0.5 : 1 }}>
                                                <TableCell width="8%">{teamQuiz.nr}</TableCell>
                                                <TableCell sx={{ width: '80px', maxWidth: '80px', padding: '8px 4px', whiteSpace: 'nowrap' }}>
                                                    <Tooltip title={teamQuiz.excluded ? "Team excluded from scoring" : "Team active"}>
                                                        <Switch
                                                            checked={!teamQuiz.excluded}
                                                            onChange={() => handleToggleExcluded(teamQuiz.team.id, teamQuiz.excluded)}
                                                            size="small"
                                                        />
                                                    </Tooltip>
                                                </TableCell>
                                                <TableCell width="66%">
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
                                        <TableCell width="8%">New</TableCell>
                                        <TableCell sx={{ width: '80px', maxWidth: '80px', padding: '8px 4px', whiteSpace: 'nowrap' }}></TableCell>
                                        <TableCell>
                                            <TextField
                                                inputRef={newTeamInputRef}
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
                                                                disabled={round.isExAequo === true}
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
                                                                disabled={
                                                                    index === 0 || 
                                                                    round.isExAequo === true || 
                                                                    (index > 0 && sortedRounds[index - 1]?.isExAequo === true)
                                                                }
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
                                                                disabled={
                                                                    index === sortedRounds.length - 1 || 
                                                                    round.isExAequo === true || 
                                                                    (index < sortedRounds.length - 1 && sortedRounds[index + 1]?.isExAequo === true)
                                                                }
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
                                                inputRef={newRoundInputRef}
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
                                                checked={newRoundExcludeFromScale}
                                                onChange={(e) => setNewRoundExcludeFromScale(e.target.checked)}
                                                size="small"
                                                disabled={!scaleConversionEnabled}
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

            {/* Unsaved Changes Confirmation Dialog */}
            <Dialog
                open={unsavedChangesDialogOpen}
                onClose={handleKeepEditing}
            >
                <DialogTitle>Unsaved Changes</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        You have unsaved changes. Do you want to discard them?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleKeepEditing}>Keep Editing</Button>
                    <Button onClick={handleDiscardChanges} color="warning" variant="contained">
                        Discard Changes
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}

export default memo(QuizManagement);
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
    Box
} from '@mui/material';
import { Quiz, Round, TeamQuiz } from '../types';
import { quizApi } from '../services/api';

export default function Scoreboard() {
    const { id } = useParams();
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [sortColumn, setSortColumn] = useState<string>('total');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    useEffect(() => {
        if (id) loadQuiz();
    }, [id]);

    const loadQuiz = async () => {
        if (!id) return;
        const data = await quizApi.get(parseInt(id));
        setQuiz(data);
    };

    const convertScore = (points: number, round: Round) => {
        // If scaling is disabled, or this round is excluded, return raw points
        if (!quiz || !quiz.scaleConversionEnabled || round.excludeFromScale || !quiz.standardScale) {
            return points;
        }

        // Per-round scaling: map this round's maxScore to the quiz.standardScale.
        // convertedPoints = (points / round.maxScore) * standardScale
        if (!round.maxScore || round.maxScore === 0) return 0;
        return (points / round.maxScore) * quiz.standardScale;
    };

    const getConvertedMaxScore = (round: Round) => {
        if (!quiz || !quiz.scaleConversionEnabled || round.excludeFromScale || !quiz.standardScale) {
            return round.maxScore;
        }

        // When scale conversion is enabled and the round is included, each non-excluded
        // round is converted to the quiz.standardScale.
        return quiz.standardScale;
    };

    const calculateTotal = (teamQuiz: TeamQuiz) => {
        if (!quiz) return 0;
        return teamQuiz.scores.reduce((sum, score) => {
            const round = quiz.rounds.find(r => r.id === score.round.id);
            if (!round) return sum;
            return sum + convertScore(score.points, round);
        }, 0);
    };

    const findScore = (teamQuiz: TeamQuiz, round: Round) => {
        const score = teamQuiz.scores.find(s => s.round.id === round.id);
        const points = score ? score.points : 0;
        return convertScore(points, round);
    };

    const handleSort = (column: string) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    const getRankByTotal = (teamQuiz: TeamQuiz) => {
        if (!quiz) return 0;
        const sortedByTotal = [...quiz.teamQuizzes].sort((a, b) => calculateTotal(b) - calculateTotal(a));
        return sortedByTotal.findIndex(tq => tq.id === teamQuiz.id) + 1;
    };

    const getGradientColor = (teamQuiz: TeamQuiz) => {
        // Return transparent if gradient is disabled
        if (!quiz || !quiz.gradientEnabled || quiz.teamQuizzes.length <= 1) return 'transparent';
        
        const rank = getRankByTotal(teamQuiz);
        const totalTeams = quiz.teamQuizzes.length;
        
        // Calculate position from 0 (winning) to 1 (losing)
        const position = (rank - 1) / (totalTeams - 1);
        
        // Green (winning) to Yellow (middle) to Red (losing)
        let r, g, b;
        if (position < 0.5) {
            // Green to Yellow
            const t = position * 2; // 0 to 1
            r = Math.round(76 + (255 - 76) * t);   // 76 to 255
            g = Math.round(175 + (235 - 175) * t);  // 175 to 235
            b = Math.round(80 + (59 - 80) * t);     // 80 to 59
        } else {
            // Yellow to Red
            const t = (position - 0.5) * 2; // 0 to 1
            r = 255;
            g = Math.round(235 - (235 - 82) * t);   // 235 to 82
            b = Math.round(59 - (59 - 82) * t);     // 59 to 82
        }
        
        return `rgba(${r}, ${g}, ${b}, 0.15)`;
    };

    const getSortedTeams = () => {
        if (!quiz) return [];
        
        const teams = [...quiz.teamQuizzes];
        
        return teams.sort((a, b) => {
            let aValue: number | string = 0;
            let bValue: number | string = 0;

            switch (sortColumn) {
                case 'rank':
                    aValue = getRankByTotal(a);
                    bValue = getRankByTotal(b);
                    break;
                case 'nr':
                    aValue = a.team.nr;
                    bValue = b.team.nr;
                    break;
                case 'team':
                    aValue = a.team.name.toLowerCase();
                    bValue = b.team.name.toLowerCase();
                    break;
                case 'total':
                    aValue = calculateTotal(a);
                    bValue = calculateTotal(b);
                    break;
                default:
                    // Round column (sortColumn will be the round id)
                    const roundId = parseInt(sortColumn.replace('round-', ''));
                    const round = quiz.rounds.find(r => r.id === roundId);
                    if (round) {
                        aValue = findScore(a, round);
                        bValue = findScore(b, round);
                    }
            }

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sortDirection === 'asc' 
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            }

            const aNum = typeof aValue === 'number' ? aValue : 0;
            const bNum = typeof bValue === 'number' ? bValue : 0;
            return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
        });
    };

    if (!quiz) return null;

    return (
        <Container maxWidth="lg">
            <Box sx={{ mt: 4, mb: 4 }}>
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell 
                                    width="80px" 
                                    onClick={() => handleSort('rank')}
                                    sx={{ cursor: 'pointer', userSelect: 'none', '&:hover': { bgcolor: 'action.hover' }, whiteSpace: 'nowrap' }}
                                >
                                    Rank {sortColumn === 'rank' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </TableCell>
                                <TableCell 
                                    width="70px" 
                                    onClick={() => handleSort('nr')}
                                    sx={{ cursor: 'pointer', userSelect: 'none', '&:hover': { bgcolor: 'action.hover' }, whiteSpace: 'nowrap' }}
                                >
                                    Nr {sortColumn === 'nr' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </TableCell>
                                <TableCell 
                                    onClick={() => handleSort('team')}
                                    sx={{ cursor: 'pointer', userSelect: 'none', '&:hover': { bgcolor: 'action.hover' }, whiteSpace: 'nowrap' }}
                                >
                                    Team {sortColumn === 'team' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </TableCell>
                                {quiz.rounds.sort((a, b) => a.nr - b.nr).map((round) => {
                                    const maxScore = getConvertedMaxScore(round);
                                    const formattedMax = quiz.scaleConversionEnabled && !round.excludeFromScale
                                        ? Math.floor(maxScore).toString()
                                        : maxScore.toString();
                                    return (
                                        <TableCell 
                                            key={round.id}
                                            onClick={() => handleSort(`round-${round.id}`)}
                                            sx={{ cursor: 'pointer', userSelect: 'none', '&:hover': { bgcolor: 'action.hover' }, minWidth: '120px' }}
                                        >
                                            <Box sx={{ whiteSpace: 'nowrap' }}>
                                                {round.title} {sortColumn === `round-${round.id}` && (sortDirection === 'asc' ? '↑' : '↓')}
                                            </Box>
                                            <Typography variant="caption">
                                                (max: {formattedMax})
                                            </Typography>
                                        </TableCell>
                                    );
                                })}
                                <TableCell 
                                    onClick={() => handleSort('total')}
                                    sx={{ cursor: 'pointer', userSelect: 'none', '&:hover': { bgcolor: 'action.hover' }, whiteSpace: 'nowrap', minWidth: '90px' }}
                                >
                                    Total {sortColumn === 'total' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {getSortedTeams().map((teamQuiz) => (
                                <TableRow key={teamQuiz.id}>
                                    <TableCell sx={{ bgcolor: getGradientColor(teamQuiz) }}>
                                        <strong>{getRankByTotal(teamQuiz)}</strong>
                                    </TableCell>
                                    <TableCell>{teamQuiz.team.nr}</TableCell>
                                    <TableCell>
                                        <Typography sx={{ fontWeight: 'bold' }}>
                                            {teamQuiz.team.name}
                                        </Typography>
                                    </TableCell>
                                    {quiz.rounds
                                        .sort((a, b) => a.nr - b.nr)
                                        .map((round) => {
                                            const score = findScore(teamQuiz, round);
                                            const formatted = quiz.scaleConversionEnabled && !round.excludeFromScale 
                                                ? score.toFixed(2) 
                                                : score.toString();
                                            return (
                                                <TableCell key={round.id}>
                                                    {formatted}
                                                </TableCell>
                                            );
                                        })}
                                    <TableCell>
                                        <strong>
                                            {quiz.scaleConversionEnabled 
                                                ? calculateTotal(teamQuiz).toFixed(2) 
                                                : calculateTotal(teamQuiz)}
                                        </strong>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        </Container>
    );
}
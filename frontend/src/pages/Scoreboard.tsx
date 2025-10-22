import { useState, useMemo, useCallback, memo } from 'react';
import {
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
import { useQuiz } from '../context/QuizContext';

function Scoreboard() {
    const { quiz } = useQuiz();
    const [sortColumn, setSortColumn] = useState<string>('total');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    // Memoize sorted rounds to avoid sorting on every render
    const sortedRounds = useMemo(() => {
        if (!quiz) return [];
        return [...quiz.rounds].sort((a, b) => a.nr - b.nr);
    }, [quiz]);

    // Pre-calculate all totals once
    const teamTotalsMap = useMemo(() => {
        if (!quiz) return new Map<number, number>();
        const map = new Map<number, number>();
        
        quiz.teamQuizzes.forEach(teamQuiz => {
            const total = teamQuiz.scores.reduce((sum, score) => {
                const round = quiz.rounds.find(r => r.id === score.round.id);
                if (!round) return sum;
                
                if (!quiz.scaleConversionEnabled || round.excludeFromScale || !quiz.standardScale) {
                    return sum + score.points;
                }
                if (!round.maxScore || round.maxScore === 0) return sum;
                return sum + (score.points / round.maxScore) * quiz.standardScale;
            }, 0);
            map.set(teamQuiz.id, total);
        });
        
        return map;
    }, [quiz]);

    // Pre-calculate all ranks once
    const teamRanksMap = useMemo(() => {
        if (!quiz) return new Map<number, number>();
        
        const sortedByTotal = [...quiz.teamQuizzes].sort((a, b) => {
            const totalA = teamTotalsMap.get(a.id) || 0;
            const totalB = teamTotalsMap.get(b.id) || 0;
            return totalB - totalA;
        });
        
        const map = new Map<number, number>();
        sortedByTotal.forEach((tq, index) => {
            map.set(tq.id, index + 1);
        });
        
        return map;
    }, [quiz, teamTotalsMap]);

    // Pre-calculate all scores for all teams and rounds
    const teamScoresMap = useMemo(() => {
        if (!quiz) return new Map<string, number>();
        const map = new Map<string, number>();
        
        quiz.teamQuizzes.forEach(teamQuiz => {
            quiz.rounds.forEach(round => {
                const score = teamQuiz.scores.find(s => s.round.id === round.id);
                const points = score ? score.points : 0;
                
                let convertedPoints = points;
                if (quiz.scaleConversionEnabled && !round.excludeFromScale && quiz.standardScale) {
                    if (round.maxScore && round.maxScore !== 0) {
                        convertedPoints = (points / round.maxScore) * quiz.standardScale;
                    }
                }
                
                map.set(`${teamQuiz.id}-${round.id}`, convertedPoints);
            });
        });
        
        return map;
    }, [quiz]);

    // Pre-calculate all gradient colors
    const teamColorsMap = useMemo(() => {
        if (!quiz || !quiz.gradientEnabled || quiz.teamQuizzes.length <= 1) {
            return new Map<number, string>();
        }
        
        const map = new Map<number, string>();
        const totalTeams = quiz.teamQuizzes.length;
        
        quiz.teamQuizzes.forEach(teamQuiz => {
            const rank = teamRanksMap.get(teamQuiz.id) || 0;
            const position = (rank - 1) / (totalTeams - 1);
            
            let r, g, b;
            if (position < 0.5) {
                const t = position * 2;
                r = Math.round(76 + (255 - 76) * t);
                g = Math.round(175 + (235 - 175) * t);
                b = Math.round(80 + (59 - 80) * t);
            } else {
                const t = (position - 0.5) * 2;
                r = 255;
                g = Math.round(235 - (235 - 82) * t);
                b = Math.round(59 - (59 - 82) * t);
            }
            
            map.set(teamQuiz.id, `rgba(${r}, ${g}, ${b}, 0.15)`);
        });
        
        return map;
    }, [quiz, teamRanksMap]);

    const handleSort = useCallback((column: string) => {
        setSortColumn(prevColumn => {
            if (prevColumn === column) {
                setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                return prevColumn;
            } else {
                setSortDirection('asc');
                return column;
            }
        });
    }, []);

    // Memoize sorted teams based on sort column and direction
    const sortedTeams = useMemo(() => {
        if (!quiz) return [];
        
        const teams = [...quiz.teamQuizzes];
        
        return teams.sort((a, b) => {
            let aValue: number | string = 0;
            let bValue: number | string = 0;

            switch (sortColumn) {
                case 'rank':
                    aValue = teamRanksMap.get(a.id) || 0;
                    bValue = teamRanksMap.get(b.id) || 0;
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
                    aValue = teamTotalsMap.get(a.id) || 0;
                    bValue = teamTotalsMap.get(b.id) || 0;
                    break;
                default:
                    // Round column
                    const roundId = parseInt(sortColumn.replace('round-', ''), 10);
                    aValue = teamScoresMap.get(`${a.id}-${roundId}`) || 0;
                    bValue = teamScoresMap.get(`${b.id}-${roundId}`) || 0;
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
    }, [quiz, sortColumn, sortDirection, teamRanksMap, teamTotalsMap, teamScoresMap]);

    if (!quiz) return null;

    return (
        <Box sx={{ width: '100%', px: 2, py: 2 }}>
            <TableContainer 
                component={Paper}
                sx={{ 
                    width: '100%',
                    maxHeight: 'calc(100vh - 120px)', // Full viewport height minus AppBar and padding
                    overflow: 'auto'
                }}
            >
                <Table stickyHeader sx={{ tableLayout: 'fixed', width: '100%' }}>
                    <TableHead>
                        <TableRow>
                            <TableCell 
                                width="60px"
                                onClick={() => handleSort('rank')}
                                sx={{ cursor: 'pointer', userSelect: 'none', '&:hover': { bgcolor: 'action.hover' }, whiteSpace: 'nowrap', p: 1 }}
                            >
                                Rank {sortColumn === 'rank' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </TableCell>
                            <TableCell 
                                width="50px"
                                onClick={() => handleSort('nr')}
                                sx={{ cursor: 'pointer', userSelect: 'none', '&:hover': { bgcolor: 'action.hover' }, whiteSpace: 'nowrap', p: 1 }}
                            >
                                Nr {sortColumn === 'nr' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </TableCell>
                            <TableCell 
                                width="200px"
                                onClick={() => handleSort('team')}
                                sx={{ cursor: 'pointer', userSelect: 'none', '&:hover': { bgcolor: 'action.hover' }, whiteSpace: 'nowrap', p: 1 }}
                            >
                                Team {sortColumn === 'team' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </TableCell>
                            {sortedRounds.map((round) => {
                                const maxScore = quiz.scaleConversionEnabled && !round.excludeFromScale && quiz.standardScale
                                    ? quiz.standardScale
                                    : round.maxScore;
                                const formattedMax = quiz.scaleConversionEnabled && !round.excludeFromScale
                                    ? Math.floor(maxScore).toString()
                                    : maxScore.toString();
                                return (
                                    <TableCell 
                                        key={round.id}
                                        onClick={() => handleSort(`round-${round.id}`)}
                                        sx={{ 
                                            cursor: 'pointer', 
                                            userSelect: 'none', 
                                            '&:hover': { bgcolor: 'action.hover' },
                                            p: 1,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                        }}
                                    >
                                        <Box sx={{ 
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            fontSize: '0.875rem'
                                        }}>
                                            {round.title} {sortColumn === `round-${round.id}` && (sortDirection === 'asc' ? '↑' : '↓')}
                                        </Box>
                                        <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                                            (max: {formattedMax})
                                        </Typography>
                                    </TableCell>
                                );
                            })}
                            <TableCell 
                                width="80px"
                                onClick={() => handleSort('total')}
                                sx={{ cursor: 'pointer', userSelect: 'none', '&:hover': { bgcolor: 'action.hover' }, whiteSpace: 'nowrap', p: 1 }}
                            >
                                Total {sortColumn === 'total' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sortedTeams.map((teamQuiz) => {
                            const rank = teamRanksMap.get(teamQuiz.id) || 0;
                            const total = teamTotalsMap.get(teamQuiz.id) || 0;
                            const bgColor = teamColorsMap.get(teamQuiz.id) || 'transparent';
                            
                            return (
                                <TableRow key={teamQuiz.id}>
                                    <TableCell sx={{ bgcolor: bgColor, p: 1 }}>
                                        <strong>{rank}</strong>
                                    </TableCell>
                                    <TableCell sx={{ p: 1 }}>{teamQuiz.team.nr}</TableCell>
                                    <TableCell sx={{ p: 1 }}>
                                        <Typography sx={{ 
                                            fontWeight: 'bold',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {teamQuiz.team.name}
                                        </Typography>
                                    </TableCell>
                                    {sortedRounds.map((round) => {
                                        const score = teamScoresMap.get(`${teamQuiz.id}-${round.id}`) || 0;
                                        const formatted = quiz.scaleConversionEnabled && !round.excludeFromScale 
                                            ? score.toFixed(2) 
                                            : score.toString();
                                        return (
                                            <TableCell key={round.id} sx={{ p: 1, textAlign: 'center' }}>
                                                {formatted}
                                            </TableCell>
                                        );
                                    })}
                                    <TableCell sx={{ p: 1 }}>
                                        <strong>
                                            {quiz.scaleConversionEnabled 
                                                ? total.toFixed(2) 
                                                : total}
                                        </strong>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}

export default memo(Scoreboard);
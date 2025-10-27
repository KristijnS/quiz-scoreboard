import { Container, Typography, Box, Paper, useTheme } from '@mui/material';
import { EmojiEvents as TrophyIcon, WorkspacePremium as MedalIcon } from '@mui/icons-material';
import { useQuiz } from '../context/QuizContext';
import { useMemo, useState, useCallback, useRef, useEffect } from 'react';

function Leaderboard() {
    const theme = useTheme();
    const { quiz } = useQuiz();
    const isDarkMode = theme.palette.mode === 'dark';
    const [revealedCount, setRevealedCount] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Calculate team totals and sort
    const allTeamsSorted = useMemo(() => {
        if (!quiz || !quiz.rounds || quiz.rounds.length === 0) return [];
        
        const teamTotals = (quiz.teamQuizzes || []).filter(tq => !tq.excluded).map(teamQuiz => {
            const scoreMap = new Map<number, number>();
            if (teamQuiz.scores) {
                teamQuiz.scores.forEach(score => {
                    if (score.round && typeof score.round.id === 'number') {
                        scoreMap.set(score.round.id, score.points);
                    }
                });
            }
            
            // Calculate total excluding Ex Aequo rounds
            const total = quiz.rounds
                .filter(round => round.isExAequo !== true)
                .reduce((sum, round) => {
                    const pts = scoreMap.get(round.id) ?? 0;
                    const converted = quiz.scaleConversionEnabled && !round.excludeFromScale && quiz.standardScale && round.maxScore
                        ? (pts / round.maxScore) * quiz.standardScale
                        : pts;
                    return sum + converted;
                }, 0);
            
            // Get Ex Aequo score for tiebreaking
            const exAequoRound = quiz.rounds.find(r => r.isExAequo === true);
            const exAequoScore = exAequoRound ? (scoreMap.get(exAequoRound.id) ?? 0) : 0;
            
            return { teamQuiz, total, exAequoScore };
        });
        
        // Sort by total score, then by Ex Aequo tiebreaker if enabled
        return teamTotals.sort((a, b) => {
            if (a.total !== b.total) return b.total - a.total;
            
            // Tiebreaker: closest to Ex Aequo target value wins
            if (quiz.exAequoEnabled && quiz.exAequoValue !== undefined) {
                const aDiff = Math.abs(a.exAequoScore - quiz.exAequoValue);
                const bDiff = Math.abs(b.exAequoScore - quiz.exAequoValue);
                return aDiff - bDiff;
            }
            
            return 0;
        });
    }, [quiz]);

    // Top 5 teams for initial reveal (5th → 4th → 3rd → 2nd → 1st)
    const top5Teams = useMemo(() => allTeamsSorted.slice(0, Math.min(5, allTeamsSorted.length)), [allTeamsSorted]);
    
    // Teams from 6th onwards that append at bottom
    const remainingTeams = useMemo(() => allTeamsSorted.slice(Math.min(5, allTeamsSorted.length)), [allTeamsSorted]);

    // Handle click to reveal next team
    const handleRevealNext = useCallback(() => {
        if (revealedCount < allTeamsSorted.length) {
            setRevealedCount(prev => prev + 1);
        }
    }, [revealedCount, allTeamsSorted.length]);

    // Auto-scroll to bottom when revealing teams beyond the top group
    useEffect(() => {
        const topTeamsCount = Math.min(5, allTeamsSorted.length);
        if (revealedCount > topTeamsCount && bottomRef.current) {
            // Small delay to let animation start, then smooth scroll to bottom
            setTimeout(() => {
                bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }, 100);
        }
    }, [revealedCount, allTeamsSorted.length]);

    if (!quiz) return <div>Loading...</div>;

    if (allTeamsSorted.length === 0) {
        return (
            <Container maxWidth="md" sx={{ py: 4 }}>
                <Typography variant="h4" align="center" color="textSecondary">
                    No teams available yet
                </Typography>
            </Container>
        );
    }

    const getColorForPosition = (index: number) => {
        if (!quiz.gradientEnabled) {
            return isDarkMode ? '#90caf9' : '#1976d2';
        }
        
        switch (index) {
            case 0: return '#FFD700'; // Gold for 1st
            case 1: return '#C0C0C0'; // Silver for 2nd
            case 2: return '#CD7F32'; // Bronze for 3rd
            default: return isDarkMode ? '#90caf9' : '#1976d2'; // Default blue
        }
    };

    const getBgColorForPosition = (index: number) => {
        if (!quiz.gradientEnabled) {
            return isDarkMode ? '#2d2d2d' : '#ffffff';
        }
        
        switch (index) {
            case 0: return isDarkMode ? '#3d3520' : '#fffef0'; // Gold background
            case 1: return isDarkMode ? '#2d2d2d' : '#f8f8f8'; // Silver background
            case 2: return isDarkMode ? '#3d2f20' : '#fff8f0'; // Bronze background
            default: return isDarkMode ? '#2d2d2d' : '#ffffff';
        }
    };

    // Determine which teams from top 5 are revealed (5th → 1st)
    const revealedTop5 = top5Teams.filter((_, index) => {
        // Reveal from bottom to top: last → first
        const positionFromBottom = top5Teams.length - 1 - index;
        return revealedCount > positionFromBottom;
    });

    // After top teams revealed, show remaining teams one by one
    const revealedRemainingCount = Math.max(0, revealedCount - top5Teams.length);
    const revealedRemaining = remainingTeams.slice(0, revealedRemainingCount);

    return (
        <Box 
            ref={containerRef}
            onClick={handleRevealNext}
            sx={{ 
                cursor: revealedCount < allTeamsSorted.length ? 'pointer' : 'default',
                minHeight: 'calc(120vh - 64px)',
                height: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                p: 3,
                overflowY: 'auto',
                overflowX: 'hidden'
            }}
        >
            <Typography 
                variant="h2" 
                align="center" 
                gutterBottom 
                sx={{ 
                    mb: 3,
                    fontWeight: 'bold',
                    color: isDarkMode ? '#90caf9' : '#1976d2',
                    fontSize: '3rem'
                }}
            >
                Leaderboard
            </Typography>
            
            {revealedCount < allTeamsSorted.length && (
                <Typography 
                    variant="h5" 
                    align="center" 
                    sx={{ 
                        mb: 2,
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                        fontStyle: 'italic',
                        fontSize: '1.5rem'
                    }}
                >
                    Click anywhere to reveal teams...
                </Typography>
            )}
            
            <Container maxWidth="lg" sx={{ maxWidth: '1400px !important' }}>
                <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: 2,
                    alignItems: 'center'
                }}>
                    {/* Revealed top 5 teams */}
                    {revealedTop5.map((team) => {
                        const actualIndex = top5Teams.indexOf(team);
                        const rank = actualIndex + 1;
                        const color = getColorForPosition(actualIndex);
                        const bgColor = getBgColorForPosition(actualIndex);
                        const isTop3 = actualIndex < 3;
                        
                        // Progressive width sizing: 1st widest, 2nd narrower, 3rd even narrower, 4+ standard
                        const getMaxWidth = () => {
                            if (actualIndex === 0) return '100%';  // 1st place: full width
                            if (actualIndex === 1) return '95%';   // 2nd place: 95% width
                            if (actualIndex === 2) return '90%';   // 3rd place: 90% width
                            return '85%';                          // 4th+: 85% width
                        };
                        
                        return (
                            <Paper
                                key={team.teamQuiz.id}
                                elevation={isTop3 ? 12 : 3}
                                sx={{
                                    p: isTop3 ? 4 : 3,
                                    bgcolor: bgColor,
                                    border: isTop3 ? `4px solid ${color}` : `2px solid ${isDarkMode ? '#404040' : '#e0e0e0'}`,
                                    transition: 'all 0.5s ease',
                                    animation: 'fadeInUp 0.8s ease',
                                    boxShadow: isTop3 ? `0 8px 24px ${color}40` : undefined,
                                    maxWidth: getMaxWidth(),
                                    width: '100%',
                                    '@keyframes fadeInUp': {
                                        '0%': { opacity: 0, transform: 'translateY(30px)' },
                                        '100%': { opacity: 1, transform: 'translateY(0)' }
                                    },
                                    '&:hover': {
                                        transform: isTop3 ? 'scale(1.03)' : 'scale(1.02)',
                                        elevation: isTop3 ? 16 : 6,
                                        boxShadow: isTop3 ? `0 12px 32px ${color}60` : undefined
                                    }
                                }}
                            >
                                <Box sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center',
                                    gap: isTop3 ? 4 : 3
                                }}>
                                    {/* Rank with icon for top 3 */}
                                    <Box sx={{ 
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        minWidth: isTop3 ? '120px' : '100px'
                                    }}>
                                        {actualIndex === 0 && (
                                            <TrophyIcon 
                                                sx={{ 
                                                    fontSize: 80, 
                                                    color: color,
                                                    animation: 'pulse 2s ease-in-out infinite',
                                                    '@keyframes pulse': {
                                                        '0%, 100%': { transform: 'scale(1)' },
                                                        '50%': { transform: 'scale(1.15)' }
                                                    }
                                                }} 
                                            />
                                        )}
                                        {(actualIndex === 1 || actualIndex === 2) && (
                                            <MedalIcon 
                                                sx={{ 
                                                    fontSize: 72, 
                                                    color: color,
                                                    animation: 'pulse 2s ease-in-out infinite',
                                                    '@keyframes pulse': {
                                                        '0%, 100%': { transform: 'scale(1)' },
                                                        '50%': { transform: 'scale(1.15)' }
                                                    }
                                                }} 
                                            />
                                        )}
                                        <Typography
                                            variant="h4"
                                            sx={{
                                                fontWeight: 'bold',
                                                color: color,
                                                mt: actualIndex < 3 ? 1 : 0,
                                                fontSize: isTop3 ? '3.5rem' : '2.5rem'
                                            }}
                                        >
                                            {rank === 1 ? '1st' : rank === 2 ? '2nd' : rank === 3 ? '3rd' : `${rank}th`}
                                        </Typography>
                                    </Box>

                                    {/* Team info */}
                                    <Box sx={{ flex: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                            <Typography
                                                variant="h5"
                                                sx={{
                                                    fontWeight: 'bold',
                                                    color: color,
                                                    fontSize: isTop3 ? '3.5rem' : '2.5rem'
                                                }}
                                            >
                                                #{team.teamQuiz.nr}
                                            </Typography>
                                            <Typography
                                                variant="h4"
                                                sx={{
                                                    fontWeight: 'bold',
                                                    color: isDarkMode ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)',
                                                    flex: 1,
                                                    fontSize: isTop3 ? '3rem' : '2.5rem'
                                                }}
                                            >
                                                {team.teamQuiz.team.name}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    {/* Points */}
                                    <Box sx={{ textAlign: 'right', minWidth: isTop3 ? '180px' : '140px' }}>
                                        <Typography
                                            variant="h3"
                                            sx={{
                                                fontWeight: 'bold',
                                                color: color,
                                                fontSize: isTop3 ? '3.5rem' : '2.5rem'
                                            }}
                                        >
                                            {Math.round(team.total)}
                                        </Typography>
                                        <Typography
                                            variant="body1"
                                            sx={{
                                                color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                                                fontSize: isTop3 ? '3.5rem' : '2.5rem'
                                            }}
                                        >
                                            points
                                        </Typography>
                                    </Box>
                                </Box>
                            </Paper>
                        );
                    })}

                    {/* Remaining teams (6th onwards) */}
                    {revealedRemaining.map((team, index) => {
                        const rank = index + 6;
                        const color = isDarkMode ? '#90caf9' : '#1976d2';
                        const bgColor = isDarkMode ? '#2d2d2d' : '#ffffff';
                        
                        return (
                            <Paper
                                key={team.teamQuiz.id}
                                elevation={3}
                                sx={{
                                    p: 3,
                                    bgcolor: bgColor,
                                    border: `2px solid ${isDarkMode ? '#404040' : '#e0e0e0'}`,
                                    transition: 'all 0.5s ease',
                                    animation: 'fadeInUp 0.8s ease',
                                    maxWidth: '78%',
                                    width: '100%',
                                    '@keyframes fadeInUp': {
                                        '0%': { opacity: 0, transform: 'translateY(30px)' },
                                        '100%': { opacity: 1, transform: 'translateY(0)' }
                                    },
                                    '&:hover': {
                                        transform: 'scale(1.02)',
                                        elevation: 6
                                    }
                                }}
                            >
                                <Box sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center',
                                    gap: 3
                                }}>
                                    {/* Rank */}
                                    <Box sx={{ 
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        minWidth: '100px'
                                    }}>
                                        <Typography
                                            variant="h4"
                                            sx={{
                                                fontWeight: 'bold',
                                                color: color,
                                                fontSize: '2.5rem'
                                            }}
                                        >
                                            {rank}th
                                        </Typography>
                                    </Box>

                                    {/* Team info */}
                                    <Box sx={{ flex: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                            <Typography
                                                variant="h5"
                                                sx={{
                                                    fontWeight: 'bold',
                                                    color: color,
                                                    fontSize: '2.5rem'
                                                }}
                                            >
                                                #{team.teamQuiz.nr}
                                            </Typography>
                                            <Typography
                                                variant="h4"
                                                sx={{
                                                    fontWeight: 'bold',
                                                    color: isDarkMode ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)',
                                                    flex: 1,
                                                    fontSize: '2.5rem'
                                                }}
                                            >
                                                {team.teamQuiz.team.name}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    {/* Points */}
                                    <Box sx={{ textAlign: 'right', minWidth: '140px' }}>
                                        <Typography
                                            variant="h3"
                                            sx={{
                                                fontWeight: 'bold',
                                                color: color,
                                                fontSize: '2.5rem'
                                            }}
                                        >
                                            {Math.round(team.total)}
                                        </Typography>
                                        <Typography
                                            variant="body1"
                                            sx={{
                                                color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                                                fontSize: '1.1rem'
                                            }}
                                        >
                                            points
                                        </Typography>
                                    </Box>
                                </Box>
                            </Paper>
                        );
                    })}
                    
                    {/* Bottom anchor for auto-scroll */}
                    <div ref={bottomRef} />
                </Box>
            </Container>

            {revealedCount === allTeamsSorted.length && (
                <Typography 
                    variant="h5" 
                    align="center" 
                    sx={{ 
                        mt: 4,
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                        fontStyle: 'italic',
                        fontSize: '1.5rem'
                    }}
                >
                    All teams revealed! 🎉
                </Typography>
            )}
        </Box>
    );
}

export default Leaderboard;

import { Container, Typography, Box, Paper, useTheme, Fade } from '@mui/material';
import { EmojiEvents as TrophyIcon, WorkspacePremium as MedalIcon } from '@mui/icons-material';
import { useQuiz } from '../context/QuizContext';
import { useMemo, useState, useCallback } from 'react';

function Top5() {
    const theme = useTheme();
    const { quiz } = useQuiz();
    const isDarkMode = theme.palette.mode === 'dark';
    const [revealedCount, setRevealedCount] = useState(0);

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

    const top5Teams = useMemo(() => allTeamsSorted.slice(0, Math.min(5, allTeamsSorted.length)), [allTeamsSorted]);
    const remainingTeams = useMemo(() => allTeamsSorted.slice(Math.min(5, allTeamsSorted.length)), [allTeamsSorted]);

    // Handle click to reveal next team (from bottom to top, then remaining teams)
    const handleRevealNext = useCallback(() => {
        const maxReveal = Math.min(6, top5Teams.length + 1);
        if (revealedCount < maxReveal) {
            setRevealedCount(prev => prev + 1);
        }
    }, [revealedCount, top5Teams.length]);

    if (!quiz) return <div>Loading...</div>;

    if (top5Teams.length === 0) {
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

    return (
        <Box 
            onClick={handleRevealNext}
            sx={{ 
                cursor: revealedCount < 6 ? 'pointer' : 'default',
                minHeight: 'calc(100vh - 64px)', // Account for app bar
                height: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                p: 1,
                overflowY: 'auto',
                overflowX: 'hidden'
            }}
        >
            {/* Main Top 5 Section */}
            <Container 
                maxWidth={false}
                sx={{ 
                    py: 2,
                    overflow: 'visible',
                    flexShrink: 0,
                    px: 3
                }}
            >
                <Typography 
                    variant="h3" 
                    align="center" 
                    gutterBottom 
                    sx={{ 
                        mb: 2,
                        fontWeight: 'bold',
                        color: isDarkMode ? '#90caf9' : '#1976d2'
                    }}
                >
                    Top 5 Teams
                </Typography>
                
                {revealedCount < top5Teams.length && (
                    <Typography 
                        variant="h6" 
                        align="center" 
                        sx={{ 
                            mb: 2,
                            color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                            fontStyle: 'italic'
                        }}
                    >
                        Click anywhere to reveal teams...
                    </Typography>
                )}
                
                <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    alignContent: 'center',
                    gap: 1.5,
                    flexWrap: 'wrap'
                }}>
                    {top5Teams.map((team, index) => {
                    const color = getColorForPosition(index);
                    const isWinner = index === 0;
                    // Show teams from bottom to top: last team reveals first, then up to first
                    const positionFromBottom = top5Teams.length - 1 - index;
                    const isRevealed = revealedCount > positionFromBottom;
                    
                    // Determine card size based on position
                    const getCardSize = () => {
                        if (index === 0) return { minWidth: '280px', maxWidth: '320px', padding: 2.5 }; // 1st
                        if (index === 1) return { minWidth: '280px', maxWidth: '300px', padding: 2.2 }; // 2nd
                        if (index === 2) return { minWidth: '230px', maxWidth: '270px', padding: 1.8 }; // 3rd
                        return { minWidth: '200px', maxWidth: '240px', padding: 1.5 }; // 4th & 5th
                    };
                    const cardSize = getCardSize();
                    
                    return (
                        <Fade 
                            key={team.teamQuiz.id}
                            in={isRevealed} 
                            timeout={1000}
                            style={{ transitionDelay: isRevealed ? '200ms' : '0ms' }}
                        >
                            <div>
                        <Paper
                            elevation={isWinner ? 8 : 3}
                            sx={{
                                p: cardSize.padding,
                                width: 'auto',
                                minWidth: cardSize.minWidth,
                                maxWidth: cardSize.maxWidth,
                                bgcolor: isDarkMode ? '#2d2d2d' : '#ffffff',
                                border: isWinner ? `4px solid ${color}` : `2px solid ${color}`,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    transform: 'scale(1.02)',
                                    elevation: isWinner ? 12 : 6
                                }
                            }}
                        >
                            <Box sx={{ 
                                display: 'flex', 
                                flexDirection: 'column',
                                alignItems: 'center', 
                                justifyContent: 'center',
                                gap: 1
                            }}>
                                {isWinner && (
                                    <TrophyIcon 
                                        sx={{ 
                                            fontSize: 60, 
                                            color: color,
                                            animation: 'pulse 2s ease-in-out infinite',
                                            '@keyframes pulse': {
                                                '0%, 100%': { transform: 'scale(1)' },
                                                '50%': { transform: 'scale(1.1)' }
                                            }
                                        }} 
                                    />
                                )}
                                
                                {(index === 1 || index === 2) && (
                                    <MedalIcon 
                                        sx={{ 
                                            fontSize: index === 1 ? 55 : 48, 
                                            color: color,
                                            animation: 'pulse 2s ease-in-out infinite',
                                            '@keyframes pulse': {
                                                '0%, 100%': { transform: 'scale(1)' },
                                                '50%': { transform: 'scale(1.1)' }
                                            }
                                        }} 
                                    />
                                )}
                                
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <Typography
                                        sx={{
                                            fontSize: '2rem',
                                            fontWeight: 'bold',
                                            color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                                            textAlign: 'center',
                                            lineHeight: 1
                                        }}
                                    >
                                        {index === 0 ? '1st' : index === 1 ? '2nd' : index === 2 ? '3rd' : `${index + 1}th`} place
                                    </Typography>
                                    <Typography
                                        sx={{
                                            fontSize: '2rem',
                                            fontWeight: 'bold',
                                            color: color,
                                            textAlign: 'center',
                                            lineHeight: 1.2
                                        }}
                                    >
                                        #{team.teamQuiz.nr}
                                    </Typography>
                                </Box>
                                
                                <Typography
                                    sx={{
                                        fontSize: '2rem',
                                        fontWeight: 'bold',
                                        color: isDarkMode ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)',
                                        textAlign: 'center',
                                        lineHeight: 1.3,
                                        wordWrap: 'break-word',
                                        overflowWrap: 'break-word',
                                        whiteSpace: 'normal'
                                    }}
                                >
                                    {team.teamQuiz.team.name}
                                </Typography>
                                
                                <Typography
                                    sx={{
                                        fontSize: '1.5rem',
                                        fontWeight: 'bold',
                                        color: color,
                                        textAlign: 'center'
                                    }}
                                >
                                    {Math.round(team.total)} pts
                                </Typography>
                            </Box>
                        </Paper>
                            </div>
                        </Fade>
                    );
                })}
                
                {/* Last Place Team - Revealed on final click */}
                {/*lastTeam && allTeamsSorted.length > 5 && (
                    <Fade 
                        in={revealedCount === 6} 
                        timeout={1000}
                        style={{ transitionDelay: revealedCount === 6 ? '200ms' : '0ms' }}
                    >
                        <div style={{ marginLeft: '10rem' }}>
                            <Paper
                                elevation={3}
                                sx={{
                                    p: 1.5,
                                    width: 'auto',
                                    minWidth: '200px',
                                    maxWidth: '240px',
                                    //bgcolor: isDarkMode ? '#3d1f1f' : '#ffebee',
                                    border: '2px solid #d32f2f',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        transform: 'scale(1.02)',
                                        elevation: 6
                                    }
                                }}
                            >
                                <Box sx={{ 
                                    display: 'flex', 
                                    flexDirection: 'column',
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    gap: 1
                                }}>
                                    <CandleIcon 
                                        sx={{ 
                                            fontSize: 48, 
                                            color: '#d32f2f',
                                            animation: 'flicker 2s ease-in-out infinite',
                                            '@keyframes flicker': {
                                                '0%, 100%': { opacity: 1 },
                                                '50%': { opacity: 0.7 }
                                            }
                                        }} 
                                    />
                                    
                                    <Typography
                                        sx={{
                                            fontSize: '1.5rem',
                                            fontWeight: 'bold',
                                            color: '#d32f2f',
                                            textAlign: 'center',
                                            lineHeight: 1.2
                                        }}
                                    >
                                        {allTeamsSorted.length}th Place
                                    </Typography>
                                    
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            fontSize: '2rem',
                                            fontWeight: 'bold',
                                            color: isDarkMode ? '#ef9a9a' : '#c62828',
                                            textAlign: 'center'
                                        }}
                                    >
                                        #{lastTeam.teamQuiz.nr}
                                    </Typography>
                                    
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            fontSize: '1.5rem',
                                            fontWeight: 'bold',
                                            textAlign: 'center',
                                            color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
                                            mt: 0.5,
                                            lineHeight: 1.3,
                                            wordWrap: 'break-word',
                                            overflowWrap: 'break-word',
                                            whiteSpace: 'normal'
                                        }}
                                    >
                                        {lastTeam.teamQuiz.team.name}
                                    </Typography>
                                    
                                    <Typography
                                        sx={{
                                            fontSize: '1.5rem',
                                            fontWeight: 'bold',
                                            color: '#d32f2f',
                                            textAlign: 'center'
                                        }}
                                    >
                                        {Math.round(lastTeam.total)} pts
                                    </Typography>
                                </Box>
                            </Paper>
                        </div>
                    </Fade>
                )*/}
                </Box>
            </Container>

            {/* Other Teams Section - Optimized for 60 teams */}
            {remainingTeams.length > 0 && revealedCount > top5Teams.length && (
                <Box
                    sx={{
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: '400px',
                        px: 2,
                        pb: 2
                    }}
                >
                    <Typography
                        variant="h5"
                        sx={{
                            mb: 1.5,
                            fontWeight: 'bold',
                            color: isDarkMode ? '#90caf9' : '#1976d2',
                            textAlign: 'center'
                        }}
                    >
                        Other Teams
                    </Typography>
                    
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                            gap: 1,
                            overflowY: 'auto',
                            overflowX: 'hidden',
                            alignContent: 'start',
                            maxHeight: '600px'
                        }}
                    >
                        {remainingTeams.map((team, index) => {
                            const placement = index + 6;
                            const getOrdinalSuffix = (num: number) => {
                                const j = num % 10;
                                const k = num % 100;
                                if (j === 1 && k !== 11) return 'st';
                                if (j === 2 && k !== 12) return 'nd';
                                if (j === 3 && k !== 13) return 'rd';
                                return 'th';
                            };
                            
                            return (
                                <Fade in={true} timeout={500} key={team.teamQuiz.id}>
                                    <Paper
                                        elevation={1}
                                        sx={{
                                            bgcolor: isDarkMode ? '#1e1e1e' : '#ffffff',
                                            p: 1,
                                            borderRadius: 1,
                                            border: `1px solid ${isDarkMode ? '#404040' : '#e0e0e0'}`,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 0.5,
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                elevation: 3,
                                                transform: 'scale(1.02)',
                                                bgcolor: isDarkMode ? '#252525' : '#f5f5f5'
                                            }
                                        }}
                                    >
                                        {/* Rank */}
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                fontWeight: 'bold',
                                                color: isDarkMode ? 'rgba(137, 189, 249, 0.69)' : 'rgba(21, 24, 85, 0.68)',
                                                fontSize: '1rem',
                                                textAlign: 'center'
                                            }}
                                        >
                                            {placement}{getOrdinalSuffix(placement)} place
                                        </Typography>
                                        
                                        {/* Team Name */}
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: isDarkMode ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)',
                                                fontSize: '1.5rem',
                                                fontWeight: 'bold',
                                                textAlign: 'center',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {team.teamQuiz.team.name}
                                        </Typography>
                                        
                                        {/* Team Number and Score */}
                                        <Box 
                                            sx={{ 
                                                display: 'flex', 
                                                justifyContent: 'space-between', 
                                                alignItems: 'center',
                                                mt: 0.5
                                            }}
                                        >
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    fontWeight: 'bold',
                                                    color: isDarkMode ? '#90caf9' : '#1976d2',
                                                    fontSize: '1.5rem'
                                                }}
                                            >
                                                #{team.teamQuiz.nr}
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    fontWeight: 'bold',
                                                    color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                                                    fontSize: '1.5rem'
                                                }}
                                            >
                                                {Math.round(team.total)} pts
                                            </Typography>
                                        </Box>
                                    </Paper>
                                </Fade>
                            );
                        })}
                    </Box>
                </Box>
            )}
        </Box>
    );
}

export default Top5;

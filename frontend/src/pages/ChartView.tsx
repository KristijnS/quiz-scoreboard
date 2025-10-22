import { useMemo, useCallback, memo } from 'react';
import { Container, Typography, Box, Paper, useTheme } from '@mui/material';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    BarController,
    LineElement,
    LineController,
    PointElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
    import { Chart } from 'react-chartjs-2';
    import { useQuiz } from '../context/QuizContext';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    BarController,
    LineElement,
    LineController,
    PointElement,
    Title,
    Tooltip,
    Legend
);

    function ChartView() {
        const theme = useTheme();
        const { quiz } = useQuiz();
        const isDarkMode = theme.palette.mode === 'dark';

    if (!quiz) return <div>Loading...</div>;

        // Pre-calculate all team totals
        const teamTotals = useMemo(() => {
            if (!quiz.rounds || quiz.rounds.length === 0) return [];
            
            return (quiz.teamQuizzes || []).map(teamQuiz => {
                const scoreMap = new Map<number, number>();
                if (teamQuiz.scores) {
                    teamQuiz.scores.forEach(score => {
                        if (score.round && typeof score.round.id === 'number') {
                            scoreMap.set(score.round.id, score.points);
                        }
                    });
                }
                
                const total = quiz.rounds.reduce((sum, round) => {
                    const pts = scoreMap.get(round.id) ?? 0;
                    const converted = quiz.scaleConversionEnabled && !round.excludeFromScale && quiz.standardScale && round.maxScore
                        ? (pts / round.maxScore) * quiz.standardScale
                        : pts;
                    return sum + converted;
                }, 0);
                
                return { teamQuiz, total };
            });
        }, [quiz]);

        // Sort teams by total score (highest to lowest) - memoized
        const sortedTeams = useMemo(() => {
            return [...teamTotals].sort((a, b) => b.total - a.total);
        }, [teamTotals]);

        // Memoize gradient color calculation
        const getGradientColor = useCallback((index: number, opacity: number = 0.8) => {
            if (!quiz || !quiz.gradientEnabled || sortedTeams.length <= 1) {
                return isDarkMode ? `rgba(144, 202, 249, ${opacity})` : `rgba(76, 175, 80, ${opacity})`;
            }
            
            const totalTeams = sortedTeams.length;
            const position = index / (totalTeams - 1);
            
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
            
            return `rgba(${r}, ${g}, ${b}, ${opacity})`;
        }, [quiz, sortedTeams.length, isDarkMode]);

        // Pre-calculate max score - memoized
        const maxScore = useMemo(() => {
            if (quiz.scaleConversionEnabled && quiz.standardScale) {
                const includedCount = quiz.rounds.filter(r => !r.excludeFromScale).length;
                const excludedRoundsMax = quiz.rounds
                    .filter(r => r.excludeFromScale)
                    .reduce((sum, round) => sum + round.maxScore, 0);
                return (includedCount * quiz.standardScale) + excludedRoundsMax;
            }
            return quiz.rounds?.reduce((sum: number, round: { maxScore: number }) => sum + (round?.maxScore || 0), 0) || 0;
        }, [quiz]);

        // Calculate responsive font sizes - memoized
        const fontSizes = useMemo(() => {
            const teamCount = sortedTeams.length;
            return {
                xAxisNumber: teamCount > 30 ? 14 : teamCount > 20 ? 16 : teamCount > 10 ? 18 : 20,
                xAxisName: teamCount > 30 ? 11 : teamCount > 20 ? 12 : teamCount > 10 ? 13 : 14,
                legend: teamCount > 30 ? 16 : 18,
                title: teamCount > 30 ? 22 : 24,
                yAxis: 16,
                teamCount
            };
        }, [sortedTeams.length]);

        // Memoize labels - just team numbers for prominent display
        const labels = useMemo(() => {
            return sortedTeams.map((item) => `${item.teamQuiz.nr}`);
        }, [sortedTeams]);

        // Memoize team scores
        const teamScores = useMemo(() => {
            return sortedTeams.map((item) => item.total);
        }, [sortedTeams]);

        // Memoize max scores array
        const maxScores = useMemo(() => {
            return sortedTeams.map(() => maxScore);
        }, [sortedTeams, maxScore]);

        const hasChartData = labels.length > 0 && teamScores.some(score => score > 0);

        // Memoize chart data
        const data = useMemo(() => ({
            labels,
            datasets: [
                {
                    type: 'bar' as const,
                    label: 'Total Score',
                    data: teamScores,
                    backgroundColor: sortedTeams.map((_, index) => getGradientColor(index, 0.7)),
                    borderColor: sortedTeams.map((_, index) => getGradientColor(index, 1)),
                    borderWidth: 2,
                    borderRadius: 4,
                    barThickness: 'flex' as const,
                    maxBarThickness: 80,
                },
                {
                    type: 'line' as const,
                    label: 'Max Score',
                    data: maxScores,
                    borderColor: isDarkMode ? 'rgba(255, 183, 77, 1)' : 'rgba(255, 152, 0, 1)',
                    borderWidth: 3,
                    borderDash: [10, 5],
                    pointRadius: 0,
                    fill: false,
                    backgroundColor: isDarkMode ? 'rgba(255, 183, 77, 0.1)' : 'rgba(255, 152, 0, 0.1)',
                    order: 2,
                }
            ]
        }), [labels, teamScores, maxScores, sortedTeams, getGradientColor, isDarkMode]);

        // Memoize chart options
        const options = useMemo(() => ({
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top' as const,
                    labels: {
                        font: {
                            size: fontSizes.legend,
                            weight: 'bold' as const
                        },
                        padding: fontSizes.teamCount > 30 ? 10 : 15,
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)',
                        boxWidth: 20,
                        boxHeight: 20
                    }
                },
                title: {
                    display: true,
                    text: `${quiz.name} - Team Scores`,
                    font: {
                        size: fontSizes.title,
                        weight: 'bold' as const
                    },
                    padding: {
                        top: 8,
                        bottom: fontSizes.teamCount > 30 ? 12 : 15
                    },
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)'
                },
                tooltip: {
                    backgroundColor: isDarkMode ? 'rgba(45, 45, 45, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    titleColor: isDarkMode ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)',
                    bodyColor: isDarkMode ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)',
                    borderColor: isDarkMode ? 'rgba(144, 202, 249, 0.5)' : 'rgba(0, 0, 0, 0.12)',
                    borderWidth: 1,
                    titleFont: {
                        size: 16,
                        weight: 'bold' as const
                    },
                    bodyFont: {
                        size: 15
                    },
                    padding: 12,
                    callbacks: {
                        title: (context: any) => {
                            const index = context[0].dataIndex;
                            return `${sortedTeams[index].teamQuiz.nr}. ${sortedTeams[index].teamQuiz.team.name}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        font: {
                            size: fontSizes.xAxisNumber,
                            weight: 'bold' as const
                        },
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)',
                        maxRotation: 0,
                        minRotation: 0,
                        autoSkip: false,
                        padding: 8,
                        callback: function(_value: any, index: number) {
                            // Return only team number prominently
                            const team = sortedTeams[index];
                            if (!team) return '';
                            return `#${team.teamQuiz.nr}`;
                        }
                    },
                    grid: {
                        display: false
                    },
                    afterFit: (scale: any) => {
                        // Add extra space for rotated team names
                        scale.paddingBottom = fontSizes.teamCount > 30 ? 110 : fontSizes.teamCount > 20 ? 105 : 100;
                    }
                },
                y: {
                    beginAtZero: true,
                    max: Math.max(maxScore, ...teamScores) + 5,
                    ticks: {
                        font: {
                            size: fontSizes.yAxis,
                            weight: 'bold' as const
                        },
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)'
                    },
                    grid: {
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)'
                    }
                }
            },
            layout: {
                padding: {
                    left: 10,
                    right: 10,
                    top: 10,
                    bottom: fontSizes.teamCount > 30 ? 110 : fontSizes.teamCount > 20 ? 100 : 90
                }
            }
        }), [quiz.name, fontSizes, isDarkMode, maxScore, teamScores, sortedTeams]);

        // Custom plugin to draw rotated team names - memoized
        const teamNamePlugin = useMemo(() => ({
            id: 'teamNames',
            afterDraw: (chart: any) => {
                const ctx = chart.ctx;
                const xAxis = chart.scales.x;
                const yAxis = chart.scales.y;
                
                ctx.save();
                ctx.font = `bold ${fontSizes.xAxisName}px Arial`;
                ctx.fillStyle = isDarkMode ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                
                sortedTeams.forEach((team, index) => {
                    const x = xAxis.getPixelForValue(index);
                    const y = yAxis.bottom + 50; // Position further below to avoid overlap
                    
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.rotate(Math.PI / 4); // +45 degrees (rotates downward to the right)
                    ctx.fillText(team.teamQuiz.team.name, 0, 0);
                    ctx.restore();
                });
                
                ctx.restore();
            }
        }), [sortedTeams, fontSizes.xAxisName, isDarkMode]);

        return (
            <Container maxWidth={false} sx={{ px: { xs: 1, sm: 2, md: 3 }, py: 1 }}>
                <Box sx={{ mt: 1, mb: 1 }}>
                    <Paper 
                        sx={{ 
                            p: { xs: 1, sm: 1.5, md: 2 }, 
                            height: 'calc(100vh - 80px)', 
                            minHeight: '600px',
                            maxHeight: '1200px',
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center' 
                        }}
                    >
                        {hasChartData ? (
                            <Chart 
                                type="bar" 
                                options={options} 
                                data={data} 
                                plugins={[teamNamePlugin]}
                                style={{ height: '100%', width: '100%' }} 
                            />
                        ) : (
                            <Typography color="textSecondary" sx={{ p: 2, fontSize: '18px' }}>
                                No chart data available for this quiz.
                            </Typography>
                        )}
                    </Paper>
                </Box>
            </Container>
        );
}

export default memo(ChartView);
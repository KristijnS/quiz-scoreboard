import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
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
    import { Quiz } from '../types';
    import { quizApi } from '../services/api';

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

    export default function ChartView() {
        const { id } = useParams();
        const theme = useTheme();
        const [quiz, setQuiz] = useState<Quiz | null>(null);
        const isDarkMode = theme.palette.mode === 'dark';

        useEffect(() => {
            if (id) {
                loadQuiz();
            }
            // eslint-disable-next-line
        }, [id]);

        const loadQuiz = async () => {
            if (!id) return;
            const quizId = parseInt(id, 10);
            if (isNaN(quizId)) {
                console.error('Invalid quiz ID');
                return;
            }
            const data = await quizApi.get(quizId);
            setQuiz(data);
        };

    if (!quiz) return <div>Loading...</div>;

        // Helper function to wrap long text into multiple lines
        const wrapLabel = (label: string, maxCharsPerLine: number = 15): string[] => {
            const words = label.split(' ');
            const lines: string[] = [];
            let currentLine = '';

            for (const word of words) {
                const testLine = currentLine ? `${currentLine} ${word}` : word;
                if (testLine.length <= maxCharsPerLine) {
                    currentLine = testLine;
                } else {
                    if (currentLine) lines.push(currentLine);
                    currentLine = word;
                }
            }
            if (currentLine) lines.push(currentLine);

            return lines;
        };

        const convertScore = (points: number, roundId: number) => {
            if (!quiz || !quiz.scaleConversionEnabled || !quiz.standardScale) {
                return points;
            }
            const round = quiz.rounds.find(r => r.id === roundId);
            if (!round || round.excludeFromScale) {
                return points;
            }
            if (!round.maxScore || round.maxScore === 0) return 0;
            // Per-round scaling: map this round's maxScore to the quiz.standardScale
            return (points / round.maxScore) * quiz.standardScale;
        };

        // For each team, sum their score for each round, defaulting to 0 if missing
        const calculateTotal = (teamQuiz: Quiz['teamQuizzes'][number]) => {
            if (!quiz.rounds || quiz.rounds.length === 0) return 0;
            // Map roundId to score for this team
            const scoreMap = new Map<number, number>();
            if (teamQuiz.scores) {
                teamQuiz.scores.forEach(score => {
                    if (score.round && typeof score.round.id === 'number') {
                        scoreMap.set(score.round.id, score.points);
                    }
                });
            }
            // For each round, get score or default to 0, then apply conversion
            return quiz.rounds.reduce((sum, round) => {
                const pts = scoreMap.get(round.id) ?? 0;
                const converted = convertScore(pts, round.id);
                return sum + converted;
            }, 0);
        };

        // Sort teams by total score (highest to lowest)
        const sortedTeams = [...(quiz.teamQuizzes || [])].sort((a, b) => calculateTotal(b) - calculateTotal(a));

        const getGradientColor = (index: number, opacity: number = 0.8) => {
            // Return default color if gradient is disabled or only one team
            if (!quiz || !quiz.gradientEnabled || sortedTeams.length <= 1) {
                return isDarkMode ? `rgba(144, 202, 249, ${opacity})` : `rgba(76, 175, 80, ${opacity})`;
            }
            
            const totalTeams = sortedTeams.length;
            
            // Calculate position from 0 (winning) to 1 (losing)
            // index 0 = rank 1 (winning), so position calculation matches scoreboard
            const position = index / (totalTeams - 1);
            
            // Green (winning) to Yellow (middle) to Red (losing)
            // Using exact same RGB values as scoreboard
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
            
            return `rgba(${r}, ${g}, ${b}, ${opacity})`;
        };

        const getMaxScore = () => {
            if (quiz.scaleConversionEnabled && quiz.standardScale) {
                // When scale conversion is enabled, each included round contributes `standardScale`.
                // Excluded rounds contribute their original maxScore.
                const includedCount = quiz.rounds.filter(r => !r.excludeFromScale).length;
                const excludedRoundsMax = quiz.rounds
                    .filter(r => r.excludeFromScale)
                    .reduce((sum, round) => sum + round.maxScore, 0);
                return (includedCount * quiz.standardScale) + excludedRoundsMax;
            }
            // Otherwise, sum all round max scores
            return quiz.rounds?.reduce((sum: number, round: { maxScore: number }) => sum + (round?.maxScore || 0), 0) || 0;
        };

        const maxScore = getMaxScore();
        const labels = sortedTeams.map((tq) => wrapLabel(`${tq.team.nr}. ${tq.team.name}`));
        const teamScores = sortedTeams.map((tq) => calculateTotal(tq));
        const maxScores = sortedTeams.map(() => maxScore);

        const hasChartData = labels.length > 0 && teamScores.some(score => score > 0);

        // Calculate responsive font sizes based on number of teams
        // Increased for better visibility on projector/beamer
        const teamCount = sortedTeams.length;
        const xAxisFontSize = teamCount > 30 ? 13 : teamCount > 20 ? 14 : teamCount > 10 ? 15 : 16;
        const legendFontSize = teamCount > 30 ? 16 : 18;
        const titleFontSize = teamCount > 30 ? 22 : 24;
        const yAxisFontSize = 16;

        const data = {
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
        };

        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top' as const,
                    labels: {
                        font: {
                            size: legendFontSize,
                            weight: 'bold' as const
                        },
                        padding: teamCount > 30 ? 10 : 15,
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)',
                        boxWidth: 20,
                        boxHeight: 20
                    }
                },
                title: {
                    display: true,
                    text: `${quiz.name} - Team Scores`,
                    font: {
                        size: titleFontSize,
                        weight: 'bold' as const
                    },
                    padding: {
                        top: 8,
                        bottom: teamCount > 30 ? 12 : 15
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
                            // Show original unwrapped label in tooltip
                            const index = context[0].dataIndex;
                            return `${sortedTeams[index].team.nr}. ${sortedTeams[index].team.name}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        font: {
                            size: xAxisFontSize,
                            weight: 'bold' as const
                        },
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)',
                        maxRotation: 0,
                        minRotation: 0,
                        autoSkip: false,
                        padding: 2
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    max: Math.max(maxScore, ...teamScores) + 5,
                    ticks: {
                        font: {
                            size: yAxisFontSize,
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
                    left: 5,
                    right: 5,
                    top: 5,
                    bottom: teamCount > 30 ? 5 : teamCount > 20 ? 8 : 10
                }
            }
        };

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
                            <Chart type="bar" options={options} data={data} style={{ height: '100%', width: '100%' }} />
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
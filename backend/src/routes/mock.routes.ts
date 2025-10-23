/**
 * Mock Quiz Generation Routes
 * 
 * Provides an endpoint to generate mock quizzes with teams, rounds, and optional scores.
 * Used for testing and demonstration purposes.
 */

import { Router, Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Quiz } from '../entities/Quiz';
import { Team } from '../entities/Team';
import { Round } from '../entities/Round';
import { TeamQuiz } from '../entities/TeamQuiz';
import { Score } from '../entities/Score';

const router = Router();

// Funky quiz name components
const quizAdjectives = ['Epic', 'Spectacular', 'Ultimate', 'Legendary', 'Cosmic', 'Mystical', 'Electric', 'Supreme', 'Radical', 'Mega'];
const quizNouns = ['Trivia', 'Challenge', 'Showdown', 'Battle', 'Championship', 'Tournament', 'Quest', 'Adventure', 'Extravaganza', 'Bonanza'];

// Funky team name components
const teamAdjectives = ['Blazing', 'Thunder', 'Mighty', 'Cosmic', 'Turbo', 'Super', 'Ultra', 'Quantum', 'Stellar', 'Neon', 'Arctic', 'Crimson', 'Golden', 'Silver', 'Diamond'];
const teamNouns = ['Phoenixes', 'Dragons', 'Wizards', 'Warriors', 'Champions', 'Legends', 'Mavericks', 'Titans', 'Eagles', 'Panthers', 'Wolves', 'Falcons', 'Knights', 'Pirates', 'Ninjas'];

// Funky round name themes
const roundThemes = [
    ['Opening Salvo', 'First Blood', 'Dawn Breaker', 'Genesis Round', 'Kickoff Clash'],
    ['Rising Storm', 'Momentum Shift', 'Second Strike', 'Escalation', 'Power Surge'],
    ['Midpoint Madness', 'Halfway Havoc', 'Center Stage', 'Pivot Point', 'Turning Tide'],
    ['Penultimate Push', 'Final Approach', 'Crunch Time', 'Home Stretch', 'Last Stand'],
    ['Grand Finale', 'Ultimate Showdown', 'Climax Round', 'Endgame', 'Championship Bout'],
    ['Lightning Round', 'Speed Demon', 'Rapid Fire', 'Quick Draw', 'Flash Challenge'],
    ['Brain Buster', 'Mind Meld', 'Think Tank', 'Neural Net', 'Cerebral Clash'],
    ['Wild Card', 'Mystery Box', 'Surprise Round', 'Chaos Factor', 'Random Roll']
];

/**
 * Generate a random funky quiz name
 */
function generateQuizName(): string {
    const adj = quizAdjectives[Math.floor(Math.random() * quizAdjectives.length)];
    const noun = quizNouns[Math.floor(Math.random() * quizNouns.length)];
    return `${adj} ${noun}`;
}

/**
 * Generate a random funky team name
 */
function generateTeamName(index: number, usedNames: Set<string>): string {
    let name: string;
    let attempts = 0;
    do {
        const adj = teamAdjectives[Math.floor(Math.random() * teamAdjectives.length)];
        const noun = teamNouns[Math.floor(Math.random() * teamNouns.length)];
        name = `${adj} ${noun}`;
        attempts++;
    } while (usedNames.has(name) && attempts < 50);
    
    // If we couldn't find a unique name, append the index
    if (usedNames.has(name)) {
        name = `${name} ${index}`;
    }
    
    usedNames.add(name);
    return name;
}

/**
 * Generate a funky round name
 */
function generateRoundName(roundIndex: number, totalRounds: number): string {
    // Determine which theme to use based on position in quiz
    let themeIndex: number;
    
    if (roundIndex === 0) {
        themeIndex = 0; // Opening round
    } else if (roundIndex === totalRounds - 1) {
        themeIndex = 4; // Final round
    } else if (roundIndex === totalRounds - 2 && totalRounds > 2) {
        themeIndex = 3; // Penultimate round
    } else if (roundIndex === Math.floor(totalRounds / 2)) {
        themeIndex = 2; // Midpoint
    } else if (roundIndex === 1 && totalRounds > 3) {
        themeIndex = 1; // Second round
    } else {
        // Random theme from the special rounds
        themeIndex = 5 + Math.floor(Math.random() * 3);
    }
    
    const theme = roundThemes[themeIndex];
    return theme[Math.floor(Math.random() * theme.length)];
}

/**
 * POST /api/mock/generate
 * 
 * Generate a mock quiz with specified number of teams, rounds, and optional scores.
 * 
 * Body:
 * - teams: number (required) - Number of teams to create
 * - rounds: number (required) - Number of rounds to create
 * - withScores: boolean (optional) - Whether to generate random scores
 * 
 * Returns:
 * - quizId: number - ID of the created quiz
 */
router.post('/generate', async (req: Request, res: Response) => {
    try {
        const { teams, rounds, withScores, useStandardScale, standardScale } = req.body;

        // Validate input
        if (!teams || !rounds || teams < 1 || rounds < 1) {
            return res.status(400).json({ error: 'Teams and rounds must be positive numbers' });
        }

        const quizRepo = AppDataSource.getRepository(Quiz);
        const teamRepo = AppDataSource.getRepository(Team);
        const roundRepo = AppDataSource.getRepository(Round);
        const teamQuizRepo = AppDataSource.getRepository(TeamQuiz);
        const scoreRepo = AppDataSource.getRepository(Score);

        // Create quiz with funky name
        const quiz = quizRepo.create({
            name: generateQuizName(),
            scaleConversionEnabled: useStandardScale || false,
            standardScale: useStandardScale ? (standardScale || 10) : undefined,
            gradientEnabled: true
        });
        await quizRepo.save(quiz);

        // Create teams with funky names
        const createdTeams: Team[] = [];
        const usedTeamNames = new Set<string>();
        for (let i = 1; i <= teams; i++) {
            const team = teamRepo.create({
                name: generateTeamName(i, usedTeamNames)
            });
            await teamRepo.save(team);
            createdTeams.push(team);
        }

        // Create rounds with funky names and variable max scores
        const createdRounds: Round[] = [];
        const possibleMaxScores = [5, 10, 15, 20, 25, 30];
        
        for (let i = 1; i <= rounds; i++) {
            // Determine max score
            let maxScore: number;
            if (useStandardScale) {
                // Use variable max scores when standard scale is enabled
                maxScore = possibleMaxScores[Math.floor(Math.random() * possibleMaxScores.length)];
            } else {
                // Use fixed max score of 10 when no standard scale
                maxScore = 10;
            }
            
            const round = roundRepo.create({
                nr: i,
                title: generateRoundName(i - 1, rounds),
                maxScore: maxScore,
                quiz: quiz
            });
            await roundRepo.save(round);
            createdRounds.push(round);
        }

        // Create TeamQuiz entries (link teams to quiz)
        const createdTeamQuizzes: TeamQuiz[] = [];
        for (let i = 0; i < createdTeams.length; i++) {
            const teamQuiz = teamQuizRepo.create({
                team: createdTeams[i],
                quiz: quiz,
                nr: i + 1
            });
            await teamQuizRepo.save(teamQuiz);
            createdTeamQuizzes.push(teamQuiz);
        }

        // Optionally create scores
        if (withScores) {
            for (const teamQuiz of createdTeamQuizzes) {
                for (const round of createdRounds) {
                    // Generate random score between 0 and round.maxScore
                    const points = Math.floor(Math.random() * (round.maxScore + 1));
                    const score = scoreRepo.create({
                        points,
                        round,
                        teamQuiz
                    });
                    await scoreRepo.save(score);
                }
            }
        }

        res.json({ 
            quizId: quiz.id,
            message: `Mock quiz created with ${teams} teams and ${rounds} rounds${withScores ? ' (with scores)' : ''}`
        });
        return;

    } catch (error) {
        console.error('Error generating mock quiz:', error);
        res.status(500).json({ error: 'Failed to generate mock quiz' });
        return;
    }
});

export default router;

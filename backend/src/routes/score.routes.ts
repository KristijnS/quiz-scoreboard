import { Router } from 'express';
import { AppDataSource } from '../data-source';
import { Score } from '../entities/Score';
import { Round } from '../entities/Round';
import { TeamQuiz } from '../entities/TeamQuiz';

const router = Router();

// Get scores for a specific round and quiz
router.get('/round/:roundId', async (req, res) => {
    const scoreRepository = AppDataSource.getRepository(Score);
    const scores = await scoreRepository.find({
        where: { round: { id: parseInt(req.params.roundId) } },
        relations: ['teamQuiz', 'teamQuiz.team'],
        order: { teamQuiz: { team: { name: 'ASC' } } }
    });
    res.json(scores);
});

// Update or create score
router.put('/', async (req, res) => {
    try {
        const { roundId, teamQuizId, points } = req.body;
        
        // Validate input
        const parsedRoundId = parseInt(roundId, 10);
        const parsedTeamQuizId = parseInt(teamQuizId, 10);
        const parsedPoints = parseFloat(points);

        if (isNaN(parsedRoundId) || parsedRoundId <= 0) {
            return res.status(400).json({ message: 'Invalid round ID' });
        }
        if (isNaN(parsedTeamQuizId) || parsedTeamQuizId <= 0) {
            return res.status(400).json({ message: 'Invalid team ID' });
        }
        if (isNaN(parsedPoints) || parsedPoints < 0) {
            return res.status(400).json({ message: 'Points must be a non-negative number' });
        }
        
        const scoreRepository = AppDataSource.getRepository(Score);
        const roundRepository = AppDataSource.getRepository(Round);
        const teamQuizRepository = AppDataSource.getRepository(TeamQuiz);
        
        const round = await roundRepository.findOne({
            where: { id: parsedRoundId },
            relations: ['quiz']
        });
        
        if (!round) {
            return res.status(404).json({ message: 'Round not found' });
        }
        
        const teamQuiz = await teamQuizRepository.findOne({
            where: { id: parsedTeamQuizId },
            relations: ['quiz']
        });
        
        if (!teamQuiz) {
            return res.status(404).json({ message: 'Team not found in quiz' });
        }
        
        if (round.quiz.id !== teamQuiz.quiz.id) {
            return res.status(400).json({ message: 'Round and team are not from the same quiz' });
        }
        
        // Validate points against round max
        if (parsedPoints > round.maxScore) {
            return res.status(400).json({ message: `Points cannot exceed round max (${round.maxScore})` });
        }

        let score = await scoreRepository.findOne({
            where: { round: { id: parsedRoundId }, teamQuiz: { id: parsedTeamQuizId } }
        });

        if (!score) {
            score = scoreRepository.create({
                round,
                teamQuiz,
                points: parsedPoints
            });
        } else {
            score.points = parsedPoints;
        }
        
        await scoreRepository.save(score);
        return res.json(score);
    } catch (error) {
        console.error('Error updating score:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;
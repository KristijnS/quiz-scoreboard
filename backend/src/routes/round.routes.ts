import { Router } from 'express';
import { AppDataSource } from '../data-source';
import { Round } from '../entities/Round';
import { Quiz } from '../entities/Quiz';
import { Score } from '../entities/Score';

const router = Router();

// Get all rounds for a quiz
router.get('/quiz/:quizId', async (req, res) => {
    const roundRepository = AppDataSource.getRepository(Round);
    const rounds = await roundRepository.find({
        where: { quiz: { id: parseInt(req.params.quizId) } },
        order: { nr: 'ASC' }
    });
    return res.json(rounds);
});

// Create a new round
router.post('/', async (req, res) => {
    const { title, nr, maxScore, quizId } = req.body;
    
    const roundRepository = AppDataSource.getRepository(Round);
    const quizRepository = AppDataSource.getRepository(Quiz);
    
    const quiz = await quizRepository.findOneBy({ id: quizId });
    if (!quiz) {
        return res.status(404).json({ message: 'Quiz not found' });
    }

    // Check if a round with this name already exists in this quiz
    const existingRound = await roundRepository.findOne({
        where: {
            quiz: { id: quizId },
            title: title
        }
    });

    if (existingRound) {
        return res.status(400).json({ message: 'A round with this name already exists in this quiz' });
    }
    
    const round = roundRepository.create({
        title,
        nr,
        maxScore,
        excludeFromScale: req.body.excludeFromScale || false,
        isExAequo: req.body.isExAequo || false,
        quiz
    });
    
    await roundRepository.save(round);
    return res.status(201).json(round);
});

// Update round details
router.put('/:id', async (req, res) => {
    const { title, maxScore } = req.body;
    const roundRepository = AppDataSource.getRepository(Round);
    
    const round = await roundRepository.findOne({
        where: { id: parseInt(req.params.id) },
        relations: ['quiz']
    });
    
    if (!round) {
        return res.status(404).json({ message: 'Round not found' });
    }

    // Check if a round with this title already exists in this quiz (excluding current round, case-insensitive)
    const existingRound = await roundRepository
        .createQueryBuilder('round')
        .where('round.quiz.id = :quizId', { quizId: round.quiz.id })
        .andWhere('LOWER(round.title) = LOWER(:title)', { title })
        .andWhere('round.id != :roundId', { roundId: round.id })
        .getOne();

    if (existingRound) {
        return res.status(400).json({ message: 'A round with this name already exists in this quiz' });
    }
    
    round.title = title;
    round.maxScore = maxScore;
    if (req.body.excludeFromScale !== undefined) {
        round.excludeFromScale = req.body.excludeFromScale;
    }
    await roundRepository.save(round);
    return res.json(round);
});

// Update round order
router.put('/:id/order', async (req, res) => {
    const { newNr } = req.body;
    const roundRepository = AppDataSource.getRepository(Round);
    
    const round = await roundRepository.findOne({
        where: { id: parseInt(req.params.id) },
        relations: ['quiz']
    });
    
    if (!round) {
        return res.status(404).json({ message: 'Round not found' });
    }
    
    round.nr = newNr;
    await roundRepository.save(round);
    return res.json(round);
});

// Delete a round
router.delete('/:id', async (req, res) => {
    const roundRepository = AppDataSource.getRepository(Round);
    const round = await roundRepository.findOne({
        where: { id: parseInt(req.params.id) },
        relations: ['scores']
    });
    
    if (!round) {
        return res.status(404).json({ message: 'Round not found' });
    }
    
    // Delete all scores first if any exist
    if (round.scores && round.scores.length > 0) {
        const scoreRepository = AppDataSource.getRepository(Score);
        await scoreRepository.remove(round.scores);
    }
    
    await roundRepository.remove(round);
    return res.status(204).send();
});

export default router;
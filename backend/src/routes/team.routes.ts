import { Router } from 'express';
import { AppDataSource } from '../data-source';
import { Team } from '../entities/Team';
import { TeamQuiz } from '../entities/TeamQuiz';
import { Quiz } from '../entities/Quiz';
import { Score } from '../entities/Score';

const router = Router();

// Get all teams for a specific quiz
router.get('/quiz/:quizId', async (req, res) => {
    const teamQuizRepository = AppDataSource.getRepository(TeamQuiz);
    const teams = await teamQuizRepository.find({
        where: { quiz: { id: parseInt(req.params.quizId) } },
        relations: ['team'],
        order: { team: { name: 'ASC' } }
    });
    return res.json(teams.map(tq => tq.team));
});

// Add team to quiz
router.post('/quiz/:quizId', async (req, res) => {
    const { name } = req.body;
    const quizId = parseInt(req.params.quizId);

    const teamRepository = AppDataSource.getRepository(Team);
    const quizRepository = AppDataSource.getRepository(Quiz);
    const teamQuizRepository = AppDataSource.getRepository(TeamQuiz);

    const quiz = await quizRepository.findOneBy({ id: quizId });
    if (!quiz) {
        return res.status(404).json({ message: 'Quiz not found' });
    }

    // Check if a team with this name already exists in this quiz
    const existingTeam = await teamQuizRepository
        .createQueryBuilder('teamQuiz')
        .leftJoinAndSelect('teamQuiz.team', 'team')
        .where('teamQuiz.quiz.id = :quizId', { quizId })
        .andWhere('LOWER(team.name) = LOWER(:name)', { name })
        .getOne();

    if (existingTeam) {
        return res.status(400).json({ message: 'A team with this name already exists in this quiz' });
    }

    // Get the max team number for this quiz
    const maxNrTeam = await teamQuizRepository.createQueryBuilder('teamQuiz')
        .leftJoinAndSelect('teamQuiz.team', 'team')
        .where('teamQuiz.quiz.id = :quizId', { quizId })
        .orderBy('team.nr', 'DESC')
        .getOne();

    const nextNr = maxNrTeam ? maxNrTeam.team.nr + 1 : 1;

    // Create new team or update existing one
    let team = await teamRepository.findOneBy({ name });
    if (!team) {
        team = teamRepository.create({ name, nr: nextNr });
        await teamRepository.save(team);
    } else {
        team.nr = nextNr;
        await teamRepository.save(team);
    }

    const existingTeamQuiz = await teamQuizRepository.findOneBy({
        team: { id: team.id },
        quiz: { id: quizId }
    });

    if (existingTeamQuiz) {
        return res.status(400).json({ message: 'Team already in quiz' });
    }

    const teamQuiz = teamQuizRepository.create({
        team,
        quiz
    });

    await teamQuizRepository.save(teamQuiz);
    return res.status(201).json(team);
});

// Remove team from quiz
router.delete('/quiz/:quizId/team/:teamId', async (req, res) => {
    const teamQuizRepository = AppDataSource.getRepository(TeamQuiz);
    const teamQuiz = await teamQuizRepository.findOne({
        where: {
            quiz: { id: parseInt(req.params.quizId) },
            team: { id: parseInt(req.params.teamId) }
        },
        relations: ['scores']
    });

    if (!teamQuiz) {
        return res.status(404).json({ message: 'Team not found in quiz' });
    }

    // Delete all scores first if any exist
    if (teamQuiz.scores && teamQuiz.scores.length > 0) {
        const scoreRepository = AppDataSource.getRepository(Score);
        await scoreRepository.remove(teamQuiz.scores);
    }

    await teamQuizRepository.remove(teamQuiz);
    return res.status(204).send();
});

// Update team name
router.put('/:teamId', async (req, res) => {
    const { name, quizId } = req.body;
    const teamId = parseInt(req.params.teamId);

    const teamRepository = AppDataSource.getRepository(Team);
    const teamQuizRepository = AppDataSource.getRepository(TeamQuiz);

    const team = await teamRepository.findOneBy({ id: teamId });
    if (!team) {
        return res.status(404).json({ message: 'Team not found' });
    }

    // Check if a team with this name already exists in this quiz (excluding current team)
    const existingTeam = await teamQuizRepository
        .createQueryBuilder('teamQuiz')
        .leftJoinAndSelect('teamQuiz.team', 'team')
        .where('teamQuiz.quiz.id = :quizId', { quizId })
        .andWhere('LOWER(team.name) = LOWER(:name)', { name })
        .andWhere('team.id != :teamId', { teamId })
        .getOne();

    if (existingTeam) {
        return res.status(400).json({ message: 'A team with this name already exists in this quiz' });
    }

    team.name = name;
    await teamRepository.save(team);
    return res.json(team);
});

// Update team order
router.put('/:teamId/order', async (req, res) => {
    const { nr, quizId } = req.body;
    const teamId = parseInt(req.params.teamId);

    const teamRepository = AppDataSource.getRepository(Team);
    const teamQuizRepository = AppDataSource.getRepository(TeamQuiz);

    const team = await teamRepository.findOneBy({ id: teamId });
    if (!team) {
        return res.status(404).json({ message: 'Team not found' });
    }

    // Get all teams in this quiz to update their order
    const allTeamQuizzes = await teamQuizRepository.find({
        where: { quiz: { id: quizId } },
        relations: ['team'],
        order: { team: { nr: 'ASC' } }
    });

    const teams = allTeamQuizzes.map(tq => tq.team);
    const oldNr = team.nr;

    // Update the order of all affected teams
    if (nr > oldNr) {
        // Moving down - decrease nr of teams that were below
        for (const t of teams) {
            if (t.nr > oldNr && t.nr <= nr && t.id !== teamId) {
                t.nr--;
                await teamRepository.save(t);
            }
        }
    } else if (nr < oldNr) {
        // Moving up - increase nr of teams that were above
        for (const t of teams) {
            if (t.nr >= nr && t.nr < oldNr && t.id !== teamId) {
                t.nr++;
                await teamRepository.save(t);
            }
        }
    }

    team.nr = nr;
    await teamRepository.save(team);
    return res.json(team);
});

export default router;
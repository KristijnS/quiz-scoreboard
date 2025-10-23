import express from 'express';
import cors from 'cors';
import { AppDataSource } from './data-source';
import quizRoutes from './routes/quiz.routes';
import teamRoutes from './routes/team.routes';
import roundRoutes from './routes/round.routes';
import scoreRoutes from './routes/score.routes';
import mockRoutes from './routes/mock.routes';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// API Documentation
app.get('/', (_req, res) => {
    res.send('Quiz Scoreboard API - Visit /api/quizzes for quiz endpoints');
});

// Routes
app.use('/api/quizzes', quizRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/rounds', roundRoutes);
app.use('/api/scores', scoreRoutes);
app.use('/api/mock', mockRoutes);

AppDataSource.initialize().then(() => {
    console.log("Database initialized");
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}).catch(error => console.log(error));

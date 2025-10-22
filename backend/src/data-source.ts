import { DataSource } from "typeorm";
import { Quiz } from "./entities/Quiz";
import { Round } from "./entities/Round";
import { Team } from "./entities/Team";
import { TeamQuiz } from "./entities/TeamQuiz";
import { Score } from "./entities/Score";

export const AppDataSource = new DataSource({
    type: "sqlite",
    database: "quiz.sqlite",
    synchronize: true,
    logging: false,
    entities: [Quiz, Round, Team, TeamQuiz, Score],
    migrations: [],
    subscribers: [],
    // Enable foreign keys for SQLite
    extra: {
        pragma: "PRAGMA foreign_keys = ON;"
    }
});
import { Entity, PrimaryGeneratedColumn, ManyToOne, OneToMany, Index } from "typeorm";
import { Quiz } from "./Quiz";
import { Team } from "./Team";
import { Score } from "./Score";

@Entity()
@Index(['quiz', 'team']) // Composite index for quiz-team lookups
export class TeamQuiz {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Team, team => team.teamQuizzes)
    @Index() // Index on teamId for faster joins
    team!: Team;

    @ManyToOne(() => Quiz, quiz => quiz.teamQuizzes)
    @Index() // Index on quizId for faster joins
    quiz!: Quiz;

    @OneToMany(() => Score, score => score.teamQuiz, { cascade: true, onDelete: 'CASCADE' })
    scores!: Score[];
}
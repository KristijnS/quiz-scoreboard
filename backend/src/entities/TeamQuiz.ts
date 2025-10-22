import { Entity, PrimaryGeneratedColumn, ManyToOne, OneToMany, Index, Column } from "typeorm";
import { Quiz } from "./Quiz";
import { Team } from "./Team";
import { Score } from "./Score";

@Entity()
@Index(['quiz', 'team']) // Composite index for quiz-team lookups
export class TeamQuiz {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ default: 1 })
    @Index() // Index on nr for sorting teams within a quiz
    nr!: number;

    @ManyToOne(() => Team, team => team.teamQuizzes)
    @Index() // Index on teamId for faster joins
    team!: Team;

    @ManyToOne(() => Quiz, quiz => quiz.teamQuizzes)
    @Index() // Index on quizId for faster joins
    quiz!: Quiz;

    @OneToMany(() => Score, score => score.teamQuiz, { cascade: true, onDelete: 'CASCADE' })
    scores!: Score[];
}
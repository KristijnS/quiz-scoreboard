import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index } from "typeorm";
import { Round } from "./Round";
import { TeamQuiz } from "./TeamQuiz";

@Entity()
@Index(['round', 'teamQuiz']) // Composite index for common queries
export class Score {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    points!: number;

    @ManyToOne(() => Round, round => round.scores)
    @Index() // Index on roundId for faster joins
    round!: Round;

    @ManyToOne(() => TeamQuiz, teamQuiz => teamQuiz.scores)
    @Index() // Index on teamQuizId for faster joins
    teamQuiz!: TeamQuiz;
}
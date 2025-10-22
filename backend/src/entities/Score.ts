import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Round } from "./Round";
import { TeamQuiz } from "./TeamQuiz";

@Entity()
export class Score {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    points!: number;

    @ManyToOne(() => Round, round => round.scores)
    round!: Round;

    @ManyToOne(() => TeamQuiz, teamQuiz => teamQuiz.scores)
    teamQuiz!: TeamQuiz;
}
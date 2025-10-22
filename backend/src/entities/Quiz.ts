import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from "typeorm";
import { Round } from "./Round";
import { TeamQuiz } from "./TeamQuiz";

@Entity()
export class Quiz {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column({ default: false })
    scaleConversionEnabled!: boolean;

    @Column({ type: 'float', nullable: true })
    standardScale?: number;

    @Column({ default: true })
    gradientEnabled!: boolean;

    @CreateDateColumn()
    creationDate!: Date;

    @OneToMany(() => Round, round => round.quiz, { cascade: true, onDelete: 'CASCADE' })
    rounds!: Round[];

    @OneToMany(() => TeamQuiz, teamQuiz => teamQuiz.quiz, { cascade: true, onDelete: 'CASCADE' })
    teamQuizzes!: TeamQuiz[];
}
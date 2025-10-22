import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { TeamQuiz } from "./TeamQuiz";

@Entity()
export class Team {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column({ default: 1 })
    nr!: number;

    @OneToMany(() => TeamQuiz, teamQuiz => teamQuiz.team)
    teamQuizzes!: TeamQuiz[];
}
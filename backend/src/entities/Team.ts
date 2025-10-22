import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { TeamQuiz } from "./TeamQuiz";

@Entity()
export class Team {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @OneToMany(() => TeamQuiz, teamQuiz => teamQuiz.team)
    teamQuizzes!: TeamQuiz[];
}
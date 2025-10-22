import { Entity, PrimaryGeneratedColumn, Column, OneToMany, Index } from "typeorm";
import { TeamQuiz } from "./TeamQuiz";

@Entity()
export class Team {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column({ default: 1 })
    @Index() // Index on nr for sorting teams
    nr!: number;

    @OneToMany(() => TeamQuiz, teamQuiz => teamQuiz.team)
    teamQuizzes!: TeamQuiz[];
}
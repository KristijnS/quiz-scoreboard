import { Entity, PrimaryGeneratedColumn, ManyToOne, OneToMany } from "typeorm";
import { Quiz } from "./Quiz";
import { Team } from "./Team";
import { Score } from "./Score";

@Entity()
export class TeamQuiz {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Team, team => team.teamQuizzes)
    team!: Team;

    @ManyToOne(() => Quiz, quiz => quiz.teamQuizzes)
    quiz!: Quiz;

    @OneToMany(() => Score, score => score.teamQuiz, { cascade: true, onDelete: 'CASCADE' })
    scores!: Score[];
}
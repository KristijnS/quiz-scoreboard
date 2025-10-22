import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, Index } from "typeorm";
import { Quiz } from "./Quiz";
import { Score } from "./Score";

@Entity()
export class Round {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    title!: string;

    @Column()
    @Index() // Index on nr for sorting
    nr!: number;

    @Column()
    maxScore!: number;

    @Column({ default: false })
    excludeFromScale!: boolean;

    @ManyToOne(() => Quiz, quiz => quiz.rounds)
    @Index() // Index on quizId for faster joins
    quiz!: Quiz;

    @OneToMany(() => Score, score => score.round, { cascade: true, onDelete: 'CASCADE' })
    scores!: Score[];
}
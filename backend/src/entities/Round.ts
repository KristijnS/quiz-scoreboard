import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from "typeorm";
import { Quiz } from "./Quiz";
import { Score } from "./Score";

@Entity()
export class Round {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    title!: string;

    @Column()
    nr!: number;

    @Column()
    maxScore!: number;

    @Column({ default: false })
    excludeFromScale!: boolean;

    @ManyToOne(() => Quiz, quiz => quiz.rounds)
    quiz!: Quiz;

    @OneToMany(() => Score, score => score.round, { cascade: true, onDelete: 'CASCADE' })
    scores!: Score[];
}
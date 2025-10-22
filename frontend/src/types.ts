export interface Quiz {
    id: number;
    name: string;
    creationDate: string;
    scaleConversionEnabled: boolean;
    standardScale?: number;
    gradientEnabled: boolean;
    rounds: Round[];
    teamQuizzes: TeamQuiz[];
}

export interface Round {
    id: number;
    title: string;
    nr: number;
    maxScore: number;
    excludeFromScale: boolean;
    scores: Score[];
}

export interface Team {
    id: number;
    name: string;
    nr: number;
}

export interface TeamQuiz {
    id: number;
    team: Team;
    scores: Score[];
}

export interface CreateRoundData {
    title: string;
    nr: number;
    maxScore: number;
    quizId: number;
}

export interface Score {
    id: number;
    points: number;
    round: Round;
    teamQuiz: TeamQuiz;
}
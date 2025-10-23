import axios from 'axios';
import { Quiz, Team, Round, Score, CreateRoundData } from '../types';

const API_URL = 'http://localhost:3000/api';

export const quizApi = {
    getAll: () => axios.get<Quiz[]>(`${API_URL}/quizzes`).then(res => res.data),
    get: (id: number) => axios.get<Quiz>(`${API_URL}/quizzes/${id}`).then(res => res.data),
    create: (name: string) => axios.post<Quiz>(`${API_URL}/quizzes`, { name }).then(res => res.data),
    update: (id: number, data: { scaleConversionEnabled?: boolean; standardScale?: number; gradientEnabled?: boolean }) =>
        axios.put<Quiz>(`${API_URL}/quizzes/${id}`, data).then(res => res.data),
    delete: (id: number) => axios.delete(`${API_URL}/quizzes/${id}`)
};

export const teamApi = {
    getForQuiz: (quizId: number) => axios.get<Team[]>(`${API_URL}/teams/quiz/${quizId}`).then(res => res.data),
    addToQuiz: (quizId: number, name: string) => 
        axios.post<Team>(`${API_URL}/teams/quiz/${quizId}`, { name }).then(res => res.data),
    removeFromQuiz: (quizId: number, teamId: number) => 
        axios.delete(`${API_URL}/teams/quiz/${quizId}/team/${teamId}`),
    updateOrder: (id: number, nr: number, quizId: number) =>
        axios.put<Team>(`${API_URL}/teams/${id}/order`, { nr, quizId }).then(res => res.data),
    update: (id: number, name: string, quizId: number) =>
        axios.put<Team>(`${API_URL}/teams/${id}`, { name, quizId }).then(res => res.data)
};

export const roundApi = {
    getForQuiz: (quizId: number) => axios.get<Round[]>(`${API_URL}/rounds/quiz/${quizId}`).then(res => res.data),
    create: (round: CreateRoundData) => 
        axios.post<Round>(`${API_URL}/rounds`, round).then(res => res.data),
    updateOrder: (id: number, newNr: number) => 
        axios.put<Round>(`${API_URL}/rounds/${id}/order`, { newNr }).then(res => res.data),
    update: (id: number, data: { title: string; maxScore: number; excludeFromScale?: boolean }) =>
        axios.put<Round>(`${API_URL}/rounds/${id}`, data).then(res => res.data),
    delete: (id: number) => axios.delete(`${API_URL}/rounds/${id}`)
};

export const scoreApi = {
    getForRound: (roundId: number) => 
        axios.get<Score[]>(`${API_URL}/scores/round/${roundId}`).then(res => res.data),
    update: (roundId: number, teamQuizId: number, points: number) => 
        axios.put<Score>(`${API_URL}/scores`, { roundId, teamQuizId, points }).then(res => res.data)
};

export const mockApi = {
    generate: (teams: number, rounds: number, withScores: boolean, useStandardScale: boolean, standardScale: number) =>
        axios.post<{ quizId: number; message: string }>(`${API_URL}/mock/generate`, { teams, rounds, withScores, useStandardScale, standardScale }).then(res => res.data)
};
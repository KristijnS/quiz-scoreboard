import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Quiz } from '../types';
import { quizApi } from '../services/api';

interface QuizContextType {
    quiz: Quiz | null;
    loading: boolean;
    error: Error | null;
    refreshQuiz: () => Promise<void>;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export function QuizProvider({ children }: { children: ReactNode }) {
    const location = useLocation();
    // Extract quiz ID from the current location path
    const match = location.pathname.match(/\/quiz\/(\d+)/);
    const id = match ? match[1] : null;
    
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const loadQuiz = useCallback(async () => {
        if (!id) {
            setQuiz(null);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const data = await quizApi.get(parseInt(id, 10));
            setQuiz(data);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to load quiz'));
            setQuiz(null);
        } finally {
            setLoading(false);
        }
    }, [id]);

    // Load quiz when id changes
    useEffect(() => {
        loadQuiz();
    }, [loadQuiz]);

    const refreshQuiz = useCallback(async () => {
        await loadQuiz();
    }, [loadQuiz]);

    return (
        <QuizContext.Provider value={{ quiz, loading, error, refreshQuiz }}>
            {children}
        </QuizContext.Provider>
    );
}

export function useQuiz() {
    const context = useContext(QuizContext);
    if (context === undefined) {
        throw new Error('useQuiz must be used within a QuizProvider');
    }
    return context;
}

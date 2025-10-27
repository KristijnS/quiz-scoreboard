import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
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
    
    // Track if a request is in flight to prevent duplicate calls
    const loadingRef = useRef(false);
    const currentIdRef = useRef<string | null>(null);

    const loadQuiz = useCallback(async () => {
        if (!id) {
            setQuiz(null);
            loadingRef.current = false;
            currentIdRef.current = null;
            return;
        }

        // Prevent duplicate calls for the same ID
        if (loadingRef.current && currentIdRef.current === id) {
            return;
        }

        loadingRef.current = true;
        currentIdRef.current = id;
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
            loadingRef.current = false;
        }
    }, [id]);

    // Load quiz when id changes
    useEffect(() => {
        loadQuiz();
    }, [loadQuiz]);

    // Refresh quiz data when navigating to different pages within the same quiz
    useEffect(() => {
        if (id) {
            loadQuiz();
        }
    }, [location.pathname, id]); // Re-fetch when pathname changes

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

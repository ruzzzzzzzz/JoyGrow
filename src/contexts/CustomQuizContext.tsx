import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useUser } from './UserContext';
import { db } from '../database';

export interface CustomQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'fill_blank' | 'matching' | 'enumeration' | 'identification';
  question: string;
  options?: string[];
  correct_answer: string | string[];
  explanation: string;
  pairs?: { left: string; right: string }[];
  // For Modified True/False questions
  underlinedText?: string;
  correctReplacement?: string;
  // For Fill in the Blank questions with multiple blanks
  fill_blank_answers?: string[];
}

export interface CustomQuiz {
  id: string;
  title: string;
  description: string;
  questions: CustomQuestion[];
  createdAt: number;
  updatedAt: number;
  tags: string[];
  category: string;
}

interface CustomQuizContextType {
  customQuizzes: CustomQuiz[];
  addQuiz: (quiz: Omit<CustomQuiz, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateQuiz: (id: string, quiz: Partial<CustomQuiz>) => void;
  deleteQuiz: (id: string) => void;
  getQuiz: (id: string) => CustomQuiz | undefined;
  resetCustomQuizzes: () => void;
}

const CustomQuizContext = createContext<CustomQuizContextType | undefined>(undefined);

export function CustomQuizProvider({ children }: { children: ReactNode }) {
  const userContext = useUser();
  const { currentUser } = userContext || { currentUser: null };
  const [customQuizzes, setCustomQuizzes] = useState<CustomQuiz[]>([]);

  // Load user-specific custom quizzes from database
  useEffect(() => {
    const loadQuizzes = async () => {
      if (currentUser) {
        try {
          const dbQuizzes = await db.getCustomQuizzesByUser(currentUser.id);
          const mappedQuizzes: CustomQuiz[] = dbQuizzes.map(quiz => ({
            id: quiz.id,
            title: quiz.title,
            description: quiz.description || '',
            questions: quiz.questions,
            createdAt: new Date(quiz.created_at).getTime(),
            updatedAt: new Date(quiz.updated_at).getTime(),
            tags: quiz.tags,
            category: quiz.category || '',
          }));
          setCustomQuizzes(mappedQuizzes);
        } catch (error) {
          console.error('Error loading custom quizzes from database:', error);
          setCustomQuizzes([]);
        }
      } else {
        setCustomQuizzes([]);
      }
    };

    loadQuizzes();
  }, [currentUser]);

  const addQuiz = useCallback(async (quiz: Omit<CustomQuiz, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!currentUser) return;

    try {
      const newQuiz = await db.createCustomQuiz({
        user_id: currentUser.id,
        title: quiz.title,
        description: quiz.description,
        category: quiz.category,
        tags: quiz.tags,
        questions: quiz.questions,
        synced: false,
      });

      const mappedQuiz: CustomQuiz = {
        id: newQuiz.id,
        title: newQuiz.title,
        description: newQuiz.description || '',
        questions: newQuiz.questions,
        createdAt: new Date(newQuiz.created_at).getTime(),
        updatedAt: new Date(newQuiz.updated_at).getTime(),
        tags: newQuiz.tags,
        category: newQuiz.category || '',
      };

      setCustomQuizzes(prev => [mappedQuiz, ...prev]);
    } catch (error) {
      console.error('Error adding custom quiz:', error);
    }
  }, [currentUser]);

  const updateQuiz = useCallback(async (id: string, updates: Partial<CustomQuiz>) => {
    if (!currentUser) return;

    try {
      const dbUpdates: any = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
      if (updates.questions !== undefined) dbUpdates.questions = updates.questions;

      const updatedQuiz = await db.updateCustomQuiz(id, dbUpdates);

      const mappedQuiz: CustomQuiz = {
        id: updatedQuiz.id,
        title: updatedQuiz.title,
        description: updatedQuiz.description || '',
        questions: updatedQuiz.questions,
        createdAt: new Date(updatedQuiz.created_at).getTime(),
        updatedAt: new Date(updatedQuiz.updated_at).getTime(),
        tags: updatedQuiz.tags,
        category: updatedQuiz.category || '',
      };

      setCustomQuizzes(prev =>
        prev.map(quiz => quiz.id === id ? mappedQuiz : quiz)
      );
    } catch (error) {
      console.error('Error updating custom quiz:', error);
    }
  }, [currentUser]);

  const deleteQuiz = useCallback(async (id: string) => {
    if (!currentUser) return;

    try {
      await db.deleteCustomQuiz(id);
      setCustomQuizzes(prev => prev.filter(quiz => quiz.id !== id));
    } catch (error) {
      console.error('Error deleting custom quiz:', error);
    }
  }, [currentUser]);

  const getQuiz = useCallback((id: string) => {
    return customQuizzes.find(quiz => quiz.id === id);
  }, [customQuizzes]);

  // Reset all custom quizzes
  const resetCustomQuizzes = useCallback(() => {
    setCustomQuizzes([]);
  }, []);

  return (
    <CustomQuizContext.Provider
      value={{
        customQuizzes,
        addQuiz,
        updateQuiz,
        deleteQuiz,
        getQuiz,
        resetCustomQuizzes
      }}
    >
      {children}
    </CustomQuizContext.Provider>
  );
}

export function useCustomQuiz() {
  const context = useContext(CustomQuizContext);
  if (context === undefined) {
    throw new Error('useCustomQuiz must be used within a CustomQuizProvider');
  }
  return context;
}
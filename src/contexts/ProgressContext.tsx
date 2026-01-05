import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { OfflineQuiz } from '../data/offlineQuizzes';
import { useUser } from './UserContext';
import { db } from '../database';

export interface QuizAttempt {
  id: string;
  quizType: OfflineQuiz['type'] | 'all_types';
  quizTitle: string;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  timeTaken: number;
  timestamp: number;
  answers: { [key: string]: string | string[] };
  quizzes: (OfflineQuiz | any)[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
  progress?: number;
  maxProgress?: number;
  color: string;
}

interface ProgressContextType {
  quizAttempts: QuizAttempt[];
  achievements: Achievement[];
  addQuizAttempt: (attempt: QuizAttempt) => void;
  getProgressStats: () => {
    totalQuizzes: number;
    averageScore: number;
    currentStreak: number;
    typesMastered: number;
    todayQuizzes: number;
    todayScore: number;
    todayQuestionsAnswered: number;
    totalPoints: number;
    level: number;
    levelProgress: number;
    pointsToNextLevel: number;
  };
  getQuizTypeProgress: (type: OfflineQuiz['type']) => {
    attempts: number;
    bestScore: number;
    averageScore: number;
    totalQuestions: number;
    correctAnswers: number;
    mastery: number;
  };
  checkAndUnlockAchievements: (attempt: QuizAttempt) => Promise<Achievement[]>;
  resetProgress: () => void;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

const defaultAchievements: Achievement[] = [
  {
    id: 'first_quiz',
    title: 'First Steps',
    description: 'Complete your first quiz',
    icon: '🎯',
    unlocked: false,
    color: 'from-blue-400 to-blue-600'
  },
  {
    id: 'perfect_score',
    title: 'Perfect Score',
    description: 'Score 100% on any quiz',
    icon: '💯',
    unlocked: false,
    color: 'from-yellow-400 to-yellow-600'
  },
  {
    id: 'quiz_master',
    title: 'Quiz Master',
    description: 'Complete all 6 quiz types',
    icon: '👑',
    unlocked: false,
    progress: 0,
    maxProgress: 6,
    color: 'from-purple-400 to-purple-600'
  },
  {
    id: 'speed_demon',
    title: 'Speed Demon',
    description: 'Complete a quiz in under 5 minutes',
    icon: '⚡',
    unlocked: false,
    color: 'from-orange-400 to-orange-600'
  },
  {
    id: 'consistent_learner',
    title: 'Consistent Learner',
    description: 'Complete 5 quizzes',
    icon: '📚',
    unlocked: false,
    progress: 0,
    maxProgress: 5,
    color: 'from-green-400 to-green-600'
  },
  {
    id: 'high_achiever',
    title: 'High Achiever',
    description: 'Score above 90% on 3 quizzes',
    icon: '⭐',
    unlocked: false,
    progress: 0,
    maxProgress: 3,
    color: 'from-pink-400 to-pink-600'
  },
  {
    id: 'knowledge_seeker',
    title: 'Knowledge Seeker',
    description: 'Answer 50 questions correctly',
    icon: '🧠',
    unlocked: false,
    progress: 0,
    maxProgress: 50,
    color: 'from-indigo-400 to-indigo-600'
  },
  {
    id: 'complete_challenge',
    title: 'Complete Challenge',
    description: 'Complete the General Knowledge quiz',
    icon: '🏆',
    unlocked: false,
    color: 'from-rose-400 to-rose-600'
  },
  {
    id: 'multiple_choice_expert',
    title: 'Multiple Choice Expert',
    description: 'Score 100% on 3 Multiple Choice quizzes',
    icon: '🔘',
    unlocked: false,
    progress: 0,
    maxProgress: 3,
    color: 'from-blue-400 to-blue-600'
  },
  {
    id: 'dedication',
    title: 'Dedication',
    description: 'Complete 10 quizzes',
    icon: '🎖️',
    unlocked: false,
    progress: 0,
    maxProgress: 10,
    color: 'from-red-400 to-red-600'
  }
];

export function ProgressProvider({ children }: { children: ReactNode }) {
  const userContext = useUser();
  const { currentUser } = userContext || { currentUser: null };

  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>(defaultAchievements);
  const [isLoading, setIsLoading] = useState(true);

  // Load user-specific data from database when user changes
  useEffect(() => {
    const loadUserData = async () => {
      if (currentUser) {
        try {
          setIsLoading(true);
          
          // Load quiz attempts from database
          const dbAttempts = await db.getQuizAttemptsByUser(currentUser.id);
          const mappedAttempts: QuizAttempt[] = dbAttempts.map(attempt => ({
            id: attempt.id,
            quizType: attempt.quiz_type as any,
            quizTitle: attempt.quiz_title,
            totalQuestions: attempt.total_questions,
            correctAnswers: attempt.correct_answers,
            score: attempt.score,
            timeTaken: attempt.time_taken,
            timestamp: new Date(attempt.timestamp).getTime(),
            answers: attempt.answers,
            quizzes: attempt.quizzes,
          }));
          setQuizAttempts(mappedAttempts);

          // Load achievements from database
          const dbAchievements = await db.getUserAchievements(currentUser.id);
          if (dbAchievements.length > 0) {
            const mappedAchievements: Achievement[] = dbAchievements.map(ach => ({
              id: ach.achievement_id,
              title: ach.title,
              description: ach.description,
              icon: ach.icon,
              unlocked: ach.unlocked,
              unlockedAt: ach.unlocked_at ? new Date(ach.unlocked_at).getTime() : undefined,
              progress: ach.progress,
              maxProgress: ach.max_progress,
              color: ach.color,
            }));
            setAchievements(mappedAchievements);
          } else {
            // Initialize achievements for new user
            await db.initializeUserAchievements(currentUser.id);
            setAchievements(defaultAchievements);
          }
        } catch (error) {
          console.error('Error loading user progress from database:', error);
          setQuizAttempts([]);
          setAchievements(defaultAchievements);
        } finally {
          setIsLoading(false);
        }
      } else {
        // No user logged in, reset to defaults
        setQuizAttempts([]);
        setAchievements(defaultAchievements);
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [currentUser]);

  const addQuizAttempt = useCallback(async (attempt: QuizAttempt) => {
    if (!currentUser) return;

    try {
      // Save to database
      await db.createQuizAttempt({
        user_id: currentUser.id,
        quiz_type: attempt.quizType,
        quiz_title: attempt.quizTitle,
        total_questions: attempt.totalQuestions,
        correct_answers: attempt.correctAnswers,
        score: attempt.score,
        time_taken: attempt.timeTaken,
        answers: attempt.answers,
        quizzes: attempt.quizzes,
        synced: false,
      });

      // Update local state
      setQuizAttempts(prev => [...prev, attempt]);
    } catch (error) {
      console.error('Error saving quiz attempt:', error);
    }
  }, [currentUser]);

  const getProgressStats = useCallback(() => {
    const totalQuizzes = quizAttempts.length;
    const averageScore = totalQuizzes > 0
      ? quizAttempts.reduce((sum, a) => sum + a.score, 0) / totalQuizzes
      : 0;

    // Calculate streak (consecutive days)
    const today = new Date().setHours(0, 0, 0, 0);
    const sortedAttempts = [...quizAttempts].sort((a, b) => b.timestamp - a.timestamp);
    let currentStreak = 0;
    let checkDate = today;
    
    for (const attempt of sortedAttempts) {
      const attemptDate = new Date(attempt.timestamp).setHours(0, 0, 0, 0);
      if (attemptDate === checkDate) {
        if (checkDate === today || currentStreak > 0) {
          currentStreak++;
          checkDate = checkDate - 86400000; // Go back one day
        }
      } else if (attemptDate < checkDate - 86400000) {
        break; // Streak broken
      }
    }

    // Count unique quiz types completed
    const uniqueTypes = new Set(quizAttempts.map(a => a.quizType));
    const typesMastered = uniqueTypes.size;

    // Today's stats
    const todayAttempts = quizAttempts.filter(a => {
      const attemptDate = new Date(a.timestamp).setHours(0, 0, 0, 0);
      return attemptDate === today;
    });
    const todayQuizzes = todayAttempts.length;
    const todayScore = todayQuizzes > 0
      ? todayAttempts.reduce((sum, a) => sum + a.score, 0) / todayQuizzes
      : 0;
    
    // Calculate today's questions answered
    const todayQuestionsAnswered = todayAttempts.reduce((sum, a) => sum + a.totalQuestions, 0);

    // Calculate total points (10 points per correct answer)
    const totalPoints = quizAttempts.reduce((sum, a) => sum + (a.correctAnswers * 10), 0);
    
    // Calculate level (300 points per level)
    const level = Math.floor(totalPoints / 300) + 1;
    const pointsInCurrentLevel = totalPoints % 300;
    const levelProgress = (pointsInCurrentLevel / 300) * 100;
    const pointsToNextLevel = 300 - pointsInCurrentLevel;

    return {
      totalQuizzes,
      averageScore: Math.round(averageScore),
      currentStreak,
      typesMastered,
      todayQuizzes,
      todayScore: Math.round(todayScore),
      todayQuestionsAnswered,
      totalPoints,
      level,
      levelProgress: Math.round(levelProgress),
      pointsToNextLevel
    };
  }, [quizAttempts]);

  const getQuizTypeProgress = useCallback((type: OfflineQuiz['type']) => {
    const typeAttempts = quizAttempts.filter(a => a.quizType === type);
    const attempts = typeAttempts.length;
    const bestScore = attempts > 0 ? Math.max(...typeAttempts.map(a => a.score)) : 0;
    const averageScore = attempts > 0
      ? typeAttempts.reduce((sum, a) => sum + a.score, 0) / attempts
      : 0;
    const totalQuestions = typeAttempts.reduce((sum, a) => sum + a.totalQuestions, 0);
    const correctAnswers = typeAttempts.reduce((sum, a) => sum + a.correctAnswers, 0);
    const mastery = attempts > 0 ? Math.min(100, attempts * 20 + averageScore * 0.5) : 0;

    return {
      attempts,
      bestScore: Math.round(bestScore),
      averageScore: Math.round(averageScore),
      totalQuestions,
      correctAnswers,
      mastery: Math.round(mastery)
    };
  }, [quizAttempts]);

  const checkAndUnlockAchievements = async (attempt: QuizAttempt): Promise<Achievement[]> => {
    if (!currentUser) return [];
    
    const newlyUnlocked: Achievement[] = [];
    const stats = getProgressStats();

    // Get current achievements from database
    const dbAchievements = await db.getUserAchievements(currentUser.id);

    for (const dbAch of dbAchievements) {
      if (dbAch.unlocked) continue;

      let shouldUnlock = false;
      let newProgress = dbAch.progress || 0;

      switch (dbAch.achievement_id) {
        case 'first_quiz':
          shouldUnlock = stats.totalQuizzes >= 1;
          break;

        case 'perfect_score':
          shouldUnlock = attempt.score === 100;
          break;

        case 'quiz_master':
          const uniqueTypes = new Set(quizAttempts.map(a => a.quizType).concat(attempt.quizType));
          newProgress = uniqueTypes.size;
          shouldUnlock = newProgress >= 6;
          break;

        case 'speed_demon':
          shouldUnlock = attempt.timeTaken < 300; // 5 minutes
          break;

        case 'consistent_learner':
          newProgress = stats.totalQuizzes;
          shouldUnlock = newProgress >= 5;
          break;

        case 'high_achiever':
          const highScores = quizAttempts.filter(a => a.score >= 90).length + (attempt.score >= 90 ? 1 : 0);
          newProgress = highScores;
          shouldUnlock = newProgress >= 3;
          break;

        case 'knowledge_seeker':
          const totalCorrect = quizAttempts.reduce((sum, a) => sum + a.correctAnswers, 0) + attempt.correctAnswers;
          newProgress = totalCorrect;
          shouldUnlock = newProgress >= 50;
          break;

        case 'complete_challenge':
          shouldUnlock = attempt.quizType === 'all_types';
          break;

        case 'multiple_choice_expert':
          const mcPerfect = quizAttempts.filter(a => a.quizType === 'multiple_choice' && a.score === 100).length +
            (attempt.quizType === 'multiple_choice' && attempt.score === 100 ? 1 : 0);
          newProgress = mcPerfect;
          shouldUnlock = newProgress >= 3;
          break;

        case 'dedication':
          newProgress = stats.totalQuizzes;
          shouldUnlock = newProgress >= 10;
          break;
      }

      // Update database with new progress or unlock status
      if (shouldUnlock || newProgress !== dbAch.progress) {
        const updates: any = { progress: newProgress };
        
        if (shouldUnlock) {
          updates.unlocked = true;
          updates.unlocked_at = new Date().toISOString();
          
          newlyUnlocked.push({
            id: dbAch.achievement_id,
            title: dbAch.title,
            description: dbAch.description,
            icon: dbAch.icon,
            unlocked: true,
            unlockedAt: Date.now(),
            progress: newProgress,
            maxProgress: dbAch.max_progress,
            color: dbAch.color,
          });
        }

        await db.updateUserAchievement(dbAch.id, updates);
      }
    }

    // Reload achievements to update local state
    const updatedDbAchievements = await db.getUserAchievements(currentUser.id);
    const mappedAchievements: Achievement[] = updatedDbAchievements.map(ach => ({
      id: ach.achievement_id,
      title: ach.title,
      description: ach.description,
      icon: ach.icon,
      unlocked: ach.unlocked,
      unlockedAt: ach.unlocked_at ? new Date(ach.unlocked_at).getTime() : undefined,
      progress: ach.progress,
      maxProgress: ach.max_progress,
      color: ach.color,
    }));
    setAchievements(mappedAchievements);

    return newlyUnlocked;
  };

  // Reset all progress data
  const resetProgress = useCallback(() => {
    setQuizAttempts([]);
    setAchievements(defaultAchievements);
  }, []);

  return (
    <ProgressContext.Provider
      value={{
        quizAttempts,
        achievements,
        addQuizAttempt,
        getProgressStats,
        getQuizTypeProgress,
        checkAndUnlockAchievements,
        resetProgress
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress must be used within ProgressProvider');
  }
  return context;
}
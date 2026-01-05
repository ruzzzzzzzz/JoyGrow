import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { DashboardHeader } from './components/DashboardHeader';
import { Navigation, DesktopSidebar } from './components/Navigation';
import { QuizGenerator } from './components/QuizGenerator';
import { GeneratedQuizEditor } from './components/GeneratedQuizEditor';
import { QuizTaker } from './components/QuizTaker';
import { QuizResults } from './components/QuizResults';
import { QuizBuilder } from './components/QuizBuilder';
import { Achievements } from './components/Achievements';
import { Profile } from './components/Profile';
import { Settings } from './components/Settings';
import { Notifications } from './components/Notifications';
import { ContactUs } from './components/ContactUs';
import { Notes } from './components/Notes';
import { PomodoroTimer } from './components/PomodoroTimer';
import { ProductivityToolsInterface } from './components/ProductivityToolsInterface';
import { LeaderboardPage } from './components/LeaderboardPage';
import { IntroScreen } from './components/IntroScreen';
import { AuthScreen } from './components/AuthScreen';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminModeSelector } from './components/AdminModeSelector';
import { AdminTestModeBanner } from './components/AdminTestModeBanner';
import { MaintenanceScreen } from './components/MaintenanceScreen';
import { OfflineModeIndicator } from './components/OfflineModeIndicator';
import { OfflineQuizSelector } from './components/OfflineQuizSelector';
import { SaveQuizDialog } from './components/SaveQuizDialog';
import { EnvSetupError } from './components/EnvSetupError';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { OfflineQuiz } from './data/offlineQuizzes';
import { ProgressProvider, useProgress } from './contexts/ProgressContext';
import { NotificationProvider, useNotifications } from './contexts/NotificationContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { CustomQuizProvider, useCustomQuiz } from './contexts/CustomQuizContext';
import { UserProvider, useUser } from './contexts/UserContext';
import { AdminProvider, useAdmin } from './contexts/AdminContext';
import { PomodoroProvider } from './contexts/PomodoroContext';
import { TodoProvider } from './contexts/TodoContext';
import { TodoList } from './components/TodoList';
import { PomodoroWidget } from './components/PomodoroWidget';
import { QuickActions } from './components/QuickActions';
import { QuizAnalytics } from './components/QuizAnalytics';
import { WrongAnswerReview } from './components/WrongAnswerReview';
import { Button } from './components/ui/button';
import { db } from './database';
import { getCurrentSession, deleteSession } from './utils/session-manager';


interface Quiz {
  id: string;
  type:
    | 'multiple_choice'
    | 'true_false'
    | 'fill_blank'
    | 'matching'
    | 'enumeration'
    | 'identification';
  question: string;
  options?: string[];
  correct_answer: string | string[];
  explanation: string;
  pairs?: { left: string; right: string }[];
  // For Modified True/False questions
  underlinedText?: string;
  correctReplacement?: string;
  // For Fill in the Blank questions
  fill_blank_answers?: string[];
}

interface QuizResults {
  totalQuestions: number;
  correctAnswers: number;
  timeTaken: number;
  answers: { [key: string]: string | string[] };
  score: number;
}

type AppState = 'intro' | 'auth' | 'authenticated';

function AppContent() {
  console.log('✅ AppContent: Starting render');

  // NOTE: removed top-level initializeDatabase() to avoid calling DB before React is ready
const Dashboard = lazy(() =>
  import('./components/Dashboard').then(mod => ({ default: mod.Dashboard }))
);
const StudyMaterials = lazy(() =>
  import('./components/StudyMaterials').then(mod => ({ default: mod.StudyMaterials }))
);
  
  const [appState, setAppState] = useState<AppState>('intro');
  const [currentView, setCurrentView] = useState('dashboard');
  const [quizState, setQuizState] = useState<
    'generator' | 'offline-selector' | 'editor' | 'taking' | 'results'
  >('generator');
  const [currentQuizzes, setCurrentQuizzes] = useState<(Quiz | OfflineQuiz)[]>([]);
  const [quizResults, setQuizResults] = useState<QuizResults | null>(null);
  const [quizBuilderMode, setQuizBuilderMode] = useState<'create' | 'edit'>('create');
  const [editingQuizId, setEditingQuizId] = useState<string | undefined>(undefined);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(false);
  const [quizSource, setQuizSource] = useState<'generator' | 'materials' | 'offline-practice'>(
    'generator'
  );
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [pendingQuizSave, setPendingQuizSave] = useState<{
    quizzes: Quiz[];
    studyMaterial?: string;
    materialFile?: string;
    materialSubject?: string;
  } | null>(null);

  const [showMaintenanceDialog, setShowMaintenanceDialog] = useState(false);

  const [quizAttempts, setQuizAttempts] = useState<any[]>([]);
  const [reviewingAttempt, setReviewingAttempt] = useState<any | null>(null);

  const [showAdminModeSelector, setShowAdminModeSelector] = useState(false);
  const [pendingAdminData, setPendingAdminData] = useState<any | null>(null);
  const [adminInLearnerMode, setAdminInLearnerMode] = useState(false);

  const [dbReady, setDbReady] = useState(false);

  // NEW: prevent repeated auto-login and logs
  const [sessionHandled, setSessionHandled] = useState(false);

  const resetQuizState = () => {
    setQuizState('generator');
    setCurrentQuizzes([]);
    setQuizResults(null);
    setQuizBuilderMode('create');
    setEditingQuizId(undefined);
    setShowSaveDialog(false);
    setPendingQuizSave(null);
    setReviewingAttempt(null);
    setQuizSource('generator');
  };

  const { currentUser, setCurrentUser } = useUser();
  const { isAdmin, checkAdminCredentials, setIsAdmin, appSettings } = useAdmin();
  const isMaintenanceOn = appSettings.maintenanceMode;
  const { isOnline, isOfflineMode, connectionType, setOfflineMode, effectivelyOffline } =
    useNetworkStatus();
  const {
    addQuizAttempt,
    checkAndUnlockAchievements,
    achievements,
    getProgressStats,
    resetProgress
  } = useProgress();
  const { addNotification, unreadCount, resetNotifications } = useNotifications();
  const { addQuiz } = useCustomQuiz();

  console.log('✅ AppContent: All hooks initialized, appState =', appState);

  const handleIntroComplete = () => {
    setAppState('auth');
  };

  // FIXED: add options.silent so auto-login does not spam welcome toast
  const handleLogin = useCallback(
    async (userData: any, isAdminFlag: boolean = false, options?: { silent?: boolean }) => {
      const MAINTENANCE_ADMIN_ID = 'ac69ea30-2bd8-4755-b590-8946c00adeae';

      if (appSettings.maintenanceMode && userData?.id !== MAINTENANCE_ADMIN_ID) {
        setShowMaintenanceDialog(true);
        setAppState('auth');       // stay on login screen
        setCurrentUser(null);
        setIsAdmin(false);
        await deleteSession();     // remove any created session
        return;                    // ⛔ block login completely
      }

      setCurrentUser({
        id: userData.id,
        username: userData.username,
        level: userData.level,
        streak: userData.streak,
        totalPoints: userData.totalPoints,
        profileImage: userData.profileimage || userData.profilePicture
      });

      if (!isAdminFlag && userData.id) {
        try {
          const today = new Date().toISOString().split('T')[0];
          const history = await db.getLoginHistory(userData.id);
          const hasToday = history.some((h: any) => h.login_date === today);
          if (!hasToday) {
            await db.recordLogin(userData.id, today);
          }
        } catch (err) {
          console.error('Failed to record login day:', err);
        }
      }

      if (isAdminFlag) {
        setPendingAdminData(userData);
        setShowAdminModeSelector(true);
        setAppState('authenticated');
      } else {
        setIsAdmin(false);
        setCurrentView('dashboard');
        setAppState('authenticated');

        if (!options?.silent) {
          setTimeout(() => {
            addNotification({
              type: 'update',
              title: 'Welcome to JoyGrow! 🎉',
              message: `Welcome back, ${userData.username}! Ready to continue your learning journey?`,
              icon: '👋'
            });
          }, 1000);
        }
      }
    },
    [appSettings.maintenanceMode, setCurrentUser, setIsAdmin, addNotification]
  );

  const handleBackToIntro = () => {
    setAppState('intro');
  };

  const handleLogout = async () => {
    try {
      await deleteSession();
      console.log('✅ Session deleted successfully');
    } catch (err) {
      console.error('Failed to delete session on logout:', err);
    }

    setCurrentUser(null);
    setIsAdmin(false);
    setAdminInLearnerMode(false);

    setAppState('intro');
    setCurrentView('dashboard');
    setQuizState('generator');
    setCurrentQuizzes([]);
    setQuizResults(null);

    toast.success('Logged out successfully');
  };

  const handleAdminModeSelect = (mode: 'admin' | 'learner') => {
    if (!pendingAdminData) return;

    setShowAdminModeSelector(false);
    setIsAdmin(true);

    if (mode === 'admin') {
      setCurrentView('admin');
      setAdminInLearnerMode(false);
      toast.success('Admin dashboard mode activated! 🔐');
    } else {
      setCurrentView('dashboard');
      setAdminInLearnerMode(true);
      toast.info('Admin Test Mode: Experiencing JoyGrow as a learner 📚', {
        duration: 4000
      });
    }

    setPendingAdminData(null);
  };

  const handleBackToAdmin = () => {
    setCurrentView('admin');
    setAdminInLearnerMode(false);
    toast.success('Back to Admin Dashboard 🔐');
  };

  const handleSwitchToLearner = () => {
    setCurrentView('dashboard');
    setAdminInLearnerMode(true);
    toast.info('Admin Test Mode: Experiencing JoyGrow as a learner 📚', {
      duration: 4000
    });
  };

  // FIXED: Run initialization only once on mount
  useEffect(() => {
    let cancelled = false;
    let hasRun = false;

    const init = async () => {
      // Prevent multiple runs
      if (hasRun) {
        console.log('⏭️ Init already ran, skipping');
        return;
      }
      hasRun = true;

      try {
        console.log('🔄 Initializing database...');
        await db.initialize();
        if (cancelled) return;
        console.log('✅ Database initialized successfully');
        setDbReady(true);

        const session = await getCurrentSession();

        const MAINTENANCE_ADMIN_ID = 'ac69ea30-2bd8-4755-b590-8946c00adeae';

        if (session?.isValid && session.username) {
          if (
            appSettings.maintenanceMode &&
            session.userId !== MAINTENANCE_ADMIN_ID
          ) {
            console.log('🚧 Skipping auto-login due to maintenance (non-admin user)');
            await deleteSession();
            setSessionHandled(true);
            setAppState('auth');
            return;
          }

          console.log('✅ Valid session found:', session.username);

          let userData: any = null;

          if (session.isAdmin) {
            if (session.username === 'admin123') {
              userData = {
                id: session.userId,
                username: session.username,
                level: 999,
                streak: 0,
                total_points: 0
              };
            } else {
              userData = await db.getUserById(session.userId);
            }
          } else {
            userData = await db.getUserById(session.userId);
          }

          if (userData) {
            db.setCurrentUser(userData.id, session.isAdmin);

            // Call handleLogin directly (inline) instead of from dependency
            const loginData = {
              id: userData.id,
              name: userData.username,
              username: userData.username,
              level: userData.level || 1,
              streak: userData.streak || 0,
              totalPoints: userData.total_points || 0
            };

            // Inline the login logic to avoid dependency
            if (appSettings.maintenanceMode && loginData.id !== MAINTENANCE_ADMIN_ID) {
              setShowMaintenanceDialog(true);
              setAppState('auth');
              setCurrentUser(null);
              setIsAdmin(false);
              await deleteSession();
              return;
            }

            setCurrentUser({
              id: loginData.id,
              username: loginData.username,
              level: loginData.level,
              streak: loginData.streak,
              totalPoints: loginData.totalPoints,
              profileImage: userData.profile_image || userData.profilePicture
            });

            if (!session.isAdmin && loginData.id) {
              try {
                const today = new Date().toISOString().split('T')[0];
                const history = await db.getLoginHistory(loginData.id);
                const hasToday = history.some((h: any) => h.login_date === today);
                if (!hasToday) {
                  await db.recordLogin(loginData.id, today);
                }
              } catch (err) {
                console.error('Failed to record login day:', err);
              }
            }

            if (session.isAdmin) {
              setPendingAdminData(loginData);
              setShowAdminModeSelector(true);
              setAppState('authenticated');
            } else {
              setIsAdmin(false);
              setCurrentView('dashboard');
              setAppState('authenticated');
            }

            toast.success(`Welcome back, ${session.username}! 🎉`, {
              description: 'Automatically signed in from previous session',
              duration: 3000
            });
          } else {
            console.warn('⚠️ User not found in database, clearing session');
            await deleteSession();
          }
        } else {
          console.log('ℹ️ No valid session found, showing intro screen');
        }

        setSessionHandled(true);
      } catch (error) {
        console.error('Failed to initialize DB or check session:', error);
        setDbReady(true);
        setSessionHandled(true);
      }
    };

    void init();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - runs only once on mount

  if (showMaintenanceDialog) {
    return (
      <MaintenanceScreen
        onLogout={() => {
          setShowMaintenanceDialog(false);
          setAppState('auth');   // back to AuthScreen
        }}
      />
    );
  }

  if (!dbReady) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-gray-600">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-transparent" />
          <span>Preparing your study space…</span>
        </div>
      </div>
    );
  }

  // === everything below is identical to your current file ===

  const handleQuizGenerated = (quizzes: Quiz[], studyMaterial?: string) => {
    setCurrentQuizzes(quizzes);
    setPendingQuizSave({ quizzes, studyMaterial });
    setQuizState('editor');
  };

  const handleSaveQuiz = async (
    title: string,
    description: string,
    category: string,
    tags: string[]
  ) => {
    if (!pendingQuizSave) return;

    const customQuestions = pendingQuizSave.quizzes.map((quiz) => ({
      id: quiz.id,
      type: quiz.type,
      question: quiz.question,
      options: quiz.options,
      correct_answer: quiz.correct_answer,
      explanation: quiz.explanation,
      pairs: quiz.pairs,
      underlinedText: quiz.underlinedText,
      correctReplacement: quiz.correctReplacement,
      fill_blank_answers: quiz.fill_blank_answers
    }));

    try {
      // Await the async addQuiz operation
      await addQuiz({
        title,
        description,
        questions: customQuestions,
        tags,
        category
      });

      toast.success('Quiz saved to Study Materials! 🎉', {
        description: `"${title}" is now available in your study materials.`,
        duration: 4000
      });

      addNotification({
        type: 'update',
        title: 'Quiz Saved! 📚',
        message: `"${title}" has been added to your study materials with ${customQuestions.length} questions.`,
        icon: '📚'
      });

      setCurrentQuizzes(pendingQuizSave.quizzes);
      setQuizState('taking');
      setPendingQuizSave(null);
      setShowSaveDialog(false);
    } catch (error) {
      console.error('Error saving quiz:', error);
      toast.error('Failed to save quiz', {
        description: 'Please try again.',
        duration: 4000
      });
    }
  };

  const handleSkipSaveQuiz = () => {
    if (!pendingQuizSave) return;

    setCurrentQuizzes(pendingQuizSave.quizzes);
    setQuizState('taking');
    setPendingQuizSave(null);

    toast.info('Quiz started without saving', {
      description: 'You can create a custom quiz from the Study Materials section.',
      duration: 3000
    });
  };

  const handleStartQuizFromEditor = (editedQuizzes: Quiz[]) => {
    setCurrentQuizzes(editedQuizzes);
    setQuizState('taking');

    toast.info('Quiz started without saving', {
      description: 'You can create a custom quiz from the Study Materials section.',
      duration: 3000
    });
  };

  const handleSaveAndStartFromEditor = (editedQuizzes: Quiz[]) => {
    if (!pendingQuizSave) return;

    setPendingQuizSave({ ...pendingQuizSave, quizzes: editedQuizzes });
    setShowSaveDialog(true);
  };

  const handleBackFromEditor = () => {
    setQuizState('generator');
    setCurrentQuizzes([]);
  };

  const handleOfflineQuizSelected = (quizzes: OfflineQuiz[]) => {
    setCurrentQuizzes(quizzes);
    setQuizState('taking');
    setQuizSource('offline-practice');
    toast.success(`Starting practice quiz with ${quizzes.length} questions! Good luck! 🎯`);
  };

  const handleQuizComplete = async (results: QuizResults) => {
    setQuizResults(results);
    setQuizState('results');

    let quizType: OfflineQuiz['type'] | 'all_types' = 'multiple_choice';
    let quizTitle = 'Quiz';

    if (currentQuizzes.length === 6) {
      quizType = 'all_types';
      quizTitle = 'General Knowledge';
    } else if (currentQuizzes.length === 1 && 'type' in currentQuizzes[0]) {
      quizType = currentQuizzes[0].type as OfflineQuiz['type'];
      quizTitle = (currentQuizzes[0] as any).question || 'Quiz';
    }

    const attempt = {
      id: `attempt_${Date.now()}`,
      quizType,
      quizTitle,
      totalQuestions: results.totalQuestions,
      correctAnswers: results.correctAnswers,
      score: results.score,
      timeTaken: results.timeTaken,
      timestamp: Date.now(),
      date: new Date(),
      answers: results.answers,
      quizzes: currentQuizzes
    };

    setQuizAttempts((prev) => [...prev, attempt]);

    const statsBefore = getProgressStats();

    addQuizAttempt(attempt);
    const newAchievements = await checkAndUnlockAchievements(attempt);

    const statsAfter = getProgressStats();

    const pointsEarned = results.correctAnswers * 10;
    addNotification({
      type: 'quiz',
      title: 'Quiz Completed! ',
      message: `You scored ${results.score}% on ${quizTitle} and earned ${pointsEarned} points!`,
      icon: '🎯',
      metadata: {
        score: results.score,
        points: pointsEarned
      }
    });

    if (statsAfter.level > statsBefore.level) {
      addNotification({
        type: 'level',
        title: 'Level Up! 🎊',
        message: `Congratulations! You've reached Level ${statsAfter.level}! (${statsAfter.totalPoints} total points)`,
        icon: '🎊',
        metadata: {
          level: statsAfter.level,
          points: statsAfter.totalPoints
        }
      });
      toast.success(`🎊 Level Up! You're now Level ${statsAfter.level}!`, {
        duration: 5000
      });
    }

    if (statsAfter.currentStreak > statsBefore.currentStreak) {
      addNotification({
        type: 'streak',
        title: 'Streak Updated! 🔥',
        message: `You're on a ${statsAfter.currentStreak}-day streak! Keep it up!`,
        icon: '🔥',
        metadata: {
          streakCount: statsAfter.currentStreak
        }
      });
      toast.success(`🔥 ${statsAfter.currentStreak}-day streak! Keep going!`, {
        duration: 4000
      });

      if (statsAfter.currentStreak === 3) {
        addNotification({
          type: 'streak',
          title: '3-Day Streak Milestone! 🔥',
          message: "Great start! You're building a strong learning habit!",
          icon: '🔥',
          metadata: { streakCount: 3 }
        });
      } else if (statsAfter.currentStreak === 7) {
        addNotification({
          type: 'streak',
          title: 'Week Streak Achieved! 🔥',
          message: "Amazing! You've been studying for a whole week!",
          icon: '🔥',
          metadata: { streakCount: 7 }
        });
        toast.success(`🔥 Amazing! 7-day streak achieved!`, { duration: 4000 });
      } else if (statsAfter.currentStreak === 14) {
        addNotification({
          type: 'streak',
          title: '2-Week Streak! 🔥🔥',
          message: 'Incredible dedication! Two weeks of consistent learning!',
          icon: '🔥',
          metadata: { streakCount: 14 }
        });
        toast.success(`🔥 Incredible! 14-day streak!`, { duration: 4000 });
      } else if (statsAfter.currentStreak === 30) {
        addNotification({
          type: 'streak',
          title: 'Month Streak - Legendary! 🔥🔥🔥',
          message: "You're unstoppable! A full month of learning!",
          icon: '🔥',
          metadata: { streakCount: 30 }
        });
        toast.success(`🔥 Legendary! 30-day streak!`, { duration: 5000 });
      }
    }

    if (newAchievements.length > 0) {
      newAchievements.forEach((achievement) => {
        const progressInfo = achievement.maxProgress
          ? ` (${achievement.progress || 0}/${achievement.maxProgress})`
          : '';

        addNotification({
          type: 'achievement',
          title: 'Achievement Unlocked! 🏆',
          message: `${achievement.icon} ${achievement.title}: ${achievement.description}${progressInfo}`,
          icon: achievement.icon,
          metadata: {
            achievementId: achievement.id,
            progress: achievement.progress,
            maxProgress: achievement.maxProgress
          }
        });

        toast.success(`🏆 Achievement Unlocked: ${achievement.title}!`, {
          description: `${achievement.icon} ${achievement.description}`,
          duration: 6000,
          className: 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-300'
        });
      });

      if (newAchievements.length > 1) {
        toast.success(`🎉 ${newAchievements.length} Achievements Unlocked!`, {
          description: "You're on fire! Keep up the amazing work!",
          duration: 5000
        });
      }
    } else if (results.score >= 90) {
      toast.success('🏆 Excellent performance!');
    } else if (results.score >= 80) {
      toast.success('⭐ Great job! Keep up the good work!');
    }
  };

  const handleRetakeQuiz = () => {
    setQuizState('taking');
  };

  const handleViewAnalytics = () => {
    setCurrentView('analytics');
  };

  const handleReviewWrongAnswers = (attempt: any) => {
    setReviewingAttempt(attempt);
    setCurrentView('review-wrong-answers');
  };

  const handleRetakeWrongAnswers = (quizzes: Quiz[]) => {
    setCurrentQuizzes(quizzes);
    setQuizState('taking');
    setCurrentView('quiz');
  };

  const handleBackToGenerator = () => {
    if (quizSource === 'offline-practice') {
      setQuizState('offline-selector');
    } else {
      setQuizState('generator');
    }
    setCurrentQuizzes([]);
    setQuizResults(null);
  };

  const handleStartQuiz = () => {
    resetQuizState();
    setCurrentView('quiz');
    setQuizSource('generator');
    if (effectivelyOffline) {
      setQuizState('offline-selector');
    } else {
      setQuizState('generator');
    }
  };

  const handleGenerateQuizFromMaterial = (quizzes: OfflineQuiz[]) => {
    setCurrentQuizzes(quizzes);
    setCurrentView('quiz');
    setQuizSource('materials');
    setQuizState('taking');
    toast.success(
      `Starting quiz with ${quizzes.length} question${quizzes.length > 1 ? 's' : ''}!`
    );
  };

  const handleCreateQuiz = () => {
    setQuizBuilderMode('create');
    setEditingQuizId(undefined);
    setCurrentView('quiz-builder');
  };

  const handleEditQuiz = (quizId: string) => {
    setQuizBuilderMode('edit');
    setEditingQuizId(quizId);
    setCurrentView('quiz-builder');
  };

  const handleBackToMaterials = () => {
    setCurrentView('materials');
    setEditingQuizId(undefined);
  };

  const renderMainContent = () => {
    if (currentView === 'admin') {
      return (
        <AdminDashboard onLogout={handleLogout} onSwitchToLearner={handleSwitchToLearner} />
      );
    }

    switch (currentView) {
      case 'dashboard':
        return (
          <Suspense fallback={<div>Loading dashboard...</div>}>
            <Dashboard
              user={currentUser}
              onStartQuiz={handleStartQuiz}
              onViewMaterials={() => setCurrentView('materials')}
              onViewAchievements={() => setCurrentView('achievements')}
              onViewNotes={() => setCurrentView('notes')}
              onViewPomodoro={() => setCurrentView('timer')}
              onViewTodos={() => setCurrentView('todos')}
              onViewLeaderboard={() => setCurrentView('leaderboard')}
              onCreateQuiz={handleCreateQuiz}
              isOffline={effectivelyOffline}
              adminMode={adminInLearnerMode}
            />
          </Suspense>
        );

      case 'quiz':
        switch (quizState) {
          case 'generator':
            if (!appSettings.allowUserQuizCreation && !isAdmin) {
              return (
                <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
                  <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full mx-auto mb-6 flex items-center justify-center">
                      <svg
                        className="w-10 h-10 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                    </div>
                    <h2 className="text-2xl mb-3 text-gray-900">
                      Quiz Creation Disabled
                    </h2>
                    <p className="text-gray-600 mb-6">
                      Quiz creation has been disabled by your admin. Please contact your
                      administrator if you need to create quizzes.
                    </p>
                    <Button
                      onClick={() => setCurrentView('dashboard')}
                      className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 h-12 rounded-xl"
                    >
                      Go to Dashboard
                    </Button>
                  </div>
                </div>
              );
            }

            if (effectivelyOffline) {
              return <OfflineQuizSelector onStartQuiz={handleOfflineQuizSelected} />;
            }
            return <QuizGenerator onQuizGenerated={handleQuizGenerated} />;

          case 'offline-selector':
            return <OfflineQuizSelector onStartQuiz={handleOfflineQuizSelected} />;

          case 'editor':
            return (
              <GeneratedQuizEditor
                quizzes={currentQuizzes as Quiz[]}
                onStartQuiz={handleStartQuizFromEditor}
                onSaveAndStart={handleSaveAndStartFromEditor}
                onBack={handleBackFromEditor}
              />
            );

          case 'taking':
            return (
              <QuizTaker
                quizzes={currentQuizzes}
                onComplete={handleQuizComplete}
                onBack={handleBackToGenerator}
              />
            );

          case 'results':
            return (
              <QuizResults
                results={quizResults!}
                onRetake={handleRetakeQuiz}
                onHome={() => {
                  resetQuizState();
                  setCurrentView('dashboard');
                }}
                onBackToMaterials={() => {
                  if (quizSource === 'materials') {
                    setCurrentView('materials');
                  } else if (quizSource === 'offline-practice') {
                    setQuizState('offline-selector');
                  } else {
                    setCurrentView('dashboard');
                  }
                  resetQuizState();
                }}
              />
            );
        }
        break;

      case 'materials':
        return (
          <Suspense fallback={<div>Loading study materials...</div>}>
            <StudyMaterials
              onGenerateQuiz={handleGenerateQuizFromMaterial}
              onCreateQuiz={handleCreateQuiz}
              onEditQuiz={handleEditQuiz}
              isOffline={effectivelyOffline}
            />
          </Suspense>
        );

      case 'quiz-builder':
        return <QuizBuilder onBack={handleBackToMaterials} editQuizId={editingQuizId} />;

      case 'achievements':
        return (
          <Achievements
            achievements={achievements.map((a) => ({
              ...a,
              unlockedAt: a.unlockedAt ? new Date(a.unlockedAt).toISOString() : undefined
            }))}
          />
        );

      case 'profile':
        return (
          <Profile
            user={currentUser}
            onSettings={() => setCurrentView('settings')}
            onLogout={handleLogout}
          />
        );

      case 'settings':
        return (
          <Settings
            user={currentUser}
            onBack={() => setCurrentView('profile')}
            onLogout={handleLogout}
            onDeleteAccount={() => {
              setCurrentUser(null);
              setAppState('intro');
              setCurrentView('dashboard');
            }}
            networkStatus={{
              isOnline,
              isOfflineMode,
              setOfflineMode
            }}
          />
        );

      case 'notifications':
        return <Notifications onBack={() => setCurrentView('dashboard')} />;

      case 'notes':
        return <Notes />;

      case 'timer':
      case 'pomodoro':
        return <PomodoroTimer />;

      case 'todos':
        return <TodoList />;

      case 'productivity-tools':
        return (
          <ProductivityToolsInterface
            onNavigateToPomodoro={() => setCurrentView('timer')}
            onNavigateToTasks={() => setCurrentView('todos')}
            onNavigateToNotes={() => setCurrentView('notes')}
          />
        );

      case 'leaderboard':
        return (
          <LeaderboardPage
            currentUserId={currentUser?.id || ''}
            onBack={() => setCurrentView('dashboard')}
            isOnline={!effectivelyOffline}
          />
        );

      case 'quick-actions':
        return (
          <QuickActions
            onStartQuiz={handleStartQuiz}
            onViewMaterials={() => setCurrentView('materials')}
            onViewTodos={() => setCurrentView('todos')}
            onViewPomodoro={() => setCurrentView('timer')}
            onCreateQuiz={handleCreateQuiz}
            onViewNotes={() => setCurrentView('notes')}
            onViewAchievements={() => setCurrentView('achievements')}
          />
        );

      case 'contact':
        return <ContactUs />;

      case 'analytics':
        return (
          <QuizAnalytics
            attempts={quizAttempts}
            onReviewAttempt={handleReviewWrongAnswers}
            onBack={() => setCurrentView('dashboard')}
          />
        );

      case 'review-wrong-answers':
        return reviewingAttempt ? (
          <WrongAnswerReview
            attempt={reviewingAttempt}
            onRetakeWrongAnswers={handleRetakeWrongAnswers}
            onBack={() => setCurrentView('analytics')}
          />
        ) : null;

      default:
        return (
          <Suspense fallback={<div>Loading dashboard...</div>}>
            <Dashboard
              user={currentUser}
              onStartQuiz={handleStartQuiz}
              onViewMaterials={() => setCurrentView('materials')}
              onViewAchievements={() => setCurrentView('achievements')}
              onViewNotes={() => setCurrentView('notes')}
              onViewPomodoro={() => setCurrentView('timer')}
              onViewTodos={() => setCurrentView('todos')}
              isOffline={effectivelyOffline}
            />
          </Suspense>
        );
    }
  };

  if (appState === 'intro') {
    return (
      <>
        <IntroScreen onComplete={handleIntroComplete} />
        <Toaster />
      </>
    );
  }

  if (appState === 'auth') {
    return (
      <>
        <AuthScreen onLogin={handleLogin} onBack={handleBackToIntro} />
        <Toaster />
      </>
    );
  }

  if (showMaintenanceDialog) {
    return <MaintenanceScreen onLogout={handleLogout} />;
  }

  if (showAdminModeSelector && pendingAdminData) {
    return (
      <>
        <AdminModeSelector
          adminUsername={pendingAdminData.username}
          onSelectMode={handleAdminModeSelect}
        />
        <Toaster />
      </>
    );
  }

  if (isAdmin && currentView === 'admin' && !adminInLearnerMode) {
    return (
      <>
        <AdminDashboard onLogout={handleLogout} onSwitchToLearner={handleSwitchToLearner} />
        <Toaster />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-pink-50 overflow-x-hidden">
      <DesktopSidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        onLogout={handleLogout}
        isOpen={isDesktopSidebarOpen}
        onOpenChange={setIsDesktopSidebarOpen}
        notifications={unreadCount}
        onNotificationsClick={() => setCurrentView('notifications')}
        onSettingsClick={() => setCurrentView('settings')}
        isOfflineMode={isOfflineMode}
        networkIndicator={
          <OfflineModeIndicator
            isOnline={isOnline}
            isOfflineMode={isOfflineMode}
            connectionType={connectionType}
            onToggleOfflineMode={setOfflineMode}
          />
        }
      />

      <div className="pb-16 md:pb-0 md:pl-0">
        {adminInLearnerMode && <AdminTestModeBanner onBackToAdmin={handleBackToAdmin} />}

        <div className={`hidden md:block ${adminInLearnerMode ? 'md:mt-0' : ''}`}>
          <DashboardHeader
            userName={currentUser?.username || 'User'}
            notifications={unreadCount}
            profileImage={currentUser?.profileImage}
            onProfileClick={() => setCurrentView('profile')}
            onSettingsClick={() => setCurrentView('settings')}
            onNotificationsClick={() => setCurrentView('notifications')}
            onLogout={handleLogout}
            onMenuClick={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
            networkIndicator={
              <OfflineModeIndicator
                isOnline={isOnline}
                isOfflineMode={isOfflineMode}
                connectionType={connectionType}
                onToggleOfflineMode={setOfflineMode}
              />
            }
          />
        </div>

        <main className={`p-1.5 sm:p-3 md:p-6 max-w-full ${adminInLearnerMode ? 'mt-0' : ''}`}>
          <div className="max-w-7xl mx-auto">{renderMainContent()}</div>
        </main>
      </div>

      {currentView !== 'quiz-builder' && (
        <Navigation
          currentView={currentView}
          onViewChange={setCurrentView}
          onLogout={handleLogout}
        />
      )}

      {currentView !== 'timer' &&
        currentView !== 'pomodoro' &&
        currentView !== 'productivity-tools' && (
          <PomodoroWidget onNavigateToTimer={() => setCurrentView('timer')} />
        )}

      <Toaster />

      {showSaveDialog && pendingQuizSave && (
        <SaveQuizDialog
          open={showSaveDialog}
          onOpenChange={setShowSaveDialog}
          onClose={() => setShowSaveDialog(false)}
          onSave={handleSaveQuiz}
          onSkip={handleSkipSaveQuiz}
          quizzes={pendingQuizSave.quizzes}
          studyMaterial={pendingQuizSave.studyMaterial}
        />
      )}
    </div>
  );
}

export default function App() {
  console.log('✅ App component rendering...');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || supabaseUrl.trim() === '') {
    return <EnvSetupError missingVar="VITE_SUPABASE_URL" />;
  }

  if (!supabaseKey || supabaseKey.trim() === '') {
    return <EnvSetupError missingVar="VITE_SUPABASE_ANON_KEY" />;
  }

  return (
    <UserProvider>
      <AdminProvider>
        <SettingsProvider>
          <ProgressProvider>
            <NotificationProvider>
              <PomodoroProvider>
                <TodoProvider>
                  <CustomQuizProvider>
                    <AppContent />
                  </CustomQuizProvider>
                </TodoProvider>
              </PomodoroProvider>
            </NotificationProvider>
          </ProgressProvider>
        </SettingsProvider>
      </AdminProvider>
    </UserProvider>
  );
}
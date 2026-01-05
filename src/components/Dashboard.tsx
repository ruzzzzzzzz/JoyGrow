import { useState, useEffect, JSX } from 'react';
import {
  Calendar as CalendarIcon,
  Trophy,
  BookOpen,
  Brain,
  StickyNote,
  Timer,
  Flame,
  ArrowLeft,
  ArrowRight,
  CheckSquare,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { JoyCharacter } from './JoyCharacter';
import { StudyStats } from './StudyStats';
import { ProgressRing } from './ProgressRing';
import { motion } from 'motion/react';
import { useProgress } from '../contexts/ProgressContext';
import { useSettings } from '../contexts/SettingsContext';
import { useUser } from '../contexts/UserContext';
import { db } from '../database';

interface DashboardProps {
  user?: any;
  onStartQuiz: () => void;
  onViewMaterials: () => void;
  onViewAchievements: () => void;
  onViewCalendar?: () => void;
  onViewNotes?: () => void;
  onViewPomodoro?: () => void;
  onViewTodos?: () => void;
  onCreateQuiz?: () => void;
  onViewLeaderboard?: () => void;
  isOffline?: boolean;
  adminMode?: boolean;
}

interface LoginDate {
  date: string;      // YYYY-MM-DD
  timestamp: number; // ms
}

// Today as YYYY-MM-DD (local)
const getTodayYMD = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Convert quizAttempts timestamps to set of YYYY-MM-DD
const getQuizDaysSet = (quizAttempts: any[]): Set<string> => {
  const set = new Set<string>();
  for (const a of quizAttempts) {
    const d = new Date(a.timestamp);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    set.add(`${year}-${month}-${day}`);
  }
  return set;
};

// Helper: add days to a local date string
const addDaysLocal = (ymd: string, delta: number): string => {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
};

/**
 * Fire dates = quiz days that belong to the *current* DB streak (users.streak).
 * Uses ONLY local YYYY-MM-DD for all comparisons to avoid UTC off-by-one bugs.
 */
const getCurrentStreakSetFromQuizzes = (
  quizDays: Set<string>,
  streakCount: number,
): Set<string> => {
  const result = new Set<string>();
  if (streakCount <= 0) return result;

  const today = getTodayYMD();

  // Walk backwards streakCount-1 days before today
  // and include only contiguous quiz days.
  let cursor = today;
  let included = 0;

  for (let i = 0; i < streakCount; i++) {
    const checkDate = addDaysLocal(today, -i);
    if (!quizDays.has(checkDate)) {
      // gap => streak in DB will already be broken at this point,
      // so do not show any earlier fire dates
      break;
    }
    result.add(checkDate);
    included++;
  }

  // If DB says streak > included (e.g., today has no quiz yet but streak=1),
  // then show only the last quiz day (yesterday) as fire.
  if (result.size === 0 && streakCount === 1) {
    const yesterday = addDaysLocal(today, -1);
    if (quizDays.has(yesterday)) {
      result.add(yesterday);
    }
  }

  return result;
};


export function Dashboard({
  user,
  onStartQuiz,
  onViewMaterials,
  onViewAchievements,
  onViewNotes,
  onViewPomodoro,
  onViewTodos,
  onCreateQuiz,
  onViewLeaderboard,
  isOffline = false,
  adminMode = false,
}: DashboardProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [loginDates, setLoginDates] = useState<LoginDate[]>([]);
  const [showFullCalendar, setShowFullCalendar] = useState(false);

  const { getProgressStats, quizAttempts } = useProgress();
  const { settings } = useSettings();
  const { currentUser } = useUser();

  // Progress stats – currentStreak should mirror users.streak (kept in sync by backend)
  const progressStats = getProgressStats();

  // FIRE ICON DATES = quiz days intersected with DB streak
  const quizDaysSet = getQuizDaysSet(quizAttempts);
  const currentStreakSet = getCurrentStreakSetFromQuizzes(
    quizDaysSet,
    progressStats.currentStreak,
  );

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // LOGIN HISTORY: drives Total Days / This Month
  useEffect(() => {
    const loadLoginDates = async () => {
      if (!currentUser?.id) {
        setLoginDates([]);
        return;
      }

      try {
        const history = await db.getLoginHistory(currentUser.id);
        const mapped: LoginDate[] = history.map((record: any) => ({
          date: record.logindate || record.login_date,
          timestamp: new Date(record.createdat || record.created_at).getTime(),
        }));
        setLoginDates(mapped);
      } catch (err) {
        console.error('Error loading login dates from database:', err);
        setLoginDates([]);
      }
    };

    loadLoginDates();
  }, [currentUser]);

  const userData = {
    name: user?.username || user?.name || 'User',
    // Day Streak shows DB streak (users.streak via ProgressContext)
    level: progressStats.level,
    streak: progressStats.currentStreak,
    totalPoints: progressStats.totalPoints,
    todayGoal: settings.studyGoal,
    todayProgress: progressStats.todayQuestionsAnswered,
    weeklyQuizzes: progressStats.totalQuizzes,
    accuracy: progressStats.averageScore,
  };

  const totalStudyMinutes = Math.floor(
    quizAttempts.reduce((sum, a) => sum + a.timeTaken / 60, 0),
  );

  const stats = {
    dailyGoal: userData.todayGoal,
    dailyProgress: userData.todayProgress,
    weeklyStreak: userData.streak,
    totalQuizzes: userData.weeklyQuizzes,
    studyTime: totalStudyMinutes,
    accuracy: userData.accuracy,
  };

  const getJoyMood = () => {
    const hour = currentTime.getHours();
    const progressRatio =
      userData.todayGoal > 0
        ? userData.todayProgress / userData.todayGoal
        : 0;

    if (progressRatio >= 1) return 'excited';
    if (progressRatio >= 0.7) return 'happy';
    if (hour < 10) return 'sleepy';
    if (progressRatio < 0.3) return 'encouraging';
    return 'thinking';
  };

  const getRank = () => {
    const totalAnswered = quizAttempts.reduce(
      (sum, a) => sum + a.totalQuestions,
      0,
    );

    if (totalAnswered >= 601)
      return {
        name: 'Grandmaster',
        color: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white',
      };
    if (totalAnswered >= 401)
      return {
        name: 'Master',
        color: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white',
      };
    if (totalAnswered >= 201)
      return {
        name: 'Expert',
        color: 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white',
      };
    if (totalAnswered >= 101)
      return {
        name: 'Scholar',
        color: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white',
      };
    if (totalAnswered >= 51)
      return {
        name: 'Learner',
        color: 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white',
      };
    if (totalAnswered >= 21)
      return {
        name: 'Novice',
        color: 'bg-gradient-to-r from-pink-400 to-rose-500 text-white',
      };
    return {
      name: 'Amateur',
      color: 'bg-gradient-to-r from-gray-400 to-gray-500 text-white',
    };
  };

  // Calendar helpers
  const getDaysInMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

  const getFirstDayOfMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const formatDate = (year: number, month: number, day: number) => {
    const monthStr = String(month + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${year}-${monthStr}-${dayStr}`;
  };

  const isLoginDate = (date: string) =>
    loginDates.some((d) => d.date === date);

  const isToday = (date: string) => {
    const now = new Date();
    const todayStr = formatDate(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    return date === todayStr;
  };

  // This Month = loginhistory within current calendar month
  const currentMonthLoginCount = loginDates.filter((d) => {
    const loginDate = new Date(d.date);
    return (
      loginDate.getMonth() === calendarDate.getMonth() &&
      loginDate.getFullYear() === calendarDate.getFullYear()
    );
  }).length;

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(calendarDate);
    const firstDay = getFirstDayOfMonth(calendarDate);
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    const days: JSX.Element[] = [];
    const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    // headers
    dayNames.forEach((name, index) => {
      days.push(
        <div
          key={`header-${index}`}
          className="text-center text-xs text-gray-500 py-1"
        >
          {name}
        </div>,
      );
    });

    // leading blanks
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-1" />);
    }

    // actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDate(year, month, day);
      const isLogged = isLoginDate(dateStr);
      const isTodayDate = isToday(dateStr);
      const isStreakDay = currentStreakSet.has(dateStr); // 🔥 only on quiz streak dates

      days.push(
        <motion.div
          key={day}
          whileTap={{ scale: 0.95 }}
          className="p-0.5"
        >
          <div
            className={`
              relative aspect-square rounded-md flex items-center justify-center text-xs
              transition-all duration-200
              ${
                isTodayDate
                  ? 'bg-white text-purple-600 ring-2 ring-purple-500'
                  : 'bg-pink-100 text-pink-600'
              }
              ${
                isLogged && !isTodayDate
                  ? 'bg-gradient-to-br from-pink-100 to-pink-200 text-pink-800 border-2 border-pink-300'
                  : ''
              }
              ${
                !isLogged && !isTodayDate
                  ? 'text-gray-600 hover:bg-gray-50'
                  : ''
              }
            `}
          >
            <span className={isLogged || isTodayDate ? 'font-semibold' : ''}>
              {day}
            </span>

            {/* Fire icon only where quiz streak is active */}
            {isStreakDay && (
              <div className="absolute -top-1 -right-1">
                <Flame className="w-5 h-5 text-orange-500 drop-shadow-lg" />
              </div>
            )}
          </div>
        </motion.div>,
      );
    }

    return days;
  };

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const recentActivities = quizAttempts
    .slice(-3)
    .reverse()
    .map((attempt) => ({
      type: 'quiz',
      subject: attempt.quizTitle,
      score: attempt.score,
      timestamp: attempt.timestamp,
    }));

  const quickActions = [
    {
      title: isOffline ? 'Practice Quiz' : 'Generate Quiz',
      description: isOffline ? 'Offline quizzes' : 'AI-powered questions',
      icon: Brain,
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
      action: onStartQuiz,
    },
    {
      title: 'Achievements',
      description: 'Your rewards',
      icon: Trophy,
      color: 'bg-gradient-to-br from-amber-500 to-amber-600',
      action: onViewAchievements,
    },
    {
      title: 'My Tasks',
      description: 'To-do list',
      icon: CheckSquare,
      color: 'bg-gradient-to-br from-green-500 to-green-600',
      action: onViewTodos || (() => {}),
    },
    {
      title: 'Customize Quiz',
      description: 'Create your own',
      icon: BookOpen,
      color: 'bg-gradient-to-br from-rose-500 to-rose-600',
      action: onCreateQuiz || (() => {}),
    },
    {
      title: 'Pomodoro Timer',
      description: 'Focus sessions',
      icon: Timer,
      color: 'bg-gradient-to-br from-pink-500 to-pink-600',
      action: onViewPomodoro || (() => {}),
    },
    {
      title: 'My Notes',
      description: 'Ideas & study notes',
      icon: StickyNote,
      color: 'bg-gradient-to-br from-yellow-500 to-yellow-600',
      action: onViewNotes || (() => {}),
    },
    {
      title: 'Study Materials',
      description: 'Your resources',
      icon: BookOpen,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      action: onViewMaterials,
    },
    {
      title: 'Leaderboard',
      description: 'See top learners',
      icon: Trophy,
      color: 'bg-gradient-to-br from-amber-500 to-amber-600',
      action: onViewLeaderboard || (() => {}),
    },
  ];

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-4 pb-6 pt-16">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-1 md:space-y-2 px-2"
      >
        <h1 className="text-lg md:text-2xl">
          {getGreeting()}, {userData.name}!
        </h1>
        <p className="text-xs md:text-sm text-gray-600">
          Ready to continue your learning journey?
        </p>
        <div className="flex items-center justify-center gap-1.5 md:gap-3 text-[10px] md:text-sm text-gray-500 flex-wrap">
          <div className="flex items-center gap-0.5">
            <CalendarIcon className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden sm:inline">
              {currentTime.toLocaleDateString()}
            </span>
            <span className="sm:hidden">
              {currentTime.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
          <Badge
            variant="outline"
            className="text-[10px] md:text-xs px-1.5 py-0"
          >
            Level {userData.level}
          </Badge>
          <Badge
            variant="outline"
            className="text-[10px] md:text-xs px-1.5 py-0"
          >
            {userData.totalPoints} pts
          </Badge>
        </div>
      </motion.div>

      {/* Joy */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <JoyCharacter mood={getJoyMood()} streak={userData.streak} />
      </motion.div>

      {/* Today's Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="overflow-hidden">
          <CardHeader className="pb-2 md:pb-3">
            <CardTitle className="flex items-center gap-1.5 md:gap-2 text-sm md:text-lg">
              📊 Today's Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-3">
            <div className="flex items-center justify-center">
              {(() => {
                let currentGoal = userData.todayGoal || 10;
                while (userData.todayProgress > currentGoal) {
                  currentGoal *= 2;
                }

                const progressPercent = Math.min(
                  100,
                  (userData.todayProgress / currentGoal) * 100,
                );

                const getProgressColor = () => {
                  if (progressPercent >= 100) return 'rgb(34, 197, 94)';
                  if (progressPercent >= 75) return 'rgb(59, 130, 246)';
                  if (progressPercent >= 50) return 'rgb(168, 85, 247)';
                  if (progressPercent >= 25) return 'rgb(236, 72, 153)';
                  return 'rgb(249, 115, 22)';
                };

                return (
                  <ProgressRing
                    progress={progressPercent}
                    size={140}
                    strokeWidth={12}
                    color={getProgressColor()}
                    value={`${userData.todayProgress}/${currentGoal}`}
                    label="Questions"
                  />
                );
              })()}
            </div>

            <div className="text-center space-y-1">
              {(() => {
                let currentGoal = userData.todayGoal || 10;
                while (userData.todayProgress > currentGoal) {
                  currentGoal *= 2;
                }
                if (userData.todayProgress >= currentGoal) {
                  return (
                    <div className="space-y-2">
                      <Badge className="bg-green-500 text-white px-3 py-1">
                        🎉 Goal Achieved!
                      </Badge>
                      <p className="text-sm text-gray-600">
                        Amazing work! You've reached your daily goal!
                      </p>
                    </div>
                  );
                }
                return (
                  <div className="space-y-1.5">
                    <p className="text-sm text-gray-600">
                      {currentGoal - userData.todayProgress} more question
                      {currentGoal - userData.todayProgress !== 1 ? 's' : ''} to
                      reach your goal!
                    </p>
                    <Badge className={`${getRank().color} px-3 py-1`}>
                      {getRank().name}
                    </Badge>
                  </div>
                );
              })()}

              {progressStats.pointsToNextLevel <= 100 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-2"
                >
                  <Badge
                    variant="outline"
                    className="bg-purple-50 border-purple-200 text-purple-700 px-3 py-1"
                  >
                    ⭐ {progressStats.pointsToNextLevel} points to Level{' '}
                    {progressStats.level + 1}!
                  </Badge>
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Calendar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="overflow-hidden">
          <CardHeader className="pb-2 md:pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-1.5 md:gap-2 text-sm md:text-lg">
                <CalendarIcon className="w-3.5 h-3.5 md:w-5 md:h-5 text-pink-500" />
                Login Streak Calendar
              </CardTitle>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="sm"
                  onClick={() => setShowFullCalendar((v) => !v)}
                  className={`text-xs md:text-sm gap-1.5 font-semibold px-3 md:px-4 py-1.5 md:py-2 transition-all duration-200 shadow-md ${
                    showFullCalendar
                      ? 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white'
                      : 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white'
                  }`}
                >
                  {showFullCalendar ? (
                    <>
                      <ArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4 rotate-90" />
                      <span>Hide</span>
                    </>
                  ) : (
                    <>
                      <span>Expand</span>
                      <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4 rotate-90 animate-pulse" />
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Streak stats */}
            <div className="grid grid-cols-3 gap-2 md:gap-3">
              <div className="text-center p-2 md:p-3 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                <Flame className="w-5 h-5 md:w-6 md:h-6 text-orange-500 mx-auto mb-1" />
                <p className="text-lg md:text-xl mb-0.5">
                  {progressStats.currentStreak}
                </p>
                <p className="text-xs text-gray-600">Day Streak</p>
              </div>
              <div className="text-center p-2 md:p-3 bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg">
                <CalendarIcon className="w-5 h-5 md:w-6 md:h-6 text-pink-500 mx-auto mb-1" />
                <p className="text-lg md:text-xl mb-0.5">
                  {loginDates.length}
                </p>
                <p className="text-xs text-gray-600">Total Days</p>
              </div>
              <div className="text-center p-2 md:p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                <CalendarIcon className="w-5 h-5 md:w-6 md:h-6 text-blue-500 mx-auto mb-1" />
                <p className="text-lg md:text-xl mb-0.5">
                  {currentMonthLoginCount}
                </p>
                <p className="text-xs text-gray-600">This Month</p>
              </div>
            </div>

            {showFullCalendar && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 pt-2 border-t"
              >
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setCalendarDate(
                        new Date(
                          calendarDate.getFullYear(),
                          calendarDate.getMonth() - 1,
                        ),
                      )
                    }
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <h3 className="text-sm md:text-base">
                    {monthNames[calendarDate.getMonth()]}{' '}
                    {calendarDate.getFullYear()}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setCalendarDate(
                        new Date(
                          calendarDate.getFullYear(),
                          calendarDate.getMonth() + 1,
                        ),
                      )
                    }
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-7 gap-0.5 md:gap-1">
                  {renderCalendarDays()}
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader className="pb-2 md:pb-3">
            <CardTitle className="text-sm md:text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5 md:gap-3">
              {quickActions.map((action) => (
                <motion.div
                  key={action.title}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="ghost"
                    className="h-auto p-2 md:p-4 flex flex-col items-center text-center w-full hover:bg-gray-50"
                    onClick={action.action}
                  >
                    <div
                      className={`w-9 h-9 md:w-12 md:h-12 ${action.color} rounded-lg flex items-center justify-center mb-1.5 md:mb-2 shadow-sm`}
                    >
                      <action.icon className="w-4 h-4 md:w-6 md:h-6 text-white" />
                    </div>
                    <h3 className="text-[11px] md:text-sm mb-0.5 leading-tight">
                      {action.title}
                    </h3>
                    <p className="text-gray-500 text-[9px] md:text-xs leading-tight">
                      {action.description}
                    </p>
                  </Button>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Study Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <StudyStats stats={stats} />
      </motion.div>

      {/* Recent Activity */}
      {recentActivities.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base md:text-lg">
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentActivities.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-2.5 md:p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-lg flex items-center justify-center text-lg md:text-xl flex-shrink-0">
                      🧠
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs md:text-sm truncate">
                        Completed <strong>{activity.subject}</strong>
                      </p>
                      <p className="text-xs text-green-600">
                        Score: {activity.score}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}


import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { useAdmin } from '../../contexts/AdminContext';
import { db } from '../../database';
import {
  Brain,
  CheckSquare,
  Clock,
  StickyNote,
  TrendingUp,
  Flame,
  RefreshCw,
  Trophy,
} from 'lucide-react';
import { Progress } from '../ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { toast } from 'sonner';

type AdminUser = {
  id: string;
  username: string;
  level: number;
  streak: number;
  totalPoints: number;
  quizzesCompleted?: number;
  achievementsUnlocked?: number;
  is_admin?: boolean;
  profile_image?: string | null;
};

type ActivityStats = {
  totalTodos: number;
  completedTodos: number;
  usersWithTodos: number;
  totalNotes: number;
  usersWithNotes: number;
  totalPomodoroSessions: number;
  usersWithPomodoro: number;
};

type QuizStats = {
  totalQuizzes: number;
  usersWithQuizzes: number;
};

export function AdminActivityTracking() {
  const { getAllUsers, getAllQuizzes } = useAdmin();

  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [allQuizzes, setAllQuizzes] = useState<any[]>([]);
  const [activityStats, setActivityStats] = useState<ActivityStats>({
    totalTodos: 0,
    completedTodos: 0,
    usersWithTodos: 0,
    totalNotes: 0,
    usersWithNotes: 0,
    totalPomodoroSessions: 0,
    usersWithPomodoro: 0,
  });
  const [quizStats, setQuizStats] = useState<QuizStats>({
    totalQuizzes: 0,
    usersWithQuizzes: 0,
  });

  // overall engagement counters
  const [quizUsersCount, setQuizUsersCount] = useState(0);
  const [badgeUsersCount, setBadgeUsersCount] = useState(0);

  // per‑section loading
  const [quizSectionLoading, setQuizSectionLoading] = useState(true);
  const [streakSectionLoading, setStreakSectionLoading] = useState(true);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [todoSectionLoading, setTodoSectionLoading] = useState(true);
  const [notesSectionLoading, setNotesSectionLoading] = useState(true);
  const [pomodoroSectionLoading, setPomodoroSectionLoading] = useState(true);
  const [overallSectionLoading, setOverallSectionLoading] = useState(true);

  // Derived list: only real users (no admins)
  const nonAdminUsers = useMemo(
    () => users.filter((u) => u && !u.is_admin && u.username !== 'admin123'),
    [users],
  );

  // Auto-refresh every 10 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey((prev) => prev + 1);
    }, 600000);
    return () => clearInterval(interval);
  }, []);

  // Optimized loader: users, quizzes, and all stats
  useEffect(() => {
    const loadAll = async () => {
      try {
        setIsLoading(true);
        setQuizSectionLoading(true);
        setStreakSectionLoading(true);
        setLeaderboardLoading(true);
        setTodoSectionLoading(true);
        setNotesSectionLoading(true);
        setPomodoroSectionLoading(true);
        setOverallSectionLoading(true);

        // 1) Load users & quizzes in parallel
        const [usersResult, quizzesResult] = await Promise.all([
          getAllUsers(),
          getAllQuizzes(),
        ]);

        const loadedUsers = Array.isArray(usersResult) ? usersResult : [];
        const loadedAllQuizzes = Array.isArray(quizzesResult) ? quizzesResult : [];

        setUsers(loadedUsers);
        setAllQuizzes(loadedAllQuizzes);

        const nonAdmins = loadedUsers.filter(
          (u) => u && !u.is_admin && u.username !== 'admin123',
        );

        if (!nonAdmins.length) {
          setActivityStats({
            totalTodos: 0,
            completedTodos: 0,
            usersWithTodos: 0,
            totalNotes: 0,
            usersWithNotes: 0,
            totalPomodoroSessions: 0,
            usersWithPomodoro: 0,
          });
          setQuizStats({
            totalQuizzes: 0,
            usersWithQuizzes: 0,
          });
          setQuizUsersCount(0);
          setBadgeUsersCount(0);
          setQuizSectionLoading(false);
          setStreakSectionLoading(false);
          setLeaderboardLoading(false);
          setTodoSectionLoading(false);
          setNotesSectionLoading(false);
          setPomodoroSectionLoading(false);
          setOverallSectionLoading(false);
          return;
        }

        // 2) For each user, load all per-user data in parallel
        let totalTodos = 0;
        let completedTodos = 0;
        let usersWithTodos = 0;
        let totalNotes = 0;
        let usersWithNotes = 0;
        let totalPomodoroSessions = 0;
        let usersWithPomodoro = 0;
        let totalQuizzes = 0;
        let usersWithQuizzes = 0;
        let quizUsers = 0;
        let badgeUsers = 0;

        for (const user of nonAdmins) {
          if (!user) continue;

          const [
            userTodos,
            userNotes,
            userPomodoroSessions,
            quizAttempts,
            customQuizzes,
            achievements,
          ] = await Promise.all([
            db.getTodosByUser(user.id),
            db.getNotesByUser(user.id),
            db.getPomodoroSessionsByUser(user.id),
            db.getQuizAttemptsByUser(user.id),
            db.getCustomQuizzesByUser(user.id),
            db.getUserAchievements(user.id),
          ]);

          // Todos
          if (userTodos.length > 0) {
            totalTodos += userTodos.length;
            completedTodos += userTodos.filter((t: any) => t.completed).length;
            usersWithTodos++;
          }

          // Notes
          if (userNotes.length > 0) {
            totalNotes += userNotes.length;
            usersWithNotes++;
          }

          // Pomodoro
          if (userPomodoroSessions.length > 0) {
            totalPomodoroSessions += userPomodoroSessions.length;
            usersWithPomodoro++;
          }

          // Quiz attempts (participation)
          if (quizAttempts.length > 0) {
            usersWithQuizzes++;
            totalQuizzes += quizAttempts.length;
          }

          // Quiz Users = has custom quizzes
          if (customQuizzes.length > 0) {
            quizUsers++;
          }

          // With Badges = has achievements
          if (achievements.length > 0) {
            badgeUsers++;
          }
        }

        setActivityStats({
          totalTodos,
          completedTodos,
          usersWithTodos,
          totalNotes,
          usersWithNotes,
          totalPomodoroSessions,
          usersWithPomodoro,
        });

        setQuizStats({
          totalQuizzes,
          usersWithQuizzes,
        });

        setQuizUsersCount(quizUsers);
        setBadgeUsersCount(badgeUsers);
      } catch (error) {
        console.error('Error loading admin activity data:', error);
        setActivityStats({
          totalTodos: 0,
          completedTodos: 0,
          usersWithTodos: 0,
          totalNotes: 0,
          usersWithNotes: 0,
          totalPomodoroSessions: 0,
          usersWithPomodoro: 0,
        });
        setQuizStats({
          totalQuizzes: 0,
          usersWithQuizzes: 0,
        });
        setQuizUsersCount(0);
        setBadgeUsersCount(0);
      } finally {
        setIsLoading(false);
        setQuizSectionLoading(false);
        setStreakSectionLoading(false);
        setLeaderboardLoading(false);
        setTodoSectionLoading(false);
        setNotesSectionLoading(false);
        setPomodoroSectionLoading(false);
        setOverallSectionLoading(false);
      }
    };

    loadAll();
  }, [refreshKey, getAllUsers, getAllQuizzes]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setRefreshKey((prev) => prev + 1);
    toast.success('Activity data refreshed');
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Gamification metrics (using only non-admin users)
  const totalAchievements = nonAdminUsers.reduce(
    (sum, user) => sum + (user.achievementsUnlocked || 0),
    0,
  );
  const avgStreak =
    nonAdminUsers.length > 0
      ? Math.round(
          nonAdminUsers.reduce((sum, user) => sum + (user.streak || 0), 0) /
            nonAdminUsers.length,
        )
      : 0;

  // Activity stats (non-admin)
  const usersWithActiveStreak = nonAdminUsers.filter((u) => (u.streak || 0) > 0);
  const usersWithAchievements = nonAdminUsers.filter(
    (u) => (u.achievementsUnlocked || 0) > 0,
  );

  // Top streaks: only 3 non-admin users, including profile_image like AdminOverview
  const topStreaks = useMemo(
    () =>
      [...nonAdminUsers]
        .sort((a, b) => (b.streak || 0) - (a.streak || 0))
        .slice(0, 3),
    [nonAdminUsers],
  );

  const getUserInitials = (username: string) => username.substring(0, 2).toUpperCase();

  const getGradientColor = (index: number) => {
    const gradients = [
      'from-orange-500 to-red-500',
      'from-yellow-500 to-orange-500',
      'from-red-600 to-pink-600',
      'from-blue-500 to-cyan-500',
      'from-purple-500 to-pink-500',
    ];
    return gradients[index % gradients.length];
  };

  return (
    <div className="space-y-6" key={refreshKey}>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex-1">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-1 sm:mb-2">
            Activity Tracking & Gamification
          </h2>
          <p className="text-xs sm:text-sm lg:text-base text-gray-600">
            Monitor user engagement, achievements, and productivity features
          </p>
        </div>
        <Button
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          variant="outline"
          className="rounded-xl h-9 sm:h-10 border-gray-300 hover:border-orange-500 hover:text-orange-600 self-start sm:self-auto text-sm flex-shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="ml-1.5 sm:ml-2">Refresh</span>
        </Button>
      </div>

      {/* Engagement Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quiz Participation */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              Quiz Participation
            </CardTitle>
            <CardDescription>Quiz engagement statistics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {quizSectionLoading ? (
              <div className="flex items-center justify-center py-8">
                <span className="h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
              </div>
            ) : (
              <>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-700">Active Participants</span>
                    <span className="text-sm font-semibold text-blue-600">
                      {nonAdminUsers.length
                        ? Math.round(
                            (quizStats.usersWithQuizzes / nonAdminUsers.length) * 100,
                          )
                        : 0}
                      %
                    </span>
                  </div>
                  <Progress
                    value={
                      nonAdminUsers.length
                        ? (quizStats.usersWithQuizzes / nonAdminUsers.length) * 100
                        : 0
                    }
                    className="h-2.5"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {quizStats.usersWithQuizzes} of {nonAdminUsers.length} users
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <p className="text-2xl font-bold text-blue-600">
                      {quizStats.totalQuizzes}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Total Quiz Attempts</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-xl border border-green-200">
                    <p className="text-2xl font-bold text-green-600">
                      {allQuizzes.length}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Quiz Materials</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Streak Tracking */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <Flame className="w-4 h-4 text-white" />
              </div>
              Streak Tracking
            </CardTitle>
            <CardDescription>Calendar streak statistics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {streakSectionLoading ? (
              <div className="flex items-center justify-center py-8">
                <span className="h-8 w-8 animate-spin rounded-full border-2 border-orange-200 border-t-orange-600" />
              </div>
            ) : (
              <>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-700">Active Streaks</span>
                    <span className="text-sm font-semibold text-orange-600">
                      {nonAdminUsers.length
                        ? Math.round(
                            (usersWithActiveStreak.length / nonAdminUsers.length) * 100,
                          )
                        : 0}
                      %
                    </span>
                  </div>
                  <Progress
                    value={
                      nonAdminUsers.length
                        ? (usersWithActiveStreak.length / nonAdminUsers.length) * 100
                        : 0
                    }
                    className="h-2.5"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {usersWithActiveStreak.length} users maintaining streaks
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-orange-50 rounded-xl border border-orange-200">
                    <p className="text-2xl font-bold text-orange-600">{avgStreak}</p>
                    <p className="text-xs text-gray-600 mt-1">Average Streak</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-xl border border-red-200">
                    <p className="text-2xl font-bold text-red-600">
                      {nonAdminUsers.length
                        ? Math.max(...nonAdminUsers.map((u) => u.streak || 0), 0)
                        : 0}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Longest Streak</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Streaks Leaderboard */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            Top Streaks Leaderboard
          </CardTitle>
          <CardDescription>Users with the longest streaks</CardDescription>
        </CardHeader>
        <CardContent>
          {leaderboardLoading ? (
            <div className="flex items-center justify-center py-8">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-yellow-200 border-t-yellow-600" />
            </div>
          ) : topStreaks.length === 0 ? (
            <p className="text-center text-gray-500 py-8 text-sm">
              No active streaks yet
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {topStreaks.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  className="flex items-center gap-3 p-3 lg:p-4 bg-gradient-to-r from-orange-50 to-transparent rounded-xl hover:from-orange-100 transition-all"
                >
                  <div className="relative">
                    <Avatar className="w-12 h-12 border-2 border-white shadow-md overflow-hidden">
                      {user.profile_image ? (
                        <AvatarImage
                          src={user.profile_image}
                          alt={user.username}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <AvatarFallback
                          className={`bg-gradient-to-br ${getGradientColor(
                            index,
                          )} text-white`}
                        >
                          {getUserInitials(user.username)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    {index < 3 && (
                      <div
                        className={`absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br ${getGradientColor(
                          index,
                        )} flex items-center justify-center border-2 border-white shadow-sm`}
                      >
                        <span className="text-white text-xs font-semibold">
                          {index + 1}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate text-sm lg:text-base">
                      {user.username}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>Level {user.level || 1}</span>
                      <span>•</span>
                      <span>{user.totalPoints || 0} points</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <Flame className="w-5 h-5 text-orange-600" />
                      <p className="text-lg lg:text-xl font-bold text-orange-600">
                        {user.streak || 0}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">days</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Productivity Features */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Todo Lists */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <CheckSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </div>
              Todo Lists
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {todoSectionLoading ? (
              <div className="flex items-center justify-center py-6">
                <span className="h-7 w-7 animate-spin rounded-full border-2 border-green-200 border-t-green-600" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 sm:p-3 bg-green-50 rounded-xl border border-green-200">
                    <p className="text-xl sm:text-2xl font-bold text-green-600">
                      {activityStats.totalTodos}
                    </p>
                    <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5 sm:mt-1">
                      Tasks Created
                    </p>
                  </div>
                  <div className="p-2.5 sm:p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                    <p className="text-xl sm:text-2xl font-bold text-emerald-600">
                      {activityStats.completedTodos}
                    </p>
                    <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5 sm:mt-1">
                      Completed
                    </p>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-xs sm:text-sm text-gray-700">
                      Active Users
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-green-600">
                      {nonAdminUsers.length
                        ? Math.round(
                            (activityStats.usersWithTodos / nonAdminUsers.length) * 100,
                          )
                        : 0}
                      %
                    </span>
                  </div>
                  <Progress
                    value={
                      nonAdminUsers.length
                        ? (activityStats.usersWithTodos / nonAdminUsers.length) * 100
                        : 0
                    }
                    className="h-2 sm:h-2.5"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Note Taking */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                <StickyNote className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </div>
              Note Taking
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {notesSectionLoading ? (
              <div className="flex items-center justify-center py-6">
                <span className="h-7 w-7 animate-spin rounded-full border-2 border-yellow-200 border-t-yellow-600" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 sm:p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                  <p className="text-2xl sm:text-3xl font-bold text-yellow-600">
                    {activityStats.totalNotes}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">Notes Created</p>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-xs sm:text-sm text-gray-700">
                      Users with Notes
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-yellow-600">
                      {nonAdminUsers.length
                        ? Math.round(
                            (activityStats.usersWithNotes / nonAdminUsers.length) * 100,
                          )
                        : 0}
                      %
                    </span>
                  </div>
                  <Progress
                    value={
                      nonAdminUsers.length
                        ? (activityStats.usersWithNotes / nonAdminUsers.length) * 100
                        : 0
                    }
                    className="h-2 sm:h-2.5"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pomodoro Usage */}
        <Card className="border-0 shadow-lg sm:col-span-2 lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </div>
              Pomodoro Usage
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {pomodoroSectionLoading ? (
              <div className="flex items-center justify-center py-6">
                <span className="h-7 w-7 animate-spin rounded-full border-2 border-red-200 border-t-red-600" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 sm:p-4 bg-red-50 rounded-xl border border-red-200">
                  <p className="text-2xl sm:text-3xl font-bold text-red-600">
                    {activityStats.totalPomodoroSessions}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    Sessions Completed
                  </p>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-xs sm:text-sm text-gray-700">
                      Users Using Pomodoro
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-red-600">
                      {nonAdminUsers.length
                        ? Math.round(
                            (activityStats.usersWithPomodoro / nonAdminUsers.length) *
                              100,
                          )
                        : 0}
                      %
                    </span>
                  </div>
                  <Progress
                    value={
                      nonAdminUsers.length
                        ? (activityStats.usersWithPomodoro / nonAdminUsers.length) *
                          100
                        : 0
                    }
                    className="h-2 sm:h-2.5"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Overall Engagement */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base lg:text-lg">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            </div>
            Overall User Engagement
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Comprehensive engagement metrics across all features
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {overallSectionLoading ? (
            <div className="flex items-center justify-center py-8">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-purple-200 border-t-purple-600" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                <p className="text-xl sm:text-2xl font-bold text-blue-600">
                  {quizUsersCount}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5 sm:mt-1">
                  Quiz Users
                </p>
              </div>
              <div className="p-3 sm:p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border border-orange-200">
                <p className="text-xl sm:text-2xl font-bold text-orange-600">
                  {usersWithActiveStreak.length}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5 sm:mt-1">
                  Streak Users
                </p>
              </div>
              <div className="p-3 sm:p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                <p className="text-xl sm:text-2xl font-bold text-purple-600">
                  {badgeUsersCount}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5 sm:mt-1">
                  With Badges
                </p>
              </div>
              <div className="p-3 sm:p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                <p className="text-xl sm:text-2xl font-bold text-green-600">
                  {activityStats.usersWithTodos}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5 sm:mt-1">
                  Todo Users
                </p>
              </div>
              <div className="p-3 sm:p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
                <p className="text-xl sm:text-2xl font-bold text-yellow-600">
                  {activityStats.usersWithNotes}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5 sm:mt-1">
                  Note Users
                </p>
              </div>
              <div className="p-3 sm:p-4 bg-gradient-to-br from-red-50 to-pink-50 rounded-xl border border-red-200">
                <p className="text-xl sm:text-2xl font-bold text-red-600">
                  {activityStats.usersWithPomodoro}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5 sm:mt-1">
                  Pomodoro Users
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

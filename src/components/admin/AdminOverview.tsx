import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { useAdmin } from '../../contexts/AdminContext';
import { db } from '../../database';
import {
  Users,
  Brain,
  Award,
  Flame,
  TrendingUp,
  Clock,
  CheckSquare,
  RefreshCw,
  Download,
  Zap,
  Target,
} from 'lucide-react';
import { Progress } from '../ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { toast } from 'sonner';

type AdminStats = {
  totalUsers: number;
  activeUsers: number;
  newUsersThisWeek: number;
};

type AdminUser = {
  id: string;
  username: string;
  level: number;
  streak: number;
  totalPoints: number;
  quizzesCompleted?: number;
  achievementsUnlocked?: number;
  tasksCompleted?: number;
  studyTime?: number;
  createdAt?: string;
  profileImage?: string | null;
  is_admin?: boolean;
};

export function AdminOverview() {
  const { getAllUsers, getAllQuizzes, getAdminStats, getAllMaterials } = useAdmin();

  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const [metrics, setMetrics] = useState({
    totalQuizzesCompleted: 0,
    totalAchievements: 0,
    totalPoints: 0,
    avgPoints: 0,
    totalTasks: 0,
    avgStreak: 0,
    totalStreakSum: 0,
    totalStudyTime: 0,
    usersWithActiveStreak: 0,
    usersWithAchievements: 0,
    usersWithQuizzes: 0,
    customQuizzesCount: 0,
    quizzesCompletedToday: 0,
    materialsCount: 0,
  });

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    newUsersThisWeek: 0,
  });
  const [allQuizzesCount, setAllQuizzesCount] = useState(0);
  const [allMaterialsCount, setAllMaterialsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // small inline loader for per‑section loading
  const SmallLoader = () => (
    <RefreshCw className="w-4 h-4 animate-spin text-gray-400 inline-block align-middle" />
  );

  // Filter out admins and hard‑limit to 1000 users for speed
  const nonAdminUsers = useMemo(
    () =>
      users
        .filter((user) => user && !user.is_admin && user.username !== 'admin123')
        .slice(0, 1000),
    [users],
  );

  // FAST LOADING: show something quickly with Promise.race
  const loadData = useCallback(
    async () => {
      setIsLoading(true);

      try {
        const usersPromise = getAllUsers();
        const otherDataPromise = Promise.all([
          getAllQuizzes(),
          getAllMaterials(),
          getAdminStats(),
        ]);

        // 1) First paint: whichever finishes first
        const first = await Promise.race([usersPromise, otherDataPromise]);

        if (Array.isArray(first)) {
          // got [quizzes, materials, stats]
          const [quizzesResult, materialsResult, statsResult] = first as any;

          setAllQuizzesCount(Array.isArray(quizzesResult) ? quizzesResult.length : 0);
          setAllMaterialsCount(
            Array.isArray(materialsResult) ? materialsResult.length : 0,
          );

          if (statsResult) {
            setStats({
              totalUsers: statsResult.totalUsers ?? users.length,
              activeUsers: statsResult.activeUsers ?? 0,
              newUsersThisWeek: statsResult.newUsersThisWeek ?? 0,
            });
          }
        } else {
          // got users first
          const safeUsers = Array.isArray(first) ? first : [];
          setUsers(safeUsers);
        }

        // 2) Ensure all data is fully loaded in background
        const [usersResult, quizzesResult, materialsResult, statsResult] =
          await Promise.all([
            usersPromise,
            getAllQuizzes(),
            getAllMaterials(),
            getAdminStats(),
          ]);

        const safeUsers = Array.isArray(usersResult) ? usersResult : [];
        setUsers(safeUsers);

        setAllQuizzesCount(Array.isArray(quizzesResult) ? quizzesResult.length : 0);
        setAllMaterialsCount(
          Array.isArray(materialsResult) ? materialsResult.length : 0,
        );

        if (statsResult) {
          setStats({
            totalUsers: statsResult.totalUsers ?? safeUsers.length,
            activeUsers: statsResult.activeUsers ?? 0,
            newUsersThisWeek: statsResult.newUsersThisWeek ?? 0,
          });
        } else {
          setStats({
            totalUsers: safeUsers.length,
            activeUsers: 0,
            newUsersThisWeek: 0,
          });
        }
      } catch (error) {
        console.error('Failed to load admin overview data:', error);
        toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    },
    [getAllUsers, getAllQuizzes, getAllMaterials, getAdminStats, users.length],
  );

  useEffect(() => {
    loadData();
  }, [refreshKey, loadData]);

  // LIGHTWEIGHT metrics, batched, only on nonAdminUsers (max 1000)
  const calculateMetrics = useCallback(
    async () => {
      if (nonAdminUsers.length === 0) return;

      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const userIds = nonAdminUsers.map((u) => u.id);

        // Quiz attempts for all users (batched)
        const allQuizPromises = userIds.map((id) => db.getQuizAttemptsByUser(id));
        const allQuizResults = await Promise.allSettled(allQuizPromises);

        let totalQuizzesCompleted = 0;
        let quizzesCompletedToday = 0;
        let totalStudyTime = 0;
        let usersWithQuizzes = 0;

        allQuizResults.forEach((result) => {
          if (result.status === 'fulfilled') {
            const quizAttempts = result.value;
            totalQuizzesCompleted += quizAttempts.length;
            if (quizAttempts.length > 0) usersWithQuizzes++;

            const todayQuizzes = quizAttempts.filter((q: any) => {
              const completedDate = new Date(q.timestamp).setHours(0, 0, 0, 0);
              return completedDate === today.getTime();
            });
            quizzesCompletedToday += todayQuizzes.length;

            const quizStudyTime = quizAttempts.reduce(
              (sum: number, q: any) => sum + (q.time_taken || 0),
              0,
            );
            totalStudyTime += Math.floor(quizStudyTime / 60);
          }
        });

        // Achievements for all users (batched)
        const allAchievementPromises = userIds.map((id) => db.getUserAchievements(id));
        const allAchievementResults = await Promise.allSettled(
          allAchievementPromises,
        );

        let totalAchievements = 0;
        let usersWithAchievements = 0;
        allAchievementResults.forEach((result) => {
          if (result.status === 'fulfilled') {
            const unlocked = result.value.filter((a: any) => a.unlocked);
            totalAchievements += unlocked.length;
            if (unlocked.length > 0) usersWithAchievements++;
          }
        });

        // Simple aggregations from in‑memory users
        let totalPoints = 0;
        let totalStreakSum = 0;
        let usersWithActiveStreak = 0;
        let totalTasks = 0;

        nonAdminUsers.forEach((user) => {
          totalPoints += user.totalPoints || 0;
          const streak = user.streak || 0;
          totalStreakSum += streak;
          if (streak > 0) usersWithActiveStreak++;
          totalTasks += user.tasksCompleted || 0;
        });

        const userCount = nonAdminUsers.length;
        const avgPoints = userCount > 0 ? Math.round(totalPoints / userCount) : 0;
        const avgStreak = userCount > 0 ? Math.round(totalStreakSum / userCount) : 0;

        setMetrics({
          totalQuizzesCompleted,
          totalAchievements,
          totalPoints,
          avgPoints,
          totalTasks,
          avgStreak,
          totalStreakSum,
          totalStudyTime,
          usersWithActiveStreak,
          usersWithAchievements,
          usersWithQuizzes,
          customQuizzesCount: allQuizzesCount,
          quizzesCompletedToday,
          materialsCount: allMaterialsCount,
        });
      } catch (error) {
        console.error('Error calculating metrics:', error);
      }
    },
    [nonAdminUsers, allQuizzesCount, allMaterialsCount],
  );

  // Debounce metrics so they don’t block first paint
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      calculateMetrics();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [calculateMetrics]);

  // Auto‑refresh every 10 minutes (less network)
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey((prev) => prev + 1);
      setLastUpdated(new Date());
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setRefreshKey((prev) => prev + 1);
    setLastUpdated(new Date());
    toast.success('Data refreshed successfully');
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleExportAllData = useCallback(
    () => {
      const exportData = {
        exportDate: new Date().toISOString(),
        stats: {
          totalUsers: stats.totalUsers,
          activeUsers: stats.activeUsers,
          ...metrics,
        },
        users: nonAdminUsers.map((u) => ({
          id: u.id,
          username: u.username,
          level: u.level,
          points: u.totalPoints,
          streak: u.streak,
          quizzesCompleted: u.quizzesCompleted,
          achievementsUnlocked: u.achievementsUnlocked,
          tasksCompleted: u.tasksCompleted,
          studyTime: u.studyTime,
          createdAt: u.createdAt,
        })),
        summary: {
          totalUsers: stats.totalUsers,
          activeUsers: stats.activeUsers,
          totalQuizzes: metrics.totalQuizzesCompleted,
          totalPoints: metrics.totalPoints,
          totalAchievements: metrics.totalAchievements,
          quizzesCompletedToday: metrics.quizzesCompletedToday,
          newUsersThisWeek: stats.newUsersThisWeek,
          customQuizzes: metrics.customQuizzesCount,
          avgStreak: metrics.avgStreak,
        },
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `joygrow_admin_export_${
        new Date().toISOString().split('T')[0]
      }.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Admin data exported successfully');
    },
    [stats, metrics, nonAdminUsers],
  );

  const topPerformers = useMemo(
    () =>
      nonAdminUsers
        .slice()
        .sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0))
        .slice(0, 3),
    [nonAdminUsers],
  );

  const getUserProfilePicture = useCallback(
    (userId: string): string => {
      const user = users.find((u) => u.id === userId);
      return user?.profileImage || '';
    },
    [users],
  );

  const getUserInitials = (username: string) =>
    username.substring(0, 2).toUpperCase();

  const getGradientColor = (index: number) => {
    const gradients = [
      'from-yellow-500 to-orange-500',
      'from-gray-400 to-gray-500',
      'from-orange-600 to-red-600',
      'from-blue-500 to-cyan-500',
      'from-purple-500 to-pink-500',
    ];
    return gradients[index % gradients.length];
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      subtitle: `${stats.activeUsers} active`,
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      loading: isLoading && stats.totalUsers === 0,
    },
    {
      title: 'Total Quiz Attempts',
      value: metrics.totalQuizzesCompleted,
      subtitle: `${metrics.quizzesCompletedToday} today`,
      icon: Brain,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50',
      loading: isLoading && metrics.totalQuizzesCompleted === 0,
    },
    {
      title: 'Achievements Earned',
      value: metrics.totalAchievements,
      subtitle: `By ${metrics.usersWithAchievements} users`,
      icon: Award,
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'bg-yellow-50',
      loading: isLoading && metrics.totalAchievements === 0,
    },
    {
      title: 'Active Streaks',
      value: metrics.usersWithActiveStreak,
      subtitle: `${metrics.avgStreak} avg days`,
      icon: Flame,
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-50',
      loading: isLoading && metrics.usersWithActiveStreak === 0,
    },
  ];

  const engagementCards = [
    {
      title: 'Quiz Participation',
      value: metrics.usersWithQuizzes,
      total: nonAdminUsers.length,
      icon: Brain,
      color: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Active Streaks',
      value: metrics.usersWithActiveStreak,
      total: nonAdminUsers.length,
      icon: Flame,
      color: 'from-orange-500 to-red-500',
    },
    {
      title: 'Achievement Hunters',
      value: metrics.usersWithAchievements,
      total: nonAdminUsers.length,
      icon: Award,
      color: 'from-yellow-500 to-orange-500',
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-0 max-w-full overflow-x-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
            Admin Overview
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
            Monitor platform activity and user engagement
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="text-xs text-right hidden sm:block min-w-[100px]">
            <p className="text-gray-500">Last updated</p>
            <p className="font-medium text-gray-700">
              {lastUpdated.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <Button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="h-9 px-3 flex-shrink-0 min-w-[80px]"
          >
            <RefreshCw
              className={`w-4 h-4 mr-1.5 ${
                isRefreshing ? 'animate-spin' : ''
              }`}
            />
            {isRefreshing ? 'Loading...' : 'Refresh'}
          </Button>
          <Button
            onClick={handleExportAllData}
            variant="outline"
            size="sm"
            className="h-9 px-3 flex-shrink-0 min-w-[80px]"
          >
            <Download className="w-4 h-4 mr-1.5" />
            Export
          </Button>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-0 shadow-sm hover:shadow-md transition-all overflow-hidden w-full">
                <div className={`h-1.5 bg-gradient-to-r ${card.color}`} />
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${card.bgColor} flex items-center justify-center flex-shrink-0`}
                    >
                      <Icon
                        className={`w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br ${card.color} bg-clip-text text-transparent`}
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1.5">
                      {card.title}
                    </p>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 leading-tight">
                      {card.loading ? (
                        <SmallLoader />
                      ) : (
                        card.value.toLocaleString()
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {card.loading ? <SmallLoader /> : card.subtitle}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Engagement & Activity + Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* User Engagement */}
        <Card className="border-0 shadow-sm w-full">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </div>
              User Engagement
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Participation rates across platform features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            {engagementCards.map((card) => {
              const Icon = card.icon;
              const percentage =
                card.total > 0
                  ? Math.round((card.value / card.total) * 100)
                  : 0;
              const loading = isLoading && card.total === 0;
              return (
                <div key={card.title} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Icon
                        className={`w-3.5 h-3.5 sm:w-4 sm:h-4 bg-gradient-to-r ${card.color} bg-clip-text text-transparent flex-shrink-0`}
                      />
                      <span className="text-xs sm:text-sm text-gray-700 truncate">
                        {card.title}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 ml-2 whitespace-nowrap">
                      {loading ? <SmallLoader /> : `${percentage}%`}
                    </span>
                  </div>
                  <Progress
                    value={loading ? 0 : percentage}
                    className="h-2"
                  />
                  <p className="text-xs text-gray-500">
                    {loading ? (
                      <SmallLoader />
                    ) : (
                      <>
                        {card.value} of {card.total} users
                      </>
                    )}
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      

        {/* Top Performers */}
        <Card className="border-0 shadow-sm w-full">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </div>
              Top Performers
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Highest scoring users by total points
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <SmallLoader />
              </div>
            ) : topPerformers.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                <Users className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500 text-sm sm:text-base">No users yet</p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3 max-h-[400px] overflow-y-auto">
                {topPerformers.map((user, index) => {
                  const profilePicture = getUserProfilePicture(user.id);
                  return (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + index * 0.05 }}
                      className="flex items_center gap-3 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-orange-50 to-transparent rounded-xl hover:from-orange-100 transition-all"
                    >
                      <div className="relative flex-shrink-0">
                        <Avatar className="w-12 h-12 sm:w-14 sm:h-14 border-2 border-white shadow-sm">
                          {profilePicture ? (
                            <AvatarImage
                              src={profilePicture}
                              alt={user.username}
                            />
                          ) : null}
                          <AvatarFallback
                            className={`bg-gradient-to-br ${getGradientColor(
                              index,
                            )} text-white text-xs sm:text-sm font-semibold`}
                          >
                            {getUserInitials(user.username)}
                          </AvatarFallback>
                        </Avatar>
                        {index < 3 && (
                          <div
                            className={`absolute -top-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br ${getGradientColor(
                              index,
                            )} flex items-center justify-center border-2 border-white shadow-sm`}
                          >
                            <span className="text-white text-xs font-bold">
                              {index + 1}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                          {user.username}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            Level {user.level || 1}
                          </span>
                          <span className="flex items-center gap-1">
                            <Flame className="w-3 h-3" />
                            {user.streak || 0}d streak
                          </span>
                          <span className="flex items-center gap-1">
                            <Brain className="w-3 h-3" />
                            {user.quizzesCompleted || 0} quizzes
                          </span>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0 ml-2 sm:ml-0">
                        <div className="flex items-center gap-1">
                          <Zap className="w-4 h-4 sm:w-5 h-5 text-yellow-600" />
                          <p className="text-lg sm:text-xl font-bold text-yellow-600 whitespace-nowrap">
                            {user.totalPoints?.toLocaleString() || 0}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">points</p>
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}

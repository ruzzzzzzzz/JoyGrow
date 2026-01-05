import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  MoreVertical,
  Shield,
  Ban,
  Download,
  Eye,
  TrendingUp,
  Award,
  Clock,
  CheckCircle,
  Brain,
  BookOpen,
  CheckSquare,
  Target,
  RefreshCw,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { db } from '../../database';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { toast } from 'sonner';
import { useAdmin, AdminUser } from '../../contexts/AdminContext';
import { motion, AnimatePresence } from 'motion/react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { ScrollArea } from '../ui/scroll-area';

interface UserManagementProps {
  searchQuery?: string;
}

interface UserStats {
  tasksCompleted: number;
  totalTasks: number;
  studyTimeMinutes: number;
  quizAttempts: number;
  achievementsUnlocked: number;
  pomodoroSessions: number;
  notes: number;
}

export function AdminUserManagement({ searchQuery = '' }: UserManagementProps) {
  const {
    getAllUsers,
    getUserDetails,
    blockUser,
    unblockUser,
    exportUserData,
  } = useAdmin();

  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [sortBy, setSortBy] =
    useState<'createdAt' | 'username' | 'level' | 'points'>('createdAt');
  const [blockDialog, setBlockDialog] = useState<{
    open: boolean;
    userId: string | null;
    isBlocking: boolean;
  }>({
    open: false,
    userId: null,
    isBlocking: true,
  });
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(true);

  const [userStats, setUserStats] = useState<Record<string, UserStats>>({});
  const [loadingStats, setLoadingStats] = useState<boolean>(false);

  const [loadingUserDetails, setLoadingUserDetails] = useState(false);

  const [selectedUserDetails, setSelectedUserDetails] = useState<any | null>(
    null,
  );
  const selectedUserStats = selectedUser
    ? userStats[selectedUser] || {
        tasksCompleted: 0,
        totalTasks: 0,
        studyTimeMinutes: 0,
        quizAttempts: 0,
        achievementsUnlocked: 0,
        pomodoroSessions: 0,
        notes: 0,
      }
    : null;

  const STAT_LIMIT = 100; // only compute heavy stats for first 100 users

  const USERS_PER_PAGE = 5;
  const [currentPage, setCurrentPage] = useState(1);

  // small inline loader
  const SmallLoader = () => (
    <RefreshCw className="w-4 h-4 animate-spin text-gray-400 inline-block align-middle" />
  );

  // Load users once
  useEffect(() => {
    let cancelled = false;

    const loadUsers = async () => {
      setLoadingUsers(true);
      try {
        const data = await getAllUsers();
        if (!cancelled) {
          setUsers(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Error loading admin users:', error);
        if (!cancelled) {
          setUsers([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingUsers(false);
        }
      }
    };

    loadUsers();

    return () => {
      cancelled = true;
    };
  }, [getAllUsers]);

  const getUserStats = (userId: string): UserStats => {
    return (
      userStats[userId] || {
        tasksCompleted: 0,
        totalTasks: 0,
        studyTimeMinutes: 0,
        quizAttempts: 0,
        achievementsUnlocked: 0,
        pomodoroSessions: 0,
        notes: 0,
      }
    );
  };

  // Sorted users (memoized)
  const sortedUsers = useMemo(
    () =>
      Array.isArray(users)
        ? [...users].sort((a, b) => {
            switch (sortBy) {
              case 'username':
                return a.username.localeCompare(b.username);
              case 'level':
                return (b.level || 0) - (a.level || 0);
              case 'points':
                return (b.totalPoints || 0) - (a.totalPoints || 0);
              case 'createdAt':
              default:
                return (
                  new Date(b.createdAt as any).getTime() -
                  new Date(a.createdAt as any).getTime()
                );
            }
          })
        : [],
    [users, sortBy],
  );

  // non-admin users for counts
  const nonAdminUsers = useMemo(
    () => sortedUsers.filter((u: any) => !u.is_admin),
    [sortedUsers],
  );

  // Filtered by search
  const filteredUsers = useMemo(
    () =>
      sortedUsers.filter((user) =>
        user.username
          .toLowerCase()
          .includes(localSearchQuery.toLowerCase()),
      ),
    [sortedUsers, localSearchQuery],
  );

  // Pagination: compute total pages, current slice
  const totalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / USERS_PER_PAGE),
  );

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * USERS_PER_PAGE;
    const end = start + USERS_PER_PAGE;
    return filteredUsers.slice(start, end);
  }, [filteredUsers, currentPage]);

  // Reset to page 1 when search or sort changes so user always sees results
  useEffect(() => {
    setCurrentPage(1);
  }, [localSearchQuery, sortBy]);

  // Load stats fast: parallel per user, limited to first STAT_LIMIT
  const loadUserStats = useCallback(async (usersForStats: AdminUser[]) => {
    if (!Array.isArray(usersForStats) || usersForStats.length === 0) {
      setUserStats({});
      return;
    }

    setLoadingStats(true);
    try {
      const limitedUsers = usersForStats.slice(0, STAT_LIMIT);

      const statPromises = limitedUsers.map(async (user) => {
        try {
          const [
            todos,
            quizAttempts,
            pomodoroSessions,
            achievements,
            notes,
          ] = await Promise.all([
            db.getTodosByUser(user.id),
            db.getQuizAttemptsByUser(user.id),
            db.getPomodoroSessionsByUser(user.id),
            db.getUserAchievements(user.id),
            db.getNotesByUser(user.id),
          ]);

          const completedTodos = todos.filter((t: any) => t.completed);

          const quizStudyTime = quizAttempts.reduce(
            (sum: number, q: any) => sum + (q.time_taken || 0),
            0,
          );
          const quizMinutes = Math.floor(quizStudyTime / 60);

          const pomodoroMinutes = pomodoroSessions.reduce(
            (sum: number, s: any) => sum + (s.duration || 25),
            0,
          );

          const unlockedAchievements = achievements.filter(
            (a: any) => a.unlocked,
          );

          return {
            userId: user.id,
            stats: {
              tasksCompleted: completedTodos.length,
              totalTasks: todos.length,
              studyTimeMinutes: quizMinutes + pomodoroMinutes,
              quizAttempts: quizAttempts.length,
              achievementsUnlocked: unlockedAchievements.length,
              pomodoroSessions: pomodoroSessions.length,
              notes: notes.length,
            } as UserStats,
          };
        } catch (error) {
          console.error(`Error loading stats for user ${user.id}:`, error);
          return {
            userId: user.id,
            stats: {
              tasksCompleted: 0,
              totalTasks: 0,
              studyTimeMinutes: 0,
              quizAttempts: 0,
              achievementsUnlocked: 0,
              pomodoroSessions: 0,
              notes: 0,
            } as UserStats,
          };
        }
      });

      const results = await Promise.all(statPromises);

      setUserStats((prev) => {
        const next = { ...prev };
        results.forEach((r) => {
          next[r.userId] = r.stats;
        });
        return next;
      });
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // Trigger stats load for the CURRENT PAGE users only (better perf)
  useEffect(() => {
    if (!paginatedUsers.length) {
      return;
    }
    const timeoutId = setTimeout(() => {
      loadUserStats(paginatedUsers);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [paginatedUsers, loadUserStats]);

  const handleBlockUser = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    const wasBlocked = (user as any)?.isBlocked;

    setUsers((prevUsers) =>
      Array.isArray(prevUsers)
        ? prevUsers.map((u) =>
            u.id === userId ? ({ ...u, isBlocked: !wasBlocked } as any) : u,
          )
        : prevUsers,
    );

    if (wasBlocked) {
      unblockUser(userId);
      toast.success('User unblocked successfully');
    } else {
      blockUser(userId);
      toast.success('User blocked successfully');
    }
  };

  const handleExportData = (userId: string) => {
    exportUserData(userId);
    toast.success('User data exported successfully');
  };

  const getUserInitials = (username: string) =>
    username.substring(0, 2).toUpperCase();

  const getUserProfilePicture = (userId: string): string => {
    const user = users.find((u) => u.id === userId);
    return (user as any)?.profileImage || '';
  };

  const getGradientColor = (index: number) => {
    const gradients = [
      'from-blue-500 to-cyan-500',
      'from-purple-500 to-pink-500',
      'from-green-500 to-emerald-500',
      'from-orange-500 to-red-500',
      'from-indigo-500 to-purple-500',
      'from-pink-500 to-rose-500',
    ];
    return gradients[index % gradients.length];
  };

  useEffect(() => {
    let cancelled = false;

    if (selectedUser) {
      setLoadingUserDetails(true);
      (async () => {
        try {
          const details = await getUserDetails(selectedUser);
          if (!cancelled) {
            setSelectedUserDetails(details?.user ?? null);
          }
        } catch (error) {
          console.error('Failed to load selected user details:', error);
          if (!cancelled) setSelectedUserDetails(null);
        } finally {
          if (!cancelled) setLoadingUserDetails(false);
        }
      })();
    } else {
      setSelectedUserDetails(null);
      setLoadingUserDetails(false);
    }

    return () => {
      cancelled = true;
    };
  }, [selectedUser, getUserDetails]);

  const handleNextPage = () => {
    setCurrentPage((p) => Math.min(p + 1, totalPages));
  };

  const handlePrevPage = () => {
    setCurrentPage((p) => Math.max(p - 1, 1));
  };

  return (
    <>
      <div className="space-y-4 sm:space-y-6 pb-4">
        {/* Header with Search and Actions */}
        <Card className="border-0 shadow-md sm:shadow-lg">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="w-full sm:w-auto">
                <CardTitle className="text-lg sm:text-xl lg:text-2xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-1">
                  User Management
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Manage and monitor all user accounts
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Badge
                  variant="outline"
                  className="text-purple-600 border-purple-300 text-xs sm:text-sm"
                >
                  {loadingUsers ? (
                    <SmallLoader />
                  ) : (
                    `${nonAdminUsers.length} Total`
                  )}
                </Badge>
                <Badge className="bg-green-500 text-xs sm:text-sm">
                  {loadingUsers ? (
                    <SmallLoader />
                  ) : (
                    `${
                      nonAdminUsers.filter((u: any) => !u.isBlocked).length
                    } Active`
                  )}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by username..."
                  value={localSearchQuery}
                  onChange={(e) => setLocalSearchQuery(e.target.value)}
                  className="pl-9 sm:pl-10 h-10 sm:h-11 rounded-xl border-gray-300 focus:border-purple-500 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="rounded-xl border-gray-300 min-w-[100px] sm:min-w-[120px] h-10 sm:h-11 text-xs sm:text-sm"
                    >
                      Sort:{' '}
                      {sortBy === 'createdAt'
                        ? 'Newest'
                        : sortBy === 'username'
                        ? 'Name'
                        : sortBy === 'level'
                        ? 'Level'
                        : 'Points'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl">
                    <DropdownMenuItem onClick={() => setSortBy('createdAt')}>
                      Newest First
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('username')}>
                      Username A-Z
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('level')}>
                      Highest Level
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('points')}>
                      Most Points
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User List */}
        <div className="grid grid-cols-1 gap-3 sm:gap-4">
          {loadingUsers && !sortedUsers.length ? (
            <div className="flex items-center justify-center py-12">
              <SmallLoader />
            </div>
          ) : paginatedUsers.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-sm text-gray-500">
              No users found.
            </div>
          ) : (
            <AnimatePresence>
              {paginatedUsers.map((user, index) => {
                const profilePicture = getUserProfilePicture(user.id);
                const stats = getUserStats(user.id);
                const statsLoading = loadingStats && !userStats[user.id];

                return (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      className={`border-0 shadow-md hover:shadow-lg transition-all ${
                        (user as any).isBlocked ? 'opacity-60' : ''
                      }`}
                    >
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                          {/* Avatar */}
                          <div className="relative flex-shrink-0">
                            <Avatar className="w-14 h-14 sm:w-16 sm:h-16 border-2 border-white shadow-md">
                              {profilePicture ? (
                                <AvatarImage
                                  src={profilePicture}
                                  alt={user.username}
                                />
                              ) : null}
                              <AvatarFallback
                                className={`bg-gradient-to-br ${getGradientColor(
                                  index,
                                )} text-white`}
                              >
                                {getUserInitials(user.username)}
                              </AvatarFallback>
                            </Avatar>
                            {(user as any).isBlocked && (
                              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center border-2 border-white">
                                <Ban className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>

                          {/* User Info */}
                          <div className="flex-1 min-w-0 w-full sm:w-auto">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-gray-900 truncate text-sm sm:text-base">
                                    {user.username}
                                  </h3>
                                  {user.username === 'admin123' && (
                                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
                                      <Shield className="w-3 h-3 mr-1" />
                                      Admin
                                    </Badge>
                                  )}
                                  {(user as any).isBlocked && (
                                    <Badge
                                      variant="destructive"
                                      className="text-xs"
                                    >
                                      Blocked
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Target className="w-3 h-3" />
                                    Level {user.level || 1}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" />
                                    {user.totalPoints || 0} pts
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    {user.streak || 0} day streak
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-3">
                              <div className="text-center p-2 bg-blue-50 rounded-lg">
                                <Brain className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                                <p className="text-xs font-semibold text-blue-900">
                                  {statsLoading ? (
                                    <SmallLoader />
                                  ) : (
                                    stats.quizAttempts
                                  )}
                                </p>
                                <p className="text-[10px] text-blue-600">
                                  Quizzes
                                </p>
                              </div>
                              <div className="text-center p-2 bg-yellow-50 rounded-lg">
                                <Award className="w-4 h-4 mx-auto mb-1 text-yellow-600" />
                                <p className="text-xs font-semibold text-yellow-900">
                                  {statsLoading ? (
                                    <SmallLoader />
                                  ) : (
                                    stats.achievementsUnlocked
                                  )}
                                </p>
                                <p className="text-[10px] text-yellow-600">
                                  Badges
                                </p>
                              </div>
                              <div className="text-center p-2 bg-green-50 rounded-lg">
                                <CheckSquare className="w-4 h-4 mx-auto mb-1 text-green-600" />
                                <p className="text-xs font-semibold text-green-900">
                                  {statsLoading ? (
                                    <SmallLoader />
                                  ) : (
                                    stats.tasksCompleted
                                  )}
                                </p>
                                <p className="text-[10px] text-green-600">
                                  Tasks
                                </p>
                              </div>
                              <div className="text-center p-2 bg-purple-50 rounded-lg">
                                <Clock className="w-4 h-4 mx-auto mb-1 text-purple-600" />
                                <p className="text-xs font-semibold text-purple-900">
                                  {statsLoading ? (
                                    <SmallLoader />
                                  ) : (
                                    `${stats.studyTimeMinutes}m`
                                  )}
                                </p>
                                <p className="text-[10px] text-purple-600">
                                  Study
                                </p>
                              </div>
                              <div className="text-center p-2 bg-pink-50 rounded-lg">
                                <BookOpen className="w-4 h-4 mx-auto mb-1 text-pink-600" />
                                <p className="text-xs font-semibold text-pink-900">
                                  {statsLoading ? (
                                    <SmallLoader />
                                  ) : (
                                    stats.notes
                                  )}
                                </p>
                                <p className="text-[10px] text-pink-600">
                                  Notes
                                </p>
                              </div>
                              <div className="text-center p-2 bg-red-50 rounded-lg">
                                <Target className="w-4 h-4 mx-auto mb-1 text-red-600" />
                                <p className="text-xs font-semibold text-red-900">
                                  {statsLoading ? (
                                    <SmallLoader />
                                  ) : (
                                    stats.pomodoroSessions
                                  )}
                                </p>
                                <p className="text-[10px] text-red-600">
                                  Pomodoro
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex sm:flex-col gap-2 w-full sm:w-auto">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedUser(user.id)}
                              className="flex-1 sm:flex-none rounded-lg hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 text-xs"
                            >
                              <Eye className="w-3 h-3 sm:mr-1" />
                              <span className="hidden sm:inline">View</span>
                            </Button>
                            {user.username !== 'admin123' && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 sm:flex-none rounded-lg text-xs"
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="rounded-xl"
                                >
                                  <DropdownMenuItem
                                    onClick={() => handleExportData(user.id)}
                                  >
                                    <Download className="w-4 h-4 mr-2" />
                                    Export Data
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setBlockDialog({
                                        open: true,
                                        userId: user.id,
                                        isBlocking: !(user as any).isBlocked,
                                      });
                                    }}
                                    className={
                                      (user as any).isBlocked
                                        ? 'text-green-600'
                                        : 'text-red-600'
                                    }
                                  >
                                    <Ban className="w-4 h-4 mr-2" />
                                    {(user as any).isBlocked
                                      ? 'Unblock User'
                                      : 'Block User'}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Pagination controls */}
          <div className="flex items-center justify-between pt-2">
            {/* Left: Previous */}
            <Button
              size="sm"
              className="rounded-full px-5 text-xs sm:text-sm bg-pink-500 text-white hover:bg-pink-600 disabled:bg-pink-300 disabled:text-white"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
            >
              Previous
            </Button>

            {/* Center: Page info */}
            <p className="text-xs sm:text-sm text-gray-500 text-center">
              Page {currentPage} of {totalPages}
            </p>

            {/* Right: Next */}
            <Button
              size="sm"
              className="rounded-full px-5 text-xs sm:text-sm bg-pink-500 text-white hover:bg-pink-600 disabled:bg-pink-300 disabled:text-white"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
      </div>

      {/* Block/Unblock Dialog */}
      <AlertDialog
        open={blockDialog.open}
        onOpenChange={(open: boolean) =>
          setBlockDialog((prev) => ({ ...prev, open }))
        }
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {blockDialog.isBlocking ? 'Block User?' : 'Unblock User?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {blockDialog.isBlocking
                ? 'This user will be unable to access the platform. You can unblock them later.'
                : 'This user will regain access to the platform.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (blockDialog.userId) {
                  handleBlockUser(blockDialog.userId);
                }
                setBlockDialog({
                  open: false,
                  userId: null,
                  isBlocking: true,
                });
              }}
              className={`rounded-xl ${
                blockDialog.isBlocking
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {blockDialog.isBlocking ? 'Block User' : 'Unblock User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* User Details Dialog */}
      <Dialog
        open={!!selectedUser}
        onOpenChange={(open: boolean) => !open && setSelectedUser(null)}
      >
        <DialogContent className="rounded-2xl max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Detailed information and activity for this user
            </DialogDescription>
          </DialogHeader>

          {loadingUserDetails ? (
            <div className="flex items-center justify-center py-10">
              <SmallLoader />
              <span className="text-sm text-gray-600 ml-2">
                Loading user details...
              </span>
            </div>
          ) : (
            selectedUserDetails &&
            selectedUserStats && (
              <ScrollArea className="max-h-[60vh] pr-4">
                <div className="space-y-6">
                  {/* User Profile */}
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                    <Avatar className="w-16 h-16 border-2 border-white shadow-md">
                      {getUserProfilePicture(selectedUserDetails.id) ? (
                        <AvatarImage
                          src={getUserProfilePicture(selectedUserDetails.id)}
                          alt={selectedUserDetails.username}
                        />
                      ) : null}
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                        {getUserInitials(selectedUserDetails.username)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg">
                        {selectedUserDetails.username}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                        <span>Level {selectedUserDetails.level || 1}</span>
                        <span>•</span>
                        <span>
                          {selectedUserDetails.totalPoints || 0} points
                        </span>
                        <span>•</span>
                        <span>
                          {selectedUserDetails.streak || 0} day streak
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Activity Stats */}
                  <div>
                    <h4 className="font-semibold mb-3">Activity Overview</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Brain className="w-5 h-5 text-blue-600" />
                          <p className="text-sm font-medium text-blue-900">
                            Quizzes
                          </p>
                        </div>
                        <p className="text-2xl font-bold text-blue-600">
                          {selectedUserStats.quizAttempts}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">Completed</p>
                      </div>

                      <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Award className="w-5 h-5 text-yellow-600" />
                          <p className="text-sm font-medium text-yellow-900">
                            Achievements
                          </p>
                        </div>
                        <p className="text-2xl font-bold text-yellow-600">
                          {selectedUserStats.achievementsUnlocked}
                        </p>
                        <p className="text-xs text-yellow-600 mt-1">Unlocked</p>
                      </div>

                      <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckSquare className="w-5 h-5 text-green-600" />
                          <p className="text-sm font-medium text-green-900">
                            Tasks
                          </p>
                        </div>
                        <p className="text-2xl font-bold text-green-600">
                          {selectedUserStats.tasksCompleted}
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          of {selectedUserStats.totalTasks} completed
                        </p>
                      </div>

                      <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-5 h-5 text-purple-600" />
                          <p className="text-sm font-medium text-purple-900">
                            Study Time
                          </p>
                        </div>
                        <p className="text-2xl font-bold text-purple-600">
                          {selectedUserStats.studyTimeMinutes}
                        </p>
                        <p className="text-xs text-purple-600 mt-1">
                          minutes
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Additional Stats */}
                  <div>
                    <h4 className="font-semibold mb-3">Content Created</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-pink-50 rounded-lg border border-pink-200">
                        <div className="flex items-center justify-between">
                          <BookOpen className="w-5 h-5 text-pink-600" />
                          <p className="text-xl font-bold text-pink-600">
                            {selectedUserStats.notes}
                          </p>
                        </div>
                        <p className="text-xs text-pink-600 mt-1">
                          Study Notes
                        </p>
                      </div>

                      <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                        <div className="flex items-center justify-between">
                          <Target className="w-5 h-5 text-red-600" />
                          <p className="text-xl font-bold text-red-600">
                            {selectedUserStats.pomodoroSessions}
                          </p>
                        </div>
                        <p className="text-xs text-red-600 mt-1">
                          Pomodoro Sessions
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Account Info */}
                  <div>
                    <h4 className="font-semibold mb-3">Account Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between p-2 bg-gray-50 rounded">
                        <span className="text-gray-600">User ID:</span>
                        <span className="font-mono text-gray-900">
                          {selectedUserDetails.id}
                        </span>
                      </div>
                      <div className="flex justify-between p-2 bg-gray-50 rounded">
                        <span className="text-gray-600">Created:</span>
                        <span className="text-gray-900">
                          {selectedUserDetails.createdAt
                            ? new Date(
                                selectedUserDetails.createdAt,
                              ).toLocaleDateString()
                            : 'N/A'}
                        </span>
                      </div>

                      <div className="flex justify-between p-2 bg-gray-50 rounded">
                        <span className="text-gray-600">Last Active:</span>
                        <span className="text-gray-900">
                          {selectedUserDetails.lastActive
                            ? new Date(
                                selectedUserDetails.lastActive,
                              ).toLocaleDateString()
                            : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between p-2 bg-gray-50 rounded">
                        <span className="text-gray-600">Status:</span>
                        <Badge
                          className={
                            selectedUserDetails.isBlocked
                              ? 'bg-red-500'
                              : 'bg-green-500'
                          }
                        >
                          {selectedUserDetails.isBlocked
                            ? 'Blocked'
                            : 'Active'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            )
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
} from 'react';
import { db } from '../database';

export interface AdminUser {
  id: string;
  username: string;
  level: number;
  streak: number;
  totalPoints: number;
  createdAt: string;
  lastActive?: string | null;
  isBlocked?: boolean;
  quizzesCompleted?: number;
  achievementsUnlocked?: number;
  studyTime?: number;
  tasksCompleted?: number;
  is_admin: boolean;
  profileImage?: string | null; // 👈 NEW
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisWeek: number;
  totalQuizzesCompleted: number;
  totalAchievements: number;
  totalPoints: number;
  avgPoints: number;
  avgStreak: number;
  totalTasks: number;
  usersWithActiveStreak: number;
  usersWithAchievements: number;
  usersWithQuizzes: number;
  quizzesCompletedToday: number;
  topPerformers: AdminUser[];
}

interface AppSettings {
  maintenanceMode: boolean;
  maxQuizzesPerDay: number;
  allowUserQuizCreation: boolean;
  enableOfflineMode: boolean;
  minPasswordLength: number;
  sessionTimeout: number;
}

interface AdminContextType {
  isAdmin: boolean;
  checkAdminCredentials: (username: string, userCode: string) => boolean;
  setIsAdmin: (isAdmin: boolean) => void;
  logoutAdmin: () => void;
  getAllUsers: () => Promise<AdminUser[]>;
  getUserDetails: (userId: string) => Promise<any | null>;
  blockUser: (userId: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  resetUserPassword: (userId: string) => Promise<string>;
  updateUserPoints: (
    userId: string,
    points: number,
    operation: 'set' | 'add' | 'subtract'
  ) => Promise<void>;
  updateUserStreak: (
    userId: string,
    streak: number,
    operation: 'set' | 'increment' | 'reset'
  ) => Promise<void>;
  getReportedContent: () => any[];
  updateReportStatus: (reportId: string, status: string) => void;
  deleteReportedContent: (contentId: string) => void;
  appSettings: AppSettings;
  updateAppSettings: (settings: Partial<AppSettings>) => Promise<void>;
  getAdminStats: () => Promise<AdminStats>;
  getUserActivity: (userId: string) => Promise<any[]>;
  getAllQuizzes: () => Promise<any[]>;
  getAllMaterials: () => Promise<any[]>;
  searchUsers: (query: string) => Promise<AdminUser[]>;
  exportUserData: (userId: string) => Promise<void>;
}

const defaultSettings: AppSettings = {
  maintenanceMode: false,
  maxQuizzesPerDay: 50,
  allowUserQuizCreation: true,
  enableOfflineMode: true,
  minPasswordLength: 6,
  sessionTimeout: 3600000,
};

const defaultStats = (): AdminStats => ({
  totalUsers: 0,
  activeUsers: 0,
  newUsersThisWeek: 0,
  totalQuizzesCompleted: 0,
  totalAchievements: 0,
  totalPoints: 0,
  avgPoints: 0,
  avgStreak: 0,
  totalTasks: 0,
  usersWithActiveStreak: 0,
  usersWithAchievements: 0,
  usersWithQuizzes: 0,
  quizzesCompletedToday: 0,
  topPerformers: [],
});

const AdminContext = createContext<AdminContextType>({
  isAdmin: false,
  checkAdminCredentials: () => false,
  setIsAdmin: () => {},
  logoutAdmin: () => {},
  getAllUsers: async () => [],
  getUserDetails: async () => null,
  blockUser: async () => {},
  unblockUser: async () => {},
  deleteUser: async () => {},
  resetUserPassword: async () => '',
  updateUserPoints: async () => {},
  updateUserStreak: async () => {},
  getReportedContent: () => [],
  updateReportStatus: () => {},
  deleteReportedContent: () => {},
  appSettings: defaultSettings,
  updateAppSettings: async () => {},
  getAdminStats: async () => defaultStats(),
  getUserActivity: async () => [],
  getAllQuizzes: async () => [],
  getAllMaterials: async () => [],
  searchUsers: async () => [],
  exportUserData: async () => {},
});

const ADMIN_CREDENTIALS = {
  username: 'admin123',
  userCode: 'JOYGROW3APP3',
};

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [appSettings, setAppSettings] =
    useState<AppSettings>(defaultSettings);
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        await db.initialize();
        if (cancelled) return;
        setDbReady(true);

        try {
          const settings = await db.getAppSettings();
          if (settings) {
            setAppSettings({
              maintenanceMode: settings.maintenance_mode ?? false,
              maxQuizzesPerDay: settings.max_quizzes_per_day ?? 50,
              allowUserQuizCreation:
                settings.allow_user_quiz_creation ?? true,
              enableOfflineMode: settings.enable_offline_mode ?? true,
              minPasswordLength: settings.min_password_length ?? 6,
              sessionTimeout: settings.session_timeout ?? 3600000,
            });
          }
        } catch (error) {
          console.error('Error loading app settings:', error);
        }

        const adminSession = localStorage.getItem('joygrow_admin_session');
        if (adminSession) {
          try {
            const session = JSON.parse(adminSession);
            if (Date.now() - session.timestamp < 24 * 60 * 60 * 1000) {
              setIsAdmin(true);
            } else {
              localStorage.removeItem('joygrow_admin_session');
            }
          } catch {
            localStorage.removeItem('joygrow_admin_session');
          }
        }
      } catch (err) {
        console.error('AdminProvider init failed:', err);
        setDbReady(true);
      }
    };

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  const checkAdminCredentials = useCallback(
    (username: string, userCode: string): boolean => {
      return (
        username === ADMIN_CREDENTIALS.username &&
        userCode === ADMIN_CREDENTIALS.userCode
      );
    },
    []
  );

  const setAdminStatus = useCallback((status: boolean) => {
    setIsAdmin(status);
    if (status) {
      localStorage.setItem(
        'joygrow_admin_session',
        JSON.stringify({
          timestamp: Date.now(),
          username: ADMIN_CREDENTIALS.username,
        })
      );
    } else {
      localStorage.removeItem('joygrow_admin_session');
    }
  }, []);

  const logoutAdmin = useCallback(() => {
    setIsAdmin(false);
    localStorage.removeItem('joygrow_admin_session');
  }, []);

  const getAdminStats = useCallback(async (): Promise<AdminStats> => {
    if (!dbReady) return defaultStats();

    try {
      const users = await db.getAllUsers();
      const nonAdminUsers = users.filter(
        (u: any) => !u.is_admin && u.username !== 'admin123'
      );

      if (nonAdminUsers.length === 0) return defaultStats();

      const totalUsers = nonAdminUsers.length;
      const activeUsers = nonAdminUsers.filter(
        (u: any) => !u.is_blocked
      ).length;

      let totalPoints = 0;
      let totalStreakSum = 0;
      let usersWithActiveStreak = 0;

      nonAdminUsers.forEach((user: any) => {
        totalPoints += user.total_points || 0;
        const streak = user.streak || 0;
        totalStreakSum += streak;
        if (streak > 0) usersWithActiveStreak++;
      });

      const avgPoints =
        totalUsers > 0 ? Math.round(totalPoints / totalUsers) : 0;
      const avgStreak =
        totalUsers > 0 ? Math.round(totalStreakSum / totalUsers) : 0;

      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const newUsersThisWeek = nonAdminUsers.filter(
        (u: any) => new Date(u.created_at) > weekAgo
      ).length;

      const topPerformers = nonAdminUsers
        .sort(
          (a: any, b: any) =>
            (b.total_points || 0) - (a.total_points || 0)
        )
        .slice(0, 5)
        .map(
          (u: any): AdminUser => ({
            id: u.id,
            username: u.username,
            level: u.level || 1,
            streak: u.streak || 0,
            totalPoints: u.total_points || 0,
            createdAt: u.created_at || '',
            is_admin: u.is_admin || false,
            profileImage: u.profile_image ?? null, // keep consistent
          })
        );

      return {
        totalUsers,
        activeUsers,
        newUsersThisWeek,
        totalQuizzesCompleted: 0,
        totalAchievements: 0,
        totalPoints,
        avgPoints,
        avgStreak,
        totalTasks: 0,
        usersWithActiveStreak,
        usersWithAchievements: 0,
        usersWithQuizzes: 0,
        quizzesCompletedToday: 0,
        topPerformers,
      };
    } catch (error) {
      console.error('getAdminStats error:', error);
      return defaultStats();
    }
  }, [dbReady]);

  const getAllUsers = useCallback(async (): Promise<AdminUser[]> => {
    if (!dbReady) return [];
    try {
      const rows = await db.getAllUsers();
      return rows.map(
        (u: any): AdminUser => ({
          id: u.id,
          username: u.username,
          level: u.level ?? 1,
          streak: u.streak ?? 0,
          totalPoints: u.total_points ?? 0,
          createdAt: u.created_at ?? new Date().toISOString(),
          lastActive: u.last_active ?? null,
          isBlocked: u.is_blocked ?? false,
          quizzesCompleted: 0,
          achievementsUnlocked: 0,
          studyTime: 0,
          tasksCompleted: 0,
          is_admin: u.is_admin ?? false,
          profileImage: u.profile_image ?? null, // 👈 NEW
        })
      );
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }, [dbReady]);

  const getUserDetails = useCallback(async (userId: string) => {
    try {
      const user = await db.getUserById(userId);
      if (!user) return null;

      const quizHistory = await db.getQuizHistory(userId);
      const progress = await db.getProgress(userId);
      const achievements = progress?.achievements || [];
      const studyMaterials =
        (await db.getNotesByUser?.(userId)) || [];
      const todoHistory = (await db.getTodos?.(userId)) || [];
      const pomodoroSessions =
        (await db.getPomodoroSessions?.(userId)) || [];

      const mappedUser: AdminUser = {
        id: user.id,
        username: user.username,
        level: user.level ?? 1,
        streak: user.streak ?? 0,
        totalPoints: user.total_points ?? 0,
        createdAt: user.created_at,
        lastActive: user.last_active ?? null,
        isBlocked: user.is_blocked ?? false,
        is_admin: user.is_admin ?? false,
        profileImage: user.profile_image ?? null, // 👈 NEW
      };

      return {
        user: mappedUser,
        quizHistory,
        achievements,
        studyMaterials,
        todoHistory,
        pomodoroSessions,
      };
    } catch (error) {
      console.error('Error getting user details:', error);
      return null;
    }
  }, []);

  const blockUser = useCallback(async (userId: string) => {
    try {
      await db.updateUser(userId, { is_blocked: true });
    } catch (error) {
      console.error('Error blocking user:', error);
    }
  }, []);

  const unblockUser = useCallback(async (userId: string) => {
    try {
      await db.updateUser(userId, { is_blocked: false });
    } catch (error) {
      console.error('Error unblocking user:', error);
    }
  }, []);

  const deleteUser = useCallback(async (userId: string) => {
    try {
      await db.deleteUser(userId);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }, []);

  const resetUserPassword = useCallback(
    async (userId: string): Promise<string> => {
      const newCode = Math.random()
        .toString(36)
        .substring(2, 10)
        .toUpperCase();
      try {
        await db.updateUser(userId, { password_hash: newCode });
        return newCode;
      } catch (error) {
        console.error('Error resetting password:', error);
        throw error;
      }
    },
    []
  );

  const updateUserPoints = useCallback(
    async (
      userId: string,
      points: number,
      operation: 'set' | 'add' | 'subtract'
    ) => {
      try {
        const progress = await db.getProgress(userId);
        const currentPoints = progress?.total_points || 0;
        let newPoints = currentPoints;

        switch (operation) {
          case 'set':
            newPoints = points;
            break;
          case 'add':
            newPoints = currentPoints + points;
            break;
          case 'subtract':
            newPoints = Math.max(0, currentPoints - points);
            break;
        }

        const newLevel = Math.floor(newPoints / 300) + 1;

        await db.updateProgress(userId, {
          total_points: newPoints,
          level: newLevel,
        });

        await db.updateUser(userId, {
          total_points: newPoints,
          level: newLevel,
        });
      } catch (error) {
        console.error('Error updating user points:', error);
        throw error;
      }
    },
    []
  );

  const updateUserStreak = useCallback(
    async (
      userId: string,
      streak: number,
      operation: 'set' | 'increment' | 'reset'
    ) => {
      try {
        const progress = await db.getProgress(userId);
        const currentStreak = progress?.streak || 0;
        let newStreak = currentStreak;

        switch (operation) {
          case 'set':
            newStreak = streak;
            break;
          case 'increment':
            newStreak = currentStreak + streak;
            break;
          case 'reset':
            newStreak = 0;
            break;
        }

        await db.updateProgress(userId, { streak: newStreak });
        await db.updateUser(userId, { streak: newStreak });
      } catch (error) {
        console.error('Error updating user streak:', error);
        throw error;
      }
    },
    []
  );

  const getReportedContent = useCallback(() => [], []);

  const updateReportStatus = useCallback(
    (reportId: string, status: string) => {
      console.log('Update report status:', reportId, status);
    },
    []
  );

  const deleteReportedContent = useCallback((contentId: string) => {
    console.log('Delete reported content:', contentId);
  }, []);

  const updateAppSettings = useCallback(
    async (settings: Partial<AppSettings>) => {
      const newSettings: AppSettings = {
        ...appSettings,
        ...settings,
      };
      setAppSettings(newSettings);

      const dbSettings = {
        id: '1', // string
        maintenance_mode: newSettings.maintenanceMode,
        max_quizzes_per_day: newSettings.maxQuizzesPerDay,
        allow_user_quiz_creation: newSettings.allowUserQuizCreation,
        enable_offline_mode: newSettings.enableOfflineMode,
        min_password_length: newSettings.minPasswordLength,
        session_timeout: newSettings.sessionTimeout,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      try {
        // accepts the structural type, no explicit Types.AppSettings needed
        await db.updateAppSettings(dbSettings as any);
      } catch (error) {
        console.error('Failed to update app settings:', error);
      }
    },
    [appSettings],
  );


  const getUserActivity = useCallback(async (userId: string) => {
    try {
      const activityLogs =
        (await db.getActivityLogsByUser?.(userId)) || [];
      return activityLogs;
    } catch (error) {
      console.error('Error getting user activity:', error);
      return [];
    }
  }, []);

  const getAllQuizzes = useCallback(async () => {
    try {
      const customQuizzes = (await db.getCustomQuizzes?.()) || [];
      return customQuizzes;
    } catch (error) {
      console.error('Error getting all quizzes:', error);
      return [];
    }
  }, []);

  const getAllMaterials = useCallback(async () => {
    try {
      const materials = (await db.getNotes?.()) || [];
      return materials;
    } catch (error) {
      console.error('Error getting all materials:', error);
      return [];
    }
  }, []);

  const searchUsers = useCallback(
    async (query: string): Promise<AdminUser[]> => {
      try {
        const users = await getAllUsers();
        if (!query) return users;

        const lowerQuery = query.toLowerCase();
        return users.filter(
          (user) =>
            user.username.toLowerCase().includes(lowerQuery) ||
            user.id.toLowerCase().includes(lowerQuery)
        );
      } catch (error) {
        console.error('Error searching users:', error);
        return [];
      }
    },
    [getAllUsers]
  );

  const exportUserData = useCallback(
    async (userId: string) => {
      try {
        const userData = await getUserDetails(userId);
        if (!userData) return;

        const dataStr = JSON.stringify(userData, null, 2);
        const dataBlob = new Blob([dataStr], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `user_${
          userData.user?.username || userId
        }_data.json`;
        link.click();
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error exporting user data:', error);
      }
    },
    [getUserDetails]
  );

  return (
    <AdminContext.Provider
      value={{
        isAdmin,
        checkAdminCredentials,
        setIsAdmin: setAdminStatus,
        logoutAdmin,
        getAllUsers,
        getUserDetails,
        blockUser,
        unblockUser,
        deleteUser,
        resetUserPassword,
        updateUserPoints,
        updateUserStreak,
        getReportedContent,
        updateReportStatus,
        deleteReportedContent,
        appSettings,
        updateAppSettings,
        getAdminStats,
        getUserActivity,
        getAllQuizzes,
        getAllMaterials,
        searchUsers,
        exportUserData,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => useContext(AdminContext);

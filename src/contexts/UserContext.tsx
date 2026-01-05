import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { db } from '../database';
import type { User as DBUser } from '../database';

export interface User {
  id: string;
  username: string;
  level?: number;
  streak?: number;
  totalPoints?: number;
  profileImage?: string;
}

interface UserContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  clearAllUserData: () => void;
  getUserStorageKey: (key: string) => string;
  updateUserProfile: (userId: string, updates: Partial<DBUser>) => Promise<void>;
  refreshUserData: (userId: string) => Promise<void>;
}

// Create context with default values to prevent undefined errors
const defaultContextValue: UserContextType = {
  currentUser: null,
  setCurrentUser: () => {},
  clearAllUserData: () => {},
  getUserStorageKey: (key: string) => key,
  updateUserProfile: async () => {},
  refreshUserData: async () => {},
};

const UserContext = createContext<UserContextType>(defaultContextValue);

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Update lastActive timestamp when user is set
  const setCurrentUserWithTimestamp = useCallback(async (user: User | null) => {
    setCurrentUser(user);

    if (user) {
      try {
        // Column is last_active in DatabaseService/createUser
        await db.updateUser(user.id, {
          last_active: new Date().toISOString(),
        });

        const dbUser = await db.getUserById(user.id);
        if (dbUser) {
          // DatabaseService uses is_admin / is_blocked flags
          db.setCurrentUser(dbUser.id, dbUser.is_admin);
        }
      } catch (error) {
        console.error('Error updating lastActive:', error);
      }
    }
  }, []);

  // Refresh user data from database
  const refreshUserData = useCallback(async (userId: string) => {
    try {
      const dbUser = await db.getUserById(userId);
      if (dbUser) {
        setCurrentUser({
          id: dbUser.id,
          username: dbUser.username,
          level: dbUser.level,
          streak: dbUser.streak,
          totalPoints: dbUser.total_points,
          profileImage: dbUser.profile_image,
        });
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
      throw error;
    }
  }, []);

  // Update user profile in database
  const updateUserProfile = useCallback(
    async (userId: string, updates: Partial<DBUser>) => {
      try {
        const mappedUpdates: any = { ...updates };

        // Map camelCase fields into DB column names if needed
        if ('profileImage' in mappedUpdates) {
          mappedUpdates.profile_image = mappedUpdates.profileImage;
          delete mappedUpdates.profileImage;
        }
        if ('totalPoints' in mappedUpdates) {
          mappedUpdates.total_points = mappedUpdates.totalPoints;
          delete mappedUpdates.totalPoints;
        }

        await db.updateUser(userId, mappedUpdates);

        if (currentUser && currentUser.id === userId) {
          await refreshUserData(userId);
        }
      } catch (error) {
        console.error('Error updating user profile:', error);
        throw error;
      }
    },
    [currentUser, refreshUserData],
  );

  // Generate user-specific storage key
  const getUserStorageKey = useCallback(
    (key: string): string => {
      if (!currentUser) return key;
      return `user_${currentUser.id}_${key}`;
    },
    [currentUser],
  );

  // Clear all user data from localStorage (legacy - will be replaced by database cleanup)
  const clearAllUserData = useCallback(() => {
    if (!currentUser) return;

    const userId = currentUser.id;
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`user_${userId}_`)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
  }, [currentUser]);

  return (
    <UserContext.Provider
      value={{
        currentUser,
        setCurrentUser: setCurrentUserWithTimestamp,
        clearAllUserData,
        getUserStorageKey,
        updateUserProfile,
        refreshUserData,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  return context;
}

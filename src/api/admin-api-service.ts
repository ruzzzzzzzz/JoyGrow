// Admin API Service - 100% Database-Driven
// All operations use database instead of localStorage

import { db } from '../database';

// Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface AdminUser {
  id: string;
  username: string;
  level: number;
  streak: number;
  totalPoints: number;
  quizzesCompleted: number;
  achievementsUnlocked: number;
  tasksCompleted: number;
  lastActive: string;
  isBlocked: boolean;
}

export interface UpdatePointsRequest {
  points: number;
  operation: 'add' | 'subtract' | 'set';
}

export interface BlockUserRequest {
  blocked: boolean;
  reason?: string;
}

export interface UpdateStreakRequest {
  streak: number;
  operation: 'add' | 'subtract' | 'set';
}

class AdminAPIService {
  /**
   * Get all users - FROM DATABASE
   */
  async getAllUsers(): Promise<ApiResponse<AdminUser[]>> {
    try {
      const users = await db.getAllUsers();

      const enrichedUsers: AdminUser[] = await Promise.all(
        users.map(async (user: any) => {
          // Get quiz attempts count from database
          const quizAttempts = await db.getQuizAttemptsByUser(user.id);

          // Get achievements count from database
          const achievements = await db.getUserAchievements(user.id);
          const unlockedAchievements = achievements.filter(
            (a) => a.unlocked
          ).length;

          // Get todos count from database
          const todos = await db.getTodosByUser(user.id);
          const completedTodos = todos.filter((t) => t.completed).length;

          return {
            id: user.id,
            username: user.username,
            level: user.level || 1,
            streak: user.streak || 0,
            totalPoints: user.total_points || 0,
            quizzesCompleted: quizAttempts.length,
            achievementsUnlocked: unlockedAchievements,
            tasksCompleted: completedTodos,
            lastActive: user.last_active,
            isBlocked: user.is_blocked,
          };
        })
      );

      return { success: true, data: enrichedUsers };
    } catch (error) {
      console.error('Error getting all users:', error);
      return { success: false, error: 'Failed to get users' };
    }
  }

  /**
   * Update user points - IN DATABASE
   */
  async updateUserPoints(
    userId: string,
    request: UpdatePointsRequest
  ): Promise<ApiResponse<{ points: number }>> {
    try {
      const user = await db.getUserById(userId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      let newPoints = user.total_points || 0;

      switch (request.operation) {
        case 'add':
          newPoints += request.points;
          break;
        case 'subtract':
          newPoints = Math.max(0, newPoints - request.points);
          break;
        case 'set':
          newPoints = request.points;
          break;
      }

      // Update in database
      await db.updateUser(userId, { total_points: newPoints });

      return { success: true, data: { points: newPoints } };
    } catch (error) {
      console.error('Error updating user points:', error);
      return { success: false, error: 'Failed to update points' };
    }
  }

  /**
   * Block/unblock user - IN DATABASE
   */
  async blockUser(
    userId: string,
    request: BlockUserRequest
  ): Promise<ApiResponse<{ blocked: boolean }>> {
    try {
      await db.updateUser(userId, { is_blocked: request.blocked });

      // Log the action
      await db.createActivityLog({
        user_id: userId,
        action: request.blocked ? 'User blocked' : 'User unblocked',
        details: request.reason,
        type: 'other',
      });

      return { success: true, data: { blocked: request.blocked } };
    } catch (error) {
      console.error('Error blocking user:', error);
      return { success: false, error: 'Failed to block user' };
    }
  }

  /**
   * Update user streak - IN DATABASE
   */
  async updateUserStreak(
    userId: string,
    request: UpdateStreakRequest
  ): Promise<ApiResponse<{ streak: number }>> {
    try {
      const user = await db.getUserById(userId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      let newStreak = user.streak || 0;

      switch (request.operation) {
        case 'add':
          newStreak += request.streak;
          break;
        case 'subtract':
          newStreak = Math.max(0, newStreak - request.streak);
          break;
        case 'set':
          newStreak = request.streak;
          break;
      }

      // Update in database
      await db.updateUser(userId, { streak: newStreak });

      return { success: true, data: { streak: newStreak } };
    } catch (error) {
      console.error('Error updating user streak:', error);
      return { success: false, error: 'Failed to update streak' };
    }
  }

  /**
   * Get user activity logs - FROM DATABASE
   */
  async getUserActivityLogs(
    userId: string
  ): Promise<ApiResponse<any[]>> {
    try {
      const logs = await db.getActivityLogsByUser(userId);
      return { success: true, data: logs };
    } catch (error) {
      console.error('Error getting user activity logs:', error);
      return { success: false, error: 'Failed to get activity logs' };
    }
  }

  /**
   * Get all activity logs - FROM DATABASE
   */
  async getAllActivityLogs(): Promise<ApiResponse<any[]>> {
    try {
      const logs = await db.getAllActivityLogs();
      return { success: true, data: logs };
    } catch (error) {
      console.error('Error getting all activity logs:', error);
      return { success: false, error: 'Failed to get activity logs' };
    }
  }
}

export const adminAPIService = new AdminAPIService();

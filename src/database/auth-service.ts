// Authentication Service
import { db } from './database-service';
import * as Types from './types';
import bcrypt from 'bcryptjs';

// If SecurityQuestion is defined in SecurityQuestionsSetup.tsx, export it there and import here.
// Example:
// export interface SecurityQuestion { question: string; answer: string; }
import type { SecurityQuestion } from '../components/SecurityQuestionsSetup';

interface AuthResult {
  success: boolean;
  user?: Types.User;
  mode?: 'online' | 'offline';
  error?: string;
}

export class AuthService {
  /**
   * Hash a password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * Verify a password against a hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  async checkUsername(
    username: string
  ): Promise<{ exists: boolean; error?: string }> {
    try {
      const existing = await db.getUserByUsername(username.trim());
      return { exists: !!existing };
    } catch (error) {
      console.error('Check username error:', error);
      return { exists: false, error: 'Failed to check username' };
    }
  }

  /**
   * Register a new user (Sign Up)
   */
  async signUp(
    username: string,
    password: string,
    _securityQuestions?: SecurityQuestion[]
  ): Promise<AuthResult> {
    try {
      // Check if username already exists
      const existing = await db.getUserByUsername(username);
      if (existing) {
        return {
          success: false,
          error: 'Username already exists',
        };
      }

      // Hash password
      const passwordHash = await this.hashPassword(password);

      // Create user (include securityquestions on first insert)
      const newUser: Types.NewUser = {
        username,
        password_hash: passwordHash,
        level: 1,
        streak: 0,
        total_points: 0,
        is_blocked: false,
        is_admin: false,
        securityquestions: _securityQuestions,
      };

      const user = await db.createUser(newUser);

      // Set current user context
      db.setCurrentUser(user.id, false);

      // Initialize user achievements
      await db.initializeUserAchievements(user.id);

      // Create default pomodoro settings
      const pomodoroSettings: Types.NewPomodoroSettings = {
        user_id: user.id,
        work_duration: 25,
        break_duration: 5,
        long_break_duration: 15,
        sessions_until_long_break: 4,
        completed_cycles: 0,
      };
      await db.createPomodoroSettings(pomodoroSettings);

      // Log activity
      await db.createActivityLog({
        user_id: user.id,
        action: 'User Registered',
        details: `New user account created: ${username}`,
        type: 'login',
      });

      return {
        success: true,
        user,
        mode: db.isNetworkOnline() ? 'online' : 'offline',
      };
    } catch (error) {
      console.error('Sign up error:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to create account',
      };
    }
  }

  /**
   * Login a user (Sign In)
   */
  async signIn(username: string, password: string): Promise<AuthResult> {
    try {
      // Special case: hardcoded admin account
      if (username === 'admin123' && password === 'JOYGROW3app3') {
        // Try to get admin user from database
        let adminUser = await db.getUserByUsername('admin123');

        if (adminUser) {
          // Set current user context
          db.setCurrentUser(adminUser.id, true);

          // Log activity
          await db.createActivityLog({
            user_id: adminUser.id,
            action: 'Admin Login',
            details: 'Administrator logged in',
            type: 'login',
          });

          return {
            success: true,
            user: adminUser,
            mode: db.isNetworkOnline() ? 'online' : 'offline',
          };
        } else {
          // If admin doesn't exist in database, create it
          const passwordHash = await this.hashPassword(password);
          const newAdminUser: Types.NewUser = {
            username: 'admin123',
            password_hash: passwordHash,
            level: 999,
            streak: 0,
            total_points: 0,
            is_blocked: false,
            is_admin: true,
          };

          adminUser = await db.createUser(newAdminUser);
          db.setCurrentUser(adminUser.id, true);

          return {
            success: true,
            user: adminUser,
            mode: db.isNetworkOnline() ? 'online' : 'offline',
          };
        }
      }

      // Normal login flow: get user by username
      const user = await db.getUserByUsername(username);
      if (!user) {
        return {
          success: false,
          error: 'Invalid username or password',
        };
      }

      // Verify password
      const isValid = await this.verifyPassword(password, user.password_hash);
      if (!isValid) {
        return {
          success: false,
          error: 'Invalid username or password',
        };
      }

      // Check if user is blocked
      if (user.is_blocked) {
        return {
          success: true, // Success to allow the blocked dialog to show
          user,
          mode: db.isNetworkOnline() ? 'online' : 'offline',
        };
      }

      // Set current user context
      db.setCurrentUser(user.id, user.is_admin);

      // Log activity
      await db.createActivityLog({
        user_id: user.id,
        action: 'User Login',
        details: `User logged in: ${username}`,
        type: 'login',
      });

      // Update last active
      await db.updateUser(user.id, {
        last_active: new Date().toISOString(),
      });

      return {
        success: true,
        user,
        mode: db.isNetworkOnline() ? 'online' : 'offline',
      };
    } catch (error) {
      console.error('Sign in error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }

  /**
   * Register a new user (legacy method)
   */
  async register(username: string, password: string): Promise<Types.User> {
    const result = await this.signUp(username, password);
    if (!result.success || !result.user) {
      throw new Error(result.error || 'Failed to create user');
    }
    return result.user;
  }

  /**
   * Login a user (legacy method)
   */
  async login(username: string, password: string): Promise<Types.User> {
    const result = await this.signIn(username, password);
    if (!result.success || !result.user) {
      throw new Error(result.error || 'Login failed');
    }
    return result.user;
  }

  /**
   * Change user password (user knows old password)
   */
  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await db.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify old password
    const isValid = await this.verifyPassword(oldPassword, user.password_hash);
    if (!isValid) {
      throw new Error('Invalid old password');
    }

    // Hash new password
    const newPasswordHash = await this.hashPassword(newPassword);

    // Update password
    await db.updateUser(userId, {
      password_hash: newPasswordHash,
    });

    // Log activity
    await db.createActivityLog({
      user_id: userId,
      action: 'Password Changed',
      details: 'User changed their password',
      type: 'other',
    });
  }

  /**
   * Reset password via forgot-password flow (no old password)
   * Used after answering security questions in ForgotPasswordFlow.tsx
   */
  async resetPasswordByUsername(
    username: string,
    newPassword: string
  ): Promise<void> {
    // 1. Find the user
    const user = await db.getUserByUsername(username.trim());
    if (!user) {
      throw new Error('User not found');
    }

    // 2. Hash new password
    const newPasswordHash = await this.hashPassword(newPassword);

    // 3. Update password
    await db.updateUser(user.id, {
      password_hash: newPasswordHash,
    });

    // 4. Log activity
    await db.createActivityLog({
      user_id: user.id,
      action: 'Password Reset via Security Questions',
      details: 'User reset their password through recovery flow',
      type: 'other',
    });
  }

  /**
   * Admin: Reset user password
   */
  async resetUserPassword(
    adminId: string,
    userId: string,
    newPassword: string
  ): Promise<void> {
    // Verify admin
    const admin = await db.getUserById(adminId);
    if (!admin || !admin.is_admin) {
      throw new Error('Unauthorized: Admin access required');
    }

    // Hash new password
    const newPasswordHash = await this.hashPassword(newPassword);

    // Update password
    await db.updateUser(userId, {
      password_hash: newPasswordHash,
    });

    // Log activity
    await db.createActivityLog({
      user_id: userId,
      action: 'Password Reset by Admin',
      details: `Admin ${admin.username} reset the password`,
      type: 'other',
    });
  }

  /**
   * Logout (clear context)
   */
  logout(): void {
    // Pass null user id by convention: you can optionally
    // add a db.clearCurrentUser() wrapper if you prefer.
    db.setCurrentUser('', false);
  }
}

// Export singleton instance
export const authService = new AuthService();

import { supabase, setSupabaseContext } from './supabase-client';
import { sqliteService } from './sqlite-service';
import { syncService } from './sync-service';
import * as Types from './types';

export class DatabaseService {

  private currentUserId: string | null = null;
  private isOnline: boolean = navigator.onLine;

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('🌐 Online - Will sync data');
      this.syncWhenOnline();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('📴 Offline - Using local database');
    });
  }

  /**
   * Set the current user context
   */
  setCurrentUser(userId: string | null, isAdmin: boolean = false): void {
    this.currentUserId = userId;
    if (userId && this.isOnline) {
      setSupabaseContext(userId, isAdmin);
    }
  }


  /**
   * Check if we're online
   */
  isNetworkOnline(): boolean {
    return this.isOnline && navigator.onLine;
  }

  /**
   * Sync data when online
   */
  private async syncWhenOnline(): Promise<void> {
    if (this.currentUserId && this.isOnline) {
      try {
        await syncService.syncAll(this.currentUserId);
      } catch (error) {
        console.error('Sync error:', error);
      }
    }
  }

  /**
   * Initialize the database
   */
  async initialize(): Promise<void> {
    await sqliteService.init();
    console.log('✅ Database service initialized');
  }

  // ============================================
  // USERS
  // ============================================

  async createUser(user: Types.NewUser): Promise<Types.User> {
    const id = sqliteService.generateId();
    const now = new Date().toISOString();

    const fullUser: Types.User = {
      ...user,
      id,
      created_at: now,
      last_active: now,
      updated_at: now,
    };

    // Try online first
    if (this.isNetworkOnline()) {
      try {
        const { data, error } = await supabase
          .from('users')
          .insert(fullUser)
          .select()
          .maybeSingle();

        if (error) throw error;

        // Also save to SQLite
        this.saveUserToSQLite(data as Types.User);
        return data as Types.User;
      } catch (error) {
        console.error('Supabase createUser error:', error);
      }
    }

    // Fallback to SQLite
    this.saveUserToSQLite(fullUser);
    syncService.queueSync(id, 'users', id, 'INSERT', fullUser);
    return fullUser;
  }

  private saveUserToSQLite(user: Types.User): void {
    sqliteService.run(
      `INSERT OR REPLACE INTO users (
        id,
        username,
        password_hash,
        level,
        streak,
        total_points,
        profile_image,
        is_blocked,
        is_admin,
        securityquestions,      -- 👈 new column
        created_at,
        last_active,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.id,
        user.username,
        user.password_hash,
        user.level,
        user.streak,
        user.total_points,
        user.profile_image || null,
        sqliteService.boolToInt(user.is_blocked),
        sqliteService.boolToInt(user.is_admin),
        user.securityquestions
          ? JSON.stringify(user.securityquestions)
          : null,               // 👈 stringify here
        user.created_at,
        user.last_active,
        user.updated_at,
      ]
    );
  }


  async getUserById(id: string): Promise<Types.User | null> {
    // Try online first
    if (this.isNetworkOnline()) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (!error && data) {
          this.saveUserToSQLite(data as Types.User);
          return data as Types.User;
        }
      } catch (error) {
        console.error('Supabase getUserById error:', error);
      }
    }

    // Fallback to SQLite
    const user = sqliteService.queryOne<any>(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    if (!user) return null;

    return this.convertSQLiteUser(user);
  }

  /**
   * IMPORTANT: check Supabase first, then SQLite to avoid duplicate usernames
   */
  async getUserByUsername(username: string): Promise<Types.User | null> {
    // Normalize input
    username = username.trim().toLowerCase();

    // Try Supabase first
    if (this.isNetworkOnline()) {
      try {
        const { data, error, status } = await supabase
          .from('users')
          .select('*')
          .ilike('username', username)  // or .eq if you store lowercase
          .maybeSingle();              // ✅ important

        if (error) {
          console.error(
            'Supabase getUserByUsername error:',
            status,
            error.message
          );
        } else if (data) {
          this.saveUserToSQLite(data as Types.User);
          return data as Types.User;
        }
        // Fall through to SQLite if no data
      } catch (e) {
        console.error('Supabase getUserByUsername exception:', e);
        // Fall through to SQLite
      }
    }

    // SQLite fallback
    const row = sqliteService.queryOne<any>(
      'SELECT * FROM users WHERE LOWER(username) = LOWER(?)',
      [username]
    );
    if (!row) return null;

    return this.convertSQLiteUser(row);
  }


    async verifyCredentials(
      username: string,
      passwordHash: string
    ): Promise<Types.User | null> {
      // Try online first
      if (this.isNetworkOnline()) {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .eq('password_hash', passwordHash)
            .eq('is_blocked', false)
            .single();

          if (!error && data) {
            this.saveUserToSQLite(data as Types.User);
            return data as Types.User;
          }
        } catch (error) {
          console.error('Supabase verifyCredentials error:', error);
        }
      }

      // Fallback to SQLite
      const user = sqliteService.queryOne<any>(
        'SELECT * FROM users WHERE username = ? AND password_hash = ? AND is_blocked = 0',
        [username, passwordHash]
      );
      if (!user) return null;

      return this.convertSQLiteUser(user);
    }

  async updateUser(
    id: string,
    updates: Partial<Types.User>
  ): Promise<Types.User | null> {
    const now = new Date().toISOString();

    // Try online first
    if (this.isNetworkOnline()) {
      try {
        const { data, error } = await supabase
          .from('users')
          .update({ ...updates, updated_at: now })
          .eq('id', id)
          .select('*')
          .maybeSingle();          // ⬅️ was .single()

        if (error) {
          console.error('Supabase updateUser error:', error);
        } else if (data) {
          this.saveUserToSQLite(data as Types.User);
          return data as Types.User;
        }
        // if no data, fall through to SQLite
      } catch (error) {
        console.error('Supabase updateUser exception:', error);
        // fall through to SQLite
      }
    }

    // Offline / fallback SQLite update (unchanged)
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key === 'is_blocked' || key === 'is_admin') {
        updateFields.push(`${key} = ?`);
        updateValues.push(sqliteService.boolToInt(value as boolean));
      } else {
        updateFields.push(`${key} = ?`);
        updateValues.push(value);
      }
    });

    updateFields.push('updated_at = ?');
    updateValues.push(now);
    updateValues.push(id);

    sqliteService.run(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    syncService.queueSync(id, 'users', id, 'UPDATE', updates);

    const user = await this.getUserById(id);
    if (!user) {
      console.warn(
        'updateUser: user not found immediately after update, returning merged data'
      );
      return {
        id,
        ...(updates as any),
        updated_at: now,
      } as Types.User;
    }

    return user;
  }

  async deleteUser(id: string): Promise<void> {
    // Try online first
    if (this.isNetworkOnline()) {
      try {
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('id', id);

        if (!error) {
          sqliteService.run('DELETE FROM users WHERE id = ?', [id]);
          return;
        }
      } catch (error) {
        console.error('Supabase deleteUser error:', error);
      }
    }

    // Always delete from SQLite as well
    sqliteService.run('DELETE FROM users WHERE id = ?', [id]);
    sqliteService.run('DELETE FROM user_settings WHERE user_id = ?', [id]);
    syncService.queueSync(id, 'users', id, 'DELETE', null);

  }

  private convertSQLiteUser(row: any): Types.User {
    return {
      ...row,
      is_blocked: sqliteService.intToBool(row.is_blocked),
      is_admin: sqliteService.intToBool(row.is_admin),
      securityquestions: row.securityquestions
        ? JSON.parse(row.securityquestions)
        : [],                   // 👈 parse here
    } as Types.User;
  }


  // ============================================
  // QUIZ ATTEMPTS
  // ============================================

  async createQuizAttempt(
    attempt: Types.NewQuizAttempt
  ): Promise<Types.QuizAttempt> {
    const id = sqliteService.generateId();
    const now = new Date().toISOString();

    const fullAttempt: Types.QuizAttempt = {
      ...attempt,
      id,
      timestamp: now,
      created_at: now,
      synced: false,
    };

    // Try online first
    if (this.isNetworkOnline()) {
      try {
        const { data, error } = await supabase
          .from('quiz_attempts')
          .insert(fullAttempt)
          .select()
          .single();

        if (!error && data) {
          this.saveQuizAttemptToSQLite(data as Types.QuizAttempt);
          return data as Types.QuizAttempt;
        }
      } catch (error) {
        console.error('Supabase createQuizAttempt error:', error);
      }
    }

    // Fallback to SQLite
    this.saveQuizAttemptToSQLite(fullAttempt);
    syncService.queueSync(
      attempt.user_id,
      'quiz_attempts',
      id,
      'INSERT',
      fullAttempt
    );
    return fullAttempt;
  }

  private saveQuizAttemptToSQLite(attempt: Types.QuizAttempt): void {
    sqliteService.run(
      `INSERT OR REPLACE INTO quiz_attempts (id, user_id, quiz_type, quiz_title, total_questions, correct_answers, score, time_taken, answers, quizzes, timestamp, synced, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        attempt.id,
        attempt.user_id,
        attempt.quiz_type,
        attempt.quiz_title,
        attempt.total_questions,
        attempt.correct_answers,
        attempt.score,
        attempt.time_taken,
        JSON.stringify(attempt.answers),
        JSON.stringify(attempt.quizzes),
        attempt.timestamp,
        sqliteService.boolToInt(attempt.synced),
        attempt.created_at,
      ]
    );
  }

  async getQuizAttemptsByUser(userId: string): Promise<Types.QuizAttempt[]> {
    // Try online first
    if (this.isNetworkOnline()) {
      try {
        const { data, error } = await supabase
          .from('quiz_attempts')
          .select('*')
          .eq('user_id', userId)
          .order('timestamp', { ascending: false });

        if (!error && data) {
          (data as Types.QuizAttempt[]).forEach(a =>
            this.saveQuizAttemptToSQLite(a)
          );
          return data as Types.QuizAttempt[];
        }
      } catch (error) {
        console.error('Supabase getQuizAttemptsByUser error:', error);
      }
    }

    // Fallback to SQLite
    const attempts = sqliteService.query<any>(
      'SELECT * FROM quiz_attempts WHERE user_id = ? ORDER BY timestamp DESC',
      [userId]
    );

    return attempts.map(row => this.convertSQLiteQuizAttempt(row));
  }

  private convertSQLiteQuizAttempt(row: any): Types.QuizAttempt {
    return {
      ...row,
      answers: JSON.parse(row.answers || '{}'),
      quizzes: JSON.parse(row.quizzes || '[]'),
      synced: sqliteService.intToBool(row.synced),
    };
  }

  // ============================================
  // ACHIEVEMENTS
  // ============================================

  async initializeUserAchievements(userId: string): Promise<void> {
    const achievements = [
      {
        id: 'first_quiz',
        title: 'First Steps',
        description: 'Complete your first quiz',
        icon: '🎯',
        color: 'from-blue-400 to-blue-600',
        maxProgress: 0,
      },
      {
        id: 'perfect_score',
        title: 'Perfect Score',
        description: 'Score 100% on any quiz',
        icon: '💯',
        color: 'from-yellow-400 to-yellow-600',
        maxProgress: 0,
      },
      {
        id: 'quiz_master',
        title: 'Quiz Master',
        description: 'Complete all 6 quiz types',
        icon: '👑',
        color: 'from-purple-400 to-purple-600',
        maxProgress: 6,
      },
      {
        id: 'speed_demon',
        title: 'Speed Demon',
        description: 'Complete a quiz in under 5 minutes',
        icon: '⚡',
        color: 'from-orange-400 to-orange-600',
        maxProgress: 0,
      },
      {
        id: 'consistent_learner',
        title: 'Consistent Learner',
        description: 'Complete 5 quizzes',
        icon: '📚',
        color: 'from-green-400 to-green-600',
        maxProgress: 5,
      },
      {
        id: 'high_achiever',
        title: 'High Achiever',
        description: 'Score above 90% on 3 quizzes',
        icon: '⭐',
        color: 'from-pink-400 to-pink-600',
        maxProgress: 3,
      },
      {
        id: 'knowledge_seeker',
        title: 'Knowledge Seeker',
        description: 'Answer 50 questions correctly',
        icon: '🧠',
        color: 'from-indigo-400 to-indigo-600',
        maxProgress: 50,
      },
      {
        id: 'complete_challenge',
        title: 'Complete Challenge',
        description: 'Complete the General Knowledge quiz',
        icon: '🏆',
        color: 'from-rose-400 to-rose-600',
        maxProgress: 0,
      },
      {
        id: 'multiple_choice_expert',
        title: 'Multiple Choice Expert',
        description: 'Score 100% on 3 Multiple Choice quizzes',
        icon: '🔘',
        color: 'from-blue-400 to-blue-600',
        maxProgress: 3,
      },
      {
        id: 'dedication',
        title: 'Dedication',
        description: 'Complete 10 quizzes',
        icon: '🎖️',
        color: 'from-red-400 to-red-600',
        maxProgress: 10,
      },
    ];

      for (const ach of achievements) {
      const existing = await this.getUserAchievementByUserAndId(userId, ach.id);
      
      if (!existing) {
        // Only create if doesn't exist
        const achievement: Types.NewUserAchievement = {
          user_id: userId,
          achievement_id: ach.id,
          title: ach.title,
          description: ach.description,
          icon: ach.icon,
          unlocked: false,
          progress: 0,
          max_progress: ach.maxProgress,
          color: ach.color,
        };
        await this.createUserAchievement(achievement);
      }
    }
  }

  async createUserAchievement(
    achievement: Types.NewUserAchievement
  ): Promise<Types.UserAchievement> {
    const id = sqliteService.generateId();
    const now = new Date().toISOString();

    const fullAchievement: Types.UserAchievement = {
      ...achievement,
      id,
      created_at: now,
      updated_at: now,
    };

    // Try online first
    if (this.isNetworkOnline()) {
      try {
        const { data, error } = await supabase
          .from('user_achievements')
          .insert(fullAchievement)
          .select()
          .single();

        if (!error && data) {
          this.saveUserAchievementToSQLite(data as Types.UserAchievement);
          return data as Types.UserAchievement;
        }
      } catch (error) {
        console.error('Supabase createUserAchievement error:', error);
      }
    }

    // Fallback to SQLite
    this.saveUserAchievementToSQLite(fullAchievement);
    syncService.queueSync(
      achievement.user_id,
      'user_achievements',
      id,
      'INSERT',
      fullAchievement
    );
    return fullAchievement;
  }

  private saveUserAchievementToSQLite(achievement: Types.UserAchievement): void {
    sqliteService.run(
      `INSERT OR REPLACE INTO user_achievements (id, user_id, achievement_id, title, description, icon, unlocked, unlocked_at, progress, max_progress, color, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        achievement.id,
        achievement.user_id,
        achievement.achievement_id,
        achievement.title,
        achievement.description,
        achievement.icon,
        sqliteService.boolToInt(achievement.unlocked),
        achievement.unlocked_at || null,
        achievement.progress,
        achievement.max_progress,
        achievement.color,
        achievement.created_at,
        achievement.updated_at,
      ]
    );
  }

  async getUserAchievements(
    userId: string
  ): Promise<Types.UserAchievement[]> {
    // Try online first
    if (this.isNetworkOnline()) {
      try {
        const { data, error } = await supabase
          .from('user_achievements')
          .select('*')
          .eq('user_id', userId);

        if (!error && data) {
          (data as Types.UserAchievement[]).forEach(ach =>
            this.saveUserAchievementToSQLite(ach)
          );
          return data as Types.UserAchievement[];
        }
      } catch (error) {
        console.error('Supabase getUserAchievements error:', error);
      }
    }

    // Fallback to SQLite
    const achievements = sqliteService.query<any>(
      'SELECT * FROM user_achievements WHERE user_id = ?',
      [userId]
    );

    return achievements.map(row => this.convertSQLiteUserAchievement(row));
  }

  /** Check if specific achievement exists for user (prevents duplicates) */
  private async getUserAchievementByUserAndId(
    userId: string, 
    achievementId: string
  ): Promise<Types.UserAchievement | null> {
    if (this.isNetworkOnline()) {
      try {
        const { data, error } = await supabase
          .from('user_achievements')
          .select('*')
          .eq('user_id', userId)
          .eq('achievement_id', achievementId)
          .single();

        if (!error && data) {
          this.saveUserAchievementToSQLite(data as Types.UserAchievement);
          return data as Types.UserAchievement;
        }
      } catch (error) {
        console.error('Supabase getUserAchievementByUserAndId error:', error);
      }
    }

    // Fallback to SQLite
    const ach = sqliteService.queryOne<any>(
      'SELECT * FROM user_achievements WHERE user_id = ? AND achievement_id = ?',
      [userId, achievementId]
    );
    return ach ? this.convertSQLiteUserAchievement(ach) : null;
  }


  async updateUserAchievement(
    id: string,
    updates: Types.UpdateUserAchievement
  ): Promise<Types.UserAchievement> {
    const now = new Date().toISOString();

    // Try online first
    if (this.isNetworkOnline()) {
      try {
        const { data, error } = await supabase
          .from('user_achievements')
          .update({ ...updates, updated_at: now })
          .eq('id', id)
          .select()
          .single();

        if (!error && data) {
          this.saveUserAchievementToSQLite(data as Types.UserAchievement);
          return data as Types.UserAchievement;
        }
      } catch (error) {
        console.error('Supabase updateUserAchievement error:', error);
      }
    }

    // Fallback to SQLite
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key === 'unlocked') {
        updateFields.push(`${key} = ?`);
        updateValues.push(sqliteService.boolToInt(value as boolean));
      } else {
        updateFields.push(`${key} = ?`);
        updateValues.push(value);
      }
    });

    updateFields.push('updated_at = ?');
    updateValues.push(now);
    updateValues.push(id);

    sqliteService.run(
      `UPDATE user_achievements SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // Get user_id for sync
    const achievement = sqliteService.queryOne<any>(
      'SELECT user_id FROM user_achievements WHERE id = ?',
      [id]
    );
    if (achievement) {
      syncService.queueSync(
        achievement.user_id,
        'user_achievements',
        id,
        'UPDATE',
        updates
      );
    }

    const updated = sqliteService.queryOne<any>(
      'SELECT * FROM user_achievements WHERE id = ?',
      [id]
    );
    if (!updated) throw new Error('Achievement not found after update');
    return this.convertSQLiteUserAchievement(updated);
  }

  private convertSQLiteUserAchievement(row: any): Types.UserAchievement {
    return {
      ...row,
      unlocked: sqliteService.intToBool(row.unlocked),
    };
  }

  // ============================================
  // CUSTOM QUIZZES
  // ============================================

  async createCustomQuiz(
    quiz: Types.NewCustomQuiz
  ): Promise<Types.CustomQuiz> {
    const id = sqliteService.generateId();
    const now = new Date().toISOString();

    const fullQuiz: Types.CustomQuiz = {
      ...quiz,
      id,
      created_at: now,
      updated_at: now,
      synced: false,
    };

    if (this.isNetworkOnline()) {
      try {
        const { data, error } = await supabase
          .from('custom_quizzes')
          .insert(fullQuiz)
          .select()
          .single();

        if (!error && data) {
          this.saveCustomQuizToSQLite(data as Types.CustomQuiz);
          return data as Types.CustomQuiz;
        }
      } catch (error) {
        console.error('Supabase createCustomQuiz error:', error);
      }
    }

    this.saveCustomQuizToSQLite(fullQuiz);
    syncService.queueSync(quiz.user_id, 'custom_quizzes', id, 'INSERT', fullQuiz);
    return fullQuiz;
  }

  private saveCustomQuizToSQLite(quiz: Types.CustomQuiz): void {
    sqliteService.run(
      `INSERT OR REPLACE INTO custom_quizzes (id, user_id, title, description, category, tags, questions, synced, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        quiz.id,
        quiz.user_id,
        quiz.title,
        quiz.description || null,
        quiz.category || null,
        JSON.stringify(quiz.tags),
        JSON.stringify(quiz.questions),
        sqliteService.boolToInt(quiz.synced),
        quiz.created_at,
        quiz.updated_at,
      ]
    );
  }

  async getCustomQuizById(id: string): Promise<Types.CustomQuiz | null> {
    if (this.isNetworkOnline()) {
      try {
        const { data, error } = await supabase
          .from('custom_quizzes')
          .select('*')
          .eq('id', id)
          .single();

        if (!error && data) {
          this.saveCustomQuizToSQLite(data as Types.CustomQuiz);
          return data as Types.CustomQuiz;
        }
      } catch (error) {
        console.error('Supabase getCustomQuizById error:', error);
      }
    }

    const quiz = sqliteService.queryOne<any>(
      'SELECT * FROM custom_quizzes WHERE id = ?',
      [id]
    );
    if (!quiz) return null;
    return this.convertSQLiteCustomQuiz(quiz);
  }

  async updateCustomQuiz(
    id: string,
    updates: Types.UpdateCustomQuiz
  ): Promise<Types.CustomQuiz> {
    const now = new Date().toISOString();

    if (this.isNetworkOnline()) {
      try {
        const { data, error } = await supabase
          .from('custom_quizzes')
          .update({ ...updates, updated_at: now })
          .eq('id', id)
          .select()
          .single();

        if (!error && data) {
          this.saveCustomQuizToSQLite(data as Types.CustomQuiz);
          return data as Types.CustomQuiz;
        }
      } catch (error) {
        console.error('Supabase updateCustomQuiz error:', error);
      }
    }

    const updateFields: string[] = [];
    const updateValues: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key === 'tags' || key === 'questions') {
        updateFields.push(`${key} = ?`);
        updateValues.push(JSON.stringify(value));
      } else {
        updateFields.push(`${key} = ?`);
        updateValues.push(value);
      }
    });

    updateFields.push('updated_at = ?');
    updateValues.push(now);
    updateValues.push(id);

    sqliteService.run(
      `UPDATE custom_quizzes SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    const quiz = sqliteService.queryOne<any>(
      'SELECT user_id FROM custom_quizzes WHERE id = ?',
      [id]
    );
    if (quiz) {
      syncService.queueSync(quiz.user_id, 'custom_quizzes', id, 'UPDATE', updates);
    }

    const updated = await this.getCustomQuizById(id);
    if (!updated) throw new Error('Custom quiz not found after update');
    return updated;
  }

  async deleteCustomQuiz(id: string): Promise<void> {
    if (this.isNetworkOnline()) {
      try {
        const { error } = await supabase
          .from('custom_quizzes')
          .delete()
          .eq('id', id);

        if (!error) {
          sqliteService.run('DELETE FROM custom_quizzes WHERE id = ?', [id]);
          return;
        }
      } catch (error) {
        console.error('Supabase deleteCustomQuiz error:', error);
      }
    }

    const quiz = sqliteService.queryOne<any>(
      'SELECT user_id FROM custom_quizzes WHERE id = ?',
      [id]
    );
    sqliteService.run('DELETE FROM custom_quizzes WHERE id = ?', [id]);
    if (quiz) {
      syncService.queueSync(quiz.user_id, 'custom_quizzes', id, 'DELETE', null);
    }
  }

  private convertSQLiteCustomQuiz(row: any): Types.CustomQuiz {
    return {
      ...row,
      tags: JSON.parse(row.tags || '[]'),
      questions: JSON.parse(row.questions || '[]'),
      synced: sqliteService.intToBool(row.synced),
    };
  }

  // ============================================
  // NOTES
  // ============================================

  async createNote(note: Types.NewNote): Promise<Types.Note> {
    const id = sqliteService.generateId();
    const now = new Date().toISOString();

    const fullNote: Types.Note = {
      ...note,
      id,
      created_at: now,
      updated_at: now,
      synced: false,
    };

    if (this.isNetworkOnline()) {
      try {
        const { data, error } = await supabase
          .from('notes')
          .insert(fullNote)
          .select()
          .single();

        if (!error && data) {
          this.saveNoteToSQLite(data as Types.Note);
          return data as Types.Note;
        }
      } catch (error) {
        console.error('Supabase createNote error:', error);
      }
    }

    this.saveNoteToSQLite(fullNote);
    syncService.queueSync(note.user_id, 'notes', id, 'INSERT', fullNote);
    return fullNote;
  }

  private saveNoteToSQLite(note: Types.Note): void {
    sqliteService.run(
      `INSERT OR REPLACE INTO notes (id, user_id, title, content, color, synced, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        note.id,
        note.user_id,
        note.title,
        note.content,
        note.color,
        sqliteService.boolToInt(note.synced),
        note.created_at,
        note.updated_at,
      ]
    );
  }

  async updateNote(
    id: string,
    updates: Types.UpdateNote
  ): Promise<Types.Note> {
    const now = new Date().toISOString();

    if (this.isNetworkOnline()) {
      try {
        const { data, error } = await supabase
          .from('notes')
          .update({ ...updates, updated_at: now })
          .eq('id', id)
          .select()
          .single();

        if (!error && data) {
          this.saveNoteToSQLite(data as Types.Note);
          return data as Types.Note;
        }
      } catch (error) {
        console.error('Supabase updateNote error:', error);
      }
    }

    const updateFields = Object.keys(updates).map(k => `${k} = ?`);
    updateFields.push('updated_at = ?');
    const updateValues = [...Object.values(updates), now, id];

    sqliteService.run(
      `UPDATE notes SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    const note = sqliteService.queryOne<any>(
      'SELECT user_id FROM notes WHERE id = ?',
      [id]
    );
    if (note) {
      syncService.queueSync(note.user_id, 'notes', id, 'UPDATE', updates);
    }

    const updated = sqliteService.queryOne<any>(
      'SELECT * FROM notes WHERE id = ?',
      [id]
    );
    if (!updated) throw new Error('Note not found after update');
    return this.convertSQLiteNote(updated);
  }

  async deleteNote(id: string): Promise<void> {
    if (this.isNetworkOnline()) {
      try {
        const { error } = await supabase
          .from('notes')
          .delete()
          .eq('id', id);

        if (!error) {
          sqliteService.run('DELETE FROM notes WHERE id = ?', [id]);
          return;
        }
      } catch (error) {
        console.error('Supabase deleteNote error:', error);
      }
    }

    const note = sqliteService.queryOne<any>(
      'SELECT user_id FROM notes WHERE id = ?',
      [id]
    );
    sqliteService.run('DELETE FROM notes WHERE id = ?', [id]);
    if (note) {
      syncService.queueSync(note.user_id, 'notes', id, 'DELETE', null);
    }
  }

  private convertSQLiteNote(row: any): Types.Note {
    return {
      ...row,
      synced: sqliteService.intToBool(row.synced),
    };
  }

  // ============================================
  // TODOS
  // ============================================

  async createTodo(todo: Types.NewTodo): Promise<Types.Todo> {
    const id = sqliteService.generateId();
    const now = new Date().toISOString();

    const fullTodo: Types.Todo = {
      ...todo,
      id,
      created_at: now,
      updated_at: now,
      completed: false,
      synced: false,
    };

    if (this.isNetworkOnline()) {
      try {
        const { data, error } = await supabase
          .from('todos')
          .insert(fullTodo)
          .select()
          .single();

        if (!error && data) {
          this.saveTodoToSQLite(data as Types.Todo);
          return data as Types.Todo;
        }
      } catch (error) {
        console.error('Supabase createTodo error:', error);
      }
    }

    this.saveTodoToSQLite(fullTodo);
    syncService.queueSync(todo.user_id, 'todos', id, 'INSERT', fullTodo);
    return fullTodo;
  }

  private saveTodoToSQLite(todo: Types.Todo): void {
    sqliteService.run(
      `INSERT OR REPLACE INTO todos (id, user_id, title, description, completed, due_date, priority, color, synced, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        todo.id,
        todo.user_id,
        todo.title,
        todo.description || null,
        sqliteService.boolToInt(todo.completed),
        todo.due_date || null,
        todo.priority,
        todo.color,
        sqliteService.boolToInt(todo.synced),
        todo.created_at,
        todo.updated_at,
      ]
    );
  }

  async getTodosByUser(userId: string): Promise<Types.Todo[]> {
    if (this.isNetworkOnline()) {
      try {
        const { data, error } = await supabase
          .from('todos')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          (data as Types.Todo[]).forEach(todo => this.saveTodoToSQLite(todo));
          return data as Types.Todo[];
        }
      } catch (error) {
        console.error('Supabase getTodosByUser error:', error);
      }
    }

    const todos = sqliteService.query<any>(
      'SELECT * FROM todos WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    return todos.map(row => this.convertSQLiteTodo(row));
  }

  async updateTodo(
    id: string,
    updates: Types.UpdateTodo
  ): Promise<Types.Todo> {
    const now = new Date().toISOString();

    if (this.isNetworkOnline()) {
      try {
        const { data, error } = await supabase
          .from('todos')
          .update({ ...updates, updated_at: now })
          .eq('id', id)
          .select()
          .single();

        if (!error && data) {
          this.saveTodoToSQLite(data as Types.Todo);
          return data as Types.Todo;
        }
      } catch (error) {
        console.error('Supabase updateTodo error:', error);
      }
    }

    const updateFields: string[] = [];
    const updateValues: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key === 'completed') {
        updateFields.push(`${key} = ?`);
        updateValues.push(sqliteService.boolToInt(value as boolean));
      } else {
        updateFields.push(`${key} = ?`);
        updateValues.push(value);
      }
    });

    updateFields.push('updated_at = ?');
    updateValues.push(now);
    updateValues.push(id);

    sqliteService.run(
      `UPDATE todos SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    const todo = sqliteService.queryOne<any>(
      'SELECT user_id FROM todos WHERE id = ?',
      [id]
    );
    if (todo) {
      syncService.queueSync(todo.user_id, 'todos', id, 'UPDATE', updates);
    }

    const updated = sqliteService.queryOne<any>(
      'SELECT * FROM todos WHERE id = ?',
      [id]
    );
    if (!updated) throw new Error('Todo not found after update');
    return this.convertSQLiteTodo(updated);
  }

  async deleteTodo(id: string): Promise<void> {
    if (this.isNetworkOnline()) {
      try {
        const { error } = await supabase
          .from('todos')
          .delete()
          .eq('id', id);

        if (!error) {
          sqliteService.run('DELETE FROM todos WHERE id = ?', [id]);
          return;
        }
      } catch (error) {
        console.error('Supabase deleteTodo error:', error);
      }
    }

    const todo = sqliteService.queryOne<any>(
      'SELECT user_id FROM todos WHERE id = ?',
      [id]
    );
    sqliteService.run('DELETE FROM todos WHERE id = ?', [id]);
    if (todo) {
      syncService.queueSync(todo.user_id, 'todos', id, 'DELETE', null);
    }
  }

  private convertSQLiteTodo(row: any): Types.Todo {
    return {
      ...row,
      completed: sqliteService.intToBool(row.completed),
      synced: sqliteService.intToBool(row.synced),
    };
  }

  // ============================================
  // POMODORO SESSIONS
  // ============================================

  async createPomodoroSession(
    session: Types.NewPomodoroSession
  ): Promise<Types.PomodoroSession> {
    const id = sqliteService.generateId();
    const now = new Date().toISOString();

    const fullSession: Types.PomodoroSession = {
      ...session,
      id,
      created_at: now,
      synced: false,
    };

    if (this.isNetworkOnline()) {
      try {
        const { data, error } = await supabase
          .from('pomodoro_sessions')
          .insert(fullSession)
          .select()
          .single();

        if (!error && data) {
          this.savePomodoroSessionToSQLite(data as Types.PomodoroSession);
          return data as Types.PomodoroSession;
        }
      } catch (error) {
        console.error('Supabase createPomodoroSession error:', error);
      }
    }

    this.savePomodoroSessionToSQLite(fullSession);
    syncService.queueSync(
      session.user_id,
      'pomodoro_sessions',
      id,
      'INSERT',
      fullSession
    );
    return fullSession;
  }

  private savePomodoroSessionToSQLite(session: Types.PomodoroSession): void {
    sqliteService.run(
      `INSERT OR REPLACE INTO pomodoro_sessions (id, user_id, type, duration, completed_at, date, synced, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        session.id,
        session.user_id,
        session.type,
        session.duration,
        session.completed_at,
        session.date,
        sqliteService.boolToInt(session.synced),
        session.created_at,
      ]
    );
  }

  async getPomodoroSessionsByUser(
    userId: string
  ): Promise<Types.PomodoroSession[]> {
    if (this.isNetworkOnline()) {
      try {
        const { data, error } = await supabase
          .from('pomodoro_sessions')
          .select('*')
          .eq('user_id', userId)
          .order('completed_at', { ascending: false });

        if (!error && data) {
          (data as Types.PomodoroSession[]).forEach(session =>
            this.savePomodoroSessionToSQLite(session)
          );
          return data as Types.PomodoroSession[];
        }
      } catch (error) {
        console.error('Supabase getPomodoroSessionsByUser error:', error);
      }
    }

    const sessions = sqliteService.query<any>(
      'SELECT * FROM pomodoro_sessions WHERE user_id = ? ORDER BY completed_at DESC',
      [userId]
    );

    return sessions.map(row => this.convertSQLitePomodoroSession(row));
  }

  private convertSQLitePomodoroSession(row: any): Types.PomodoroSession {
    return {
      ...row,
      synced: sqliteService.intToBool(row.synced),
    };
  }

  // ============================================
  // POMODORO SETTINGS
  // ============================================

  async createPomodoroSettings(
    settings: Types.NewPomodoroSettings
  ): Promise<Types.PomodoroSettings> {
    const id = sqliteService.generateId();
    const now = new Date().toISOString();

    const fullSettings: Types.PomodoroSettings = {
      ...settings,
      id,
      created_at: now,
      updated_at: now,
    };

    if (this.isNetworkOnline()) {
      try {
        const { data, error } = await supabase
          .from('pomodoro_settings')
          .upsert(fullSettings, { onConflict: 'user_id' })  // 👈 upsert by user_id
          .select()
          .single();

        if (!error && data) {
          this.savePomodoroSettingsToSQLite(data as Types.PomodoroSettings);
          return data as Types.PomodoroSettings;
        }
      } catch (error) {
        console.error('Supabase createPomodoroSettings error:', error);
      }
    }

    this.savePomodoroSettingsToSQLite(fullSettings);
    syncService.queueSync(
      settings.user_id,
      'pomodoro_settings',
      id,
      'INSERT',
      fullSettings
    );
    return fullSettings;
  }

  private savePomodoroSettingsToSQLite(settings: Types.PomodoroSettings): void {
    sqliteService.run(
      `INSERT OR REPLACE INTO pomodoro_settings (id, user_id, work_duration, break_duration, long_break_duration, sessions_until_long_break, completed_cycles, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        settings.id,
        settings.user_id,
        settings.work_duration,
        settings.break_duration,
        settings.long_break_duration,
        settings.sessions_until_long_break,
        settings.completed_cycles,
        settings.created_at,
        settings.updated_at,
      ]
    );
  }

  async getPomodoroSettings(
    userId: string
  ): Promise<Types.PomodoroSettings | null> {
    if (this.isNetworkOnline()) {
      try {
        const { data, error } = await supabase
          .from('pomodoro_settings')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (!error && data) {
          this.savePomodoroSettingsToSQLite(data as Types.PomodoroSettings);
          return data as Types.PomodoroSettings;
        }
      } catch (error) {
        console.error('Supabase getPomodoroSettings error:', error);
      }
    }

    return sqliteService.queryOne<Types.PomodoroSettings>(
      'SELECT * FROM pomodoro_settings WHERE user_id = ?',
      [userId]
    );
  }

  async updatePomodoroSettings(
    userId: string,
    updates: Types.UpdatePomodoroSettings
  ): Promise<Types.PomodoroSettings> {
    const now = new Date().toISOString();

    if (this.isNetworkOnline()) {
      try {
        const { data, error } = await supabase
          .from('pomodoro_settings')
          .update({ ...updates, updated_at: now })
          .eq('user_id', userId)
          .select()
          .single();

        if (!error && data) {
          this.savePomodoroSettingsToSQLite(data as Types.PomodoroSettings);
          return data as Types.PomodoroSettings;
        }
      } catch (error) {
        console.error('Supabase updatePomodoroSettings error:', error);
      }
    }

    const updateFields = Object.keys(updates).map(k => `${k} = ?`);
    updateFields.push('updated_at = ?');
    const updateValues = [...Object.values(updates), now, userId];

    sqliteService.run(
      `UPDATE pomodoro_settings SET ${updateFields.join(
        ', '
      )} WHERE user_id = ?`,
      updateValues
    );

    const settings = sqliteService.queryOne<any>(
      'SELECT id FROM pomodoro_settings WHERE user_id = ?',
      [userId]
    );
    if (settings) {
      syncService.queueSync(
        userId,
        'pomodoro_settings',
        settings.id,
        'UPDATE',
        updates
      );
    }

    const updated = await this.getPomodoroSettings(userId);
    if (!updated) throw new Error('Pomodoro settings not found after update');
    return updated;
  }

  // ============================================
  // NOTIFICATIONS
  // ============================================

  async createNotification(
    notification: Types.NewNotification
  ): Promise<Types.Notification> {
    const id = sqliteService.generateId();
    const now = new Date().toISOString();

    const fullNotification: Types.Notification = {
      ...notification,
      id,
      timestamp: now,
      created_at: now,
      synced: false,
      read: false,
    };

    if (this.isNetworkOnline()) {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .insert(fullNotification)
          .select()
          .single();

        if (!error && data) {
          this.saveNotificationToSQLite(data as Types.Notification);
          return data as Types.Notification;
        }
      } catch (error) {
        console.error('Supabase createNotification error:', error);
      }
    }

    this.saveNotificationToSQLite(fullNotification);
    syncService.queueSync(
      notification.user_id,
      'notifications',
      id,
      'INSERT',
      fullNotification
    );
    return fullNotification;
  }

  private saveNotificationToSQLite(
    notification: Types.Notification
  ): void {
    sqliteService.run(
      `INSERT OR REPLACE INTO notifications (id, user_id, type, title, message, icon, read, metadata, synced, timestamp, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        notification.id,
        notification.user_id,
        notification.type,
        notification.title,
        notification.message,
        notification.icon || null,
        sqliteService.boolToInt(notification.read),
        JSON.stringify(notification.metadata),
        sqliteService.boolToInt(notification.synced),
        notification.timestamp,
        notification.created_at,
      ]
    );
  }

  async getNotificationsByUser(
    userId: string
  ): Promise<Types.Notification[]> {
    if (this.isNetworkOnline()) {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('timestamp', { ascending: false });

        if (!error && data) {
          (data as Types.Notification[]).forEach(notif =>
            this.saveNotificationToSQLite(notif)
          );
          return data as Types.Notification[];
        }
      } catch (error) {
        console.error('Supabase getNotificationsByUser error:', error);
      }
    }

    const notifications = sqliteService.query<any>(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY timestamp DESC',
      [userId]
    );

    return notifications.map(row => this.convertSQLiteNotification(row));
  }

  async updateNotification(
    id: string,
    updates: Types.UpdateNotification
  ): Promise<Types.Notification> {
    if (this.isNetworkOnline()) {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (!error && data) {
          this.saveNotificationToSQLite(data as Types.Notification);
          return data as Types.Notification;
        }
      } catch (error) {
        console.error('Supabase updateNotification error:', error);
      }
    }

    const updateFields: string[] = [];
    const updateValues: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key === 'read') {
        updateFields.push(`${key} = ?`);
        updateValues.push(sqliteService.boolToInt(value as boolean));
      } else if (key === 'metadata') {
        updateFields.push(`${key} = ?`);
        updateValues.push(JSON.stringify(value));
      } else {
        updateFields.push(`${key} = ?`);
        updateValues.push(value);
      }
    });

    updateValues.push(id);

    sqliteService.run(
      `UPDATE notifications SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    const notif = sqliteService.queryOne<any>(
      'SELECT user_id FROM notifications WHERE id = ?',
      [id]
    );
    if (notif) {
      syncService.queueSync(
        notif.user_id,
        'notifications',
        id,
        'UPDATE',
        updates
      );
    }

    const updated = sqliteService.queryOne<any>(
      'SELECT * FROM notifications WHERE id = ?',
      [id]
    );
    if (!updated) throw new Error('Notification not found after update');
    return this.convertSQLiteNotification(updated);
  }

  async deleteNotification(id: string): Promise<void> {
    if (this.isNetworkOnline()) {
      try {
        const { error } = await supabase
          .from('notifications')
          .delete()
          .eq('id', id);

        if (!error) {
          sqliteService.run('DELETE FROM notifications WHERE id = ?', [id]);
          return;
        }
      } catch (error) {
        console.error('Supabase deleteNotification error:', error);
      }
    }

    const notif = sqliteService.queryOne<any>(
      'SELECT user_id FROM notifications WHERE id = ?',
      [id]
    );
    sqliteService.run('DELETE FROM notifications WHERE id = ?', [id]);
    if (notif) {
      syncService.queueSync(
        notif.user_id,
        'notifications',
        id,
        'DELETE',
        null
      );
    }
  }

  private convertSQLiteNotification(row: any): Types.Notification {
    return {
      ...row,
      read: sqliteService.intToBool(row.read),
      metadata: JSON.parse(row.metadata || '{}'),
      synced: sqliteService.intToBool(row.synced),
    };
  }

  // ============================================
  // BUG REPORTS
  // ============================================

  async createBugReport(
    report: Types.NewBugReport
  ): Promise<Types.BugReport> {
    const id = sqliteService.generateId();
    const now = new Date().toISOString();

    const fullReport: Types.BugReport = {
      ...report,
      id,
      created_at: now,
      updated_at: now,
    };

    if (this.isNetworkOnline()) {
      try {
        const { data, error } = await supabase
          .from('bug_reports')
          .insert(fullReport)
          .select()
          .single();

        if (!error && data) {
          this.saveBugReportToSQLite(data as Types.BugReport);
          return data as Types.BugReport;
        }
      } catch (error) {
        console.error('Supabase createBugReport error:', error);
      }
    }

    this.saveBugReportToSQLite(fullReport);
    syncService.queueSync(report.user_id, 'bug_reports', id, 'INSERT', fullReport);
    return fullReport;
  }

  private saveBugReportToSQLite(report: Types.BugReport): void {
    sqliteService.run(
      `INSERT OR REPLACE INTO bug_reports (id, user_id, username, type, category, description, screenshot_count, screenshots, status, priority, platform, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        report.id,
        report.user_id,
        report.username,
        report.type,
        report.category || null,
        report.description,
        report.screenshot_count,
        JSON.stringify(report.screenshots),
        report.status,
        report.priority,
        JSON.stringify(report.platform),
        report.created_at,
        report.updated_at,
      ]
    );
  }

  async getAllBugReports(): Promise<Types.BugReport[]> {
    if (this.isNetworkOnline()) {
      try {
        const { data, error } = await supabase
          .from('bug_reports')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          (data as Types.BugReport[]).forEach(report =>
            this.saveBugReportToSQLite(report)
          );
          return data as Types.BugReport[];
        }
      } catch (error) {
        console.error('Supabase getAllBugReports error:', error);
      }
    }

    const reports = sqliteService.query<any>(
      'SELECT * FROM bug_reports ORDER BY created_at DESC'
    );

    return reports.map(row => this.convertSQLiteBugReport(row));
  }

  async updateBugReport(
    id: string,
    updates: Types.UpdateBugReport
  ): Promise<Types.BugReport> {
    const now = new Date().toISOString();

    if (this.isNetworkOnline()) {
      try {
        const { data, error } = await supabase
          .from('bug_reports')
          .update({ ...updates, updated_at: now })
          .eq('id', id)
          .select()
          .single();

        if (!error && data) {
          this.saveBugReportToSQLite(data as Types.BugReport);
          return data as Types.BugReport;
        }
      } catch (error) {
        console.error('Supabase updateBugReport error:', error);
      }
    }

    const updateFields: string[] = [];
    const updateValues: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key === 'screenshots' || key === 'platform') {
        updateFields.push(`${key} = ?`);
        updateValues.push(JSON.stringify(value));
      } else {
        updateFields.push(`${key} = ?`);
        updateValues.push(value);
      }
    });

    updateFields.push('updated_at = ?');
    updateValues.push(now);
    updateValues.push(id);

    sqliteService.run(
      `UPDATE bug_reports SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    const report = sqliteService.queryOne<any>(
      'SELECT user_id FROM bug_reports WHERE id = ?',
      [id]
    );
    if (report) {
      syncService.queueSync(
        report.user_id,
        'bug_reports',
        id,
        'UPDATE',
        updates
      );
    }

    const updated = sqliteService.queryOne<any>(
      'SELECT * FROM bug_reports WHERE id = ?',
      [id]
    );
    if (!updated) throw new Error('Bug report not found after update');
    return this.convertSQLiteBugReport(updated);
  }

  async deleteBugReport(id: string): Promise<void> {
    if (this.isNetworkOnline()) {
      try {
        const { error } = await supabase
          .from('bug_reports')
          .delete()
          .eq('id', id);

        if (!error) {
          sqliteService.run('DELETE FROM bug_reports WHERE id = ?', [id]);
          return;
        }
      } catch (error) {
        console.error('Supabase deleteBugReport error:', error);
      }
    }

    const report = sqliteService.queryOne<any>(
      'SELECT user_id FROM bug_reports WHERE id = ?',
      [id]
    );
    sqliteService.run('DELETE FROM bug_reports WHERE id = ?', [id]);
    if (report) {
      syncService.queueSync(
        report.user_id,
        'bug_reports',
        id,
        'DELETE',
        null
      );
    }
  }

  private convertSQLiteBugReport(row: any): Types.BugReport {
    return {
      ...row,
      screenshots: JSON.parse(row.screenshots || '[]'),
      platform: JSON.parse(row.platform || '{}'),
    };
  }

  // ============================================
  // ACTIVITY LOGS
  // ============================================

  async createActivityLog(
    log: Types.NewActivityLog
  ): Promise<Types.ActivityLog> {
    const id = sqliteService.generateId();
    const now = new Date().toISOString();

    const fullLog: Types.ActivityLog = {
      ...log,
      id,
      timestamp: now,
      created_at: now,
    };

    if (this.isNetworkOnline()) {
      try {
        const { data, error } = await supabase
          .from('activity_logs')
          .insert(fullLog)
          .select()
          .single();

        if (!error && data) {
          this.saveActivityLogToSQLite(data as Types.ActivityLog);
          return data as Types.ActivityLog;
        }
      } catch (error) {
        console.error('Supabase createActivityLog error:', error);
      }
    }

    this.saveActivityLogToSQLite(fullLog);
    // Activity logs don't need to be synced
    return fullLog;
  }

  private saveActivityLogToSQLite(log: Types.ActivityLog): void {
    sqliteService.run(
      `INSERT OR REPLACE INTO activity_logs (id, user_id, action, details, type, timestamp, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        log.id,
        log.user_id,
        log.action,
        log.details || null,
        log.type,
        log.timestamp,
        log.created_at,
      ]
    );
  }

  async getActivityLogsByUser(
    userId: string
  ): Promise<Types.ActivityLog[]> {
    if (this.isNetworkOnline()) {
      try {
        const { data, error } = await supabase
          .from('activity_logs')
          .select('*')
          .eq('user_id', userId)
          .order('timestamp', { ascending: false })
          .limit(100);

        if (!error && data) {
          (data as Types.ActivityLog[]).forEach(log =>
            this.saveActivityLogToSQLite(log)
          );
          return data as Types.ActivityLog[];
        }
      } catch (error) {
        console.error('Supabase getActivityLogsByUser error:', error);
      }
    }

    return sqliteService.query<Types.ActivityLog>(
      'SELECT * FROM activity_logs WHERE user_id = ? ORDER BY timestamp DESC LIMIT 100',
      [userId]
    );
  }

  // Get all activity logs (admin)
  async getAllActivityLogs(): Promise<Types.ActivityLog[]> {
    if (this.isNetworkOnline()) {
      try {
        const { data, error } = await supabase
          .from('activity_logs')
          .select('*')
          .order('timestamp', { ascending: false });

        if (!error && data) {
          (data as Types.ActivityLog[]).forEach((log) =>
            this.saveActivityLogToSQLite(log),
          );
          return data as Types.ActivityLog[];
        }
      } catch (error) {
        console.error('Supabase getAllActivityLogs error:', error);
      }
    }

    const logs = sqliteService.query(
      'SELECT * FROM activity_logs ORDER BY timestamp DESC',
    );
    return logs.map((row) => row as Types.ActivityLog);
  }

  // ============================================
  // APP SETTINGS
  // ============================================

  async getAppSettings(): Promise<Types.AppSettings | null> {
    if (this.isNetworkOnline()) {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('*')
          .limit(1)
          .single();

        if (!error && data) {
          this.saveAppSettingsToSQLite(data as Types.AppSettings);
          return data as Types.AppSettings;
        }
      } catch (error) {
        console.error('Supabase getAppSettings error:', error);
      }
    }

    const settings = sqliteService.queryOne<any>(
      'SELECT * FROM app_settings LIMIT 1'
    );
    if (!settings) return null;
    return this.convertSQLiteAppSettings(settings);
  }

  // **USER SETTINGS** - Matches EXACT Supabase user_settings table
  async getUserSettings(userId: string): Promise<any | null> {
    if (this.isNetworkOnline()) {
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('settings')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (!error && data) {
          // Cache in SQLite (exact mirror)
          this.saveUserSettingsToSQLite(userId, data.settings);
          return data.settings;
        }
      } catch (error) {
        console.error('Supabase getUserSettings error:', error);
      }
    }

    // Fallback to SQLite
    const row = sqliteService.queryOne<any>(`
      SELECT settings FROM user_settings WHERE user_id = ?
    `, [userId]);
    
    if (!row) return null;
    
    try {
      return JSON.parse(row.settings);
    } catch (e) {
      console.error('Error parsing local user_settings JSON:', e);
      return {};
    }
  }

  async updateUserSettings(userId: string, settings: any): Promise<void> {
    const now = new Date().toISOString();
    
    // ALWAYS write to SQLite first (offline-first)
    this.saveUserSettingsToSQLite(userId, settings, now);

    if (!this.isNetworkOnline()) {
      // FIXED: Use 'INSERT' instead of 'UPSERT'
      syncService.queueSync(userId, 'user_settings', userId, 'INSERT', {
        user_id: userId,
        settings,
        updated_at: now
      });
      return;
    }

    // Supabase UPSERT (matches your table exactly)
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({ 
          user_id: userId, 
          settings, 
          updated_at: now 
        });
      
      if (error) {
        console.error('Supabase updateUserSettings error:', error);
      }
    } catch (error) {
      console.error('Supabase updateUserSettings exception:', error);
    }
  }

  private saveUserSettingsToSQLite(userId: string, settings: any, updatedAt?: string): void {
    const now = updatedAt || new Date().toISOString();
    sqliteService.run(`
      INSERT OR REPLACE INTO user_settings (user_id, settings, updated_at) 
      VALUES (?, ?, ?)
    `, [
      userId,
      JSON.stringify(settings || {}),
      now
    ]);
  }



  private saveAppSettingsToSQLite(settings: Types.AppSettings): void {
    sqliteService.run(
      `INSERT OR REPLACE INTO app_settings (id, maintenance_mode, max_quizzes_per_day, allow_user_quiz_creation, enable_offline_mode, min_password_length, session_timeout, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        settings.id,
        sqliteService.boolToInt(settings.maintenance_mode),
        settings.max_quizzes_per_day,
        sqliteService.boolToInt(settings.allow_user_quiz_creation),
        sqliteService.boolToInt(settings.enable_offline_mode),
        settings.min_password_length,
        settings.session_timeout,
        settings.created_at,
        settings.updated_at,
      ]
    );
  }

  async updateAppSettings(settings: Types.AppSettings): Promise<void> {
    // 1) Always save to SQLite
    this.saveAppSettingsToSQLite(settings);

    // 2) If online, also upsert to Supabase
    if (this.isNetworkOnline()) {
      try {
        const { error } = await supabase
          .from('app_settings')
          .upsert({
            id: '11029dc6-2b60-461f-a727-3498f0c8d168',
            maintenance_mode: settings.maintenance_mode,
            max_quizzes_per_day: settings.max_quizzes_per_day,
            allow_user_quiz_creation: settings.allow_user_quiz_creation,
            enable_offline_mode: settings.enable_offline_mode,
            min_password_length: settings.min_password_length,
            session_timeout: settings.session_timeout,
            created_at: settings.created_at,
            updated_at: new Date().toISOString(),
          });

        if (error) {
          console.error('Supabase updateAppSettings error:', error);
        }
      } catch (e) {
        console.error('Supabase updateAppSettings exception:', e);
      }
    }
  }

  private convertSQLiteAppSettings(row: any): Types.AppSettings {
    return {
      ...row,
      maintenance_mode: sqliteService.intToBool(row.maintenance_mode),
      allow_user_quiz_creation: sqliteService.intToBool(
        row.allow_user_quiz_creation
      ),
      enable_offline_mode: sqliteService.intToBool(row.enable_offline_mode),
    };
  }

  // ============================================
  // ADMIN METHODS
  // ============================================

  // Note: Admin getAllUsers and deleteUser implementations are handled
  // by the primary user methods earlier in this class to avoid duplicates.
  // The helper below is kept for cascade deletes when needed.

  private deleteUserFromSQLite(userId: string): void {
    // Delete user and CASCADE delete related data
    sqliteService.run('DELETE FROM users WHERE id = ?', [userId]);
    sqliteService.run('DELETE FROM progress WHERE user_id = ?', [userId]);
    sqliteService.run('DELETE FROM todos WHERE user_id = ?', [userId]);
    sqliteService.run('DELETE FROM pomodoro_sessions WHERE user_id = ?', [
      userId,
    ]);
    sqliteService.run('DELETE FROM custom_quizzes WHERE user_id = ?', [
      userId,
    ]);
    sqliteService.run('DELETE FROM notifications WHERE user_id = ?', [userId]);
    sqliteService.run('DELETE FROM quiz_attempts WHERE user_id = ?', [userId]);
    sqliteService.run('DELETE FROM notes WHERE user_id = ?', [userId]);
    sqliteService.run('DELETE FROM activity_logs WHERE user_id = ?', [userId]);
    sqliteService.run('DELETE FROM user_achievements WHERE user_id = ?', [
      userId,
    ]);
    sqliteService.run('DELETE FROM pomodoro_settings WHERE user_id = ?', [
      userId,
    ]);
    sqliteService.run('DELETE FROM login_history WHERE user_id = ?', [userId]);
    sqliteService.run('DELETE FROM bug_reports WHERE user_id = ?', [userId]);
  }

  /**
   * Get quiz history (quiz_attempts) for a user
   */
  async getQuizHistory(userId: string): Promise<Types.QuizAttempt[]> {
    return this.getQuizAttemptsByUser(userId);
  }

  // ============================================
  // USER SETTINGS
  // ============================================


  async getAllUsers(): Promise<Types.User[]> {
    // Prefer Supabase when online
    if (this.isNetworkOnline()) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          (data as Types.User[]).forEach((u) => this.saveUserToSQLite(u));
          return data as Types.User[];
        }
      } catch (error) {
        console.error('Supabase getAllUsers error', error);
      }
    }

    // Fallback to local SQLite
    const rows = sqliteService.query<any>(
      'SELECT * FROM users ORDER BY created_at DESC'
    );

    return rows.map((row) => this.convertSQLiteUser(row));
  }


  // ============================================
  // LOGIN HISTORY
  // ============================================

  /**
   * Record a login for streak tracking
   */
  async recordLogin(userId: string, date: string): Promise<void> {
    const id = sqliteService.generateId();
    const now = new Date().toISOString();

    const loginRecord = {
      id,
      user_id: userId,
      login_date: date,
      created_at: now,
    };

    // Try online first
    if (this.isNetworkOnline()) {
      try {
        const { error } = await supabase
          .from('login_history')
          .insert(loginRecord);

        if (!error) {
          // Also save to SQLite
          sqliteService.run(
            `INSERT OR REPLACE INTO login_history (id, user_id, login_date, created_at)
             VALUES (?, ?, ?, ?)`,
            [id, userId, date, now]
          );
          return;
        }
      } catch (error) {
        console.error('Supabase recordLogin error:', error);
      }
    }

    // Fallback to SQLite
    sqliteService.run(
      `INSERT OR REPLACE INTO login_history (id, user_id, login_date, created_at)
       VALUES (?, ?, ?, ?)`,
      [id, userId, date, now]
    );
    syncService.queueSync(userId, 'login_history', id, 'INSERT', loginRecord);
  }

  /**
   * Get login history for a user
   */
  async getLoginHistory(
    userId: string
  ): Promise<
    { id: string; user_id: string; login_date: string; created_at: string }[]
  > {
    // Try online first
    if (this.isNetworkOnline()) {
      try {
        const { data, error } = await supabase
          .from('login_history')
          .select('*')
          .eq('user_id', userId)
          .order('login_date', { ascending: false });

        if (!error && data) {
          // Cache in SQLite
          (data as any[]).forEach(record => {
            sqliteService.run(
              `INSERT OR REPLACE INTO login_history (id, user_id, login_date, created_at)
               VALUES (?, ?, ?, ?)`,
              [record.id, record.user_id, record.login_date, record.created_at]
            );
          });
          return data as any[];
        }
      } catch (error) {
        console.error('Supabase getLoginHistory error:', error);
      }
    }

    // Fallback to SQLite
    return sqliteService.query<any>(
      'SELECT * FROM login_history WHERE user_id = ? ORDER BY login_date DESC',
      [userId]
    );
  }

  /**
   * Get user progress (consolidated from user table and achievements)
   */
  async getProgress(
    userId: string
  ): Promise<{
    total_points: number;
    level: number;
    streak: number;
    achievements: Types.UserAchievement[];
  }> {
    const user = await this.getUserById(userId);
    const achievements = await this.getUserAchievements(userId);

    return {
      total_points: user?.total_points || 0,
      level: user?.level || 1,
      streak: user?.streak || 0,
      achievements: achievements || [],
    };
  }

  /**
   * Update user progress (updates user table)
   */
  async updateProgress(
    userId: string,
    updates: {
      total_points?: number;
      level?: number;
      streak?: number;
    }
  ): Promise<void> {
    await this.updateUser(userId, updates as Types.UpdateUser);
  }

  /**
   * Alias for getTodosByUser (for consistency with calling code)
   */
  async getTodos(userId: string): Promise<Types.Todo[]> {
    return this.getTodosByUser(userId);
  }

  /**
   * Alias for getPomodoroSessionsByUser (for consistency with calling code)
   */
  async getPomodoroSessions(
    userId: string
  ): Promise<Types.PomodoroSession[]> {
    return this.getPomodoroSessionsByUser(userId);
  }

  /**
   * Get all custom quizzes (admin/analytics)
   */
  async getCustomQuizzes(): Promise<Types.CustomQuiz[]> {
    if (this.isNetworkOnline()) {
      try {
        const { data, error } = await supabase
          .from('custom_quizzes')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          (data as Types.CustomQuiz[]).forEach(quiz =>
            this.saveCustomQuizToSQLite(quiz)
          );
          return data as Types.CustomQuiz[];
        }
      } catch (error) {
        console.error('Supabase getCustomQuizzes error:', error);
      }
    }

    const quizzes = sqliteService.query(
      'SELECT * FROM custom_quizzes ORDER BY created_at DESC'
    );
    return quizzes.map(row => this.convertSQLiteCustomQuiz(row));
  }

  /**
   * Get all notes (admin/analytics)
   */
  async getNotes(): Promise<Types.Note[]> {
    if (this.isNetworkOnline()) {
      try {
        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          (data as Types.Note[]).forEach(note => this.saveNoteToSQLite(note));
          return data as Types.Note[];
        }
      } catch (error) {
        console.error('Supabase getNotes error:', error);
      }
    }

    const notes = sqliteService.query(
      'SELECT * FROM notes ORDER BY created_at DESC'
    );
    return notes.map(row => this.convertSQLiteNote(row));
  }

  /**
   * Get notes by user
   */
  async getNotesByUser(userId: string): Promise<Types.Note[]> {
    if (this.isNetworkOnline()) {
      try {
        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          (data as Types.Note[]).forEach(note => this.saveNoteToSQLite(note));
          return data as Types.Note[];
        }
      } catch (error) {
        console.error('Supabase getNotesByUser error:', error);
      }
    }

    const notes = sqliteService.query(
      'SELECT * FROM notes WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    return notes.map(row => this.convertSQLiteNote(row));
  }

  /**
   * Get custom quizzes by user
   */
  async getCustomQuizzesByUser(userId: string): Promise<Types.CustomQuiz[]> {
    if (this.isNetworkOnline()) {
      try {
        const { data, error } = await supabase
          .from('custom_quizzes')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          (data as Types.CustomQuiz[]).forEach(quiz =>
            this.saveCustomQuizToSQLite(quiz)
          );
          return data as Types.CustomQuiz[];
        }
      } catch (error) {
        console.error('Supabase getCustomQuizzesByUser error:', error);
      }
    }

    const quizzes = sqliteService.query(
      'SELECT * FROM custom_quizzes WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    return quizzes.map(row => this.convertSQLiteCustomQuiz(row));
  }

  
}



// Export singleton instance
export const db = new DatabaseService();

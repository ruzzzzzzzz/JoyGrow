// JoyGrow Database - Main Export File
export { db, DatabaseService } from './database-service';
export { sqliteService, SQLiteService } from './sqlite-service';
export { supabase, setSupabaseContext, clearSupabaseContext } from './supabase-client';
export { syncService } from './sync-service';
export { authService, AuthService } from './auth-service';
export * as Types from './types';

// Export types for convenience
export type {
  User,
  QuizAttempt,
  UserAchievement,
  CustomQuiz,
  Note,
  Todo,
  PomodoroSession,
  PomodoroSettings,
  Notification,
  BugReport,
  ActivityLog,
  AppSettings,
  SyncQueueItem,
  NewUser,
  NewQuizAttempt,
  NewUserAchievement,
  NewCustomQuiz,
  NewNote,
  NewTodo,
  NewPomodoroSession,
  NewPomodoroSettings,
  NewNotification,
  NewBugReport,
  NewActivityLog,
  NewSyncQueueItem,
  UpdateUser,
  UpdateQuizAttempt,
  UpdateUserAchievement,
  UpdateCustomQuiz,
  UpdateNote,
  UpdateTodo,
  UpdatePomodoroSettings,
  UpdateNotification,
  UpdateBugReport,
  UpdateAppSettings,
} from './types';

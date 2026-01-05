// JoyGrow Database TypeScript Types
// Shared types for both Supabase and SQLite


// 👈 NEW: Proper SecurityQuestion interface
export interface SecurityQuestion {
  question: string;
  answer: string; // hashed
}


export interface User {
  securityquestions?: SecurityQuestion[]; // 👈 Fixed: proper array type (optional)
  id: string;
  username: string;
  password_hash: string;
  level: number;
  streak: number;
  total_points: number;
  profile_image?: string;
  is_blocked: boolean;
  is_admin: boolean;
  created_at: string;
  last_active: string;
  updated_at: string;
}


export interface QuizAttempt {
  id: string;
  user_id: string;
  quiz_type: string;
  quiz_title: string;
  total_questions: number;
  correct_answers: number;
  score: number;
  time_taken: number;
  answers: Record<string, string | string[]>;
  quizzes: any[];
  timestamp: string;
  synced: boolean;
  created_at: string;
}


export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlocked_at?: string;
  progress: number;
  max_progress: number;
  color: string;
  created_at: string;
  updated_at: string;
}


export interface CustomQuiz {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category?: string;
  tags: string[];
  questions: any[];
  synced: boolean;
  created_at: string;
  updated_at: string;
}


export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  color: string;
  synced: boolean;
  created_at: string;
  updated_at: string;
}


export interface Todo {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  completed: boolean;
  due_date?: string;
  priority: 'low' | 'medium' | 'high';
  color: string;
  synced: boolean;
  created_at: string;
  updated_at: string;
}


export interface PomodoroSession {
  id: string;
  user_id: string;
  type: 'work' | 'break';
  duration: number;
  completed_at: string;
  date: string;
  synced: boolean;
  created_at: string;
}


export interface PomodoroSettings {
  id: string;
  user_id: string;
  work_duration: number;
  break_duration: number;
  long_break_duration: number;
  sessions_until_long_break: number;
  completed_cycles: number;
  created_at: string;
  updated_at: string;
}


export interface Notification {
  id: string;
  user_id: string;
  type: 'achievement' | 'quiz' | 'reminder' | 'streak' | 'level' | 'update';
  title: string;
  message: string;
  icon?: string;
  read: boolean;
  metadata: Record<string, any>;
  synced: boolean;
  timestamp: string;
  created_at: string;
}


export interface BugReport {
  id: string;
  user_id: string;
  username: string;
  type: string;
  category?: string;
  description: string;
  screenshot_count: number;
  screenshots: string[];
  status: 'pending' | 'in_progress' | 'resolved' | 'dismissed';
  priority: 'low' | 'normal' | 'high' | 'critical';
  platform: {
    userAgent: string;
    screenSize: string;
    viewport: string;
    language: string;
  };
  created_at: string;
  updated_at: string;
}


export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  details?: string;
  type: 'quiz' | 'achievement' | 'login' | 'study' | 'task' | 'other';
  timestamp: string;
  created_at: string;
}


export interface AppSettings {
  id: string;
  maintenance_mode: boolean;
  max_quizzes_per_day: number;
  allow_user_quiz_creation: boolean;
  enable_offline_mode: boolean;
  min_password_length: number;
  session_timeout: number;
  created_at: string;
  updated_at: string;
}


export interface SyncQueueItem {
  id: string;
  user_id: string;
  table_name: string;
  record_id: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  data?: any;
  synced: boolean;
  retry_count: number;
  last_error?: string;
  created_at: string;
  synced_at?: string;
}


// Helper type for creating new records (without generated fields)
export type NewUser = Omit<User, 'id' | 'created_at' | 'updated_at' | 'last_active'>;
export type NewQuizAttempt = Omit<QuizAttempt, 'id' | 'created_at' | 'timestamp'>;
export type NewUserAchievement = Omit<UserAchievement, 'id' | 'created_at' | 'updated_at'>;
export type NewCustomQuiz = Omit<CustomQuiz, 'id' | 'created_at' | 'updated_at'>;
export type NewNote = Omit<Note, 'id' | 'created_at' | 'updated_at'>;
export type NewTodo = Omit<Todo, 'id' | 'created_at' | 'updated_at'>;
export type NewPomodoroSession = Omit<PomodoroSession, 'id' | 'created_at'>;
export type NewPomodoroSettings = Omit<PomodoroSettings, 'id' | 'created_at' | 'updated_at'>;
export type NewNotification = Omit<Notification, 'id' | 'created_at' | 'timestamp'>;
export type NewBugReport = Omit<BugReport, 'id' | 'created_at' | 'updated_at'>;
export type NewActivityLog = Omit<ActivityLog, 'id' | 'created_at' | 'timestamp'>;
export type NewSyncQueueItem = Omit<SyncQueueItem, 'id' | 'created_at'>;


// Update types (partial updates)
export type UpdateUser = Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>;
export type UpdateQuizAttempt = Partial<Omit<QuizAttempt, 'id' | 'created_at' | 'user_id'>>;
export type UpdateUserAchievement = Partial<Omit<UserAchievement, 'id' | 'created_at' | 'user_id' | 'achievement_id'>>;
export type UpdateCustomQuiz = Partial<Omit<CustomQuiz, 'id' | 'created_at' | 'user_id'>>;
export type UpdateNote = Partial<Omit<Note, 'id' | 'created_at' | 'user_id'>>;
export type UpdateTodo = Partial<Omit<Todo, 'id' | 'created_at' | 'user_id'>>;
export type UpdatePomodoroSettings = Partial<Omit<PomodoroSettings, 'id' | 'created_at' | 'user_id'>>;
export type UpdateNotification = Partial<Omit<Notification, 'id' | 'created_at' | 'user_id'>>;
export type UpdateBugReport = Partial<Omit<BugReport, 'id' | 'created_at' | 'user_id'>>;
export type UpdateAppSettings = Partial<Omit<AppSettings, 'id' | 'created_at'>>;

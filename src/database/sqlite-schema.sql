-- JoyGrow SQLite Database Schema
-- This schema mirrors the Supabase PostgreSQL schema for offline use

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  level INTEGER DEFAULT 1,
  streak INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  profile_image TEXT,
  is_blocked INTEGER DEFAULT 0,
  is_admin INTEGER DEFAULT 0,
  securityquestions TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  last_active TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Create hardcoded admin account (password: JOYGROW3app3)
INSERT OR IGNORE INTO users (id, username, password_hash, is_admin, level, streak, total_points)
VALUES ('admin-001', 'admin123', '$2a$10$XvQ5Y7Z9w6Q8F4fR2cN5K.JK3L9vR8dN4wU7xT6sP5mH2jN9rM3qK', 1, 99, 999, 999999);

-- ============================================
-- 2. QUIZ ATTEMPTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  quiz_type TEXT NOT NULL,
  quiz_title TEXT NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  score INTEGER NOT NULL,
  time_taken INTEGER NOT NULL,
  answers TEXT NOT NULL DEFAULT '{}',
  quizzes TEXT NOT NULL DEFAULT '[]',
  timestamp TEXT DEFAULT (datetime('now')),
  synced INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- 3. ACHIEVEMENTS TABLE (User Progress)
-- ============================================
CREATE TABLE IF NOT EXISTS user_achievements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  achievement_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  unlocked INTEGER DEFAULT 0,
  unlocked_at TEXT,
  progress INTEGER DEFAULT 0,
  max_progress INTEGER DEFAULT 0,
  color TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, achievement_id)
);

-- ============================================
-- 4. CUSTOM QUIZZES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS custom_quizzes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  tags TEXT DEFAULT '[]',
  questions TEXT NOT NULL DEFAULT '[]',
  synced INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- 5. NOTES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  color TEXT DEFAULT 'bg-yellow-50 border-yellow-200',
  synced INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- 6. TODOS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS todos (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  completed INTEGER DEFAULT 0,
  due_date TEXT,
  priority TEXT DEFAULT 'medium',
  color TEXT DEFAULT 'bg-blue-50',
  synced INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- 7. POMODORO SESSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS pomodoro_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  duration INTEGER NOT NULL,
  completed_at TEXT NOT NULL,
  date TEXT NOT NULL,
  synced INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- 8. POMODORO SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS pomodoro_settings (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  work_duration INTEGER DEFAULT 25,
  break_duration INTEGER DEFAULT 5,
  long_break_duration INTEGER DEFAULT 15,
  sessions_until_long_break INTEGER DEFAULT 4,
  completed_cycles INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- 9. NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  icon TEXT,
  read INTEGER DEFAULT 0,
  metadata TEXT DEFAULT '{}',
  synced INTEGER DEFAULT 0,
  timestamp TEXT DEFAULT (datetime('now')),
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- 10. BUG REPORTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS bug_reports (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  type TEXT DEFAULT 'bug_report',
  category TEXT,
  description TEXT NOT NULL,
  screenshot_count INTEGER DEFAULT 0,
  screenshots TEXT DEFAULT '[]',
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'normal',
  platform TEXT NOT NULL DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- 11. ACTIVITY LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  type TEXT NOT NULL,
  timestamp TEXT DEFAULT (datetime('now')),
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- 12. APP SETTINGS TABLE (Admin Only)
-- ============================================
CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY,
  maintenance_mode INTEGER DEFAULT 0,
  max_quizzes_per_day INTEGER DEFAULT 100,
  allow_user_quiz_creation INTEGER DEFAULT 1,
  enable_offline_mode INTEGER DEFAULT 1,
  min_password_length INTEGER DEFAULT 6,
  session_timeout INTEGER DEFAULT 86400,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Insert default app settings
INSERT OR IGNORE INTO app_settings (id, maintenance_mode)
VALUES ('settings-001', 0);

-- ============================================
-- 13. LOGIN HISTORY TABLE (For Streak Tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS login_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  login_date TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, login_date)
);

-- ============================================
-- 14. SYNC QUEUE TABLE (For Offline Sync)
-- ============================================
CREATE TABLE IF NOT EXISTS sync_queue (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  data TEXT,
  synced INTEGER DEFAULT 0,
  retry_count INTEGER DEFAULT 0,
  last_error TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  synced_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User Settings Table - EXACT Supabase mirror
CREATE TABLE IF NOT EXISTS user_settings (
  user_id TEXT PRIMARY KEY,
  settings TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- ============================================
-- INDEXES
-- ============================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active);

-- Quiz attempts indexes
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_type ON quiz_attempts(quiz_type);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_timestamp ON quiz_attempts(timestamp);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_synced ON quiz_attempts(synced) WHERE synced = 0;

-- User achievements indexes
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);

-- Custom quizzes indexes
CREATE INDEX IF NOT EXISTS idx_custom_quizzes_user_id ON custom_quizzes(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_quizzes_category ON custom_quizzes(category);
CREATE INDEX IF NOT EXISTS idx_custom_quizzes_synced ON custom_quizzes(synced) WHERE synced = 0;

-- Notes indexes
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_synced ON notes(synced) WHERE synced = 0;

-- Todos indexes
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(completed);
CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);
CREATE INDEX IF NOT EXISTS idx_todos_synced ON todos(synced) WHERE synced = 0;

-- Pomodoro sessions indexes
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_user_id ON pomodoro_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_date ON pomodoro_sessions(date);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_synced ON pomodoro_sessions(synced) WHERE synced = 0;

-- Pomodoro settings indexes
CREATE INDEX IF NOT EXISTS idx_pomodoro_settings_user_id ON pomodoro_settings(user_id);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_timestamp ON notifications(timestamp);
CREATE INDEX IF NOT EXISTS idx_notifications_synced ON notifications(synced) WHERE synced = 0;

-- Bug reports indexes
CREATE INDEX IF NOT EXISTS idx_bug_reports_user_id ON bug_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_bug_reports_status ON bug_reports(status);

-- Activity logs indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp);

-- Login history indexes
CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_login_date ON login_history(login_date);

-- Sync queue indexes
CREATE INDEX IF NOT EXISTS idx_sync_queue_user_id ON sync_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_queue_synced ON sync_queue(synced) WHERE synced = 0;
CREATE INDEX IF NOT EXISTS idx_sync_queue_table_name ON sync_queue(table_name);

-- ============================================
-- TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- ============================================

CREATE TRIGGER IF NOT EXISTS trigger_users_updated_at
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
  UPDATE users SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trigger_custom_quizzes_updated_at
AFTER UPDATE ON custom_quizzes
FOR EACH ROW
BEGIN
  UPDATE custom_quizzes SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trigger_notes_updated_at
AFTER UPDATE ON notes
FOR EACH ROW
BEGIN
  UPDATE notes SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trigger_todos_updated_at
AFTER UPDATE ON todos
FOR EACH ROW
BEGIN
  UPDATE todos SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trigger_pomodoro_settings_updated_at
AFTER UPDATE ON pomodoro_settings
FOR EACH ROW
BEGIN
  UPDATE pomodoro_settings SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trigger_user_achievements_updated_at
AFTER UPDATE ON user_achievements
FOR EACH ROW
BEGIN
  UPDATE user_achievements SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trigger_bug_reports_updated_at
AFTER UPDATE ON bug_reports
FOR EACH ROW
BEGIN
  UPDATE bug_reports SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- ============================================
-- TRIGGERS FOR LAST ACTIVE UPDATE
-- ============================================

CREATE TRIGGER IF NOT EXISTS trigger_quiz_attempts_last_active
AFTER INSERT ON quiz_attempts
FOR EACH ROW
BEGIN
  UPDATE users SET last_active = datetime('now') WHERE id = NEW.user_id;
END;

CREATE TRIGGER IF NOT EXISTS trigger_notes_last_active
AFTER INSERT ON notes
FOR EACH ROW
BEGIN
  UPDATE users SET last_active = datetime('now') WHERE id = NEW.user_id;
END;

CREATE TRIGGER IF NOT EXISTS trigger_todos_last_active
AFTER INSERT ON todos
FOR EACH ROW
BEGIN
  UPDATE users SET last_active = datetime('now') WHERE id = NEW.user_id;
END;

CREATE TRIGGER IF NOT EXISTS trigger_pomodoro_sessions_last_active
AFTER INSERT ON pomodoro_sessions
FOR EACH ROW
BEGIN
  UPDATE users SET last_active = datetime('now') WHERE id = NEW.user_id;
END;

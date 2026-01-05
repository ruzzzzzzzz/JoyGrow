-- JoyGrow Database Indexes
-- This migration creates indexes for optimal query performance

-- ============================================
-- USERS TABLE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);
CREATE INDEX IF NOT EXISTS idx_users_is_blocked ON users(is_blocked);
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- ============================================
-- QUIZ ATTEMPTS TABLE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_type ON quiz_attempts(quiz_type);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_timestamp ON quiz_attempts(timestamp);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_timestamp ON quiz_attempts(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_synced ON quiz_attempts(synced) WHERE synced = FALSE;

-- ============================================
-- USER ACHIEVEMENTS TABLE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked ON user_achievements(unlocked);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_achievement ON user_achievements(user_id, achievement_id);

-- ============================================
-- CUSTOM QUIZZES TABLE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_custom_quizzes_user_id ON custom_quizzes(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_quizzes_category ON custom_quizzes(category);
CREATE INDEX IF NOT EXISTS idx_custom_quizzes_created_at ON custom_quizzes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_custom_quizzes_synced ON custom_quizzes(synced) WHERE synced = FALSE;
-- GIN index for tags array search
CREATE INDEX IF NOT EXISTS idx_custom_quizzes_tags ON custom_quizzes USING GIN(tags);

-- ============================================
-- NOTES TABLE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_synced ON notes(synced) WHERE synced = FALSE;

-- ============================================
-- TODOS TABLE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(completed);
CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);
CREATE INDEX IF NOT EXISTS idx_todos_priority ON todos(priority);
CREATE INDEX IF NOT EXISTS idx_todos_user_completed ON todos(user_id, completed);
CREATE INDEX IF NOT EXISTS idx_todos_synced ON todos(synced) WHERE synced = FALSE;

-- ============================================
-- POMODORO SESSIONS TABLE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_user_id ON pomodoro_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_date ON pomodoro_sessions(date DESC);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_type ON pomodoro_sessions(type);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_user_date ON pomodoro_sessions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_synced ON pomodoro_sessions(synced) WHERE synced = FALSE;

-- ============================================
-- POMODORO SETTINGS TABLE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_pomodoro_settings_user_id ON pomodoro_settings(user_id);

-- ============================================
-- NOTIFICATIONS TABLE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_timestamp ON notifications(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read) WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_synced ON notifications(synced) WHERE synced = FALSE;

-- ============================================
-- BUG REPORTS TABLE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_bug_reports_user_id ON bug_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_bug_reports_status ON bug_reports(status);
CREATE INDEX IF NOT EXISTS idx_bug_reports_priority ON bug_reports(priority);
CREATE INDEX IF NOT EXISTS idx_bug_reports_category ON bug_reports(category);
CREATE INDEX IF NOT EXISTS idx_bug_reports_created_at ON bug_reports(created_at DESC);

-- ============================================
-- ACTIVITY LOGS TABLE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON activity_logs(type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_timestamp ON activity_logs(user_id, timestamp DESC);

-- ============================================
-- LOGIN HISTORY TABLE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_login_date ON login_history(login_date DESC);
CREATE INDEX IF NOT EXISTS idx_login_history_user_date ON login_history(user_id, login_date DESC);

-- ============================================
-- SYNC QUEUE TABLE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_sync_queue_user_id ON sync_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_queue_synced ON sync_queue(synced) WHERE synced = FALSE;
CREATE INDEX IF NOT EXISTS idx_sync_queue_table_name ON sync_queue(table_name);
CREATE INDEX IF NOT EXISTS idx_sync_queue_created_at ON sync_queue(created_at);

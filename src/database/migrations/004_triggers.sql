-- JoyGrow Database Triggers
-- This migration creates triggers for automatic data management

-- ============================================
-- 1. AUTO-UPDATE TIMESTAMPS
-- ============================================
CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_custom_quizzes_updated_at
  BEFORE UPDATE ON custom_quizzes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_todos_updated_at
  BEFORE UPDATE ON todos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_pomodoro_settings_updated_at
  BEFORE UPDATE ON pomodoro_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_user_achievements_updated_at
  BEFORE UPDATE ON user_achievements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_bug_reports_updated_at
  BEFORE UPDATE ON bug_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2. AUTO-UPDATE USER LAST ACTIVE
-- ============================================
CREATE TRIGGER trigger_quiz_attempts_last_active
  AFTER INSERT ON quiz_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_user_last_active();

CREATE TRIGGER trigger_notes_last_active
  AFTER INSERT OR UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_user_last_active();

CREATE TRIGGER trigger_todos_last_active
  AFTER INSERT OR UPDATE ON todos
  FOR EACH ROW
  EXECUTE FUNCTION update_user_last_active();

CREATE TRIGGER trigger_pomodoro_sessions_last_active
  AFTER INSERT ON pomodoro_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_last_active();

-- ============================================
-- 3. AUTO-UPDATE USER POINTS AND ACHIEVEMENTS
-- ============================================
CREATE OR REPLACE FUNCTION process_quiz_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user points and level
  PERFORM update_user_points(NEW.user_id, NEW.correct_answers);
  
  -- Check and update achievements
  PERFORM check_and_update_achievements(
    NEW.user_id,
    NEW.quiz_type,
    NEW.score,
    NEW.time_taken,
    NEW.correct_answers
  );
  
  -- Update user streak
  UPDATE users
  SET streak = calculate_user_streak(NEW.user_id)
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_quiz_completion
  AFTER INSERT ON quiz_attempts
  FOR EACH ROW
  EXECUTE FUNCTION process_quiz_completion();

-- ============================================
-- 4. AUTO-INITIALIZE USER DATA
-- ============================================
CREATE OR REPLACE FUNCTION initialize_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Initialize default achievements for the new user
  PERFORM initialize_user_achievements(NEW.id);
  
  -- Initialize default pomodoro settings
  INSERT INTO pomodoro_settings (user_id)
  VALUES (NEW.id);
  
  -- Log user creation activity
  INSERT INTO activity_logs (user_id, action, details, type)
  VALUES (NEW.id, 'User Created', 'New user account created', 'login');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_initialize_new_user
  AFTER INSERT ON users
  FOR EACH ROW
  WHEN (NEW.is_admin = false)
  EXECUTE FUNCTION initialize_new_user();

-- ============================================
-- 5. AUTO-LOG ACTIVITY
-- ============================================
CREATE OR REPLACE FUNCTION log_quiz_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO activity_logs (user_id, action, details, type)
  VALUES (
    NEW.user_id,
    'Quiz Completed',
    format('Completed %s quiz: %s (Score: %s%%)', NEW.quiz_type, NEW.quiz_title, NEW.score),
    'quiz'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_quiz_activity
  AFTER INSERT ON quiz_attempts
  FOR EACH ROW
  EXECUTE FUNCTION log_quiz_activity();

CREATE OR REPLACE FUNCTION log_achievement_unlock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.unlocked = true AND (OLD.unlocked = false OR OLD.unlocked IS NULL) THEN
    INSERT INTO activity_logs (user_id, action, details, type)
    VALUES (
      NEW.user_id,
      'Achievement Unlocked',
      format('Unlocked achievement: %s', NEW.title),
      'achievement'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_achievement_unlock
  AFTER UPDATE ON user_achievements
  FOR EACH ROW
  EXECUTE FUNCTION log_achievement_unlock();

-- ============================================
-- 6. AUTO-CREATE NOTIFICATIONS
-- ============================================
CREATE OR REPLACE FUNCTION create_achievement_notification()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.unlocked = true AND (OLD.unlocked = false OR OLD.unlocked IS NULL) THEN
    INSERT INTO notifications (user_id, type, title, message, icon, metadata)
    VALUES (
      NEW.user_id,
      'achievement',
      '🎉 Achievement Unlocked!',
      format('Congratulations! You unlocked: %s - %s', NEW.title, NEW.description),
      NEW.icon,
      jsonb_build_object(
        'achievementId', NEW.achievement_id,
        'progress', NEW.progress,
        'maxProgress', NEW.max_progress
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_achievement_notification
  AFTER UPDATE ON user_achievements
  FOR EACH ROW
  EXECUTE FUNCTION create_achievement_notification();

CREATE OR REPLACE FUNCTION create_level_up_notification()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.level > OLD.level THEN
    INSERT INTO notifications (user_id, type, title, message, icon, metadata)
    VALUES (
      NEW.id,
      'level',
      '🎊 Level Up!',
      format('Awesome! You reached level %s!', NEW.level),
      '🎊',
      jsonb_build_object(
        'level', NEW.level,
        'points', NEW.total_points
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_level_up_notification
  AFTER UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_level_up_notification();

-- ============================================
-- 7. PREVENT ADMIN USER DELETION
-- ============================================
CREATE OR REPLACE FUNCTION prevent_admin_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_admin = true THEN
    RAISE EXCEPTION 'Cannot delete admin user';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_admin_deletion
  BEFORE DELETE ON users
  FOR EACH ROW
  EXECUTE FUNCTION prevent_admin_deletion();

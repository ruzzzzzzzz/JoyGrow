-- JoyGrow Database Functions
-- This migration creates reusable database functions

-- ============================================
-- 1. UPDATE TIMESTAMP FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. UPDATE USER LAST ACTIVE FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_user_last_active()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET last_active = NOW()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. CALCULATE USER STATS FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION calculate_user_stats(p_user_id UUID)
RETURNS TABLE (
  total_quizzes BIGINT,
  average_score NUMERIC,
  total_correct_answers BIGINT,
  quizzes_completed_today BIGINT,
  achievements_unlocked BIGINT,
  tasks_completed BIGINT,
  study_time_minutes BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM quiz_attempts WHERE user_id = p_user_id),
    (SELECT COALESCE(AVG(score), 0) FROM quiz_attempts WHERE user_id = p_user_id),
    (SELECT COALESCE(SUM(correct_answers), 0) FROM quiz_attempts WHERE user_id = p_user_id),
    (SELECT COUNT(*) FROM quiz_attempts 
     WHERE user_id = p_user_id 
     AND DATE(timestamp) = CURRENT_DATE),
    (SELECT COUNT(*) FROM user_achievements 
     WHERE user_id = p_user_id 
     AND unlocked = true),
    (SELECT COUNT(*) FROM todos 
     WHERE user_id = p_user_id 
     AND completed = true),
    (SELECT COALESCE(SUM(duration) / 60, 0) 
     FROM pomodoro_sessions 
     WHERE user_id = p_user_id 
     AND type = 'work');
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. GET USER STREAK FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION calculate_user_streak(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_streak INTEGER := 0;
  v_current_date DATE := CURRENT_DATE;
  v_check_date DATE := CURRENT_DATE;
  v_has_activity BOOLEAN;
BEGIN
  LOOP
    -- Check if user had any quiz activity on the check date
    SELECT EXISTS(
      SELECT 1 FROM quiz_attempts
      WHERE user_id = p_user_id
      AND DATE(timestamp) = v_check_date
    ) INTO v_has_activity;
    
    IF v_has_activity THEN
      v_streak := v_streak + 1;
      v_check_date := v_check_date - INTERVAL '1 day';
    ELSE
      -- If it's the current date and no activity, don't break streak yet
      IF v_check_date = CURRENT_DATE THEN
        v_check_date := v_check_date - INTERVAL '1 day';
        CONTINUE;
      ELSE
        EXIT;
      END IF;
    END IF;
  END LOOP;
  
  RETURN v_streak;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. UPDATE USER POINTS AND LEVEL FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_user_points(
  p_user_id UUID,
  p_correct_answers INTEGER
)
RETURNS VOID AS $$
DECLARE
  v_points_to_add INTEGER := p_correct_answers * 10;
  v_new_total_points INTEGER;
  v_new_level INTEGER;
BEGIN
  -- Add points
  UPDATE users
  SET total_points = total_points + v_points_to_add
  WHERE id = p_user_id
  RETURNING total_points INTO v_new_total_points;
  
  -- Calculate new level (300 points per level)
  v_new_level := FLOOR(v_new_total_points / 300.0) + 1;
  
  -- Update level
  UPDATE users
  SET level = v_new_level
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. INITIALIZE DEFAULT ACHIEVEMENTS FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION initialize_user_achievements(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_achievements (user_id, achievement_id, title, description, icon, color, max_progress)
  VALUES
    (p_user_id, 'first_quiz', 'First Steps', 'Complete your first quiz', '🎯', 'from-blue-400 to-blue-600', 0),
    (p_user_id, 'perfect_score', 'Perfect Score', 'Score 100% on any quiz', '💯', 'from-yellow-400 to-yellow-600', 0),
    (p_user_id, 'quiz_master', 'Quiz Master', 'Complete all 6 quiz types', '👑', 'from-purple-400 to-purple-600', 6),
    (p_user_id, 'speed_demon', 'Speed Demon', 'Complete a quiz in under 5 minutes', '⚡', 'from-orange-400 to-orange-600', 0),
    (p_user_id, 'consistent_learner', 'Consistent Learner', 'Complete 5 quizzes', '📚', 'from-green-400 to-green-600', 5),
    (p_user_id, 'high_achiever', 'High Achiever', 'Score above 90% on 3 quizzes', '⭐', 'from-pink-400 to-pink-600', 3),
    (p_user_id, 'knowledge_seeker', 'Knowledge Seeker', 'Answer 50 questions correctly', '🧠', 'from-indigo-400 to-indigo-600', 50),
    (p_user_id, 'complete_challenge', 'Complete Challenge', 'Complete the General Knowledge quiz', '🏆', 'from-rose-400 to-rose-600', 0),
    (p_user_id, 'multiple_choice_expert', 'Multiple Choice Expert', 'Score 100% on 3 Multiple Choice quizzes', '🔘', 'from-blue-400 to-blue-600', 3),
    (p_user_id, 'dedication', 'Dedication', 'Complete 10 quizzes', '🎖️', 'from-red-400 to-red-600', 10)
  ON CONFLICT (user_id, achievement_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. CHECK AND UPDATE ACHIEVEMENTS FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION check_and_update_achievements(
  p_user_id UUID,
  p_quiz_type VARCHAR,
  p_score INTEGER,
  p_time_taken INTEGER,
  p_correct_answers INTEGER
)
RETURNS VOID AS $$
DECLARE
  v_total_quizzes INTEGER;
  v_high_scores INTEGER;
  v_total_correct INTEGER;
  v_mc_perfect INTEGER;
  v_unique_types INTEGER;
BEGIN
  -- Get current stats
  SELECT COUNT(*) INTO v_total_quizzes FROM quiz_attempts WHERE user_id = p_user_id;
  SELECT COUNT(*) INTO v_high_scores FROM quiz_attempts WHERE user_id = p_user_id AND score >= 90;
  SELECT SUM(correct_answers) INTO v_total_correct FROM quiz_attempts WHERE user_id = p_user_id;
  SELECT COUNT(*) INTO v_mc_perfect FROM quiz_attempts WHERE user_id = p_user_id AND quiz_type = 'multiple_choice' AND score = 100;
  SELECT COUNT(DISTINCT quiz_type) INTO v_unique_types FROM quiz_attempts WHERE user_id = p_user_id;
  
  -- First quiz
  UPDATE user_achievements
  SET unlocked = true, unlocked_at = NOW()
  WHERE user_id = p_user_id AND achievement_id = 'first_quiz' AND NOT unlocked AND v_total_quizzes >= 1;
  
  -- Perfect score
  UPDATE user_achievements
  SET unlocked = true, unlocked_at = NOW()
  WHERE user_id = p_user_id AND achievement_id = 'perfect_score' AND NOT unlocked AND p_score = 100;
  
  -- Quiz master
  UPDATE user_achievements
  SET progress = v_unique_types, unlocked = (v_unique_types >= 6), unlocked_at = CASE WHEN v_unique_types >= 6 THEN NOW() ELSE unlocked_at END
  WHERE user_id = p_user_id AND achievement_id = 'quiz_master';
  
  -- Speed demon
  UPDATE user_achievements
  SET unlocked = true, unlocked_at = NOW()
  WHERE user_id = p_user_id AND achievement_id = 'speed_demon' AND NOT unlocked AND p_time_taken < 300;
  
  -- Consistent learner
  UPDATE user_achievements
  SET progress = v_total_quizzes, unlocked = (v_total_quizzes >= 5), unlocked_at = CASE WHEN v_total_quizzes >= 5 THEN NOW() ELSE unlocked_at END
  WHERE user_id = p_user_id AND achievement_id = 'consistent_learner';
  
  -- High achiever
  UPDATE user_achievements
  SET progress = v_high_scores, unlocked = (v_high_scores >= 3), unlocked_at = CASE WHEN v_high_scores >= 3 THEN NOW() ELSE unlocked_at END
  WHERE user_id = p_user_id AND achievement_id = 'high_achiever';
  
  -- Knowledge seeker
  UPDATE user_achievements
  SET progress = COALESCE(v_total_correct, 0), unlocked = (COALESCE(v_total_correct, 0) >= 50), unlocked_at = CASE WHEN COALESCE(v_total_correct, 0) >= 50 THEN NOW() ELSE unlocked_at END
  WHERE user_id = p_user_id AND achievement_id = 'knowledge_seeker';
  
  -- Complete challenge
  UPDATE user_achievements
  SET unlocked = true, unlocked_at = NOW()
  WHERE user_id = p_user_id AND achievement_id = 'complete_challenge' AND NOT unlocked AND p_quiz_type = 'all_types';
  
  -- Multiple choice expert
  UPDATE user_achievements
  SET progress = v_mc_perfect, unlocked = (v_mc_perfect >= 3), unlocked_at = CASE WHEN v_mc_perfect >= 3 THEN NOW() ELSE unlocked_at END
  WHERE user_id = p_user_id AND achievement_id = 'multiple_choice_expert';
  
  -- Dedication
  UPDATE user_achievements
  SET progress = v_total_quizzes, unlocked = (v_total_quizzes >= 10), unlocked_at = CASE WHEN v_total_quizzes >= 10 THEN NOW() ELSE unlocked_at END
  WHERE user_id = p_user_id AND achievement_id = 'dedication';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. HASH PASSWORD FUNCTION (Basic - Use bcrypt in app layer)
-- ============================================
CREATE OR REPLACE FUNCTION hash_password(password TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Note: In production, use bcrypt in application layer
  -- This is a placeholder for the schema
  RETURN password;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. VERIFY USER CREDENTIALS FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION verify_user_credentials(
  p_username VARCHAR,
  p_password_hash TEXT
)
RETURNS TABLE (
  user_id UUID,
  username VARCHAR,
  is_admin BOOLEAN,
  is_blocked BOOLEAN,
  level INTEGER,
  streak INTEGER,
  total_points INTEGER,
  profile_image TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.username,
    u.is_admin,
    u.is_blocked,
    u.level,
    u.streak,
    u.total_points,
    u.profile_image
  FROM users u
  WHERE u.username = p_username
    AND u.password_hash = p_password_hash
    AND u.is_blocked = false;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 10. GET ADMIN STATS FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS TABLE (
  total_users BIGINT,
  active_users BIGINT,
  total_quizzes BIGINT,
  quizzes_completed_today BIGINT,
  new_users_this_week BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM users WHERE is_admin = false),
    (SELECT COUNT(*) FROM users WHERE is_admin = false AND last_active >= NOW() - INTERVAL '7 days'),
    (SELECT COUNT(*) FROM quiz_attempts),
    (SELECT COUNT(*) FROM quiz_attempts WHERE DATE(timestamp) = CURRENT_DATE),
    (SELECT COUNT(*) FROM users WHERE is_admin = false AND created_at >= NOW() - INTERVAL '7 days');
END;
$$ LANGUAGE plpgsql;

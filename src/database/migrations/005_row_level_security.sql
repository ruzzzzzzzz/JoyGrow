-- ================================
-- 1) DROP ALL EXISTING POLICIES
-- ================================

drop policy if exists users_select_own       on public.users;
drop policy if exists users_update_own       on public.users;
drop policy if exists users_insert_admin     on public.users;
drop policy if exists users_delete_admin     on public.users;

drop policy if exists quiz_attempts_select   on public.quiz_attempts;
drop policy if exists quiz_attempts_insert   on public.quiz_attempts;
drop policy if exists quiz_attempts_update   on public.quiz_attempts;
drop policy if exists quiz_attempts_delete   on public.quiz_attempts;

drop policy if exists user_achievements_select on public.user_achievements;
drop policy if exists user_achievements_insert on public.user_achievements;
drop policy if exists user_achievements_update on public.user_achievements;
drop policy if exists user_achievements_delete on public.user_achievements;

drop policy if exists custom_quizzes_select  on public.custom_quizzes;
drop policy if exists custom_quizzes_insert  on public.custom_quizzes;
drop policy if exists custom_quizzes_update  on public.custom_quizzes;
drop policy if exists custom_quizzes_delete  on public.custom_quizzes;

drop policy if exists notes_select           on public.notes;
drop policy if exists notes_insert           on public.notes;
drop policy if exists notes_update           on public.notes;
drop policy if exists notes_delete           on public.notes;

drop policy if exists todos_select           on public.todos;
drop policy if exists todos_insert           on public.todos;
drop policy if exists todos_update           on public.todos;
drop policy if exists todos_delete           on public.todos;

drop policy if exists pomodoro_sessions_select on public.pomodoro_sessions;
drop policy if exists pomodoro_sessions_insert on public.pomodoro_sessions;
drop policy if exists pomodoro_sessions_update on public.pomodoro_sessions;
drop policy if exists pomodoro_sessions_delete on public.pomodoro_sessions;

drop policy if exists pomodoro_settings_select on public.pomodoro_settings;
drop policy if exists pomodoro_settings_insert on public.pomodoro_settings;
drop policy if exists pomodoro_settings_update on public.pomodoro_settings;
drop policy if exists pomodoro_settings_delete on public.pomodoro_settings;

drop policy if exists notifications_select   on public.notifications;
drop policy if exists notifications_insert   on public.notifications;
drop policy if exists notifications_update   on public.notifications;
drop policy if exists notifications_delete   on public.notifications;

drop policy if exists bug_reports_select     on public.bug_reports;
drop policy if exists bug_reports_insert     on public.bug_reports;
drop policy if exists bug_reports_update     on public.bug_reports;
drop policy if exists bug_reports_delete     on public.bug_reports;

drop policy if exists activity_logs_select   on public.activity_logs;
drop policy if exists activity_logs_insert   on public.activity_logs;
drop policy if exists activity_logs_update   on public.activity_logs;
drop policy if exists activity_logs_delete   on public.activity_logs;

drop policy if exists app_settings_select    on public.app_settings;
drop policy if exists app_settings_insert    on public.app_settings;
drop policy if exists app_settings_update    on public.app_settings;
drop policy if exists app_settings_delete    on public.app_settings;

drop policy if exists sync_queue_select      on public.sync_queue;
drop policy if exists sync_queue_insert      on public.sync_queue;
drop policy if exists sync_queue_update      on public.sync_queue;
drop policy if exists sync_queue_delete      on public.sync_queue;


-- ================================
-- 2) ENABLE RLS ON TABLES
--    (safe even if already enabled)
-- ================================

alter table public.users              enable row level security;
alter table public.quiz_attempts      enable row level security;
alter table public.user_achievements  enable row level security;
alter table public.custom_quizzes     enable row level security;
alter table public.notes              enable row level security;
alter table public.todos              enable row level security;
alter table public.pomodoro_sessions  enable row level security;
alter table public.pomodoro_settings  enable row level security;
alter table public.notifications      enable row level security;
alter table public.bug_reports        enable row level security;
alter table public.activity_logs      enable row level security;
alter table public.app_settings       enable row level security;
alter table public.sync_queue         enable row level security;


-- ================================
-- 3) NEW SIMPLE POLICIES
-- ================================

-- USERS: table‑based auth, all via anon

create policy "Anon can register users"
on public.users
for insert
to anon
with check (true);

create policy "Anon can read usernames"
on public.users
for select
to anon
using (true);

create policy "Anon can update users"
on public.users
for update
to anon
using (true)
with check (true);

create policy "Anon can delete users"
on public.users
for delete
to anon
using (true);


-- Helper macro: for per‑user tables you currently treat as fully open.
-- (We repeat manually because SQL doesn’t support macros here.)

-- QUIZ ATTEMPTS
create policy "Anon full access quiz_attempts"
on public.quiz_attempts
for all
to anon
using (true)
with check (true);

-- USER ACHIEVEMENTS
create policy "Anon full access user_achievements"
on public.user_achievements
for all
to anon
using (true)
with check (true);

-- CUSTOM QUIZZES
create policy "Anon full access custom_quizzes"
on public.custom_quizzes
for all
to anon
using (true)
with check (true);

-- NOTES
create policy "Anon full access notes"
on public.notes
for all
to anon
using (true)
with check (true);

-- TODOS
create policy "Anon full access todos"
on public.todos
for all
to anon
using (true)
with check (true);

-- POMODORO SESSIONS
create policy "Anon full access pomodoro_sessions"
on public.pomodoro_sessions
for all
to anon
using (true)
with check (true);

-- POMODORO SETTINGS
create policy "Anon full access pomodoro_settings"
on public.pomodoro_settings
for all
to anon
using (true)
with check (true);

-- NOTIFICATIONS
create policy "Anon full access notifications"
on public.notifications
for all
to anon
using (true)
with check (true);

-- BUG REPORTS
create policy "Anon full access bug_reports"
on public.bug_reports
for all
to anon
using (true)
with check (true);

-- ACTIVITY LOGS
create policy "Anon full access activity_logs"
on public.activity_logs
for all
to anon
using (true)
with check (true);

-- SYNC QUEUE
create policy "Anon full access sync_queue"
on public.sync_queue
for all
to anon
using (true)
with check (true);

-- APP SETTINGS: readable by everyone, write‑protected

create policy "Anyone can read app_settings"
on public.app_settings
for select
to anon
using (true);

create policy "No anon writes to app_settings"
on public.app_settings
for all
to anon
using (false);

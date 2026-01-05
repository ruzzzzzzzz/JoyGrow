import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useRef,
} from 'react';
import { useUser } from './UserContext';
import { useNotifications } from './NotificationContext';
import { db } from '../database';
import { toast } from 'sonner';

export interface PomodoroSession {
  id: string;
  type: 'work' | 'break';
  duration: number; // in seconds
  completedAt: number;
  date: string;
}

export interface PomodoroSettings {
  workDuration: number; // in minutes
  breakDuration: number; // in minutes
  longBreakDuration: number; // in minutes
  sessionsUntilLongBreak: number;
}

interface PomodoroContextType {
  timeLeft: number;
  isRunning: boolean;
  currentMode: 'work' | 'break';
  sessions: PomodoroSession[];
  completedCycles: number;
  settings: PomodoroSettings;
  toggleTimer: () => void;
  resetTimer: () => void;
  switchMode: (mode: 'work' | 'break') => void;
  updateSettings: (newSettings: PomodoroSettings) => void;
  getTotalDuration: () => number;
  getProgress: () => number;
  formatTime: (seconds: number) => string;
}

const PomodoroContext = createContext<PomodoroContextType | undefined>(undefined);

export function PomodoroProvider({ children }: { children: ReactNode }) {
  const userContext = useUser();
  const { getUserStorageKey, currentUser } =
    userContext || { getUserStorageKey: (key: string) => key, currentUser: null };
  const { addNotification } = useNotifications();

  const [settings, setSettings] = useState<PomodoroSettings>({
    workDuration: 25,
    breakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4,
  });

  const [timeLeft, setTimeLeft] = useState(() => 25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [currentMode, setCurrentMode] = useState<'work' | 'break'>('work');
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [completedCycles, setCompletedCycles] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerStartTimeRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(Date.now());

  // Handle timer completion (must be declared before effects that use it)
  const handleTimerComplete = useCallback(async () => {
    setIsRunning(false);
    timerStartTimeRef.current = null;

    // Save session to database
    if (currentUser) {
      try {
        const completedDate = new Date();
        await db.createPomodoroSession({
          user_id: currentUser.id,
          type: currentMode,
          duration:
            currentMode === 'work'
              ? settings.workDuration * 60
              : settings.breakDuration * 60,
          completed_at: completedDate.toISOString(),
          date: completedDate.toISOString().split('T')[0],
          synced: false,
        });
      } catch (error) {
        console.error('Error saving pomodoro session:', error);
      }
    }

    const session: PomodoroSession = {
      id: `session_${Date.now()}`,
      type: currentMode,
      duration:
        currentMode === 'work'
          ? settings.workDuration * 60
          : settings.breakDuration * 60,
      completedAt: Date.now(),
      date: new Date().toISOString().split('T')[0],
    };

    const updatedSessions = [session, ...sessions];
    setSessions(updatedSessions);

    if (currentMode === 'work') {
      const newCycles = completedCycles + 1;
      setCompletedCycles(newCycles);

      // Update completed cycles in database
      if (currentUser) {
        try {
          await db.updatePomodoroSettings(currentUser.id, {
            completed_cycles: newCycles,
          });
        } catch (error) {
          console.error('Error updating pomodoro cycles:', error);
        }
      }

      // Notifications
      toast.success('🎉 Focus session completed! Automatically switching to break time...', {
        duration: 5000,
      });

      addNotification({
        type: 'reminder',
        title: '🎉 Focus Session Complete!',
        message:
          'Great job! You completed a focus session. Automatically starting break time!',
        icon: '🧠',
      });

      // Switch to break mode and auto-start
      const isLongBreak = newCycles % settings.sessionsUntilLongBreak === 0;
      const breakTime = isLongBreak ? settings.longBreakDuration : settings.breakDuration;
      setTimeLeft(breakTime * 60);
      setCurrentMode('break');

      const breakMessage = isLongBreak
        ? `Auto-starting long break for ${settings.longBreakDuration} minutes`
        : `Auto-starting short break for ${settings.breakDuration} minutes`;

      toast.info(breakMessage, { duration: 4000 });

      addNotification({
        type: 'reminder',
        title: isLongBreak ? '☕ Long Break Started!' : '☕ Break Started!',
        message: breakMessage,
        icon: '☕',
      });

      // Auto-start break timer
      setTimeout(() => {
        setIsRunning(true);
        timerStartTimeRef.current = Date.now();
      }, 100);
    } else {
      toast.success('Break time over! Automatically switching to focus time...', {
        duration: 4000,
      });

      addNotification({
        type: 'reminder',
        title: '🧠 Focus Time Started!',
        message: 'Your break is over. Automatically starting another focus session!',
        icon: '🧠',
      });

      setTimeLeft(settings.workDuration * 60);
      setCurrentMode('work');

      // Auto-start work timer
      setTimeout(() => {
        setIsRunning(true);
        timerStartTimeRef.current = Date.now();
      }, 100);
    }
  }, [currentMode, settings, completedCycles, sessions, currentUser, addNotification]);

  // Load user-specific data from database
  useEffect(() => {
    const loadData = async () => {
      if (currentUser) {
        try {
          // Load sessions from database
          const dbSessions = await db.getPomodoroSessionsByUser(currentUser.id);
          const mappedSessions: PomodoroSession[] = dbSessions.map((session: any) => ({
            id: session.id,
            type: session.type,
            duration: session.duration,
            completedAt: new Date(session.completed_at).getTime(),
            date: session.date,
          }));
          setSessions(mappedSessions);

          // Load timer state from localStorage (timer state is ephemeral, not persisted to DB)
          const savedTimeLeft = localStorage.getItem(
            getUserStorageKey('pomodoro_timeLeft')
          );
          const savedIsRunning = localStorage.getItem(
            getUserStorageKey('pomodoro_isRunning')
          );
          const savedMode = localStorage.getItem(getUserStorageKey('pomodoro_mode'));
          const savedStartTime = localStorage.getItem(
            getUserStorageKey('pomodoro_startTime')
          );

          if (savedMode) {
            setCurrentMode(savedMode as 'work' | 'break');
          }

          // Load settings from database
          const dbSettings = await db.getPomodoroSettings(currentUser.id);
          if (dbSettings) {
            const loadedSettings: PomodoroSettings = {
              workDuration: dbSettings.work_duration,
              breakDuration: dbSettings.break_duration,
              longBreakDuration: dbSettings.long_break_duration,
              sessionsUntilLongBreak: dbSettings.sessions_until_long_break,
            };
            setSettings(loadedSettings);
            setCompletedCycles(dbSettings.completed_cycles);
          } else {
            // Create default settings for new user
            await db.createPomodoroSettings({
              user_id: currentUser.id,
              work_duration: 25,
              break_duration: 5,
              long_break_duration: 15,
              sessions_until_long_break: 4,
              completed_cycles: 0,
            });

            const defaultSettings: PomodoroSettings = {
              workDuration: 25,
              breakDuration: 5,
              longBreakDuration: 15,
              sessionsUntilLongBreak: 4,
            };
            setSettings(defaultSettings);
          }

          // Restore timer state using settings as source of truth
          if (savedIsRunning === 'true' && savedStartTime && savedTimeLeft) {
            const startTime = parseInt(savedStartTime);
            const savedTime = parseInt(savedTimeLeft);
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const newTimeLeft = Math.max(0, savedTime - elapsed);

            setTimeLeft(newTimeLeft);
            if (newTimeLeft > 0) {
              setIsRunning(true);
            } else {
              // Timer completed while user was away; reset to current settings
              setIsRunning(false);
              setTimeLeft(
                (savedMode === 'work'
                  ? settings.workDuration
                  : settings.breakDuration) * 60
              );
            }
          } else if (savedTimeLeft) {
            // Only reuse savedTimeLeft if it matches current settings for work mode
            const asNumber = parseInt(savedTimeLeft);
            const expectedWorkSeconds = settings.workDuration * 60;

            if (currentMode === 'work' && asNumber !== expectedWorkSeconds) {
              // Settings changed since this value was stored -> ignore old cache
              setTimeLeft(expectedWorkSeconds);
            } else {
              setTimeLeft(asNumber);
            }
          } else {
            // No saved state at all -> use current settings
            setCurrentMode('work');
            setTimeLeft(settings.workDuration * 60);
          }
        } catch (error) {
          console.error('Error loading pomodoro data from database:', error);
        }
      } else {
        // Reset to defaults when no user
        setSettings({
          workDuration: 25,
          breakDuration: 5,
          longBreakDuration: 15,
          sessionsUntilLongBreak: 4,
        });
        setTimeLeft(25 * 60);
        setIsRunning(false);
        setCurrentMode('work');
        setSessions([]);
        setCompletedCycles(0);
      }
    };

    loadData();
  }, [currentUser, getUserStorageKey, settings.workDuration, settings.breakDuration, currentMode]);

  // Save state to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(getUserStorageKey('pomodoro_timeLeft'), timeLeft.toString());
      localStorage.setItem(
        getUserStorageKey('pomodoro_isRunning'),
        isRunning.toString()
      );
      localStorage.setItem(getUserStorageKey('pomodoro_mode'), currentMode);
      if (isRunning) {
        if (!timerStartTimeRef.current) {
          timerStartTimeRef.current = Date.now();
        }
        localStorage.setItem(
          getUserStorageKey('pomodoro_startTime'),
          timerStartTimeRef.current.toString()
        );
      } else {
        timerStartTimeRef.current = null;
        localStorage.removeItem(getUserStorageKey('pomodoro_startTime'));
      }
    }
  }, [timeLeft, isRunning, currentMode, currentUser, getUserStorageKey]);

  // Timer countdown logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      lastTickRef.current = Date.now();

      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const delta = Math.floor((now - lastTickRef.current) / 1000);
        lastTickRef.current = now;

        setTimeLeft((prev) => {
          const newTime = prev - (delta > 0 ? delta : 1);
          if (newTime <= 0) {
            handleTimerComplete();
            return 0;
          }
          return newTime;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, handleTimerComplete]);

  const toggleTimer = useCallback(() => {
    const newIsRunning = !isRunning;
    setIsRunning(newIsRunning);

    if (newIsRunning) {
      timerStartTimeRef.current = Date.now();
      const message = currentMode === 'work' ? 'Focus time started!' : 'Break time started!';
      toast.info(message);

      addNotification({
        type: 'reminder',
        title: currentMode === 'work' ? '🧠 Focus Mode Started' : '☕ Break Mode Started',
        message: message,
        icon: currentMode === 'work' ? '🧠' : '☕',
      });
    } else {
      timerStartTimeRef.current = null;
    }
  }, [isRunning, currentMode, addNotification]);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    timerStartTimeRef.current = null;
    if (currentMode === 'work') {
      setTimeLeft(settings.workDuration * 60);
    } else {
      setTimeLeft(settings.breakDuration * 60);
    }
    toast.info('Timer reset');
  }, [currentMode, settings]);

  const switchMode = useCallback(
    (mode: 'work' | 'break') => {
      setIsRunning(false);
      timerStartTimeRef.current = null;
      setCurrentMode(mode);
      if (mode === 'work') {
        setTimeLeft(settings.workDuration * 60);
      } else {
        setTimeLeft(settings.breakDuration * 60);
      }
    },
    [settings]
  );

  const updateSettings = useCallback(
    async (newSettings: PomodoroSettings) => {
      setSettings(newSettings);

      // Save to database
      if (currentUser) {
        try {
          await db.updatePomodoroSettings(currentUser.id, {
            work_duration: newSettings.workDuration,
            break_duration: newSettings.breakDuration,
            long_break_duration: newSettings.longBreakDuration,
            sessions_until_long_break: newSettings.sessionsUntilLongBreak,
          });
        } catch (error) {
          console.error('Error updating pomodoro settings:', error);
        }
      }

      // Clear old timer state so it does not override new settings on next load
      localStorage.removeItem(getUserStorageKey('pomodoro_timeLeft'));
      localStorage.removeItem(getUserStorageKey('pomodoro_startTime'));
      localStorage.setItem(getUserStorageKey('pomodoro_isRunning'), 'false');

      setIsRunning(false);
      setTimeLeft(
        currentMode === 'work'
          ? newSettings.workDuration * 60
          : newSettings.breakDuration * 60
      );
      toast.success('Settings saved!');
    },
    [currentMode, currentUser, getUserStorageKey]
  );

  const getTotalDuration = useCallback(() => {
    return currentMode === 'work'
      ? settings.workDuration * 60
      : settings.breakDuration * 60;
  }, [currentMode, settings]);

  const getProgress = useCallback(() => {
    const total = getTotalDuration();
    return ((total - timeLeft) / total) * 100;
  }, [timeLeft, getTotalDuration]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return (
    <PomodoroContext.Provider
      value={{
        timeLeft,
        isRunning,
        currentMode,
        sessions,
        completedCycles,
        settings,
        toggleTimer,
        resetTimer,
        switchMode,
        updateSettings,
        getTotalDuration,
        getProgress,
        formatTime,
      }}
    >
      {children}
    </PomodoroContext.Provider>
  );
}

export function usePomodoro() {
  const context = useContext(PomodoroContext);
  if (!context) {
    throw new Error('usePomodoro must be used within PomodoroProvider');
  }
  return context;
}

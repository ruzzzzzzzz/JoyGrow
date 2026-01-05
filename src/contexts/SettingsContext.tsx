import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useUser } from './UserContext';
import { db } from '../database';

export interface AppSettings {
  // Notifications
  dailyReminders: boolean;
  streakNotifications: boolean;
  achievementAlerts: boolean;
  quizReminders: boolean;
  weeklyProgress: boolean;
  
  // Privacy & Security
  profileVisibility: string;
  dataSharing: boolean;
  analyticsOptOut: boolean;
  
  // App Preferences
  offlineMode: boolean;
  autoSync: boolean;
  language: string;
  studyGoal: number; // Number of questions per day
  
  // Study Settings
  quizDifficulty: string;
  timerEnabled: boolean;
  instantFeedback: boolean;
  soundEffects: boolean;
}

interface SettingsContextType {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<void>;
  resetSettings: () => Promise<void>;
}

const defaultSettings: AppSettings = {
  // Notifications
  dailyReminders: true,
  streakNotifications: true,
  achievementAlerts: true,
  quizReminders: true,
  weeklyProgress: false,
  
  // Privacy & Security
  profileVisibility: 'private',
  dataSharing: false,
  analyticsOptOut: false,
  
  // App Preferences
  offlineMode: true,
  autoSync: true,
  language: 'en',
  studyGoal: 20, // Default 20 questions per day
  
  // Study Settings
  quizDifficulty: 'adaptive',
  timerEnabled: true,
  instantFeedback: true,
  soundEffects: true
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const userContext = useUser();
  const { currentUser } = userContext || { currentUser: null };
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(false);

  // Load user-specific settings from database when user changes
  useEffect(() => {
    const loadSettings = async () => {
      if (currentUser) {
        setIsLoading(true);
        try {
          const savedSettings = await db.getUserSettings(currentUser.id);
          if (savedSettings) {
            setSettings({ ...defaultSettings, ...savedSettings });
          } else {
            setSettings(defaultSettings);
          }
        } catch (error) {
          console.error('Error loading settings from database:', error);
          setSettings(defaultSettings);
        } finally {
          setIsLoading(false);
        }
      } else {
        setSettings(defaultSettings);
      }
    };

    loadSettings();
  }, [currentUser]);

  const updateSetting = useCallback(async <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    if (!currentUser) {
      console.warn('Cannot update settings: no user logged in');
      return;
    }

    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      
      // Save to database
      await db.updateUserSettings(currentUser.id, newSettings);
    } catch (error) {
      console.error('Error saving settings to database:', error);
      // Revert on error
      setSettings(settings);
      throw error;
    }
  }, [settings, currentUser]);

  const resetSettings = useCallback(async () => {
    if (!currentUser) {
      setSettings(defaultSettings);
      return;
    }

    try {
      setSettings(defaultSettings);
      
      // Save default settings to database
      await db.updateUserSettings(currentUser.id, defaultSettings);
    } catch (error) {
      console.error('Error resetting settings in database:', error);
      throw error;
    }
  }, [currentUser]);

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}

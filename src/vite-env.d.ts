/// <reference types="vite/client" />

/**
 * Type definitions for JoyGrow environment variables
 * This enables TypeScript autocomplete for import.meta.env
 */

interface ImportMetaEnv {
  // ================================================
  // REQUIRED: Supabase Configuration
  // ================================================
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;

  // ================================================
  // APPLICATION CONFIGURATION
  // ================================================
  readonly VITE_APP_ENV: 'development' | 'staging' | 'production';
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;

  // ================================================
  // LOGGING & DEBUGGING
  // ================================================
  readonly VITE_LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  readonly VITE_DEBUG_MODE: string;
  readonly VITE_ENABLE_CONSOLE_LOGS: string;

  // ================================================
  // OFFLINE DATABASE CONFIGURATION
  // ================================================
  readonly VITE_OFFLINE_DB_NAME: string;
  readonly VITE_OFFLINE_DB_VERSION: string;
  readonly VITE_ENABLE_OFFLINE_MODE: string;
  readonly VITE_OFFLINE_SYNC_INTERVAL: string;

  // ================================================
  // API CONFIGURATION (OPTIONAL)
  // ================================================
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_AI_QUIZ_API_URL?: string;
  readonly VITE_DOCUMENT_API_URL?: string;

  // ================================================
  // FEATURE FLAGS
  // ================================================
  readonly VITE_ENABLE_AI_QUIZ: string;
  readonly VITE_ENABLE_DOCUMENT_UPLOAD: string;
  readonly VITE_ENABLE_LEADERBOARD: string;
  readonly VITE_ENABLE_ACHIEVEMENTS: string;
  readonly VITE_ENABLE_NOTIFICATIONS: string;
  readonly VITE_ENABLE_POMODORO: string;
  readonly VITE_ENABLE_DARK_MODE: string;

  // ================================================
  // USAGE LIMITS
  // ================================================
  readonly VITE_MAX_AI_QUIZ_GENERATIONS_PER_DAY: string;
  readonly VITE_MAX_DOCUMENT_UPLOADS_PER_DAY: string;
  readonly VITE_STUDY_MATERIAL_WORD_LIMIT: string;
  readonly VITE_QUIZ_QUESTION_OPTIONS: string;
  readonly VITE_MAX_FILE_UPLOAD_SIZE_MB: string;

  // ================================================
  // SESSION & AUTHENTICATION
  // ================================================
  readonly VITE_SESSION_STORAGE_PREFIX: string;
  readonly VITE_SESSION_EXPIRY_DAYS: string;
  readonly VITE_ENABLE_KEEP_SIGNED_IN: string;

  // ================================================
  // STORAGE & CACHING
  // ================================================
  readonly VITE_STORAGE_BUCKET_AVATARS: string;
  readonly VITE_STORAGE_BUCKET_STUDY_MATERIALS: string;
  readonly VITE_STORAGE_BUCKET_DOCUMENTS: string;
  readonly VITE_CACHE_DURATION: string;

  // ================================================
  // ANALYTICS (OPTIONAL)
  // ================================================
  readonly VITE_GA_MEASUREMENT_ID?: string;
  readonly VITE_ENABLE_ANALYTICS: string;

  // ================================================
  // ERROR TRACKING (OPTIONAL)
  // ================================================
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_ENABLE_ERROR_TRACKING: string;

  // ================================================
  // SOCIAL & EXTERNAL SERVICES
  // ================================================
  readonly VITE_SUPPORT_EMAIL: string;
  readonly VITE_WEBSITE_URL: string;
  readonly VITE_PRIVACY_POLICY_URL: string;
  readonly VITE_TERMS_URL: string;

  // ================================================
  // DEVELOPMENT TOOLS (DEV ONLY)
  // ================================================
  readonly VITE_ENABLE_REACT_DEVTOOLS: string;
  readonly VITE_ENABLE_REDUX_DEVTOOLS: string;
  readonly VITE_SHOW_PERFORMANCE_METRICS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// ================================================
// HELPER UTILITIES FOR ENVIRONMENT VARIABLES
// ================================================

/**
 * Helper to parse boolean environment variables
 * Usage: parseEnvBoolean(import.meta.env.VITE_DEBUG_MODE)
 */
declare global {
  function parseEnvBoolean(value: string | undefined): boolean;
  function parseEnvNumber(value: string | undefined, defaultValue: number): number;
  function parseEnvArray(value: string | undefined): string[];
}

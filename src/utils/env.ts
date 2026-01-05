/// <reference types="vite/client" />

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/**
 * Environment Variable Utilities
 * Helper functions for safely accessing and parsing environment variables
 */

/**
 * Parse a boolean environment variable
 * Supports: 'true', '1', 'yes' → true
 *          'false', '0', 'no', undefined → false
 */
export function parseEnvBoolean(value: string | undefined): boolean {
  if (!value) return false;
  return ['true', '1', 'yes'].includes(value.toLowerCase());
}

/**
 * Parse a number environment variable with fallback
 */
export function parseEnvNumber(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Parse a comma-separated array environment variable
 * Example: "5,10,15,20" → [5, 10, 15, 20]
 */
export function parseEnvArray(value: string | undefined): string[] {
  if (!value) return [];
  return value.split(',').map(v => v.trim()).filter(Boolean);
}

/**
 * Parse a comma-separated number array
 * Example: "5,10,15,20" → [5, 10, 15, 20]
 */
export function parseEnvNumberArray(value: string | undefined): number[] {
  return parseEnvArray(value).map(v => parseInt(v, 10)).filter(n => !isNaN(n));
}

/**
 * Application configuration from environment variables
 */
export const appConfig = {
  // Supabase
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  },

  // App settings
  app: {
    env: import.meta.env.VITE_APP_ENV || 'development',
    name: import.meta.env.VITE_APP_NAME || 'JoyGrow',
    version: import.meta.env.VITE_APP_VERSION || '2.0.0',
  },

  // Logging
  logging: {
    level: import.meta.env.VITE_LOG_LEVEL || 'info',
    debugMode: parseEnvBoolean(import.meta.env.VITE_DEBUG_MODE),
    enableConsole: parseEnvBoolean(import.meta.env.VITE_ENABLE_CONSOLE_LOGS || 'true'),
  },

  // Offline database
  offline: {
    dbName: import.meta.env.VITE_OFFLINE_DB_NAME || 'joygrow_offline',
    dbVersion: parseEnvNumber(import.meta.env.VITE_OFFLINE_DB_VERSION, 1),
    enabled: parseEnvBoolean(import.meta.env.VITE_ENABLE_OFFLINE_MODE || 'true'),
    syncInterval: parseEnvNumber(import.meta.env.VITE_OFFLINE_SYNC_INTERVAL, 30000),
  },

  // Feature flags
  features: {
    aiQuiz: parseEnvBoolean(import.meta.env.VITE_ENABLE_AI_QUIZ || 'true'),
    documentUpload: parseEnvBoolean(import.meta.env.VITE_ENABLE_DOCUMENT_UPLOAD || 'true'),
    leaderboard: parseEnvBoolean(import.meta.env.VITE_ENABLE_LEADERBOARD || 'true'),
    achievements: parseEnvBoolean(import.meta.env.VITE_ENABLE_ACHIEVEMENTS || 'true'),
    notifications: parseEnvBoolean(import.meta.env.VITE_ENABLE_NOTIFICATIONS || 'true'),
    pomodoro: parseEnvBoolean(import.meta.env.VITE_ENABLE_POMODORO || 'true'),
    darkMode: parseEnvBoolean(import.meta.env.VITE_ENABLE_DARK_MODE || 'true'),
  },

  // Usage limits
  limits: {
    maxAiQuizPerDay: parseEnvNumber(
      import.meta.env.VITE_MAX_AI_QUIZ_GENERATIONS_PER_DAY,
      3
    ),
    maxDocumentUploadsPerDay: parseEnvNumber(
      import.meta.env.VITE_MAX_DOCUMENT_UPLOADS_PER_DAY,
      3
    ),
    studyMaterialWordLimit: parseEnvNumber(
      import.meta.env.VITE_STUDY_MATERIAL_WORD_LIMIT,
      1500
    ),
    quizQuestionOptions: parseEnvNumberArray(
      import.meta.env.VITE_QUIZ_QUESTION_OPTIONS || '5,10,15,20'
    ),
    maxFileUploadSizeMB: parseEnvNumber(
      import.meta.env.VITE_MAX_FILE_UPLOAD_SIZE_MB,
      10
    ),
  },

  // Session
  session: {
    storagePrefix: import.meta.env.VITE_SESSION_STORAGE_PREFIX || 'joygrow_',
    expiryDays: parseEnvNumber(import.meta.env.VITE_SESSION_EXPIRY_DAYS, 30),
    keepSignedInEnabled: parseEnvBoolean(
      import.meta.env.VITE_ENABLE_KEEP_SIGNED_IN || 'true'
    ),
  },

  // Storage buckets
  storage: {
    avatars: import.meta.env.VITE_STORAGE_BUCKET_AVATARS || 'avatars',
    studyMaterials: import.meta.env.VITE_STORAGE_BUCKET_STUDY_MATERIALS || 'study_materials',
    documents: import.meta.env.VITE_STORAGE_BUCKET_DOCUMENTS || 'documents',
    cacheDuration: parseEnvNumber(import.meta.env.VITE_CACHE_DURATION, 300000),
  },

  // Analytics
  analytics: {
    enabled: parseEnvBoolean(import.meta.env.VITE_ENABLE_ANALYTICS),
    gaId: import.meta.env.VITE_GA_MEASUREMENT_ID,
  },

  // Error tracking
  errorTracking: {
    enabled: parseEnvBoolean(import.meta.env.VITE_ENABLE_ERROR_TRACKING),
    sentryDsn: import.meta.env.VITE_SENTRY_DSN,
  },

  // External links
  links: {
    supportEmail: import.meta.env.VITE_SUPPORT_EMAIL || 'support@joygrow.com',
    website: import.meta.env.VITE_WEBSITE_URL || 'https://joygrow.com',
    privacyPolicy: import.meta.env.VITE_PRIVACY_POLICY_URL || 'https://joygrow.com/privacy',
    terms: import.meta.env.VITE_TERMS_URL || 'https://joygrow.com/terms',
  },

  // Dev tools
  devTools: {
    reactDevTools: parseEnvBoolean(import.meta.env.VITE_ENABLE_REACT_DEVTOOLS || 'true'),
    reduxDevTools: parseEnvBoolean(import.meta.env.VITE_ENABLE_REDUX_DEVTOOLS || 'true'),
    showPerformanceMetrics: parseEnvBoolean(
      import.meta.env.VITE_SHOW_PERFORMANCE_METRICS
    ),
  },
};

/**
 * Validate that required environment variables are set
 * Call this during app initialization
 */
export function validateEnvironment(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required Supabase variables
  if (!appConfig.supabase.url) {
    errors.push('VITE_SUPABASE_URL is required. Please set it in .env.local');
  }

  if (!appConfig.supabase.anonKey) {
    errors.push('VITE_SUPABASE_ANON_KEY is required. Please set it in .env.local');
  }

  // Validate Supabase URL format
  if (appConfig.supabase.url && !appConfig.supabase.url.startsWith('https://')) {
    errors.push('VITE_SUPABASE_URL must start with https://');
  }

  // Validate environment
  if (!['development', 'staging', 'production'].includes(appConfig.app.env)) {
    errors.push('VITE_APP_ENV must be one of: development, staging, production');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if app is in development mode
 */
export function isDevelopment(): boolean {
  return appConfig.app.env === 'development';
}

/**
 * Check if app is in production mode
 */
export function isProduction(): boolean {
  return appConfig.app.env === 'production';
}

/**
 * Check if feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof appConfig.features): boolean {
  return appConfig.features[feature];
}

/**
 * Get quiz question options
 */
export function getQuizQuestionOptions(): number[] {
  return appConfig.limits.quizQuestionOptions;
}

/**
 * Log configuration (for debugging)
 * Only logs in development mode if debug is enabled
 */
export function logConfig(): void {
  if (isDevelopment() && appConfig.logging.debugMode) {
    console.group('🔧 JoyGrow Configuration');
    console.log('Environment:', appConfig.app.env);
    console.log('Version:', appConfig.app.version);
    console.log('Supabase URL:', appConfig.supabase.url);
    console.log('Features:', appConfig.features);
    console.log('Limits:', appConfig.limits);
    console.groupEnd();
  }
}

// Export as default for convenience
export default appConfig;

/**
 * AI Usage Tracking Service
 * Manages daily limits for AI quiz generation and document uploads
 */

interface AIUsageData {
  user_id: string;
  usage_date: string; // YYYY-MM-DD format
  ai_quiz_generations: number;
  document_uploads: number;
}

const DAILY_AI_QUIZ_LIMIT = 3;
const DAILY_DOCUMENT_UPLOAD_LIMIT = 3;

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDate(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

/**
 * Get usage data from localStorage
 */
function getUsageData(userId: string): AIUsageData | null {
  try {
    const key = `ai_usage_${userId}_${getTodayDate()}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error getting usage data:', error);
    return null;
  }
}

/**
 * Save usage data to localStorage
 */
function saveUsageData(data: AIUsageData): void {
  try {
    const key = `ai_usage_${data.user_id}_${data.usage_date}`;
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving usage data:', error);
  }
}

/**
 * Initialize usage data for today if it doesn't exist
 */
function initializeUsageData(userId: string): AIUsageData {
  const today = getTodayDate();
  const existing = getUsageData(userId);
  
  if (existing && existing.usage_date === today) {
    return existing;
  }
  
  // Create new usage data for today
  const newData: AIUsageData = {
    user_id: userId,
    usage_date: today,
    ai_quiz_generations: 0,
    document_uploads: 0,
  };
  
  saveUsageData(newData);
  return newData;
}

/**
 * Check if user can generate AI quiz
 */
export function canGenerateAIQuiz(userId: string): boolean {
  const data = initializeUsageData(userId);
  return data.ai_quiz_generations < DAILY_AI_QUIZ_LIMIT;
}

/**
 * Check if user can upload document
 */
export function canUploadDocument(userId: string): boolean {
  const data = initializeUsageData(userId);
  return data.document_uploads < DAILY_DOCUMENT_UPLOAD_LIMIT;
}

/**
 * Get remaining AI quiz generations for today
 */
export function getRemainingAIQuizGenerations(userId: string): number {
  const data = initializeUsageData(userId);
  return Math.max(0, DAILY_AI_QUIZ_LIMIT - data.ai_quiz_generations);
}

/**
 * Get remaining document uploads for today
 */
export function getRemainingDocumentUploads(userId: string): number {
  const data = initializeUsageData(userId);
  return Math.max(0, DAILY_DOCUMENT_UPLOAD_LIMIT - data.document_uploads);
}

/**
 * Increment AI quiz generation count
 */
export function incrementAIQuizGeneration(userId: string): void {
  const data = initializeUsageData(userId);
  data.ai_quiz_generations += 1;
  saveUsageData(data);
}

/**
 * Increment document upload count
 */
export function incrementDocumentUpload(userId: string): void {
  const data = initializeUsageData(userId);
  data.document_uploads += 1;
  saveUsageData(data);
}

/**
 * Get complete usage data for today
 */
export function getAIUsageData(userId: string): {
  ai_quiz_generations: number;
  document_uploads: number;
  remaining_ai_generations: number;
  remaining_document_uploads: number;
} {
  const data = initializeUsageData(userId);
  return {
    ai_quiz_generations: data.ai_quiz_generations,
    document_uploads: data.document_uploads,
    remaining_ai_generations: getRemainingAIQuizGenerations(userId),
    remaining_document_uploads: getRemainingDocumentUploads(userId),
  };
}

/**
 * Clean up old usage data (older than 7 days)
 */
export function cleanupOldUsageData(): void {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const cutoffDate = sevenDaysAgo.toISOString().split('T')[0];
    
    // Get all localStorage keys
    const keys = Object.keys(localStorage);
    
    // Find and remove old usage data
    keys.forEach(key => {
      if (key.startsWith('ai_usage_')) {
        const parts = key.split('_');
        const date = parts[parts.length - 1];
        
        if (date < cutoffDate) {
          localStorage.removeItem(key);
        }
      }
    });
  } catch (error) {
    console.error('Error cleaning up old usage data:', error);
  }
}

// Clean up old data on module load
cleanupOldUsageData();
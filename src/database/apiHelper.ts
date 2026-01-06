    import { supabase } from './supabase-client'; // Your supabase client

    // Cache key prefix
    const CACHE_PREFIX = 'joygrow_cache_';

    // Helper to get cached data from localStorage
    export function getCachedData<T>(key: string): T | null {
    try {
        const cached = localStorage.getItem(CACHE_PREFIX + key);
        if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        // Cache valid for 24 hours
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
            return data;
        }
        }
    } catch (error) {
        console.error('Error reading cache:', error);
    }
    return null;
    }

    // Helper to set cached data in localStorage
    export function setCachedData<T>(key: string, data: T): void {
    try {
        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({
        data,
        timestamp: Date.now()
        }));
    } catch (error) {
        console.error('Error writing cache:', error);
    }
    }

    // Wrapper for Supabase queries with offline support
    export async function offlineQuery<T>(
    queryFn: () => Promise<{ data: T | null; error: any }>,
    cacheKey: string
    ): Promise<{ data: T | null; error: any; fromCache?: boolean }> {
    
    // Check if online
    if (!navigator.onLine) {
        console.log('Offline: using cached data for', cacheKey);
        const cached = getCachedData<T>(cacheKey);
        if (cached) {
        return { data: cached, error: null, fromCache: true };
        }
        return { 
        data: null, 
        error: { message: 'No internet connection and no cached data available' },
        fromCache: false 
        };
    }

    // Try to fetch from network
    try {
        const result = await queryFn();
        
        // Cache successful results
        if (result.data && !result.error) {
        setCachedData(cacheKey, result.data);
        }
        
        return result;
    } catch (error) {
        console.error('Network error:', error);
        
        // Fall back to cache
        const cached = getCachedData<T>(cacheKey);
        if (cached) {
        console.log('Network failed: using cached data for', cacheKey);
        return { data: cached, error: null, fromCache: true };
        }
        
        return { 
        data: null, 
        error: error instanceof Error ? error : { message: 'Network error' }
        };
    }
    }

    // Example usage:
    // Instead of:
    //   const { data, error } = await supabase.from('users').select('*');
    //
    // Use:
    //   const { data, error, fromCache } = await offlineQuery(
    //     () => supabase.from('users').select('*'),
    //     'users_list'
    //   );
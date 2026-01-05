// Supabase Client Configuration
import { createClient } from '@supabase/supabase-js';

// Read environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

// Create the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,        // We handle auth manually
    autoRefreshToken: false,
  },
  db: {
    schema: 'public',
  },
});

// Helper function to set the current user context for RLS
export function setSupabaseContext(userId: string, isAdmin: boolean = false) {
  // Placeholder - no-op until RLS is properly configured
  // Example when you add the RPC:
  // return supabase.rpc('set_user_context', { user_id: userId, is_admin: isAdmin });

  return Promise.resolve({ data: null, error: null });
}

// Helper function to clear Supabase context
export function clearSupabaseContext() {
  // This would clear the context if needed
  return Promise.resolve();
}

// Simple test helper (optional, can be removed later)
export async function testSupabaseConnection() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .limit(1);

  console.log('Supabase test users:', { data, error });
}

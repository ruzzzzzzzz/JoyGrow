// Simple session manager using localStorage
export interface Session {
  userId: string;
  username: string;
  isAdmin: boolean;
  isValid: boolean;
  timestamp: number;
  keepSignedIn?: boolean;
  authSource?: 'supabase' | 'local';
}

const SESSION_KEY = 'joygrow_session';
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

export async function getCurrentSession(): Promise<Session | null> {
  try {
    const sessionData = localStorage.getItem(SESSION_KEY);
    if (!sessionData) return null;

    const session: Session = JSON.parse(sessionData);

    // Check if session is expired
    const now = Date.now();
    if (now - session.timestamp > SESSION_TIMEOUT) {
      await deleteSession();
      return null;
    }

    return session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

export async function createSession(
  userId: string,
  username: string,
  isAdmin: boolean,
  keepSignedIn?: boolean,
  authSource?: 'supabase' | 'local'
): Promise<void> {
  try {
    const session: Session = {
      userId,
      username,
      isAdmin,
      isValid: true,
      timestamp: Date.now(),
      keepSignedIn,
      authSource,
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.error('Error creating session:', error);
  }
}

export async function deleteSession(): Promise<void> {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.error('Error deleting session:', error);
  }
}

// No extra export of Session needed; `export interface Session` already exports the type

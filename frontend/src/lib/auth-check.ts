import { supabase } from './supabase-client';

// Check if user is authenticated
export async function checkAuth() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Session check error:', error);
      return { isAuthenticated: false, user: null };
    }

    return {
      isAuthenticated: !!session,
      user: session?.user || null,
    };
  } catch (error) {
    console.error('Auth check error:', error);
    return { isAuthenticated: false, user: null };
  }
}

// Redirect to login if not authenticated
export function requireAuth() {
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname;
    window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
  }
}

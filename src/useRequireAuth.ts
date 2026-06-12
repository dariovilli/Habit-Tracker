import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from './auth-context';

/**
 * Redirects unauthenticated users to /login.
 * Call at the top of every protected screen as defense-in-depth
 * against deep links that bypass the root index redirect.
 */
export function useRequireAuth() {
  const { session, authLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authLoaded && !session) {
      router.replace('/login');
    }
  }, [session, authLoaded]);
}

import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase config. Ensure EXPO_PUBLIC_SUPABASE_URL and ' +
    'EXPO_PUBLIC_SUPABASE_ANON_KEY are set in your .env file.'
  );
}

const SecureStoreAdapter = {
  getItem: (key: string): Promise<string | null> | string | null =>
    SecureStore.getItemAsync(key),
  setItem: (key: string, value: string): void | Promise<void> =>
    SecureStore.setItemAsync(key, value),
  removeItem: (key: string): void | Promise<void> =>
    SecureStore.deleteItemAsync(key),
};

// On native: use expo-secure-store (encrypted keychain).
// On web: omit custom storage so Supabase uses its default session handling
// and detectSessionInUrl can process recovery tokens from email links.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY,
  Platform.OS === 'web'
    ? {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      }
    : {
        auth: {
          storage: SecureStoreAdapter as any,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      }
);

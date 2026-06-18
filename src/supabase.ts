import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const placeholderUrl = 'https://placeholder-project.supabase.co';
const placeholderKey = 'placeholder-anon-key';
const exampleUrl = 'https://your-supabase-project-id.supabase.co';
const exampleKey = 'your-supabase-anon-key';

const rawSupabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || placeholderUrl;
// Strip accidental /rest/v1 suffix — the client adds API paths itself.
const supabaseUrl = rawSupabaseUrl.replace(/\/rest\/v1\/?$/, '');
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || placeholderKey;

const isServer = typeof window === 'undefined';

const safeAsyncStorage = {
  getItem: async (key: string) => {
    if (isServer) return null;
    try {
      return await AsyncStorage.getItem(key);
    } catch (e) {
      console.error('safeAsyncStorage.getItem error:', e);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    if (isServer) return;
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      console.error('safeAsyncStorage.setItem error:', e);
    }
  },
  removeItem: async (key: string) => {
    if (isServer) return;
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.error('safeAsyncStorage.removeItem error:', e);
    }
  },
};

// Export client. If keys are missing or placeholders, we'll run in mock mode.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: safeAsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export const hasSupabaseKeys = (): boolean => {
  return !!(
    process.env.EXPO_PUBLIC_SUPABASE_URL && 
    process.env.EXPO_PUBLIC_SUPABASE_URL !== placeholderUrl &&
    process.env.EXPO_PUBLIC_SUPABASE_URL !== exampleUrl &&
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY !== placeholderKey &&
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY !== exampleKey
  );
};

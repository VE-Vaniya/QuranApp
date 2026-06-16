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

// Export client. If keys are missing or placeholders, we'll run in mock mode.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
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

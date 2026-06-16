import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '../supabase';

WebBrowser.maybeCompleteAuthSession();

const redirectTo = makeRedirectUri({ scheme: 'quranapp', path: 'login' });

async function createSessionFromUrl(url: string) {
  const { params, errorCode } = QueryParams.getQueryParams(url);
  if (errorCode) throw new Error(errorCode);
  const { access_token, refresh_token } = params;
  if (!access_token) {
    throw new Error('Google sign-in was cancelled or did not return a session.');
  }
  const { data, error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });
  if (error) throw error;
  return data.session;
}

export async function signInWithGoogleOAuth() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;
  if (!data?.url) throw new Error('Could not start Google sign-in.');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type === 'success') {
    await createSessionFromUrl(result.url);
    return;
  }
  if (result.type === 'cancel' || result.type === 'dismiss') {
    throw new Error('Google sign-in was cancelled.');
  }
  throw new Error('Google sign-in did not complete.');
}

export { redirectTo as googleAuthRedirectUri };

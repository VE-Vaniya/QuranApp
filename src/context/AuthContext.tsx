import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { signInWithGoogleOAuth } from '../lib/googleAuth';
import { hasSupabaseKeys, supabase } from '../supabase';

interface Profile {
  id: string;
  display_name: string;
  streak: number;
  last_active_at: string;
}

// ✅ FIXED: Added user and error to AuthResult
interface AuthResult {
  user?: any | null;
  error?: Error | null;
  needsEmailConfirmation?: boolean;
}

interface AuthContextType {
  user: any | null;
  profile: Profile | null;
  loading: boolean;
  isMockMode: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string, displayName: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  incrementStreak: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isMockMode, setIsMockMode] = useState<boolean>(!hasSupabaseKeys());

  useEffect(() => {
    const keysAvailable = hasSupabaseKeys();
    console.log("[AuthContext] mounting... hasSupabaseKeys =", keysAvailable);
    if (!keysAvailable) {
      console.warn("[AuthContext] Supabase keys are missing/placeholder. Running in mock/preview mode.");
      setIsMockMode(true);
      loadMockUser();
    } else {
      console.log("[AuthContext] Supabase keys found. Connecting to Supabase live server.");
      setIsMockMode(false);
      
      supabase.auth.getSession().then(({ data: { session } }) => {
        console.log("[AuthContext] getSession result user id =", session?.user?.id);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setLoading(false);
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        console.log("[AuthContext] onAuthStateChange event =", _event, "user id =", session?.user?.id);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const loadMockUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('@quranchat_mock_user');
      const storedProfile = await AsyncStorage.getItem('@quranchat_mock_profile');
      console.log("[AuthContext] loadMockUser storedUser =", storedUser);
      if (storedUser && storedProfile) {
        setUser(JSON.parse(storedUser));
        setProfile(JSON.parse(storedProfile));
      }
    } catch (e) {
      console.error("[AuthContext] Error loading mock user:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error("Error fetching profile from Supabase:", error);
      } else if (data) {
        setProfile(data);
        await checkAndUpdateStreak(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const checkAndUpdateStreak = async (currentProfile: Profile) => {
    const today = new Date().toDateString();
    const lastActive = currentProfile.last_active_at 
      ? new Date(currentProfile.last_active_at).toDateString() 
      : null;

    if (lastActive === today) {
      return;
    }

    let newStreak = currentProfile.streak;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    if (lastActive === yesterdayStr) {
      newStreak += 1;
    } else {
      newStreak = 1;
    }

    if (isMockMode) {
      const updatedProfile = { 
        ...currentProfile, 
        streak: newStreak, 
        last_active_at: new Date().toISOString() 
      };
      setProfile(updatedProfile);
      await AsyncStorage.setItem('@quranchat_mock_profile', JSON.stringify(updatedProfile));
    } else {
      const { data, error } = await supabase
        .from('profiles')
        .update({ streak: newStreak, last_active_at: new Date().toISOString() })
        .eq('id', currentProfile.id)
        .select()
        .single();

      if (!error && data) {
        setProfile(data);
      }
    }
  };

  // ✅ FIXED signIn
  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    console.log("[AuthContext] signIn called. email =", email, "isMockMode =", isMockMode);
    
    if (isMockMode) {
      const mockId = 'mock-user-id-123';
      const mockUser = { id: mockId, email };
      const displayName = email.split('@')[0];
      const mockProfile: Profile = {
        id: mockId,
        display_name: displayName.charAt(0).toUpperCase() + displayName.slice(1),
        streak: 1,
        last_active_at: new Date().toISOString()
      };

      await AsyncStorage.setItem('@quranchat_mock_user', JSON.stringify(mockUser));
      await AsyncStorage.setItem('@quranchat_mock_profile', JSON.stringify(mockProfile));
      setUser(mockUser);
      setProfile(mockProfile);
      console.log("[AuthContext] signIn mock login complete. user =", mockUser);
      
      return { user: mockUser, error: null };
    } else {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        
        if (error) {
          console.error("[AuthContext] signIn error:", error.message);
          return { user: null, error: error };
        }
        
        if (!data.session) {
          console.warn("[AuthContext] signIn succeeded but no session returned.");
          return { user: null, error: null, needsEmailConfirmation: true };
        }
        
        return { user: data.user, error: null };
      } catch (error: any) {
        console.error("[AuthContext] signIn catch error:", error);
        return { user: null, error: error };
      }
    }
  };

  // ✅ FIXED signUp
  const signUp = async (email: string, password: string, displayName: string): Promise<AuthResult> => {
    console.log("[AuthContext] signUp called. email =", email, "displayName =", displayName, "isMockMode =", isMockMode);
    
    if (isMockMode) {
      const mockId = 'mock-user-id-123';
      const mockUser = { id: mockId, email };
      const mockProfile: Profile = {
        id: mockId,
        display_name: displayName,
        streak: 1,
        last_active_at: new Date().toISOString()
      };

      await AsyncStorage.setItem('@quranchat_mock_user', JSON.stringify(mockUser));
      await AsyncStorage.setItem('@quranchat_mock_profile', JSON.stringify(mockProfile));
      setUser(mockUser);
      setProfile(mockProfile);
      console.log("[AuthContext] signUp mock complete. user =", mockUser);
      
      return { user: mockUser, error: null };
    } else {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName }
          }
        });
        
        if (error) {
          console.error("[AuthContext] signUp error:", error.message);
          return { user: null, error: error };
        }
        
        if (!data.session) {
          console.log("[AuthContext] signUp complete — email confirmation required.");
          return { user: null, error: null, needsEmailConfirmation: true };
        }
        
        return { user: data.user, error: null };
      } catch (error: any) {
        console.error("[AuthContext] signUp catch error:", error);
        return { user: null, error: error };
      }
    }
  };

  const signInWithGoogle = async () => {
    if (isMockMode) {
      const result = await signIn('googleuser@quranchat.app', 'social-password-123');
      if (result.error) throw result.error;
      return;
    }
    await signInWithGoogleOAuth();
  };

  const updatePassword = async (newPassword: string) => {
    if (isMockMode) {
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  };

  const signOut = async () => {
    setLoading(true);
    if (isMockMode) {
      await AsyncStorage.removeItem('@quranchat_mock_user');
      await AsyncStorage.removeItem('@quranchat_mock_profile');
      setUser(null);
      setProfile(null);
      setLoading(false);
    } else {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setLoading(false);
        throw error;
      }
      setUser(null);
      setProfile(null);
      setLoading(false);
    }
  };

  const incrementStreak = async () => {
    if (!profile) return;
    const today = new Date().toDateString();
    const lastActive = profile.last_active_at 
      ? new Date(profile.last_active_at).toDateString() 
      : null;

    if (lastActive === today) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    const newStreak = lastActive === yesterdayStr ? profile.streak + 1 : 1;

    if (isMockMode) {
      const updatedProfile = { 
        ...profile, 
        streak: newStreak, 
        last_active_at: new Date().toISOString() 
      };
      setProfile(updatedProfile);
      await AsyncStorage.setItem('@quranchat_mock_profile', JSON.stringify(updatedProfile));
    } else {
      const { data } = await supabase
        .from('profiles')
        .update({ streak: newStreak, last_active_at: new Date().toISOString() })
        .eq('id', profile.id)
        .select()
        .single();
      if (data) {
        setProfile(data);
      }
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      isMockMode,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
      updatePassword,
      incrementStreak,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
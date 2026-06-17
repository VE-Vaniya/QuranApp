import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { PatternBackground } from '../../components/PatternBackground';
import { HorizontalVines, VineBorderBox } from '../../components/VineDecorations';
import { useAuth } from '../../context/AuthContext';
import { THEME } from '../../theme';

function friendlyAuthError(message?: string): string {
  if (!message) return 'Something went wrong. Please try again.';
  const m = message.toLowerCase();
  if (m.includes('invalid login') || m.includes('invalid credentials')) return 'Incorrect email or password.';
  if (m.includes('email not confirmed')) return 'Please confirm your email before signing in.';
  if (m.includes('already registered') || m.includes('already been registered')) {
    return 'An account with this email already exists. Try signing in.';
  }
  if (m.includes('cancel')) return 'Sign-in was cancelled.';
  return 'Something went wrong. Please try again.';
}

export default function LoginScreen() {
  const { signIn, signUp, signInWithGoogle, isMockMode } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const toggleAuthMode = () => {
    setErrorMsg('');
    setSuccessMsg('');
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setIsSignUp(!isSignUp);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleSubmit = async () => {
    if (!email || !password || (isSignUp && !displayName)) {
      setErrorMsg('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (isSignUp) {
        const result = await signUp(email, password, displayName);
        if (result.error) {
          setErrorMsg(friendlyAuthError(result.error.message));
        } else if (result.needsEmailConfirmation) {
          setSuccessMsg('Account created! Check your email to confirm, then sign in.');
          setIsSignUp(false);
        }
      } else {
        const result = await signIn(email, password);
        if (result.error) {
          setErrorMsg(friendlyAuthError(result.error.message));
        } else if (result.needsEmailConfirmation) {
          setSuccessMsg('Please confirm your email before signing in.');
        }
      }
    } catch {
      setErrorMsg('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PatternBackground>
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" backgroundColor={THEME.colors.background} />
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.topLogoContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="moon-outline" size={32} color={THEME.colors.gold} />
          </View>
          <Text style={styles.logoText}>QuranChat</Text>
          <Text style={styles.logoTagline}>"This is a Reminder for the worlds."</Text>
          <HorizontalVines style={{ marginTop: 12, width: '80%' }} />
        </View>

        <VineBorderBox style={styles.card}>
          <View style={styles.innerCard}>
            <Animated.View style={{ opacity: fadeAnim }}>
              <Text style={styles.title}>
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </Text>
              <Text style={styles.subtitle}>
                {isSignUp 
                  ? 'Join QuranChat to track streaks, save notes, and pray with the community.' 
                  : 'Sign in to access your daily verse, AI Quran chat, and notes.'}
              </Text>

              {errorMsg ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle-outline" size={18} color={THEME.colors.error} />
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              ) : null}

              {successMsg ? (
                <View style={styles.successContainer}>
                  <Ionicons name="checkmark-circle-outline" size={18} color={THEME.colors.primary} />
                  <Text style={styles.successText}>{successMsg}</Text>
                </View>
              ) : null}

              {isSignUp && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your name"
                    placeholderTextColor={THEME.colors.textSecondary}
                    value={displayName}
                    onChangeText={setDisplayName}
                    autoCapitalize="words"
                  />
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="name@example.com"
                  placeholderTextColor={THEME.colors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.passwordInputField}
                    placeholder="Enter your password"
                    placeholderTextColor={THEME.colors.textSecondary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowPassword(!showPassword)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={THEME.colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>
              

              {/* Action Button with scaling animation */}
              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  onPress={handleSubmit}
                  activeOpacity={0.9}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={THEME.colors.textLight} />
                  ) : (
                    <Text style={styles.primaryButtonText}>
                      {isSignUp ? 'Sign Up' : 'Sign In'}
                    </Text>
                  )}
                </TouchableOpacity>
              </Animated.View>

              {/* Mode Toggle */}
              <TouchableOpacity style={styles.toggleContainer} onPress={toggleAuthMode} disabled={loading}>
                <Text style={styles.toggleText}>
                  {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                  <Text style={styles.toggleTextLink}>
                    {isSignUp ? 'Sign In' : 'Sign Up'}
                  </Text>
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </VineBorderBox>

        <View style={styles.socialContainer}>
                   <HorizontalVines style={{ marginTop: 12, width: '80%' }} />

          {isMockMode && (
            <Text style={styles.mockAlertText}>
              <Ionicons name="information-circle-outline" size={12} /> Mock mode: email login works instantlly.
            </Text>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </PatternBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 8,
    height: 48,
  },
  passwordInputField: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 16,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: THEME.colors.textDark,
  },
  eyeBtn: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: 'center',
  },
  topLogoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.gold,
    marginBottom: 12,
  },
  logoText: {
    fontSize: 28,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: THEME.colors.primary,
    marginBottom: 4,
  },
  logoTagline: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: THEME.colors.accent,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  card: {
    borderWidth: 1,
    borderColor: THEME.colors.goldBorder,
    borderRadius: 16,
    padding: 3,
    backgroundColor: THEME.colors.goldBorder,
    ...THEME.shadows.medium,
  },
  innerCard: {
    backgroundColor: THEME.colors.backgroundCard,
    borderRadius: 13,
    padding: 20,
    borderWidth: 1,
    borderColor: THEME.colors.gold,
  },
  title: {
    fontSize: 24,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: THEME.colors.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorText: {
    color: THEME.colors.error,
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    marginLeft: 6,
    flex: 1,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  successText: {
    color: THEME.colors.primary,
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    marginLeft: 6,
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: THEME.colors.primary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    height: 48,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: THEME.colors.textDark,
  },
  primaryButton: {
    height: 48,
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.gold,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: THEME.colors.textLight,
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  toggleContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: THEME.colors.textSecondary,
  },
  toggleTextLink: {
    color: THEME.colors.goldDark,
    fontFamily: 'Inter_700Bold',
  },
  socialContainer: {
    marginTop: 32,
    alignItems: 'center',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: THEME.colors.border,
    opacity: 0.5,
  },
  dividerText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: THEME.colors.textSecondary,
    marginHorizontal: 12,
    letterSpacing: 1,
  },
  mockAlertText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: THEME.colors.goldDark,
    textAlign: 'center',
    marginBottom: 12,
    opacity: 0.8,
  },
  socialButton: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  socialButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#000',
  },
});

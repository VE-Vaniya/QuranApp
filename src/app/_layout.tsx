import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, StatusBar } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { 
  useFonts, 
  PlayfairDisplay_600SemiBold, 
  PlayfairDisplay_600SemiBold_Italic, 
  PlayfairDisplay_700Bold 
} from '@expo-google-fonts/playfair-display';
import { 
  Inter_400Regular, 
  Inter_500Medium, 
  Inter_700Bold 
} from '@expo-google-fonts/inter';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ToastProvider } from '../components/ToastProvider';
import { THEME, useTheme } from '../theme';
import { SafeAreaProvider } from 'react-native-safe-area-context';

function RootLayoutNav() {
  const { loading } = useAuth();
  const { colors, isDark } = useTheme();

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
        <Text style={[styles.loadingTitle, { color: colors.primary }]}>QuranChat</Text>
        <Text style={[styles.loadingSubtitle, { color: colors.accent }]}>Reconnect with the words that guide your heart</Text>
        <ActivityIndicator size="large" color={colors.gold} style={{ marginTop: 24 }} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="note-modal" 
        options={{ 
          presentation: 'modal', 
          headerShown: true,
          headerStyle: { backgroundColor: colors.backgroundCard },
          headerTitleStyle: { fontFamily: 'PlayfairDisplay_700Bold', color: colors.primary },
          headerTintColor: colors.primary,
          title: 'Reflection Note'
        }} 
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_600SemiBold_Italic,
    PlayfairDisplay_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
  });

  const { colors, isDark } = useTheme();

  if (!fontsLoaded) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
        <Text style={[styles.loadingTitle, { color: colors.primary }]}>QuranChat</Text>
        <ActivityIndicator size="large" color={colors.gold} style={{ marginTop: 24 }} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ToastProvider>
          <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
          <RootLayoutNav />
        </ToastProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: THEME.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingTitle: {
    fontSize: 36,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: THEME.colors.primary,
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: THEME.colors.accent,
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 20,
    opacity: 0.8,
  },
});

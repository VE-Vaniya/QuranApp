import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { THEME } from '../../theme';

export default function AuthLayout() {
  const { user, loading } = useAuth();
  console.log("[AuthLayout] render: user =", !!user, "loading =", loading);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME.colors.gold} />
      </View>
    );
  }

  // If user is already authenticated, redirect to dashboard
  if (user) {
    return <Redirect href="/" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" options={{ headerShown: false }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: THEME.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

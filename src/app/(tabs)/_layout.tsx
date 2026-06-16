import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { THEME } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const { user, loading } = useAuth();
  const insets = useSafeAreaInsets();
  const tabBarHeight = 58 + insets.bottom;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME.colors.gold} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: THEME.colors.primary,
        tabBarInactiveTintColor: THEME.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: THEME.colors.backgroundCard,
          borderTopWidth: 1,
          borderTopColor: THEME.colors.goldBorder,
          height: tabBarHeight,
          paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 10 : 6),
          paddingTop: 8,
          ...THEME.shadows.small,
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter_500Medium',
          fontSize: 11,
          marginBottom: Platform.OS === 'android' ? 2 : 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
          ),
          tabBarStyle: { display: 'none' },
        }}
      />

      <Tabs.Screen
        name="reader"
        options={{
          title: 'Reader',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'book' : 'book-outline'} size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="chat"
        options={{
          title: 'QuranChat',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="dua"
        options={{
          title: 'Duas',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'heart' : 'heart-outline'} size={22} color={color} />
          ),
        }}
      />
    </Tabs>
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

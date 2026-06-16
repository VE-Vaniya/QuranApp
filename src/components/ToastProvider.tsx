import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../theme';

type ToastType = 'success' | 'error' | 'info';

interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState>({ visible: false, message: '', type: 'success' });
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setToast({ visible: true, message, type });
    Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    hideTimer.current = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => {
        setToast((prev) => ({ ...prev, visible: false }));
      });
    }, 2800);
  }, [opacity]);

  const iconName =
    toast.type === 'success' ? 'checkmark-circle-outline' :
    toast.type === 'error' ? 'alert-circle-outline' :
    'information-circle-outline';

  const accentColor =
    toast.type === 'success' ? THEME.colors.primary :
    toast.type === 'error' ? THEME.colors.error :
    THEME.colors.goldDark;

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast.visible && (
        <Animated.View style={[styles.toastWrap, { opacity }]} pointerEvents="none">
          <View style={[styles.toast, { borderColor: accentColor }]}>
            <Ionicons name={iconName} size={20} color={accentColor} />
            <Text style={styles.toastText}>{toast.message}</Text>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const styles = StyleSheet.create({
  toastWrap: {
    position: 'absolute',
    top: 56,
    left: 20,
    right: 20,
    zIndex: 9999,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: THEME.colors.backgroundCard,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    ...THEME.shadows.medium,
    maxWidth: '100%',
  },
  toastText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: THEME.colors.primary,
  },
});

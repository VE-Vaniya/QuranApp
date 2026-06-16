import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../theme';

interface ThemedDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel: () => void;
  destructive?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function ThemedDialog({
  visible,
  title,
  message,
  confirmText = 'OK',
  cancelText,
  onConfirm,
  onCancel,
  destructive = false,
  loading = false,
  icon = 'checkmark-circle-outline',
}: ThemedDialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.cardOuter}>
          <View style={styles.cardInner}>
            <View style={styles.iconCircle}>
              <Ionicons
                name={icon}
                size={28}
                color={destructive ? THEME.colors.error : THEME.colors.gold}
              />
            </View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
            <View style={styles.actions}>
              {cancelText ? (
                <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} disabled={loading}>
                  <Text style={styles.cancelText}>{cancelText}</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                style={[styles.confirmBtn, destructive && styles.destructiveBtn]}
                onPress={onConfirm || onCancel}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={THEME.colors.textLight} size="small" />
                ) : (
                  <Text style={styles.confirmText}>{confirmText}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 51, 46, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  cardOuter: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.colors.goldBorder,
    padding: 3,
    backgroundColor: THEME.colors.goldBorder,
    ...THEME.shadows.elegant,
  },
  cardInner: {
    backgroundColor: THEME.colors.backgroundCard,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: THEME.colors.gold,
    padding: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(197, 160, 89, 0.12)',
    borderWidth: 1,
    borderColor: THEME.colors.goldBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: THEME.colors.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: THEME.colors.textSecondary,
  },
  confirmBtn: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    backgroundColor: THEME.colors.primary,
    borderWidth: 1,
    borderColor: THEME.colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  destructiveBtn: {
    backgroundColor: THEME.colors.error,
    borderColor: '#FCA5A5',
  },
  confirmText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: THEME.colors.textLight,
  },
});

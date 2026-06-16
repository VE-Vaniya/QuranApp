import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { THEME } from '../theme';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useToast } from './ToastProvider';
import { ThemedDialog } from './ThemedDialog';
import { PatternBackground } from './PatternBackground';

const DRAWER_WIDTH = Math.min(Dimensions.get('window').width * 0.82, 320);

type MenuPanel = 'main' | 'duas' | 'notes' | 'password';

interface SideMenuProps {
  visible: boolean;
  onClose: () => void;
}

interface UserNote {
  id: string;
  surah_number: number;
  ayah_number: number;
  note_content: string;
}

interface UserDua {
  id: string;
  title: string;
  content: string;
  pray_count: number;
  created_at: string;
}

export function SideMenu({ visible, onClose }: SideMenuProps) {
  const { user, profile, isMockMode, signOut, updatePassword } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [panel, setPanel] = useState<MenuPanel>('main');
  const [myDuas, setMyDuas] = useState<UserDua[]>([]);
  const [myNotes, setMyNotes] = useState<UserNote[]>([]);
  const [loadingPanel, setLoadingPanel] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [logoutDialog, setLogoutDialog] = useState(false);

  useEffect(() => {
    if (visible) {
      setPanel('main');
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 260, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 260, useNativeDriver: true }),
      ]).start();
    } else {
      slideAnim.setValue(-DRAWER_WIDTH);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const closeMenu = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: -DRAWER_WIDTH, duration: 220, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(onClose);
  };

  const loadMyDuas = async () => {
    if (!user) return;
    setLoadingPanel(true);
    try {
      if (isMockMode) {
        const stored = await AsyncStorage.getItem('@quranchat_mock_duas');
        const all: UserDua[] = stored ? JSON.parse(stored) : [];
        setMyDuas(all.filter((d: any) => d.user_id === user.id));
      } else {
        const { data } = await supabase
          .from('dua_requests')
          .select('id, title, content, pray_count, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        setMyDuas(data || []);
      }
    } finally {
      setLoadingPanel(false);
    }
  };

  const loadMyNotes = async () => {
    if (!user) return;
    setLoadingPanel(true);
    try {
      if (isMockMode) {
        const stored = await AsyncStorage.getItem(`@quranchat_mock_notes_${user.id}`);
        setMyNotes(stored ? JSON.parse(stored) : []);
      } else {
        const { data } = await supabase
          .from('user_notes')
          .select('id, surah_number, ayah_number, note_content')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });
        setMyNotes(data || []);
      }
    } finally {
      setLoadingPanel(false);
    }
  };

  const openPanel = (next: MenuPanel) => {
    setPanel(next);
    if (next === 'duas') loadMyDuas();
    if (next === 'notes') loadMyNotes();
    if (next === 'password') {
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }
    setChangingPassword(true);
    try {
      await updatePassword(newPassword);
      showToast('Password updated successfully.');
      setPanel('main');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      showToast(e.message || 'Could not update password.', 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    setLogoutDialog(false);
    closeMenu();
    await signOut();
  };

  const renderMainMenu = () => (
    <>
      <View style={styles.emailBlock}>
        <Ionicons name="mail-outline" size={18} color={THEME.colors.gold} />
        <Text style={styles.emailText}>{user?.email || 'Signed in'}</Text>
      </View>

      <TouchableOpacity style={styles.menuItem} onPress={() => openPanel('duas')}>
        <Ionicons name="heart-outline" size={20} color={THEME.colors.primary} />
        <Text style={styles.menuItemText}>My Duas</Text>
        <Ionicons name="chevron-forward" size={16} color={THEME.colors.textSecondary} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem} onPress={() => openPanel('password')}>
        <Ionicons name="lock-closed-outline" size={20} color={THEME.colors.primary} />
        <Text style={styles.menuItemText}>Change Password</Text>
        <Ionicons name="chevron-forward" size={16} color={THEME.colors.textSecondary} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem} onPress={() => openPanel('notes')}>
        <Ionicons name="document-text-outline" size={20} color={THEME.colors.primary} />
        <Text style={styles.menuItemText}>All Notes</Text>
        <Ionicons name="chevron-forward" size={16} color={THEME.colors.textSecondary} />
      </TouchableOpacity>

      <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={() => setLogoutDialog(true)}>
        <Ionicons name="log-out-outline" size={20} color={THEME.colors.error} />
        <Text style={[styles.menuItemText, { color: THEME.colors.error }]}>Logout</Text>
      </TouchableOpacity>
    </>
  );

  const renderPanelContent = () => {
    if (panel === 'duas') {
      return (
        <ScrollView style={styles.panelScroll} showsVerticalScrollIndicator={false}>
          {loadingPanel ? (
            <ActivityIndicator color={THEME.colors.gold} style={{ marginTop: 24 }} />
          ) : myDuas.length === 0 ? (
            <Text style={styles.emptyText}>You have not shared any duas yet.</Text>
          ) : (
            myDuas.map((dua) => (
              <View key={dua.id} style={styles.listCard}>
                <Text style={styles.listCardTitle}>{dua.title}</Text>
                <Text style={styles.listCardBody} numberOfLines={3}>{dua.content}</Text>
                <Text style={styles.listCardMeta}>{dua.pray_count} people praying</Text>
              </View>
            ))
          )}
        </ScrollView>
      );
    }

    if (panel === 'notes') {
      return (
        <ScrollView style={styles.panelScroll} showsVerticalScrollIndicator={false}>
          {loadingPanel ? (
            <ActivityIndicator color={THEME.colors.gold} style={{ marginTop: 24 }} />
          ) : myNotes.length === 0 ? (
            <Text style={styles.emptyText}>No reflection notes saved yet.</Text>
          ) : (
            myNotes.map((note) => (
              <TouchableOpacity
                key={note.id}
                style={styles.listCard}
                onPress={() => {
                  closeMenu();
                  router.push({
                    pathname: '/note-modal',
                    params: { surah: note.surah_number, ayah: note.ayah_number, surahName: `Surah ${note.surah_number}` },
                  });
                }}
              >
                <Text style={styles.listCardTitle}>Surah {note.surah_number}:{note.ayah_number}</Text>
                <Text style={styles.listCardBody} numberOfLines={3}>{note.note_content}</Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      );
    }

    if (panel === 'password') {
      return (
        <View style={styles.panelScroll}>
          <Text style={styles.panelHint}>Enter a new password for your account.</Text>
          <TextInput
            style={styles.input}
            placeholder="New password"
            placeholderTextColor={THEME.colors.textSecondary}
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <TextInput
            style={styles.input}
            placeholder="Confirm password"
            placeholderTextColor={THEME.colors.textSecondary}
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity style={styles.primaryBtn} onPress={handleChangePassword} disabled={changingPassword}>
            {changingPassword ? (
              <ActivityIndicator color={THEME.colors.textLight} />
            ) : (
              <Text style={styles.primaryBtnText}>Update Password</Text>
            )}
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  const panelTitles: Record<MenuPanel, string> = {
    main: profile?.display_name || 'Menu',
    duas: 'My Duas',
    notes: 'All Notes',
    password: 'Change Password',
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="none" onRequestClose={closeMenu}>
        <View style={styles.modalRoot}>
          <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
            <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={closeMenu} />
          </Animated.View>

          <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
            <PatternBackground style={styles.drawerPattern}>
            <View style={styles.drawerHeader}>
              {panel !== 'main' ? (
                <TouchableOpacity onPress={() => setPanel('main')} style={styles.backBtn}>
                  <Ionicons name="arrow-back" size={22} color={THEME.colors.primary} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={closeMenu} style={styles.backBtn}>
                  <Ionicons name="close" size={22} color={THEME.colors.primary} />
                </TouchableOpacity>
              )}
              <Text
                style={[styles.drawerTitle, panel === 'main' && styles.drawerTitleMain]}
                numberOfLines={1}
              >
                {panelTitles[panel]}
              </Text>
            </View>

            <View style={styles.drawerBody}>
              {panel === 'main' ? renderMainMenu() : renderPanelContent()}
            </View>
            </PatternBackground>
          </Animated.View>
        </View>
      </Modal>

      <ThemedDialog
        visible={logoutDialog}
        title="Sign Out"
        message="Are you sure you want to sign out of QuranChat on this device?"
        confirmText="Logout"
        cancelText="Cancel"
        destructive
        icon="log-out-outline"
        onConfirm={handleLogout}
        onCancel={() => setLogoutDialog(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  modalRoot: { flex: 1 },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 51, 46, 0.4)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    borderRightWidth: 1,
    borderRightColor: THEME.colors.goldBorder,
    ...THEME.shadows.elegant,
    overflow: 'hidden',
  },
  drawerPattern: {
    flex: 1,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    gap: 8,
    backgroundColor: 'rgba(250, 247, 240, 0.92)',
  },
  backBtn: { padding: 4 },
  drawerTitle: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: THEME.colors.primary,
  },
  drawerTitleMain: {
    fontSize: 24,
  },
  drawerBody: { flex: 1, padding: 16 },
  emailBlock: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    gap: 8,
  },
  emailText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: THEME.colors.textSecondary,
    textAlign: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  menuItemText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: THEME.colors.primary,
  },
  logoutItem: { marginTop: 8, borderBottomWidth: 0 },
  panelScroll: { flex: 1 },
  panelHint: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: THEME.colors.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  input: {
    height: 44,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: THEME.colors.textDark,
    marginBottom: 12,
  },
  primaryBtn: {
    height: 44,
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.gold,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  primaryBtnText: {
    color: THEME.colors.textLight,
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
  },
  listCard: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  listCardTitle: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: THEME.colors.primary,
    marginBottom: 4,
  },
  listCardBody: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: THEME.colors.textDark,
    lineHeight: 17,
  },
  listCardMeta: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    color: THEME.colors.textSecondary,
    marginTop: 6,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 18,
  },
});

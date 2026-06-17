import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  Modal,
  Animated,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { THEME } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PatternBackground } from '../../components/PatternBackground';
import { useToast } from '../../components/ToastProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface DuaRequest {
  id: string;
  user_id: string;
  display_name: string;
  title: string;
  content: string;
  pray_count: number;
  created_at: string;
  has_prayed?: boolean;
}

const INITIAL_DUAS: DuaRequest[] = [
  {
    id: 'mock-dua-1',
    user_id: 'other-user-1',
    display_name: 'Brother Tariq',
    title: 'Shifa (Healing) for my Mother',
    content: 'Dua for my mother who is undergoing surgery tomorrow. Please pray for her complete shifa and recovery. May Allah grant her ease.',
    pray_count: 14,
    created_at: new Date(Date.now() - 4 * 3600000).toISOString(),
    has_prayed: false
  },
  {
    id: 'mock-dua-2',
    user_id: 'other-user-2',
    display_name: 'Sister Fatima',
    title: 'Guidance and focus in Board Exams',
    content: 'Asking for prayers as I take my final board exams this week. May Allah grant me focus, remove my anxiety, and reward my hard work.',
    pray_count: 9,
    created_at: new Date(Date.now() - 12 * 3600000).toISOString(),
    has_prayed: true
  },
  {
    id: 'mock-dua-3',
    user_id: 'other-user-3',
    display_name: 'Servant of Allah',
    title: 'Overcoming personal hardship',
    content: 'Requesting dua for strength to overcome a difficult trial in my family. May Allah grant us patience and keep us all steadfast in faith.',
    pray_count: 27,
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    has_prayed: false
  }
];

export default function DuaFeedScreen() {
  const { user, profile, isMockMode, incrementStreak } = useAuth();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  
  // Data lists
  const [duas, setDuas] = useState<DuaRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [newDuaTitle, setNewDuaTitle] = useState('');
  const [newDuaContent, setNewDuaContent] = useState('');
  const [posting, setPosting] = useState(false);

  // Animations
  const modalScale = useRef(new Animated.Value(0.9)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadDuas();
  }, [user]);

  const animateModalIn = () => {
    setModalVisible(true);
    Animated.parallel([
      Animated.timing(modalOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(modalScale, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true })
    ]).start();
  };

  const animateModalOut = () => {
    Animated.parallel([
      Animated.timing(modalOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(modalScale, { toValue: 0.9, duration: 150, useNativeDriver: true })
    ]).start(() => {
      setModalVisible(false);
      setNewDuaTitle('');
      setNewDuaContent('');
    });
  };

  const loadDuas = async () => {
    setLoading(true);
    try {
      if (isMockMode) {
        const stored = await AsyncStorage.getItem('@quranchat_mock_duas');
        if (stored) {
          setDuas(JSON.parse(stored));
        } else {
          // Initialize mock feed
          await AsyncStorage.setItem('@quranchat_mock_duas', JSON.stringify(INITIAL_DUAS));
          setDuas(INITIAL_DUAS);
        }
      } else {
        // 1. Fetch duas
        const { data: duasData, error: duasError } = await supabase
          .from('dua_requests')
          .select('*')
          .order('created_at', { ascending: false });

        if (duasError) throw duasError;

        if (duasData) {
          // 2. Fetch current user's prayers to mark 'has_prayed'
          const { data: prayersData, error: prayersError } = await supabase
            .from('dua_prayers')
            .select('dua_id')
            .eq('user_id', user.id);

          const prayedSet = new Set(prayersData?.map(p => p.dua_id) || []);

          const processedDuas = duasData.map(d => ({
            ...d,
            has_prayed: prayedSet.has(d.id)
          }));

          setDuas(processedDuas);
        }
      }
    } catch (e: any) {
      console.error(e);
      showToast('Could not load dua requests.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadDuas();
  };

  const handlePray = async (dua: DuaRequest) => {
    if (!user || dua.user_id === user.id) return;

    // Optimistic UI updates
    const updatedDuas = duas.map(d => {
      if (d.id === dua.id) {
        const nextHasPrayed = !d.has_prayed;
        return {
          ...d,
          has_prayed: nextHasPrayed,
          pray_count: nextHasPrayed ? d.pray_count + 1 : Math.max(0, d.pray_count - 1)
        };
      }
      return d;
    });
    setDuas(updatedDuas);

    try {
      if (isMockMode) {
        // Save mock states locally
        await AsyncStorage.setItem('@quranchat_mock_duas', JSON.stringify(updatedDuas));
      } else {
        if (dua.has_prayed) {
          // Remove prayer
          const { error } = await supabase
            .from('dua_prayers')
            .delete()
            .eq('dua_id', dua.id)
            .eq('user_id', user.id);
          
          if (error) throw error;
        } else {
          // Add prayer
          const { error } = await supabase
            .from('dua_prayers')
            .insert({ dua_id: dua.id, user_id: user.id });

          if (error) throw error;
        }
      }
      
      // Increment streak for prayer/support activity
      if (!dua.has_prayed) {
        await incrementStreak();
      }
    } catch (e) {
      console.error("Failed to toggle prayer support:", e);
      // Revert optimistic state on error
      loadDuas();
    }
  };

  const handlePostDua = async () => {
    if (!newDuaTitle.trim() || !newDuaContent.trim()) {
      showToast('Please enter a title and description.', 'error');
      return;
    }

    setPosting(true);
    try {
      const displayName = profile?.display_name || 'Brother/Sister';
      
      if (isMockMode) {
        const newDua: DuaRequest = {
          id: Math.random().toString(),
          user_id: user.id,
          display_name: displayName,
          title: newDuaTitle.trim(),
          content: newDuaContent.trim(),
          pray_count: 1,
          created_at: new Date().toISOString(),
          has_prayed: true
        };

        const updated = [newDua, ...duas];
        await AsyncStorage.setItem('@quranchat_mock_duas', JSON.stringify(updated));
        setDuas(updated);
      } else {
        const { error } = await supabase
          .from('dua_requests')
          .insert({
            user_id: user.id,
            display_name: displayName,
            title: newDuaTitle.trim(),
            content: newDuaContent.trim(),
            pray_count: 0
          });

        if (error) throw error;
        await loadDuas();
      }

      await incrementStreak();
      animateModalOut();
      showToast('Dua shared with the community.');
    } catch (e: any) {
      showToast(e.message || 'Failed to submit dua request.', 'error');
    } finally {
      setPosting(false);
    }
  };

  const renderDuaItem = ({ item }: { item: DuaRequest }) => {
    const timeAgo = (dateStr: string) => {
      const date = new Date(dateStr);
      const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
      
      let interval = Math.floor(seconds / 31536000);
      if (interval >= 1) return `${interval}y ago`;
      interval = Math.floor(seconds / 2592000);
      if (interval >= 1) return `${interval}mo ago`;
      interval = Math.floor(seconds / 86400);
      if (interval >= 1) return `${interval}d ago`;
      interval = Math.floor(seconds / 3600);
      if (interval >= 1) return `${interval}h ago`;
      interval = Math.floor(seconds / 60);
      if (interval >= 1) return `${interval}m ago`;
      return 'just now';
    };

    const isOwnDua = item.user_id === user?.id;

    return (
      <View style={styles.duaCard}>
        <View style={styles.duaHeader}>
          <View style={styles.duaUserIcon}>
            <Ionicons name="person" size={14} color={THEME.colors.primary} />
          </View>
          <View style={styles.duaUserMeta}>
            <Text style={styles.duaUserName}>{item.display_name}</Text>
            <Text style={styles.duaTimeText}>{timeAgo(item.created_at)}</Text>
          </View>
        </View>

        <Text style={styles.duaTitle}>{item.title}</Text>
        <Text style={styles.duaContent}>"{item.content}"</Text>

        <View style={styles.duaFooter}>
          {!isOwnDua ? (
            <TouchableOpacity
              style={[styles.prayBtn, item.has_prayed ? styles.prayBtnActive : {}]}
              onPress={() => handlePray(item)}
            >
              <Ionicons
                name={item.has_prayed ? 'heart' : 'heart-outline'}
                size={18}
                color={item.has_prayed ? THEME.colors.textLight : THEME.colors.gold}
              />
              <Text style={[styles.prayBtnText, item.has_prayed ? styles.prayBtnTextActive : {}]}>
                {item.has_prayed ? 'Prayed' : 'Pray for them'}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.ownDuaLabel}>Your dua request</Text>
          )}

          <Text style={styles.duaStats}>
            {item.pray_count} {item.pray_count === 1 ? 'person' : 'people'} praying
          </Text>
        </View>
      </View>
    );
  };

  return (
    <PatternBackground>
    <View style={styles.container}>
      <View style={[styles.headerBar, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={styles.headerTitle}>Dua Feed</Text>
          <Text style={styles.headerSubtitle}>Community Prayer Requests</Text>
        </View>
        <TouchableOpacity style={styles.addDuaBtn} onPress={animateModalIn}>
          <Ionicons name="add" size={24} color={THEME.colors.textLight} />
        </TouchableOpacity>
      </View>

      {/* Main List */}
      {loading && !refreshing ? (
        <ActivityIndicator size="large" color={THEME.colors.gold} style={{ marginTop: 80 }} />
      ) : (
        <FlatList
          data={duas}
          keyExtractor={item => item.id}
          renderItem={renderDuaItem}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={() => (
            <View style={styles.feedInfoBox}>
              <Text style={styles.feedInfoText}>
                "The supplication of a Muslim for his brother in his absence will certainly be answered."
              </Text>
              <Text style={styles.feedInfoRef}>— Sahih Muslim</Text>
            </View>
          )}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbox-ellipses-outline" size={48} color={THEME.colors.border} />
              <Text style={styles.emptyText}>No prayer requests shared yet.</Text>
            </View>
          )}
        />
      )}

      {/* Write New Dua Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="none"
        onRequestClose={animateModalOut}
      >
        <Animated.View style={[styles.modalOverlay, { opacity: modalOpacity }]}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboardContainer}
          >
            <Animated.View style={[styles.modalContainer, { transform: [{ scale: modalScale }] }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Request Prayers</Text>
                <TouchableOpacity onPress={animateModalOut}>
                  <Ionicons name="close" size={24} color={THEME.colors.primary} />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalLabel}>TITLE / NEED</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Health recovery for my grandfather"
                placeholderTextColor={THEME.colors.textSecondary}
                value={newDuaTitle}
                onChangeText={setNewDuaTitle}
                maxLength={60}
              />

              <Text style={styles.modalLabel}>DUA DETAILS</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                multiline
                numberOfLines={5}
                placeholder="Share your prayer request with brothers and sisters..."
                placeholderTextColor={THEME.colors.textSecondary}
                value={newDuaContent}
                onChangeText={setNewDuaContent}
                maxLength={300}
                textAlignVertical="top"
              />

              <TouchableOpacity 
                style={styles.submitBtn} 
                onPress={handlePostDua}
                disabled={posting}
              >
                {posting ? (
                  <ActivityIndicator color={THEME.colors.textLight} />
                ) : (
                  <Text style={styles.submitBtnText}>Share request</Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          </KeyboardAvoidingView>
        </Animated.View>
      </Modal>
    </View>
    </PatternBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  headerBar: {
    paddingBottom: 12,
    paddingHorizontal: 20,
    backgroundColor: THEME.colors.backgroundCard,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.goldBorder,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...THEME.shadows.small,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: THEME.colors.primary,
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: THEME.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addDuaBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.gold,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...THEME.shadows.small,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  feedInfoBox: {
    marginVertical: 16,
    padding: 16,
    backgroundColor: 'rgba(197, 160, 89, 0.08)',
    borderColor: THEME.colors.goldBorder,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
  },
  feedInfoText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  feedInfoRef: {
    fontSize: 9,
    fontFamily: 'Inter_500Medium',
    color: THEME.colors.goldDark,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  duaCard: {
    backgroundColor: THEME.colors.backgroundCard,
    borderColor: THEME.colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...THEME.shadows.small,
  },
  duaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  duaUserIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(26, 51, 46, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  duaUserMeta: {
    flex: 1,
  },
  duaUserName: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: THEME.colors.primary,
  },
  duaTimeText: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    color: THEME.colors.textSecondary,
  },
  duaTitle: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: THEME.colors.primary,
    marginBottom: 6,
  },
  duaContent: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: THEME.colors.textDark,
    lineHeight: 18,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  duaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    paddingTop: 12,
  },
  prayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.gold,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  prayBtnActive: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  prayBtnText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: THEME.colors.goldDark,
  },
  prayBtnTextActive: {
    color: THEME.colors.textLight,
  },
  duaStats: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: THEME.colors.textSecondary,
  },
  ownDuaLabel: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: THEME.colors.goldDark,
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    marginVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: THEME.colors.textSecondary,
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalKeyboardContainer: {
    width: '100%',
    alignItems: 'center',
  },
  modalContainer: {
    width: '100%',
    backgroundColor: THEME.colors.backgroundCard,
    borderWidth: 1,
    borderColor: THEME.colors.gold,
    borderRadius: 16,
    padding: 24,
    ...THEME.shadows.medium,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    paddingBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: THEME.colors.primary,
  },
  modalLabel: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: THEME.colors.primary,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  modalInput: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 8,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: THEME.colors.textDark,
    marginBottom: 16,
  },
  modalTextArea: {
    height: 100,
    paddingVertical: 10,
  },
  submitBtn: {
    height: 44,
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.gold,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: {
    color: THEME.colors.textLight,
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
  },
});

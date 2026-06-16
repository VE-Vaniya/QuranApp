import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { THEME } from '../theme';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { PatternBackground } from '../components/PatternBackground';
import { useToast } from '../components/ToastProvider';
import { ThemedDialog } from '../components/ThemedDialog';

export default function NoteModal() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, isMockMode, incrementStreak } = useAuth();
  const { showToast } = useToast();

  const surahNum = parseInt(params.surah as string);
  const ayahNum = parseInt(params.ayah as string);
  const surahName = params.surahName as string;

  const [noteContent, setNoteContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [existingNoteId, setExistingNoteId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [emptyDialogOpen, setEmptyDialogOpen] = useState(false);

  useEffect(() => {
    if (user && surahNum && ayahNum) {
      fetchExistingNote();
    }
  }, [user, surahNum, ayahNum]);

  const fetchExistingNote = async () => {
    setFetching(true);
    try {
      if (isMockMode) {
        const key = `@quranchat_mock_notes_${user.id}`;
        const stored = await AsyncStorage.getItem(key);
        if (stored) {
          const notes = JSON.parse(stored);
          const match = notes.find((n: any) => n.surah_number === surahNum && n.ayah_number === ayahNum);
          if (match) {
            setNoteContent(match.note_content);
            setExistingNoteId(match.id);
          }
        }
      } else {
        const { data, error } = await supabase
          .from('user_notes')
          .select('id, note_content')
          .eq('user_id', user.id)
          .eq('surah_number', surahNum)
          .eq('ayah_number', ayahNum)
          .maybeSingle();

        if (!error && data) {
          setNoteContent(data.note_content);
          setExistingNoteId(data.id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async () => {
    if (!noteContent.trim()) {
      setEmptyDialogOpen(true);
      return;
    }

    setLoading(true);
    try {
      if (isMockMode) {
        const key = `@quranchat_mock_notes_${user.id}`;
        const stored = await AsyncStorage.getItem(key);
        let notes = stored ? JSON.parse(stored) : [];

        if (existingNoteId) {
          notes = notes.map((n: any) =>
            n.id === existingNoteId
              ? { ...n, note_content: noteContent, updated_at: new Date().toISOString() }
              : n
          );
        } else {
          const newNote = {
            id: Math.random().toString(36).substring(7),
            user_id: user.id,
            surah_number: surahNum,
            ayah_number: ayahNum,
            note_content: noteContent,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          notes.push(newNote);
          setExistingNoteId(newNote.id);
        }

        await AsyncStorage.setItem(key, JSON.stringify(notes));
      } else {
        if (existingNoteId) {
          const { error } = await supabase
            .from('user_notes')
            .update({ note_content: noteContent, updated_at: new Date().toISOString() })
            .eq('id', existingNoteId);
          if (error) throw error;
        } else {
          const { data, error } = await supabase
            .from('user_notes')
            .insert({
              user_id: user.id,
              surah_number: surahNum,
              ayah_number: ayahNum,
              note_content: noteContent,
            })
            .select('id')
            .single();
          if (error) throw error;
          if (data) setExistingNoteId(data.id);
        }
      }

      await incrementStreak();
      showToast(existingNoteId ? 'Note updated.' : 'Note added.');
      router.back();
    } catch (e: any) {
      showToast(e.message || 'Failed to save note.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteDialogOpen(false);
    setLoading(true);
    try {
      if (isMockMode) {
        const key = `@quranchat_mock_notes_${user.id}`;
        const stored = await AsyncStorage.getItem(key);
        if (stored) {
          let notes = JSON.parse(stored);
          notes = notes.filter((n: any) => n.id !== existingNoteId);
          await AsyncStorage.setItem(key, JSON.stringify(notes));
        }
      } else {
        const { error } = await supabase.from('user_notes').delete().eq('id', existingNoteId);
        if (error) throw error;
      }
      showToast('Note deleted.');
      router.back();
    } catch (e: any) {
      showToast(e.message || 'Failed to delete note.', 'error');
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
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <View style={styles.innerCard}>
              <View style={styles.header}>
                <View style={styles.refBadge}>
                  <Text style={styles.refText}>Surah {surahName} [{surahNum}:{ayahNum}]</Text>
                </View>
              </View>

              <Text style={styles.promptText}>
                Write down your reflection, notes, or learnings from this verse. Reflecting on scripture builds your spiritual connection.
              </Text>

              {fetching ? (
                <ActivityIndicator size="large" color={THEME.colors.gold} style={{ marginVertical: 40 }} />
              ) : (
                <View>
                  <TextInput
                    style={styles.textArea}
                    multiline
                    numberOfLines={8}
                    placeholder="Today, this verse reminds me to..."
                    placeholderTextColor={THEME.colors.textSecondary}
                    value={noteContent}
                    onChangeText={setNoteContent}
                    textAlignVertical="top"
                  />

                  <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
                    {loading ? (
                      <ActivityIndicator color={THEME.colors.textLight} />
                    ) : (
                      <Text style={styles.saveBtnText}>Save Reflection</Text>
                    )}
                  </TouchableOpacity>

                  {existingNoteId && (
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => setDeleteDialogOpen(true)}
                      disabled={loading}
                    >
                      <Ionicons name="trash-outline" size={16} color={THEME.colors.error} />
                      <Text style={styles.deleteBtnText}>Delete Note</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ThemedDialog
        visible={emptyDialogOpen}
        title="Empty Note"
        message="Please write something before saving your reflection."
        confirmText="OK"
        icon="create-outline"
        onCancel={() => setEmptyDialogOpen(false)}
      />

      <ThemedDialog
        visible={deleteDialogOpen}
        title="Delete Note"
        message="Are you sure you want to delete this reflection?"
        confirmText="Delete"
        cancelText="Cancel"
        destructive
        icon="trash-outline"
        loading={loading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </PatternBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    padding: 20,
    flexGrow: 1,
    justifyContent: 'center',
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
  header: { alignItems: 'center', marginBottom: 16 },
  refBadge: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.gold,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  refText: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: THEME.colors.textLight,
  },
  promptText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  textArea: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 8,
    padding: 16,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: THEME.colors.textDark,
    height: 160,
    marginBottom: 20,
  },
  saveBtn: {
    height: 48,
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.gold,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    color: THEME.colors.textLight,
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    padding: 8,
  },
  deleteBtnText: {
    color: THEME.colors.error,
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
  },
});

import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  Platform,
  Share,
  Clipboard
} from 'react-native';
import { THEME } from '../../theme';
import { SURAH_LIST, SurahListItem } from '../../constants/surahs';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PatternBackground } from '../../components/PatternBackground';
import { searchSurahsByName } from '../../lib/surahSearch';
import { useToast } from '../../components/ToastProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CenteredTitleWithVines, VineBorderBox } from '../../components/VineDecorations';

interface Ayah {
  number: number;
  numberInSurah: number;
  text: string;
  translation: string;
}

export default function ReaderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, isMockMode } = useAuth();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  
  // Navigation states
  const [selectedSurah, setSelectedSurah] = useState<SurahListItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data states
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [surahNameResults, setSurahNameResults] = useState<SurahListItem[]>([]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [surahNotes, setSurahNotes] = useState<Record<number, string>>({}); // ayahNumber -> noteContent
  
  // Loading & Error states
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle deep linking from home screen / chat
  useEffect(() => {
    if (params.surah) {
      const surahNum = parseInt(params.surah as string);
      const surahItem = SURAH_LIST.find(s => s.number === surahNum);
      if (surahItem) {
        handleSelectSurah(surahItem);
      }
    }
  }, [params.surah]);

  // Load user notes for current surah
  useEffect(() => {
    if (selectedSurah && user) {
      loadNotesForSurah(selectedSurah.number);
    }
  }, [selectedSurah, user]);

  const loadNotesForSurah = async (surahNumber: number) => {
    try {
      if (isMockMode) {
        const key = `@quranchat_mock_notes_${user.id}`;
        const stored = await AsyncStorage.getItem(key);
        if (stored) {
          const allNotes = JSON.parse(stored);
          const filtered: Record<number, string> = {};
          allNotes.forEach((n: any) => {
            if (n.surah_number === surahNumber) {
              filtered[n.ayah_number] = n.note_content;
            }
          });
          setSurahNotes(filtered);
        }
      } else {
        const { data, error } = await supabase
          .from('user_notes')
          .select('ayah_number, note_content')
          .eq('user_id', user.id)
          .eq('surah_number', surahNumber);

        if (!error && data) {
          const notesMap: Record<number, string> = {};
          data.forEach(n => {
            notesMap[n.ayah_number] = n.note_content;
          });
          setSurahNotes(notesMap);
        }
      }
    } catch (e) {
      console.error("Error loading notes for Surah:", e);
    }
  };

  const handleSelectSurah = async (surah: SurahListItem) => {
    setSelectedSurah(surah);
    setLoading(true);
    setErrorMsg('');
    setAyahs([]);

    try {
      const response = await fetch(
        `https://api.alquran.cloud/v1/surah/${surah.number}/editions/quran-uthmani,en.sahih`
      );
      const json = await response.json();

      if (json.code === 200 && json.data) {
        const arabicAyahs = json.data[0].ayahs;
        const englishAyahs = json.data[1].ayahs;

        const zippedAyahs = arabicAyahs.map((ar: any, idx: number) => ({
          number: ar.number,
          numberInSurah: ar.numberInSurah,
          text: ar.text,
          translation: englishAyahs[idx].text,
        }));

        setAyahs(zippedAyahs);
      } else {
        setErrorMsg('Failed to load Surah text. Please check your internet connection.');
      }
    } catch (e) {
      setErrorMsg('Could not reach Quran server. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setErrorMsg('');
    setIsSearchActive(true);

    const localMatches = searchSurahsByName(searchQuery);
    setSurahNameResults(localMatches);

    try {
      const response = await fetch(
        `https://api.alquran.cloud/v1/search/${encodeURIComponent(searchQuery)}/all/en.sahih`
      );
      const json = await response.json();
      if (json.code === 200 && json.data?.matches) {
        setSearchResults(json.data.matches);
      } else {
        setSearchResults([]);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchQueryChange = (text: string) => {
    setSearchQuery(text);
    if (!text.trim()) {
      clearSearch();
      return;
    }
    const matches = searchSurahsByName(text);
    setSurahNameResults(matches);
    if (text.trim().length >= 2) {
      setIsSearchActive(true);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSurahNameResults([]);
    setErrorMsg('');
    setIsSearchActive(false);
  };

  const handleCopy = (ayah: Ayah) => {
    const refText = `${ayah.text}\n\n"${ayah.translation}"\n— Surah ${selectedSurah?.englishName} (${selectedSurah?.number}:${ayah.numberInSurah})`;
    Clipboard.setString(refText);
    showToast('Verse copied to clipboard.');
  };

  const handleShare = async (ayah: Ayah) => {
    try {
      await Share.share({
        message: `"${ayah.translation}"\n— Surah ${selectedSurah?.englishName} [${selectedSurah?.number}:${ayah.numberInSurah}]`,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenNoteModal = (ayah: Ayah) => {
    router.push({
      pathname: '/note-modal',
      params: { 
        surah: selectedSurah?.number,
        ayah: ayah.numberInSurah,
        surahName: selectedSurah?.englishName
      }
    });
  };

  // Render a Surah row in the browsing directory
  const renderSurahItem = ({ item }: { item: SurahListItem }) => (
    <TouchableOpacity 
      style={styles.surahItem} 
      onPress={() => handleSelectSurah(item)}
    >
      <View style={styles.surahNumContainer}>
        <Text style={styles.surahNumText}>{item.number}</Text>
      </View>
      <View style={styles.surahMeta}>
        <Text style={styles.surahNameEng}>{item.englishName}</Text>
        <Text style={styles.surahNameTrans}>{item.englishNameTranslation} • {item.numberOfAyahs} Verses</Text>
      </View>
      <View style={styles.surahArabicContainer}>
        <Text style={styles.surahArabicName}>{item.name}</Text>
        <Text style={styles.revelationText}>{item.revelationType}</Text>
      </View>
    </TouchableOpacity>
  );

  // Render a matching verse in the search results
  const renderSearchResultItem = ({ item }: { item: any }) => {
    const surahNum = item.surah.number;
    const surahItem = SURAH_LIST.find(s => s.number === surahNum);
    return (
      <TouchableOpacity 
        style={styles.searchResultCard} 
        onPress={() => {
          if (surahItem) handleSelectSurah(surahItem);
        }}
      >
        <View style={styles.searchResultHeader}>
          <Text style={styles.searchResultTitle}>
            Surah {item.surah.englishName} ({item.surah.number}:{item.numberInSurah})
          </Text>
          <Ionicons name="chevron-forward" size={16} color={THEME.colors.gold} />
        </View>
        <Text style={styles.searchResultText}>"{item.text}"</Text>
      </TouchableOpacity>
    );
  };

  // Render an Ayah in the Surah reader
  const renderAyahItem = ({ item }: { item: Ayah }) => {
    const hasNote = surahNotes[item.numberInSurah] !== undefined;
    return (
      <View style={styles.ayahCard}>
        <View style={styles.ayahHeader}>
          <View style={styles.ayahNumberBadge}>
            <Text style={styles.ayahNumberText}>{item.numberInSurah}</Text>
          </View>
          
          <View style={styles.ayahActions}>
            {hasNote && (
              <View style={styles.noteIndicator}>
                <Ionicons name="document-text" size={12} color={THEME.colors.textLight} />
                <Text style={styles.noteIndicatorText}>Note Saved</Text>
              </View>
            )}

            <TouchableOpacity style={styles.ayahActionBtn} onPress={() => handleOpenNoteModal(item)}>
              <Ionicons name={hasNote ? "create" : "create-outline"} size={18} color={THEME.colors.gold} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.ayahActionBtn} onPress={() => handleCopy(item)}>
              <Ionicons name="copy-outline" size={18} color={THEME.colors.gold} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.ayahActionBtn} onPress={() => handleShare(item)}>
              <Ionicons name="share-social-outline" size={18} color={THEME.colors.gold} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.ayahArabic}>{item.text}</Text>
        <Text style={styles.ayahEnglish}>{item.translation}</Text>

        {hasNote && (
          <View style={styles.notePreviewContainer}>
            <Text style={styles.notePreviewLabel}>MY NOTE:</Text>
            <Text style={styles.notePreviewText}>{surahNotes[item.numberInSurah]}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderSurahNameResult = ({ item }: { item: SurahListItem }) => (
    <TouchableOpacity style={styles.searchResultCard} onPress={() => handleSelectSurah(item)}>
      <View style={styles.searchResultHeader}>
        <Text style={styles.searchResultTitle}>
          Surah {item.englishName} ({item.number})
        </Text>
        <Ionicons name="book-outline" size={16} color={THEME.colors.gold} />
      </View>
      <Text style={styles.searchResultText}>{item.englishNameTranslation} • {item.numberOfAyahs} verses</Text>
    </TouchableOpacity>
  );

  const hasSearchResults = isSearchActive && (surahNameResults.length > 0 || searchResults.length > 0);
  const showEmptySearch =
    isSearchActive &&
    !searching &&
    surahNameResults.length === 0 &&
    searchResults.length === 0 &&
    searchQuery.trim().length >= 2;

  return (
    <PatternBackground>
    <View style={styles.container}>
      <View style={[styles.headerBar, { paddingTop: insets.top + 8, minHeight: insets.top + 52 }]}>
        {selectedSurah ? (
          <View style={styles.surahHeaderRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => setSelectedSurah(null)}>
              <Ionicons name="arrow-back" size={22} color={THEME.colors.primary} />
              <Text style={styles.backButtonText}>Surahs</Text>
            </TouchableOpacity>
            <Text style={styles.surahHeaderBarTitle} numberOfLines={1}>
              {selectedSurah.englishName}
            </Text>
            <View style={styles.backButtonSpacer} />
          </View>
        ) : (
          <CenteredTitleWithVines title="Holy Quran" textStyle={styles.headerTitle} />
        )}
      </View>

      {/* Main Content Area */}
      {!selectedSurah ? (
        // BROWSE & SEARCH MODE
        <View style={{ flex: 1 }}>
          {/* Search Inputs */}
          <View style={styles.searchBarContainer}>
            <View style={styles.searchInner}>
              <Ionicons name="search" size={20} color={THEME.colors.textSecondary} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search surah name or keyword (e.g. yasin, peace)..."
                placeholderTextColor={THEME.colors.textSecondary}
                value={searchQuery}
                onChangeText={handleSearchQueryChange}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={clearSearch}>
                  <Ionicons name="close-circle" size={18} color={THEME.colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
            {searchQuery.length > 0 && (
              <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                <Text style={styles.searchButtonText}>Search</Text>
              </TouchableOpacity>
            )}
          </View>

          {errorMsg && selectedSurah ? (
            <Text style={styles.errorText}>{errorMsg}</Text>
          ) : null}

          {searching ? (
            <ActivityIndicator size="large" color={THEME.colors.gold} style={{ marginTop: 40 }} />
          ) : hasSearchResults ? (
            <FlatList
              data={[]}
              keyExtractor={(_, idx) => `search-${idx}`}
              renderItem={() => null}
              ListHeaderComponent={() => (
                <View>
                  {surahNameResults.length > 0 && (
                    <>
                      <Text style={styles.searchSectionLabel}>Matching Surahs</Text>
                      {surahNameResults.map((item) => (
                        <View key={`surah-${item.number}`}>{renderSurahNameResult({ item })}</View>
                      ))}
                    </>
                  )}
                  {searchResults.length > 0 && (
                    <>
                      <Text style={styles.searchSectionLabel}>Matching Verses</Text>
                      {searchResults.map((item, idx) => (
                        <View key={`verse-${item.number}-${idx}`}>{renderSearchResultItem({ item })}</View>
                      ))}
                    </>
                  )}
                </View>
              )}
              contentContainerStyle={styles.listContent}
            />
          ) : showEmptySearch ? (
            <View style={styles.emptySearchContainer}>
              <Ionicons name="search-outline" size={36} color={THEME.colors.border} />
              <Text style={styles.emptySearchText}>No matching surahs or verses found.</Text>
              <Text style={styles.emptySearchHint}>Try another spelling, or press Search to find matching verses.</Text>
            </View>
          ) : (
            <FlatList
              data={SURAH_LIST}
              keyExtractor={(item) => item.number.toString()}
              renderItem={renderSurahItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      ) : (
        // SURAH READER MODE
        <View style={{ flex: 1 }}>
          {loading ? (
            <ActivityIndicator size="large" color={THEME.colors.gold} style={{ marginTop: 80 }} />
          ) : (
            <FlatList
              data={ayahs}
              keyExtractor={(item) => item.number.toString()}
              renderItem={renderAyahItem}
              contentContainerStyle={styles.readerContent}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={() => (
                <>
                  <VineBorderBox style={styles.surahHeaderCard} cornerColor={THEME.colors.goldLight}>
                    <Text style={styles.surahHeaderArabic}>{selectedSurah.name}</Text>
                    <Text style={styles.surahHeaderTitle}>{selectedSurah.englishName}</Text>
                    <Text style={styles.surahHeaderSubtitle}>
                      {selectedSurah.englishNameTranslation} • {selectedSurah.revelationType} • {selectedSurah.numberOfAyahs} Verses
                    </Text>
                  </VineBorderBox>

                  {selectedSurah.number !== 1 && selectedSurah.number !== 9 && (
                    <View style={styles.bismillahCard}>
                      <Text style={styles.bismillahArabic}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text>
                      <Text style={styles.bismillahEnglish}>In the name of Allah, the Entirely Merciful, the Especially Merciful.</Text>
                    </View>
                  )}
                </>
              )}
              ListEmptyComponent={() => (
                errorMsg ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{errorMsg}</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={() => handleSelectSurah(selectedSurah)}>
                      <Text style={styles.retryBtnText}>Retry</Text>
                    </TouchableOpacity>
                  </View>
                ) : null
              )}
            />
          )}
        </View>
      )}
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
    paddingBottom: 10,
    paddingHorizontal: 16,
    backgroundColor: THEME.colors.backgroundCard,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.goldBorder,
    justifyContent: 'flex-end',
    ...THEME.shadows.small,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: THEME.colors.primary,
  },
  surahHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 80,
  },
  backButtonSpacer: {
    minWidth: 80,
  },
  surahHeaderBarTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: THEME.colors.primary,
    textAlign: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: THEME.colors.primary,
  },
  searchBarContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: THEME.colors.background,
    gap: 8,
  },
  searchInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: THEME.colors.textDark,
  },
  searchButton: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.gold,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: 16,
    height: 44,
  },
  searchButtonText: {
    color: THEME.colors.textLight,
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  searchSectionLabel: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: THEME.colors.goldDark,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 4,
  },
  emptySearchContainer: {
    alignItems: 'center',
    marginTop: 48,
    paddingHorizontal: 32,
  },
  emptySearchText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: THEME.colors.textSecondary,
    marginTop: 12,
    textAlign: 'center',
  },
  emptySearchHint: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: THEME.colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
    opacity: 0.8,
  },
  surahItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.backgroundCard,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...THEME.shadows.small,
  },
  surahNumContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(197, 160, 89, 0.15)',
    borderWidth: 1,
    borderColor: THEME.colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  surahNumText: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: THEME.colors.goldDark,
  },
  surahMeta: {
    flex: 1,
  },
  surahNameEng: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: THEME.colors.primary,
    marginBottom: 4,
  },
  surahNameTrans: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: THEME.colors.textSecondary,
  },
  surahArabicContainer: {
    alignItems: 'flex-end',
  },
  surahArabicName: {
    fontSize: 18,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: THEME.colors.primary,
    marginBottom: 4,
  },
  revelationText: {
    fontSize: 9,
    fontFamily: 'Inter_500Medium',
    color: THEME.colors.goldDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  searchResultCard: {
    backgroundColor: THEME.colors.backgroundCard,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...THEME.shadows.small,
  },
  searchResultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    paddingBottom: 6,
  },
  searchResultTitle: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: THEME.colors.goldDark,
  },
  searchResultText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: THEME.colors.textDark,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  readerContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  surahHeaderCard: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 12,
    padding: 24,
    paddingVertical: 28,
    borderRadius: 16,
    borderColor: THEME.colors.gold,
    borderWidth: 1,
    backgroundColor: THEME.colors.accent,
    ...THEME.shadows.small,
  },
  surahHeaderArabic: {
    fontSize: 28,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: THEME.colors.textLight,
    marginBottom: 8,
  },
  surahHeaderTitle: {
    fontSize: 22,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: THEME.colors.goldLight,
    marginBottom: 4,
  },
  surahHeaderSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(250, 247, 240, 0.75)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  bismillahCard: {
    backgroundColor: THEME.colors.backgroundCard,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    ...THEME.shadows.small,
  },
  bismillahArabic: {
    fontSize: 20,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: THEME.colors.primary,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 32,
  },
  bismillahEnglish: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  ayahCard: {
    backgroundColor: THEME.colors.backgroundCard,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...THEME.shadows.small,
  },
  ayahHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  ayahNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(26, 51, 46, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ayahNumberText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: THEME.colors.primary,
  },
  ayahActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ayahActionBtn: {
    padding: 4,
  },
  ayahArabic: {
    fontSize: 20,
    fontFamily: 'PlayfairDisplay_600SemiBold', // system Arabic fallback
    color: THEME.colors.textDark,
    textAlign: 'right',
    marginBottom: 12,
    lineHeight: 32,
  },
  ayahEnglish: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: THEME.colors.textDark,
    lineHeight: 18,
  },
  noteIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.accent,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
    marginRight: 4,
  },
  noteIndicatorText: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    color: THEME.colors.textLight,
  },
  notePreviewContainer: {
    marginTop: 12,
    backgroundColor: 'rgba(75, 42, 74, 0.05)',
    borderColor: THEME.colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  notePreviewLabel: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    color: THEME.colors.accent,
    marginBottom: 4,
  },
  notePreviewText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: THEME.colors.textDark,
    fontStyle: 'italic',
  },
  errorContainer: {
    alignItems: 'center',
    marginVertical: 40,
    paddingHorizontal: 20,
  },
  errorText: {
    color: THEME.colors.error,
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryBtn: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.gold,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryBtnText: {
    color: THEME.colors.textLight,
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
  },
});

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Share,
  Clipboard,
  Platform,
  Modal,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { THEME } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { PatternBackground } from '../../components/PatternBackground';
import { SideMenu } from '../../components/SideMenu';
import { useToast } from '../../components/ToastProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const INSPIRATIONAL_VERSES = [
  {
    surah: 94,
    ayah: 5,
    surahName: 'Ash-Sharh',
    arabic: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا',
    english: 'For indeed, with hardship [will be] ease.',
  },
  {
    surah: 2,
    ayah: 186,
    surahName: 'Al-Baqarah',
    arabic: 'وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ ۖ أُجِيبُ دَعْوَةَ الدَّاعِ إِذَا دَعَانِ',
    english: 'And when My servants ask you concerning Me - indeed I am near. I respond to the invocation of the supplicant when he calls upon Me.',
  },
  {
    surah: 13,
    ayah: 28,
    surahName: "Ar-Ra'd",
    arabic: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
    english: 'Unquestionably, by the remembrance of Allah hearts are assured.',
  },
  {
    surah: 39,
    ayah: 53,
    surahName: 'Az-Zumar',
    arabic: 'قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنْفُسِهِمْ لَا تَقْنَطُوا مِنْ رَحْمَةِ اللَّهِ',
    english: "Say, 'O My servants who have transgressed against themselves [by sinning], do not despair of the mercy of Allah. Indeed, Allah forgives all sins.'",
  },
  {
    surah: 20,
    ayah: 46,
    surahName: 'Taha',
    arabic: 'قَالَ لَا تَخَافَا ۖ إِنَّنِي مَعَكُمَا أَسْمَعُ وَأَرَىٰ',
    english: "He said, 'Fear not. Indeed, I am with you both; I hear and I see.'",
  },
  {
    surah: 55,
    ayah: 13,
    surahName: 'Ar-Rahman',
    arabic: 'فَبِأَيِّ آلَاءِ رَبِّكُمَا تُكَذِّبَانِ',
    english: 'So which of the favors of your Lord would you deny?',
  },
  {
    surah: 2,
    ayah: 286,
    surahName: 'Al-Baqarah',
    arabic: 'لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا',
    english: 'Allah does not burden a soul beyond that it can bear.',
  },
];

const JOURNEY_BUTTONS = [
  {
    title: 'AI QuranChat',
    subtitle: 'Ask questions and get scripture-backed answers',
    icon: 'chatbubbles' as const,
    route: '/chat',
    bg: '#C5A059',
    textColor: THEME.colors.primary,
  },
  {
    title: 'Read & Search',
    subtitle: 'Read the Holy Quran and search verses by keyword',
    icon: 'book' as const,
    route: '/reader',
    bg: THEME.colors.primary,
    textColor: THEME.colors.textLight,
  },
  {
    title: 'Dua Community',
    subtitle: 'Share prayer requests and pray for others',
    icon: 'heart' as const,
    route: '/dua',
    bg: THEME.colors.accent,
    textColor: THEME.colors.textLight,
  },
];

export default function HomeScreen() {
  const { profile } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const [dailyVerse, setDailyVerse] = useState(INSPIRATIONAL_VERSES[0]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [streakModalOpen, setStreakModalOpen] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const dayIndex = new Date().getDay() % INSPIRATIONAL_VERSES.length;
    setDailyVerse(INSPIRATIONAL_VERSES[dayIndex]);

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `"${dailyVerse.english}"\n- Surah ${dailyVerse.surahName} [${dailyVerse.surah}:${dailyVerse.ayah}]\n\nRead more on QuranChat.`,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopy = () => {
    Clipboard.setString(`"${dailyVerse.english}"\n- Surah ${dailyVerse.surahName} [${dailyVerse.surah}:${dailyVerse.ayah}]`);
    showToast('Verse copied to clipboard.');
  };

  return (
    <PatternBackground>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.menuBtn} onPress={() => setMenuOpen(true)}>
              <Ionicons name="menu" size={24} color={THEME.colors.primary} />
            </TouchableOpacity>
            <View>
              <Text style={styles.greetingText}>As-salamu alaykum,</Text>
              <Text style={styles.nameText}>{profile?.display_name || 'Servant of Allah'}</Text>
            </View>
          </View>

          <TouchableOpacity onPress={() => setStreakModalOpen(true)} activeOpacity={0.85}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <View style={styles.streakBadge}>
                <Ionicons name="flame" size={18} color={THEME.colors.gold} />
                <Text style={styles.streakText}>{profile?.streak || 1} Days</Text>
              </View>
            </Animated.View>
          </TouchableOpacity>
        </View>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={styles.verseCardContainer}>
            <View style={styles.verseCardInner}>
              <Text style={styles.arabicText}>{dailyVerse.arabic}</Text>
              <Text style={styles.englishText}>"{dailyVerse.english}"</Text>
              <Text style={styles.referenceText}>
                — Surah {dailyVerse.surahName} ({dailyVerse.surah}:{dailyVerse.ayah})
              </Text>

              <View style={styles.cardActionsRow}>
                <TouchableOpacity
                  style={styles.cardActionBtn}
                  onPress={() => router.push({ pathname: '/reader', params: { surah: dailyVerse.surah } })}
                >
                  <Ionicons name="book-outline" size={18} color={THEME.colors.gold} />
                  <Text style={styles.cardActionBtnText}>Read</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cardActionBtn}
                  onPress={() =>
                    router.push({
                      pathname: '/note-modal',
                      params: { surah: dailyVerse.surah, ayah: dailyVerse.ayah, surahName: dailyVerse.surahName },
                    })
                  }
                >
                  <Ionicons name="create-outline" size={18} color={THEME.colors.gold} />
                  <Text style={styles.cardActionBtnText}>Note</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cardActionBtn} onPress={handleCopy}>
                  <Ionicons name="copy-outline" size={18} color={THEME.colors.gold} />
                  <Text style={styles.cardActionBtnText}>Copy</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cardActionBtn} onPress={handleShare}>
                  <Ionicons name="share-social-outline" size={18} color={THEME.colors.gold} />
                  <Text style={styles.cardActionBtnText}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Continue Your Journey</Text>

          {JOURNEY_BUTTONS.map((btn) => (
            <TouchableOpacity
              key={btn.route}
              style={[styles.journeyBtn, { backgroundColor: btn.bg }]}
              onPress={() => router.push(btn.route as any)}
              activeOpacity={0.88}
            >
              <View style={styles.journeyBtnIcon}>
                <Ionicons name={btn.icon} size={22} color={btn.textColor} />
              </View>
              <View style={styles.journeyBtnTextWrap}>
                <Text style={[styles.journeyBtnTitle, { color: btn.textColor }]}>{btn.title}</Text>
                <Text style={[styles.journeyBtnSubtitle, { color: btn.textColor, opacity: 0.85 }]}>{btn.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={btn.textColor} />
            </TouchableOpacity>
          ))}

          <View style={styles.footerQuote}>
            <Text style={styles.footerQuoteText}>
              "Indeed, this Quran guides to that which is most suitable."
            </Text>
            <Text style={styles.footerQuoteRef}>— Surah Al-Isra (17:9)</Text>
          </View>
        </Animated.View>
      </ScrollView>

      <SideMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      <Modal visible={streakModalOpen} transparent animationType="fade" onRequestClose={() => setStreakModalOpen(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setStreakModalOpen(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.streakModalOuter} onPress={() => {}}>
            <View style={styles.streakModalInner}>
              <Ionicons name="flame" size={32} color={THEME.colors.gold} />
              <Text style={styles.streakModalTitle}>Your Streak</Text>
              <Text style={styles.streakModalBody}>
                Your streak counts consecutive days of using QuranChat — reading, reflecting, chatting, or sharing duas.
                {'\n\n'}
                Open the app and engage once each day to keep it going. Miss a day and it resets to 1.
              </Text>
              <TouchableOpacity style={styles.streakModalBtn} onPress={() => setStreakModalOpen(false)}>
                <Text style={styles.streakModalBtnText}>Got it</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </PatternBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.colors.goldBorder,
    backgroundColor: THEME.colors.backgroundCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: THEME.colors.textSecondary,
  },
  nameText: {
    fontSize: 20,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: THEME.colors.primary,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.gold,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
    ...THEME.shadows.small,
  },
  streakText: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: THEME.colors.textLight,
  },
  verseCardContainer: {
    borderColor: THEME.colors.goldBorder,
    borderWidth: 1,
    borderRadius: 16,
    padding: 3,
    backgroundColor: THEME.colors.goldBorder,
    marginBottom: 28,
    ...THEME.shadows.elegant,
  },
  verseCardInner: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.gold,
    borderWidth: 1.5,
    borderRadius: 13,
    padding: 24,
    alignItems: 'center',
  },
  arabicText: {
    fontSize: 22,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: THEME.colors.textLight,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 36,
  },
  englishText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#ECEAE4',
    textAlign: 'center',
    lineHeight: 22,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  referenceText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: THEME.colors.gold,
    textAlign: 'center',
    marginBottom: 24,
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: 'rgba(197, 160, 89, 0.2)',
    paddingTop: 16,
  },
  cardActionBtn: { alignItems: 'center', gap: 4 },
  cardActionBtnText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: THEME.colors.goldLight,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: THEME.colors.primary,
    marginBottom: 14,
  },
  journeyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    ...THEME.shadows.small,
  },
  journeyBtnIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  journeyBtnTextWrap: { flex: 1 },
  journeyBtnTitle: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    marginBottom: 2,
  },
  journeyBtnSubtitle: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    lineHeight: 15,
  },
  footerQuote: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  footerQuoteText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: THEME.colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 18,
  },
  footerQuoteRef: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    color: THEME.colors.goldDark,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 51, 46, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  streakModalOuter: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.colors.goldBorder,
    padding: 3,
    backgroundColor: THEME.colors.goldBorder,
  },
  streakModalInner: {
    backgroundColor: THEME.colors.backgroundCard,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: THEME.colors.gold,
    padding: 24,
    alignItems: 'center',
  },
  streakModalTitle: {
    fontSize: 22,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: THEME.colors.primary,
    marginTop: 12,
    marginBottom: 10,
  },
  streakModalBody: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 20,
  },
  streakModalBtn: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.gold,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 28,
    paddingVertical: 10,
  },
  streakModalBtnText: {
    color: THEME.colors.textLight,
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
  },
});

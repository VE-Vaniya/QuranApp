import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform,
  Animated,
} from 'react-native';
import { THEME } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { PatternBackground } from '../../components/PatternBackground';
import { useToast } from '../../components/ToastProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

const SYSTEM_PROMPT = `You are "QuranChat AI", a highly knowledgeable, compassionate, and spiritual AI assistant specializing in the Holy Quran.
Your objective is to answer user queries with precise, scripture-backed wisdom from the Quran.
Rules:
1. Always anchor your answers in specific verses (Ayahs) of the Quran.
2. Provide the Surah name and verse references (e.g., Surah Al-Baqarah 2:255).
3. Provide the English translation of the verse (Sahih International version preferred) and explain its spiritual and practical context.
4. If appropriate, write the key Arabic text of the referenced ayah to help the user connect.
5. Maintain a respectful, humble, and spiritual tone. If a topic is completely unrelated to spiritual growth or Quranic guidance, gently guide the user back to reflection on Quranic themes.
6. Keep answers structured, clear, and readable. Use paragraph breaks and bullet points where helpful.`;

export default function ChatScreen() {
  const { incrementStreak } = useAuth();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: "As-salamu alaykum. Welcome to QuranChat. Ask me any question, and I will search the Quran to provide scripture-backed guidance and inspiration.",
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKeySetup, setShowKeySetup] = useState(false);
  
  const flatListRef = useRef<FlatList>(null);
  
  // Animation for the typing indicator
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  // Load API Key on mount
  useEffect(() => {
    loadApiKey();
  }, []);

  // Run typing indicator dots animation when loading
  useEffect(() => {
    let animationLoop: any;
    if (loading) {
      const animateDot = (dot: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
            Animated.delay(600)
          ])
        );
      };
      
      animationLoop = Animated.parallel([
        animateDot(dot1, 0),
        animateDot(dot2, 200),
        animateDot(dot3, 400)
      ]);
      animationLoop.start();
    } else {
      dot1.setValue(0);
      dot2.setValue(0);
      dot3.setValue(0);
    }
    return () => {
      if (animationLoop) animationLoop.stop();
    };
  }, [loading]);

  const loadApiKey = async () => {
    const key = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
    if (key) {
      setApiKey(key);
    } else {
      const storedKey = await AsyncStorage.getItem('@quranchat_gemini_key');
      if (storedKey) {
        setApiKey(storedKey);
      } else {
        setShowKeySetup(true);
      }
    }
  };

  const saveApiKeyCustom = async () => {
    if (!apiKeyInput.trim()) {
      showToast('Please enter a valid Gemini API key.', 'error');
      return;
    }
    await AsyncStorage.setItem('@quranchat_gemini_key', apiKeyInput.trim());
    setApiKey(apiKeyInput.trim());
    setShowKeySetup(false);
    showToast('API key saved successfully.');
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    if (!apiKey) {
      setShowKeySetup(true);
      return;
    }

    const userMessage: Message = {
      id: Math.random().toString(),
      sender: 'user',
      text: inputText.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    // Scroll to bottom
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      // Build conversation history for context (keep it lightweight for budget/performance)
      const contextMessages = messages.slice(-5).map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      // Append current user message
      contextMessages.push({
        role: 'user',
        parts: [{ text: userMessage.text }]
      });

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: contextMessages,
            systemInstruction: {
              parts: [{ text: SYSTEM_PROMPT }]
            },
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1000,
            }
          })
        }
      );

      const json = await response.json();

      if (json.candidates && json.candidates[0]?.content?.parts[0]?.text) {
        const aiReply = json.candidates[0].content.parts[0].text;
        const aiMessage: Message = {
          id: Math.random().toString(),
          sender: 'ai',
          text: aiReply,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);

        // Increment streak for engaging in learning activity
        await incrementStreak();
      } else {
        console.error('Gemini Error:', json);
        throw new Error('service_unavailable');
      }
    } catch (e: any) {
      console.error('Chat error:', e);
      setMessages(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: 'ai',
          text: "I'm having trouble responding right now. Please wait a moment and try again.",
          timestamp: new Date()
        }
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const renderMessageItem = ({ item }: { item: Message }) => {
    const isUser = item.sender === 'user';
    return (
      <View style={[styles.messageRow, isUser ? styles.userRow : styles.aiRow]}>
        {!isUser && (
          <View style={styles.aiAvatar}>
            <Ionicons name="moon" size={12} color={THEME.colors.gold} />
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
          <Text style={[styles.messageText, isUser ? styles.userText : styles.aiText]}>
            {item.text}
          </Text>
          <Text style={[styles.timeText, isUser ? styles.userTimeText : styles.aiTimeText]}>
            {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
          <Text style={styles.headerTitle}>AI QuranChat</Text>
          <Text style={styles.headerSubtitle}>Reflecting with Scripture</Text>
        </View>
      </View>

      {showKeySetup ? (
        // CUSTOM API KEY SETUP SCREEN
        <View style={styles.setupCardContainer}>
          <View style={styles.setupCard}>
            <Text style={styles.setupCardTitle}>Gemini API Key Required</Text>
            <Text style={styles.setupCardDesc}>
              This app connects directly to the Google Gemini API to offer fast and intelligent Quran insights.
            </Text>
            <Text style={styles.stepTitle}>How to get a key:</Text>
            <Text style={styles.stepText}>
              1. Visit Google AI Studio (aistudio.google.com){"\n"}
              2. Click "Create API Key" (it has a generous free tier){"\n"}
              3. Paste the key below:
            </Text>
            <TextInput
              style={styles.keyInput}
              placeholder="AIzaSy..."
              placeholderTextColor={THEME.colors.textSecondary}
              secureTextEntry
              value={apiKeyInput}
              onChangeText={setApiKeyInput}
            />
            <TouchableOpacity style={styles.saveKeyBtn} onPress={saveApiKeyCustom}>
              <Text style={styles.saveKeyBtnText}>Save API Key</Text>
            </TouchableOpacity>
            {apiKey.length > 0 && (
              <TouchableOpacity style={styles.cancelKeyBtn} onPress={() => setShowKeySetup(false)}>
                <Text style={styles.cancelKeyBtnText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ) : (
        // CHAT INTERFACE
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id}
            renderItem={renderMessageItem}
            contentContainerStyle={styles.chatContent}
            ListFooterComponent={() => (
              loading ? (
                <View style={[styles.messageRow, styles.aiRow]}>
                  <View style={styles.aiAvatar}>
                    <Ionicons name="moon" size={12} color={THEME.colors.gold} />
                  </View>
                  <View style={[styles.bubble, styles.aiBubble, styles.typingBubble]}>
                    <Animated.View style={[styles.typingDot, { opacity: dot1 }]} />
                    <Animated.View style={[styles.typingDot, { opacity: dot2 }]} />
                    <Animated.View style={[styles.typingDot, { opacity: dot3 }]} />
                  </View>
                </View>
              ) : (
                <View style={styles.disclaimerContainer}>
                  <Text style={styles.disclaimerText}>
                    <Ionicons name="alert-circle-outline" size={10} /> QuranChat AI responses are generated using Gemini. Please verify all verses in the Reader. AI is not a substitute for scholarly fatwa rulings.
                  </Text>
                </View>
              )
            )}
          />

          {/* Chat Input Bar */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.inputField}
              placeholder="Ask QuranChat anything (e.g. patience)..."
              placeholderTextColor={THEME.colors.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={400}
            />
            <TouchableOpacity 
              style={[styles.sendBtn, !inputText.trim() ? styles.sendBtnDisabled : {}]} 
              onPress={handleSend}
              disabled={!inputText.trim() || loading}
            >
              <Ionicons name="send" size={18} color={THEME.colors.textLight} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
  chatContent: {
    padding: 16,
    paddingBottom: 32,
    flexGrow: 1,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    width: '100%',
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  aiRow: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: THEME.colors.primary,
    borderWidth: 1,
    borderColor: THEME.colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    alignSelf: 'flex-end',
    marginBottom: 4,
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...THEME.shadows.small,
  },
  userBubble: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.gold,
    borderWidth: 1,
    borderBottomRightRadius: 2,
  },
  aiBubble: {
    backgroundColor: THEME.colors.backgroundCard,
    borderColor: THEME.colors.goldBorder,
    borderWidth: 1,
    borderBottomLeftRadius: 2,
  },
  messageText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  userText: {
    color: THEME.colors.textLight,
  },
  aiText: {
    color: THEME.colors.textDark,
  },
  timeText: {
    fontSize: 9,
    fontFamily: 'Inter_400Regular',
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  userTimeText: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  aiTimeText: {
    color: THEME.colors.textSecondary,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.colors.goldDark,
  },
  inputBar: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: THEME.colors.backgroundCard,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.goldBorder,
    alignItems: 'center',
    gap: 8,
  },
  inputField: {
    flex: 1,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    maxHeight: 80,
    color: THEME.colors.textDark,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.gold,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: THEME.colors.textSecondary,
    borderColor: THEME.colors.border,
    opacity: 0.5,
  },
  disclaimerContainer: {
    marginTop: 16,
    paddingHorizontal: 16,
    opacity: 0.6,
  },
  disclaimerText: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 14,
  },
  setupCardContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  setupCard: {
    backgroundColor: THEME.colors.backgroundCard,
    borderColor: THEME.colors.gold,
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    ...THEME.shadows.medium,
  },
  setupCardTitle: {
    fontSize: 20,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: THEME.colors.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  setupCardDesc: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: THEME.colors.primary,
    marginBottom: 6,
  },
  stepText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: THEME.colors.textDark,
    lineHeight: 18,
    marginBottom: 16,
  },
  keyInput: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 8,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginBottom: 16,
    color: THEME.colors.textDark,
  },
  saveKeyBtn: {
    height: 44,
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.gold,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  saveKeyBtnText: {
    color: THEME.colors.textLight,
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
  },
  cancelKeyBtn: {
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelKeyBtnText: {
    color: THEME.colors.textSecondary,
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
  },
});

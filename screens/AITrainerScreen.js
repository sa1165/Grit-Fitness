import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Image,
    Animated,
    Alert,
    FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';
const FALLBACK_MODEL = 'llama-3.1-8b-instant';

const SYSTEM_PROMPT = `You are Grit AI, a strictly specialized fitness, diet, and training expert. 

CORE RULE: 
ONLY answer questions related to fitness, bodybuilding, nutrition, weight loss, and health. 
If a user asks about UNRELATED topics (e.g., general recipes like Sambar, movie trivia, coding, or general news), you MUST politely refuse. 
Respond with: "I am your Grit AI Trainer. I only provide advice on fitness, diet, and training. How can I help you with your workout today?"

GUIDELINES:
1. NO UNRELATED CONTENT: Do not provide general recipes, instructions, or facts that are not directly related to a user's fitness journey.
2. NO FORMATTING SYMBOLS: Do NOT use asterisks (*) for bolding or lists. Do NOT use any other Markdown symbols.
3. STRUCTURE: Use plain text with clear capitalized headings.
4. ACCURACY: Base your advice on sports science and evidence-based nutrition.
5. PERSONALITY: You are Grit AI. You are professional, focused, and motivating.

WORKOUT STRUCTURE:
- PULL: Back, Biceps.
- PUSH: Chest, Shoulders, Triceps.
- LEGS: Quads, Hamstrings, Glutes, Calves.`;

const AITrainerScreen = ({ navigation }) => {
    const [messages, setMessages] = useState([
        {
            id: 1,
            text: "Hello! I'm Grit AI. How can I help you reach your goals today?",
            sender: 'ai',
            timestamp: new Date()
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [requestCount, setRequestCount] = useState(0);
    const [dailyCount, setDailyCount] = useState(0);
    const [lastRequestTime, setLastRequestTime] = useState(0);
    
    // Limits
    const MAX_SESSION_REQUESTS = 30;
    const DAILY_LIMIT = 50;
    const COOLDOWN_MS = 2000;

    const flatListRef = useRef();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        loadDailyLimit();
        // Animation for first message
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    useEffect(() => {
        // Scroll to bottom when messages change
        if (flatListRef.current && messages.length > 0) {
            setTimeout(() => {
                flatListRef.current.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages, isLoading]);

    const loadDailyLimit = async () => {
        try {
            const today = new Date().toDateString();
            const storedDate = await AsyncStorage.getItem('grit_ai_last_date');
            const storedCount = await AsyncStorage.getItem('grit_ai_daily_count');
            
            if (storedDate === today) {
                setDailyCount(parseInt(storedCount || '0'));
            } else {
                await AsyncStorage.setItem('grit_ai_last_date', today);
                await AsyncStorage.setItem('grit_ai_daily_count', '0');
                setDailyCount(0);
            }
        } catch (e) {
            console.error('Error loading daily limit:', e);
        }
    };

    const incrementDailyCount = async () => {
        try {
            const newCount = dailyCount + 1;
            setDailyCount(newCount);
            await AsyncStorage.setItem('grit_ai_daily_count', newCount.toString());
        } catch (e) {
            console.error('Error saving daily count:', e);
        }
    };

    const askAI = async (text) => {
        if (!text.trim()) return;

        // Rate Limiting Check
        const now = Date.now();
        if (now - lastRequestTime < COOLDOWN_MS) {
            Alert.alert("Slow down", "Please wait a moment before sending another message.");
            return;
        }

        if (requestCount >= MAX_SESSION_REQUESTS) {
            Alert.alert("Session Limit Reached", "You've reached the maximum number of AI requests for this session. Please try again later.");
            return;
        }

        if (dailyCount >= DAILY_LIMIT) {
            Alert.alert("Daily Limit Reached", "You've reached your daily limit of 50 AI messages. This is to ensure the service remains available for everyone. Your limit will reset tomorrow!");
            return;
        }

        setLastRequestTime(now);
        setRequestCount(prev => prev + 1);

        const userMessage = {
            id: Date.now(),
            text: text,
            sender: 'user',
            timestamp: new Date()
        };

        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInputText('');
        setIsLoading(true);

        const fetchWithRetry = async (url, options, maxRetries = 1, currentModel = DEFAULT_MODEL) => {
            let lastError;
            for (let i = 0; i <= maxRetries; i++) {
                try {
                    const response = await fetch(url, {
                        ...options,
                        body: JSON.stringify({
                            ...JSON.parse(options.body),
                            model: currentModel
                        })
                    });
                    
                    if (response.status === 429) {
                        // If primary fails with 429, and we haven't tried fallback yet
                        if (currentModel === DEFAULT_MODEL) {
                            console.log("Primary model limit reached, switching to fallback...");
                            return await fetchWithRetry(url, options, 0, FALLBACK_MODEL);
                        }
                        if (i === maxRetries) throw new Error("API Limit Reached. Please try again later.");
                        const waitTime = Math.pow(2, i) * 1000;
                        await new Promise(resolve => setTimeout(resolve, waitTime));
                        continue;
                    }

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.error?.message || `Server Error (${response.status})`);
                    }

                    return await response.json();
                } catch (err) {
                    lastError = err;
                    if (i === maxRetries) throw err;
                    const waitTime = Math.pow(2, i) * 1000;
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                }
            }
            throw lastError;
        };

        try {
            // Map messages for Groq API (OpenAI format)
            const chatHistory = newMessages.slice(-6).map(msg => ({
                role: msg.sender === 'ai' ? 'assistant' : 'user',
                content: msg.text
            }));

            const data = await fetchWithRetry(GROQ_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GROQ_API_KEY}`,
                },
                body: JSON.stringify({
                    messages: [
                        { role: 'system', content: SYSTEM_PROMPT },
                        ...chatHistory
                    ],
                    temperature: 0.7,
                    max_tokens: 1024,
                }),
            });

            const aiText = (data.choices?.[0]?.message?.content || "I'm having trouble processing that right now.").replace(/\*/g, '');
            
            const aiResponse = {
                id: Date.now() + 1,
                text: aiText,
                sender: 'ai',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiResponse]);
            await incrementDailyCount();
        } catch (error) {
            console.error('Groq Error:', error);
            let userErrorMessage = "I'm experiencing some technical difficulties. Please check your connection.";
            if (error.message?.includes("429") || error.message?.includes("Limit")) {
                userErrorMessage = "The AI service is currently at capacity. Please wait a minute and try again.";
            }

            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                text: userErrorMessage,
                sender: 'ai',
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const renderMessage = ({ item, index }) => {
        const isAI = item.sender === 'ai';
        const isFirst = index === 0;

        const MessageComponent = isFirst ? Animated.View : View;
        const animatedStyle = isFirst ? {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
        } : {};

        return (
            <MessageComponent 
                style={[styles.messageRow, isAI ? styles.aiRow : styles.userRow, animatedStyle]}
            >
                {isAI && (
                    <View style={styles.aiAvatar}>
                        <Ionicons name="logo-android" size={16} color="#FFF" />
                    </View>
                )}
                <View style={[styles.messageBubble, isAI ? styles.aiBubble : styles.userBubble]}>
                    <Text style={[styles.messageText, isAI ? styles.aiText : styles.userText]}>
                        {item.text}
                    </Text>
                </View>
            </MessageComponent>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <View style={styles.aiIconSmall}>
                        <Ionicons name="logo-android" size={20} color="#FFF" />
                    </View>
                    <View>
                        <Text style={styles.headerTitle}>Grit AI</Text>
                        <View style={styles.statusRow}>
                            <View style={styles.statusDot} />
                            <Text style={styles.statusText}>ALWAYS ACTIVE</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Chat Area */}
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={item => item.id.toString()}
                style={styles.chatArea}
                contentContainerStyle={styles.chatContent}
                showsVerticalScrollIndicator={false}
                ListFooterComponent={() => isLoading ? (
                    <View style={styles.loadingRow}>
                        <ActivityIndicator color="#2F80ED" size="small" />
                        <Text style={styles.loadingText}>Grit is thinking...</Text>
                    </View>
                ) : null}
            />

            {/* Input Area */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={styles.inputContainer}>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            placeholder="Ask about exercises, diet, etc..."
                            placeholderTextColor="#666"
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                        />
                        <TouchableOpacity 
                            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]} 
                            onPress={() => askAI(inputText)}
                            disabled={!inputText.trim() || isLoading}
                        >
                            <Ionicons name="send" size={20} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#111',
    },
    backBtn: {
        marginRight: 16,
    },
    headerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    aiIconSmall: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#2F80ED',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#4CAF50',
        marginRight: 6,
    },
    statusText: {
        color: '#666',
        fontSize: 10,
        fontWeight: 'bold',
    },
    chatArea: {
        flex: 1,
    },
    chatContent: {
        padding: 16,
        paddingBottom: 32,
    },
    messageRow: {
        flexDirection: 'row',
        marginBottom: 20,
        width: '100%',
    },
    aiRow: {
        justifyContent: 'flex-start',
    },
    userRow: {
        justifyContent: 'flex-end',
    },
    aiAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#2F80ED',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        marginTop: 4,
    },
    messageBubble: {
        padding: 14,
        borderRadius: 20,
        maxWidth: '85%',
        flexShrink: 1,
    },
    aiBubble: {
        backgroundColor: '#111',
        borderTopLeftRadius: 4,
    },
    userBubble: {
        backgroundColor: '#2F80ED',
        borderTopRightRadius: 4,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
    },
    aiText: {
        color: '#FFF',
    },
    userText: {
        color: '#FFF',
    },
    loadingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    loadingText: {
        color: '#666',
        fontSize: 12,
        marginLeft: 8,
    },
    inputContainer: {
        padding: 16,
        paddingBottom: Platform.OS === 'ios' ? 30 : 16,
        backgroundColor: '#000',
        borderTopWidth: 1,
        borderTopColor: '#111',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111',
        borderRadius: 25,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    input: {
        flex: 1,
        color: '#FFF',
        fontSize: 16,
        maxHeight: 100,
        paddingTop: 8,
        paddingBottom: 8,
    },
    sendBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#2F80ED',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
    sendBtnDisabled: {
        backgroundColor: '#333',
    },
});

export default AITrainerScreen;

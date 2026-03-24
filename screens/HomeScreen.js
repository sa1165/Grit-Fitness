import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Animated,
    Platform,
    Image,
    ActivityIndicator
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Logger } from '../utils/Logger';

const { width } = Dimensions.get('window');

// --- Data ---
const CHALLENGES = [
    "50 Push-ups in one go", "2 Minute Plank", "100 Squats", "5km Run", "10 Pull-ups",
    "50 Burpees", "1 Hour Yoga", "20 Muscle-ups", "1000 Jump Rope skips", "1 Hour Fasted Walk",
    "30 Pistols Squats", "100 Lunges", "5 Minute Wall Sit", "20 Burpee Box Jumps", "10km Cycle",
    "50 Dips", "100 Mountain Climbers", "30 Diamond Push-ups", "50 Russian Twists", "20 Hanging Leg Raises",
    "10 Minute Meditation", "Swim 500m", "50 Box Jumps", "100 Bicycle Crunches", "20 Archer Push-ups",
    "1 Hour Strength Training", "No Sugar for 24h", "Drink 4L Water", "8 Hours Sleep", "10k Steps",
    "30 Wide Grip Pull-ups", "50 Calf Raises", "20 Handstand Push-ups", "100 Glute Bridges", "50 Side Lunges",
    "5 Minute Shadow Boxing", "20 Decline Push-ups", "100 Jumping Jacks", "30 Superman Extensions", "50 Hollow Body Rocks",
    "10 Minute Stairs Climb", "20 Dragon Flags", "50 Frog Jumps", "100 High Knees", "30 Burpee Broad Jumps",
    "Cold Shower for 3 mins", "Read 10 pages of Health book", "Eat 5 types of Vegetables", "No Caffeine for 12h", "10 Minute Stretching",
    "Handstand hold for 30s", "100 Kettlebell swings", "50 Thrusters", "50 Wall ball shots", "1 Minute Battle Rope waves",
    "Farmers walk for 100m", "20 Clean and Jerks", "50 Box Step-ups", "100 Sit-ups", "30 V-ups",
    "1 Mile Run < 8 mins", "500m Row sprint", "100m Bear Crawl", "50 Dumbbell Snatches", "1 Minute Bar Hang",
    "100 Double-unders", "50 Goblet Squats", "10 Minute AMRAP", "50 Weighted Lunges", "Plank for a whole song"
];

const TIPS = [
    "Always warm up for 5-10 minutes to prevent muscle strain.",
    "Stay hydrated throughout your workout for peak performance.",
    "Focus on form over weight to prevent long-term injuries.",
    "Consistency is the secret ingredient to any fitness goal.",
    "Don't skip rest days; your muscles grow while you sleep.",
    "A 10-minute walk after meals can improve digestion significantly.",
    "Incorporate compound movements like squats and deadlifts for efficiency.",
    "Listen to your body; sharp pain is a signal to stop.",
    "Progressive overload is key to building strength and muscle.",
    "Nutrition is 70% of the battle; keep your protein high.",
    "Drink a glass of water first thing in the morning.",
    "Use a foam roller to help with muscle recovery.",
    "Try a new vegetable every week to diversify your nutrients.",
    "Replace sugary snacks with a handful of nuts.",
    "Take the stairs instead of the elevator whenever possible.",
    "Set a consistent sleep schedule to improve your circadian rhythm.",
    "Practice deep breathing for 5 minutes a day to reduce stress levels.",
    "Focus on eccentric movements for better muscle growth.",
    "Keep a workout journal to track your progress and stay motivated.",
    "Vary your rep ranges to challenge different muscle fibers.",
    "Do dynamic stretches before a workout and static stretches after.",
    "Aim for 7-9 hours of quality sleep for optimal recovery.",
    "Eat slowly and mindfully to recognize fullness signals.",
    "Limit processed foods and prioritize whole, single-ingredient options.",
    "Incorporate mobility work into your routine for joint health.",
    "Find a workout partner to increase accountability and enjoyment.",
    "Reward yourself with non-food items for reaching milestones.",
    "Stay active on rest days with light walking or swimming.",
    "Be patient with yourself; progress takes time and consistency.",
    "Focus on small, sustainable changes over drastic transformations.",
    "Stay consistent even when you don't feel motivated.",
    "Mix in some HIIT training for cardiovascular health.",
    "Don't compare your journey to anyone else's.",
    "Celebrate your wins, no matter how small they seem.",
    "Stay curious and keep learning about fitness and nutrition.",
    "Use proper footwear for your specific type of training.",
    "No screens an hour before bed for better sleep quality.",
    "Practice gratitude to improve overall mental well-being.",
    "Be mindful of your posture throughout the day.",
    "Incorporate balance exercises to improve coordination.",
    "Stay positive and focus on what your body CAN do.",
    "Keep your kitchen stocked with healthy, easy-to-prepare ingredients.",
    "Prepare meals in advance to avoid last-minute unhealthy choices.",
    "Listen to motivating music or podcasts during workouts.",
    "Try different activities until you find what you love.",
    "Don't be afraid to ask for help from a fitness professional.",
    "Focus on how exercise makes you FEEL, not just how you look.",
    "Stay hydrated even on days you don't work out.",
    "Practice mindful movement to connect with your body.",
    "Set realistic and achievable goals to stay on track.",
    "Focus on progress, not perfection.",
    "Stay flexible and adjust your routine as needed.",
    "Keep recovery as a priority, not an afterthought.",
    "Practice self-care that nourishes both body and mind.",
    "Surround yourself with people who support your goals.",
    "Be proud of yourself for showing up and putting in effort.",
    "Remember that every workout counts, no matter how short.",
    "Focus on the long-term benefits of a healthy lifestyle.",
    "Be kind to yourself even when you don't meet your goals.",
    "Keep showing up for yourself every single day."
];

const HomeScreen = ({ navigation }) => {
    const { user, profile, refreshProfile, signOut } = useAuth();
    const [currentChallenge, setCurrentChallenge] = useState(CHALLENGES[0]);
    const [currentTipIndex, setCurrentTipIndex] = useState(0);
    const [streak, setStreak] = useState(0);
    const [stats, setStats] = useState({ workouts: 0, duration: 0, volume: 0 });
    const [currentISTDate, setCurrentISTDate] = useState('');
    const [isMenuVisible, setIsMenuVisible] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    // Animation Values
    const challengeOpacity = useRef(new Animated.Value(1)).current;
    const challengeScale = useRef(new Animated.Value(1)).current;
    const tipOpacity = useRef(new Animated.Value(1)).current;
    const tipTranslateX = useRef(new Animated.Value(0)).current;

    // Real-time IST Date
    useEffect(() => {
        const updateDate = () => {
            const now = new Date();
            const istDate = now.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                timeZone: 'Asia/Kolkata'
            }).toUpperCase();
            setCurrentISTDate(istDate);
        };

        updateDate();
        const timer = setInterval(updateDate, 60000); // Update every minute
        return () => clearInterval(timer);
    }, []);

    // Fetch Weekly Stats on Focus
    useFocusEffect(
        useCallback(() => {
            if (user) {
                fetchWeeklyStats();
            }
        }, [user])
    );

    const fetchWeeklyStats = async () => {
        try {
            // Get start of current week (Sunday)
            const now = new Date();
            const day = now.getDay();
            const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
            startOfWeek.setHours(0, 0, 0, 0);

            const { data, error } = await supabase
                .from('workouts')
                .select('duration_minutes, total_volume')
                .eq('user_id', user.id)
                .gte('created_at', startOfWeek.toISOString());

            if (error) throw error;

            const workouts = data.length;
            const duration = data.reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0);
            const volume = data.reduce((acc, curr) => acc + (curr.total_volume || 0), 0);

            setStats({ workouts, duration, volume });
        } catch (err) {
            Logger.error('HomeScreen', 'Error fetching stats', err);
        }
    };

    // Tips Auto-advance
    useEffect(() => {
        const timer = setInterval(() => {
            transitionTip(1); // Auto-advance forward
        }, 5000);
        return () => clearInterval(timer);
    }, [currentTipIndex]);

    const shuffleChallenge = () => {
        // Step 1: Animate out
        Animated.parallel([
            Animated.timing(challengeOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
            Animated.timing(challengeScale, { toValue: 0.9, duration: 250, useNativeDriver: true })
        ]).start(() => {
            // Step 2: Change content
            const randomIndex = Math.floor(Math.random() * CHALLENGES.length);
            setCurrentChallenge(CHALLENGES[randomIndex]);

            // Step 3: Animate in
            Animated.parallel([
                Animated.timing(challengeOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
                Animated.spring(challengeScale, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true })
            ]).start();
        });
    };

    const transitionTip = (direction) => {
        // Step 1: Animate out
        Animated.parallel([
            Animated.timing(tipOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
            Animated.timing(tipTranslateX, { toValue: -50 * direction, duration: 250, useNativeDriver: true })
        ]).start(() => {
            // Step 2: Change content
            const nextIndex = (currentTipIndex + direction + TIPS.length) % TIPS.length;
            setCurrentTipIndex(nextIndex);

            // Reset position for entry
            tipTranslateX.setValue(50 * direction);

            // Step 3: Animate in
            Animated.parallel([
                Animated.timing(tipOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
                Animated.timing(tipTranslateX, { toValue: 0, duration: 300, useNativeDriver: true })
            ]).start();
        });
    };

    const markChallengeCompleted = async () => {
        if (!user) return;

        Logger.info('Home', 'Challenge completed: ' + currentChallenge);

        try {
            // Increment grit_score by 1
            const { error } = await supabase
                .from('profiles')
                .update({ grit_score: (profile?.grit_score || 0) + 1 })
                .eq('id', user.id);

            if (error) throw error;

            // Refresh profile to get updated score
            await refreshProfile();

            // In-app success feedback
            setSuccessMsg('🎉 Reward Earned! +1 Grit Score added to your profile.');

            // Wait 3 seconds before showing next challenge
            setTimeout(() => {
                setSuccessMsg('');
                shuffleChallenge();
            }, 3000);

        } catch (err) {
            Logger.error('HomeScreen', 'Error awarding Grit Score', err);
            // Non-intrusive feedback
            setSuccessMsg('Something went wrong, but great job on the challenge!');
            setTimeout(() => {
                setSuccessMsg('');
                shuffleChallenge();
            }, 3000);
        }
    };

    const renderStat = (value, label, change) => (
        <View style={styles.statBox}>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
            <View style={styles.statChangeContainer}>
                <Ionicons name="arrow-up" size={12} color="#888" />
                <Text style={styles.statChangeText}>{change}</Text>
            </View>
        </View>
    );

    const renderNavTab = (name, icon, active = false, route) => (
        <TouchableOpacity
            style={styles.navTab}
            onPress={() => route && navigation.navigate(route)}
        >
            <Ionicons name={icon} size={24} color={active ? '#FFF' : '#666'} />
            <Text style={[styles.navTabText, active && styles.navTabTextActive]}>{name}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <TouchableOpacity 
                        style={styles.headerDropdown}
                        onPress={() => setIsMenuVisible(!isMenuVisible)}
                    >
                        <Text style={styles.headerTitle}>Home</Text>
                        <Ionicons name={isMenuVisible ? "chevron-up" : "chevron-down"} size={20} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerDate}>{currentISTDate}</Text>
                </View>
                <View style={styles.headerIcons}>
                    <TouchableOpacity style={styles.iconBtn}>
                        <Ionicons name="flame" size={20} color="#FF9800" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Quick Navigation Menu */}
            {isMenuVisible && (
                <View style={styles.quickNavMenu}>
                    <TouchableOpacity 
                        style={styles.menuItem}
                        onPress={() => setIsMenuVisible(false)}
                    >
                        <Ionicons name="home" size={20} color="#FFF" />
                        <Text style={styles.menuItemText}>Home</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.menuItem}
                        onPress={() => {
                            setIsMenuVisible(false);
                            navigation.navigate('Workout', { startStep: 7 });
                        }}
                    >
                        <Ionicons name="list" size={20} color="#FF9800" />
                        <Text style={styles.menuItemText}>My workout plan</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.menuItem}
                        onPress={() => {
                            setIsMenuVisible(false);
                            navigation.navigate('AITrainer');
                        }}
                    >
                        <Ionicons name="sparkles" size={20} color="#4A90E2" />
                        <Text style={styles.menuItemText}>Grit AI</Text>
                    </TouchableOpacity>
                </View>
            )}

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Snapshot Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Your weekly snapshot</Text>
                </View>

                <View style={styles.statsRow}>
                    {renderStat(stats.workouts, 'Workouts', '0')}
                    {renderStat(`${stats.duration}min`, 'Duration', '0min')}
                    {renderStat(`${stats.volume}kg`, 'Volume', '0kg')}
                </View>

                {/* Quick Start Lifting Redesigned */}
                <View style={styles.quickStartCard}>
                    {/* Decorative Graphic Top */}
                    <View style={styles.quickStartGraphicContainer}>
                        <View style={styles.graphicCardSideLeft}>
                            <View style={styles.graphicIconBox}>
                                <Ionicons name="stats-chart" size={14} color="#4A90E2" />
                            </View>
                            <View style={styles.graphicLineShort} />
                            <View style={styles.graphicLineLong} />
                        </View>

                        <View style={styles.graphicCardCenter}>
                            <View style={styles.graphicCenterHeader}>
                                <View style={styles.graphicUserIcon}>
                                    <Ionicons name="person-outline" size={16} color="#4A90E2" />
                                </View>
                                <View style={styles.graphicAddIcon}>
                                    <Ionicons name="add-circle-outline" size={12} color="#4A90E2" />
                                </View>
                            </View>
                            <View style={styles.graphicLineLong} />
                            <View style={styles.graphicLineBlue} />
                            <View style={styles.graphicLineLong} />
                            <View style={styles.graphicDotsRow}>
                                <View style={styles.graphicDot} />
                                <View style={styles.graphicDot} />
                            </View>
                        </View>

                        <View style={styles.graphicCardSideRight}>
                            <View style={styles.graphicIconBox}>
                                <Ionicons name="stats-chart" size={14} color="#4A90E2" />
                            </View>
                            <View style={styles.graphicLineShort} />
                            <View style={styles.graphicLineLong} />
                        </View>
                    </View>

                    <View style={styles.quickStartContent}>
                        <Text style={styles.quickStartText}>Ready to start lifting, {profile?.full_name || profile?.username || 'User'}?</Text>
                        <Text style={styles.quickStartSub}>Go ahead and do your first workout. Your stats will be ready when you finish.</Text>
                        <TouchableOpacity
                            style={styles.startBtnOuter}
                            onPress={() => navigation.navigate('Workout')}
                        >
                            <Text style={styles.startBtnText}>START WORKOUT</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Suggested Challenges */}
                <View style={styles.sectionHeader}>
                    <View style={{ flex: 1, paddingRight: 10 }}>
                        <Text style={styles.sectionTitle}>Suggested Challenges</Text>
                        <Text style={styles.sectionSubtitle}>Make accountability a little easier, more fun and earn rewards!</Text>
                        <Text style={styles.integrityNote}>Honesty is part of the grind. Stay true to yourself and only mark as completed if you've done the work.</Text>
                    </View>
                    <TouchableOpacity style={styles.shuffleBtn} onPress={shuffleChallenge}>
                        <Ionicons name="sync" size={24} color="#4A90E2" />
                    </TouchableOpacity>
                </View>

                <Animated.View style={[
                    styles.challengeCard,
                    { opacity: challengeOpacity, transform: [{ scale: challengeScale }] }
                ]}>
                    {!successMsg ? (
                        <>
                            <View style={styles.challengeHeader}>
                                <Ionicons name="trophy-outline" size={20} color="#4A90E2" />
                                <Text style={styles.challengeTag}>ACTIVE CHALLENGE</Text>
                            </View>
                            <Text style={styles.challengeName}>{currentChallenge}</Text>

                            <TouchableOpacity style={styles.completeBtn} onPress={markChallengeCompleted}>
                                <Text style={styles.completeBtnText}>MARK AS COMPLETED</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <View style={styles.completionView}>
                            <View style={styles.challengeHeader}>
                                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                                <Text style={[styles.challengeTag, { color: '#4CAF50' }]}>WELL DONE!</Text>
                            </View>
                            <View style={styles.successContainer}>
                                <Text style={styles.successText}>{successMsg}</Text>
                            </View>
                            <ActivityIndicator color="#4A90E2" size="small" style={{ marginTop: 10 }} />
                        </View>
                    )}
                </Animated.View>

                {/* Pro Tips Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Pro Tips</Text>
                    <View style={styles.tipNav}>
                        <TouchableOpacity onPress={() => transitionTip(-1)}>
                            <Ionicons name="chevron-back" size={24} color="#333" />
                        </TouchableOpacity>
                        <TouchableOpacity style={{ marginLeft: 15 }} onPress={() => transitionTip(1)}>
                            <Ionicons name="chevron-forward" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>
                </View>

                <Animated.View style={[
                    styles.tipCard,
                    { opacity: tipOpacity, transform: [{ translateX: tipTranslateX }] }
                ]}>
                    <View style={styles.tipIconContainer}>
                        <Ionicons name="bulb-outline" size={28} color="#4A90E2" />
                    </View>
                    <Text style={styles.tipText}>"{TIPS[currentTipIndex]}"</Text>
                </Animated.View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Bottom Navigation */}
            <View style={styles.bottomNav}>
                {renderNavTab('Home', 'home', true)}
                {renderNavTab('Explore', 'search-outline', false, 'Explore')}
                <TouchableOpacity
                    style={styles.addBtnContainer}
                    onPress={() => navigation.navigate('Workout')}
                >
                    <View style={styles.addBtn}>
                        <Ionicons name="add" size={32} color="#000" />
                    </View>
                    <Text style={styles.navTabText}>Workout</Text>
                </TouchableOpacity>
                {renderNavTab('Progress', 'analytics-outline', false, 'Progress')}
                {renderNavTab('You', 'person-outline', false, 'You')}

            </View>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 50 : 40,
        paddingBottom: 10,
    },
    headerDropdown: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginRight: 5,
    },
    headerDate: {
        color: '#666',
        fontSize: 10,
        fontWeight: '600',
        marginTop: 2,
    },
    headerIcons: {
        flexDirection: 'row',
    },
    iconBtn: {
        marginLeft: 20,
    },
    scrollContent: {
        paddingHorizontal: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 15,
        marginBottom: 15,
    },
    sectionTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    sectionSubtitle: {
        color: '#666',
        fontSize: 12,
        marginTop: 5,
        maxWidth: width * 0.7,
    },
    seeMore: {
        color: '#4A90E2',
        fontSize: 14,
        fontWeight: '600',
    },
    statsRow: {
        flexDirection: 'row',
        marginBottom: 30,
    },
    statBox: {
        alignItems: 'flex-start',
        marginRight: 40,
    },
    statValue: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: 'bold',
    },
    statLabel: {
        color: '#888',
        fontSize: 12,
        marginVertical: 4,
    },
    statChangeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1A1A1A',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
    },
    statChangeText: {
        color: '#888',
        fontSize: 12,
        marginLeft: 2,
    },
    carousel: {
        marginVertical: 20,
    },
    carouselContent: {
        paddingRight: 20,
    },
    carouselCard: {
        width: width * 0.35,
        height: 180,
        borderRadius: 20,
        marginRight: 15,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    cardLine: {
        width: '100%',
        height: 4,
        backgroundColor: '#CCC',
        borderRadius: 2,
        marginTop: 20,
        opacity: 0.3,
    },
    cardLineActive: {
        width: '100%',
        height: 4,
        backgroundColor: '#4A90E2',
        borderRadius: 2,
        marginTop: 20,
    },
    quickStartCard: {
        backgroundColor: '#111',
        borderRadius: 25,
        marginVertical: 10,
        overflow: 'hidden',
    },
    quickStartText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    quickStartSub: {
        color: '#888',
        fontSize: 13,
        marginTop: 10,
        lineHeight: 18,
    },
    startBtnOuter: {
        marginTop: 20,
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 25,
        paddingVertical: 12,
        alignItems: 'center',
    },
    startBtnText: {
        color: '#4A90E2',
        fontSize: 14,
        fontWeight: 'bold',
    },
    shuffleBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#111',
        justifyContent: 'center',
        alignItems: 'center',
    },
    challengeCard: {
        backgroundColor: '#111',
        borderRadius: 25,
        padding: 20,
    },
    challengeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    challengeTag: {
        color: '#4A90E2',
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    challengeName: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 25,
    },
    completeBtn: {
        backgroundColor: '#2F80ED',
        borderRadius: 20,
        paddingVertical: 18,
        alignItems: 'center',
    },
    completeBtnText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    tipNav: {
        flexDirection: 'row',
    },
    tipCard: {
        backgroundColor: '#050A10',
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#0D1621',
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    tipIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 15,
        backgroundColor: '#0D1621',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 20,
    },
    tipText: {
        color: '#B0C4DE',
        fontSize: 16,
        fontStyle: 'italic',
        lineHeight: 22,
        flex: 1,
    },
    bottomNav: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#000',
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'ios' ? 30 : 15,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#111',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    navTab: {
        alignItems: 'center',
    },
    navTabText: {
        color: '#666',
        fontSize: 9,
        marginTop: 4,
    },
    navTabTextActive: {
        color: '#FFF',
    },
    addBtnContainer: {
        alignItems: 'center',
        bottom: 10,
    },
    addBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    // Redesigned Quick Start Styles
    quickStartGraphicContainer: {
        backgroundColor: '#E3F2FD',
        height: 160,
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        overflow: 'hidden',
    },
    quickStartContent: {
        padding: 20,
    },
    graphicCardCenter: {
        width: 80,
        height: 110,
        backgroundColor: '#FFF',
        borderRadius: 10,
        padding: 8,
        zIndex: 2,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    graphicCardSideLeft: {
        width: 65,
        height: 100,
        backgroundColor: '#FFF',
        borderRadius: 10,
        padding: 6,
        marginRight: -15,
        transform: [{ rotate: '-10deg' }],
        opacity: 0.8,
    },
    graphicCardSideRight: {
        width: 65,
        height: 100,
        backgroundColor: '#FFF',
        borderRadius: 10,
        padding: 6,
        marginLeft: -15,
        transform: [{ rotate: '10deg' }],
        opacity: 0.8,
    },
    graphicIconBox: {
        width: 24,
        height: 24,
        backgroundColor: '#E3F2FD',
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    graphicLineShort: {
        width: '40%',
        height: 4,
        backgroundColor: '#F0F0F0',
        borderRadius: 2,
        marginBottom: 6,
    },
    graphicLineLong: {
        width: '100%',
        height: 4,
        backgroundColor: '#F0F0F0',
        borderRadius: 2,
        marginBottom: 6,
    },
    graphicLineBlue: {
        width: '100%',
        height: 4,
        backgroundColor: '#4A90E2',
        borderRadius: 2,
        marginBottom: 6,
    },
    graphicCenterHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    graphicUserIcon: {
        width: 28,
        height: 28,
        backgroundColor: '#E3F2FD',
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    graphicAddIcon: {
        opacity: 0.5,
    },
    graphicDotsRow: {
        flexDirection: 'row',
        marginTop: 10,
    },
    graphicDot: {
        width: 15,
        height: 15,
        backgroundColor: '#F0F0F0',
        borderRadius: 4,
        marginRight: 6,
    },
    integrityNote: {
        color: '#4A90E2',
        fontSize: 11,
        fontStyle: 'italic',
        marginTop: 8,
        opacity: 0.8,
        maxWidth: width * 0.8,
    },
    successContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        padding: 12,
        borderRadius: 12,
        marginTop: 20,
        borderWidth: 1,
        borderColor: 'rgba(76, 175, 80, 0.3)',
    },
    successText: {
        color: '#4CAF50',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 10,
        flex: 1,
    },
    completionView: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    quickNavMenu: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 90 : 80,
        left: 20,
        backgroundColor: '#111',
        borderRadius: 15,
        padding: 10,
        zIndex: 1000,
        elevation: 10,
        minWidth: 180,
        borderWidth: 1,
        borderColor: '#222',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 10,
    },
    menuItemText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 12,
    },
});

export default HomeScreen;

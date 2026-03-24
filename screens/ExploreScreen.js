import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

const EXPLORE_TOOLS = [
    {
        id: 'scheduler',
        title: 'Workout Scheduler',
        desc: 'Plan your training sessions',
        icon: 'calendar',
        iconColor: '#9C27B0',
        iconBg: '#1A101C',
        isHighlighted: false,
    },
    {
        id: 'ai_trainer',
        title: 'Ask AI Trainer',
        desc: 'Get instant answers to any doubt',
        icon: 'logo-android',
        iconColor: '#FFF',
        iconBg: '#4A90E2',
        isHighlighted: true,
    },
    {
        id: 'calories',
        title: 'Maintenance Calories',
        desc: 'Calculate your daily energy needs',
        icon: 'calculator',
        iconColor: '#FF9800',
        iconBg: '#1C1610',
        isHighlighted: false,
    },
    {
        id: 'calorie_counter',
        title: 'Calorie Counter',
        desc: 'Track your meals and nutrition',
        icon: 'restaurant',
        iconColor: '#4CAF50',
        iconBg: '#101C12',
        isHighlighted: false,
    },
    {
        id: 'exercises',
        title: 'Exercise Library',
        desc: 'Home and Gym video tutorials',
        icon: 'barbell',
        iconColor: '#2196F3',
        iconBg: '#10161C',
        isHighlighted: false,
    }
];

const ExploreScreen = ({ navigation }) => {
    const renderToolCard = (tool) => (
        <TouchableOpacity
            key={tool.id}
            style={[
                styles.toolCard,
                tool.isHighlighted && styles.toolCardHighlighted
            ]}
            onPress={() => {
                if (tool.id === 'scheduler') navigation.navigate('WorkoutScheduler');
                if (tool.id === 'calories') navigation.navigate('CalorieCalculator');
                if (tool.id === 'calorie_counter') navigation.navigate('CalorieCounter');
                if (tool.id === 'exercises') navigation.navigate('ExerciseLibrary');
                if (tool.id === 'ai_trainer') navigation.navigate('AITrainer');
            }}
        >
            <View style={[
                styles.toolIconBox,
                { backgroundColor: tool.iconBg },
                tool.isHighlighted && { backgroundColor: 'rgba(255,255,255,0.2)' }
            ]}>
                <Ionicons name={tool.icon} size={20} color={tool.iconColor} />
            </View>
            <View style={styles.toolContent}>
                <Text style={[
                    styles.toolTitle,
                    tool.isHighlighted && styles.toolTextHighlighted
                ]}>{tool.title}</Text>
                <Text style={[
                    styles.toolDesc,
                    tool.isHighlighted && styles.toolDescHighlighted
                ]}>{tool.desc}</Text>
            </View>
            <Ionicons
                name="chevron-forward"
                size={16}
                color={tool.isHighlighted ? '#FFF' : '#333'}
            />
        </TouchableOpacity>
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
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <Text style={styles.title}>Explore</Text>
                <Text style={styles.subtitle}>Tools and guides for your fitness journey</Text>

                <View style={styles.toolsContainer}>
                    {EXPLORE_TOOLS.map(renderToolCard)}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Bottom Navigation */}
            <View style={styles.bottomNav}>
                {renderNavTab('Home', 'home-outline', false, 'Home')}
                {renderNavTab('Explore', 'search', true)}
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
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 50 : 40,
    },
    title: {
        color: '#FFF',
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 6,
    },
    subtitle: {
        color: '#666',
        fontSize: 13,
        marginBottom: 20,
    },
    toolsContainer: {
        marginTop: 5,
    },
    toolCard: {
        backgroundColor: '#111',
        borderRadius: 25,
        padding: 16,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        minHeight: 85,
    },
    toolCardHighlighted: {
        backgroundColor: '#2F80ED',
        elevation: 15,
        shadowColor: '#2F80ED',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
    },
    toolIconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    toolContent: {
        flex: 1,
    },
    toolTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    toolDesc: {
        color: '#888',
        fontSize: 14,
    },
    toolTextHighlighted: {
        color: '#FFF',
    },
    toolDescHighlighted: {
        color: 'rgba(255,255,255,0.8)',
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
});

export default ExploreScreen;

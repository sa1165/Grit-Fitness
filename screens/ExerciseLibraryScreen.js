import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ImageBackground,
    Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const ExerciseLibraryScreen = ({ navigation }) => {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Exercise Library</Text>
                <View style={{ width: 28 }} />
            </View>

            <View style={styles.content}>
                <Text style={styles.welcomeText}>Where are you training today?</Text>
                <Text style={styles.subText}>Select your environment to see relevant exercises.</Text>

                <TouchableOpacity 
                    style={styles.card}
                    onPress={() => navigation.navigate('WorkoutLibrary', { type: 'home' })}
                >
                    <View style={[styles.gradient, { backgroundColor: '#1A2A4A' }]}>
                        <Ionicons name="home" size={40} color="#FFF" style={styles.cardIcon} />
                        <Text style={styles.cardTitle}>Home Workouts</Text>
                        <Text style={styles.cardDesc}>Bodyweight & Minimal Equipment</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.card}
                    onPress={() => navigation.navigate('WorkoutLibrary', { type: 'gym' })}
                >
                    <View style={[styles.gradient, { backgroundColor: '#1A3A1A' }]}>
                        <Ionicons name="fitness" size={40} color="#FFF" style={styles.cardIcon} />
                        <Text style={styles.cardTitle}>Gym Workouts</Text>
                        <Text style={styles.cardDesc}>Full Equipment & Machines</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
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
        paddingHorizontal: 16,
        paddingVertical: 15,
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    backBtn: {
        padding: 4,
    },
    content: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
    },
    welcomeText: {
        color: '#FFF',
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subText: {
        color: '#888',
        fontSize: 16,
        marginBottom: 40,
    },
    card: {
        height: 180,
        borderRadius: 25,
        marginBottom: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#222',
    },
    gradient: {
        flex: 1,
        padding: 25,
        justifyContent: 'flex-end',
    },
    cardIcon: {
        position: 'absolute',
        top: 25,
        right: 25,
        opacity: 0.8,
    },
    cardTitle: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    cardDesc: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 14,
    }
});

export default ExerciseLibraryScreen;

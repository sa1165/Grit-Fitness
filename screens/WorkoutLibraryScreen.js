import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    Linking,
    TextInput,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const WORKOUT_DATA = {
    gym: [
        {
            category: 'Chest',
            exercises: [
                'Barbell Bench Press', 'Incline Bench Press', 'Decline Bench Press',
                'Dumbbell Bench Press', 'Incline Dumbbell Press', 'Decline Dumbbell Press',
                'Dumbbell Fly', 'Incline Fly', 'Decline Fly', 'Cable Fly (High to Low)',
                'Cable Fly (Low to High)', 'Cable Crossover', 'Pec Deck Machine',
                'Chest Press Machine', 'Smith Machine Bench Press', 'Plate Press',
                'Guillotine Press', 'Floor Press', 'Chest Dips (Weighted)'
            ]
        },
        {
            category: 'Shoulders',
            exercises: [
                'Barbell Overhead Press', 'Dumbbell Shoulder Press', 'Arnold Press',
                'Machine Shoulder Press', 'Smith Machine Overhead Press', 'Lateral Raise (Dumbbell)',
                'Cable Lateral Raise', 'Machine Lateral Raise', 'Front Raise (Plate/DB/Cable)',
                'Rear Delt Fly (Dumbbell)', 'Reverse Pec Deck', 'Face Pull',
                'Upright Row', 'Cable Front Raise', 'Landmine Press'
            ]
        },
        {
            category: 'Triceps',
            exercises: [
                'Tricep Pushdown (Rope/Bar)', 'Overhead Tricep Extension', 'Skull Crushers',
                'Close Grip Bench Press', 'Dips (Weighted)', 'Cable Kickbacks',
                'Dumbbell Kickbacks', 'Machine Tricep Extension', 'EZ Bar Extension',
                'Single Arm Cable Extension'
            ]
        },
        {
            category: 'Biceps',
            exercises: [
                'Barbell Curl', 'EZ Bar Curl', 'Dumbbell Curl', 'Hammer Curl',
                'Incline Dumbbell Curl', 'Preacher Curl', 'Cable Curl',
                'Concentration Curl', 'Spider Curl', 'Reverse Curl'
            ]
        },
        {
            category: 'Back',
            exercises: [
                'Lat Pulldown', 'Pull-ups (Weighted)', 'Chin-ups', 'Barbell Row',
                'Dumbbell Row', 'T-Bar Row', 'Seated Cable Row', 'Single Arm Cable Row',
                'Deadlift', 'Rack Pull', 'Straight Arm Pulldown', 'Machine Row',
                'Meadows Row'
            ]
        },
        {
            category: 'Abs',
            exercises: [
                'Cable Crunch', 'Hanging Leg Raise', 'Hanging Knee Raise',
                'Decline Sit-up', 'Weighted Crunch', 'Ab Crunch Machine',
                'Cable Woodchopper', 'Roman Chair Sit-up', 'Toes to Bar'
            ]
        },
        {
            category: 'Legs',
            exercises: [
                'Barbell Squat', 'Front Squat', 'Hack Squat', 'Leg Press',
                'Leg Extension', 'Leg Curl (Seated/Lying)', 'Romanian Deadlift',
                'Stiff Leg Deadlift', 'Bulgarian Split Squat', 'Goblet Squat',
                'Smith Machine Squat'
            ]
        },
        {
            category: 'Glutes',
            exercises: [
                'Hip Thrust', 'Barbell Glute Bridge', 'Cable Kickback',
                'Machine Kickback', 'Sumo Deadlift', 'Step-ups (Weighted)',
                'Bulgarian Split Squat', 'Reverse Lunges', 'Smith Machine Hip Thrust'
            ]
        }
    ],
    home: [
        {
            category: 'Chest',
            exercises: [
                'Push-up', 'Incline Push-up', 'Decline Push-up', 'Knee Push-up',
                'Wide Push-up', 'Diamond Push-up', 'Archer Push-up', 'Explosive Push-up',
                'Plyometric Push-up', 'One-arm Push-up', 'Resistance Band Chest Press'
            ]
        },
        {
            category: 'Shoulders',
            exercises: [
                'Pike Push-up', 'Handstand Push-up', 'Wall Handstand Push-up',
                'Arm Circles', 'Resistance Band Shoulder Press',
                'Resistance Band Lateral Raise', 'Front Raise (Home weights)'
            ]
        },
        {
            category: 'Triceps',
            exercises: [
                'Bench Dips', 'Diamond Push-up', 'Close Grip Push-up',
                'Resistance Band Tricep Extension', 'Overhead Band Extension'
            ]
        },
        {
            category: 'Biceps',
            exercises: [
                'Resistance Band Curls', 'Backpack Curls', 'Towel Curls',
                'Isometric Holds', 'Water Bottle Curls'
            ]
        },
        {
            category: 'Back',
            exercises: [
                'Pull-ups', 'Chin-ups', 'Inverted Rows', 'Resistance Band Rows',
                'Superman', 'Reverse Snow Angels', 'Doorway Rows'
            ]
        },
        {
            category: 'Abs',
            exercises: [
                'Plank', 'Side Plank', 'Crunches', 'Bicycle Crunch',
                'Leg Raises', 'Flutter Kicks', 'Mountain Climbers',
                'Russian Twists', 'V-ups', 'Hollow Hold'
            ]
        },
        {
            category: 'Legs',
            exercises: [
                'Bodyweight Squat', 'Jump Squat', 'Lunges (all variations)',
                'Step-ups', 'Wall Sit', 'Sumo Squat', 'Pistol Squat'
            ]
        },
        {
            category: 'Glutes',
            exercises: [
                'Glute Bridge', 'Single Leg Glute Bridge', 'Hip Thrust (bodyweight)',
                'Donkey Kicks', 'Fire Hydrants', 'Frog Pumps', 'Step-ups'
            ]
        }
    ]
};

const WorkoutLibraryScreen = ({ route, navigation }) => {
    const { type } = route.params || { type: 'gym' };
    const [searchQuery, setSearchQuery] = useState('');

    const sectionData = WORKOUT_DATA[type] || [];

    const handleSearchYouTube = (exerciseName) => {
        // Construct a YouTube search URL
        const query = encodeURIComponent(`${exerciseName} exercise tutorial`);
        const url = `https://www.youtube.com/results?search_query=${query}`;
        
        Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
    };

    const filteredData = sectionData.map(section => ({
        ...section,
        exercises: section.exercises.filter(ex => 
            ex.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(section => section.exercises.length > 0);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{type.charAt(0).toUpperCase() + type.slice(1)} Library</Text>
                <View style={{ width: 28 }} />
            </View>

            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color="#666" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search exercises..."
                        placeholderTextColor="#444"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {filteredData.map((section, idx) => (
                    <View key={idx} style={styles.section}>
                        <Text style={styles.sectionHeader}>{section.category}</Text>
                        <View style={styles.grid}>
                            {section.exercises.map((exName, exIdx) => (
                                <TouchableOpacity 
                                    key={exIdx} 
                                    style={styles.exerciseCard}
                                    onPress={() => handleSearchYouTube(exName)}
                                >
                                    <View style={styles.cardHeader}>
                                        <Text style={styles.exerciseName} numberOfLines={2}>{exName}</Text>
                                        <Ionicons name="logo-youtube" size={18} color="#FF0000" />
                                    </View>
                                    <View style={styles.watchBadge}>
                                        <Text style={styles.watchText}>SEARCH TUTORIAL</Text>
                                        <Ionicons name="search" size={10} color="#4A90E2" />
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                ))}
            </ScrollView>
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
        borderBottomWidth: 1,
        borderBottomColor: '#111',
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    backBtn: {
        padding: 4,
    },
    searchContainer: {
        padding: 16,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    searchInput: {
        flex: 1,
        color: '#FFF',
        marginLeft: 10,
        fontSize: 15,
    },
    scrollContent: {
        padding: 16,
        paddingTop: 0,
        paddingBottom: 40,
    },
    section: {
        marginBottom: 30,
    },
    sectionHeader: {
        color: '#888',
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 15,
        letterSpacing: 1,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    exerciseCard: {
        width: '48%',
        backgroundColor: '#111',
        borderRadius: 15,
        padding: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#222',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    exerciseName: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '600',
        flex: 1,
        marginRight: 5,
        lineHeight: 18,
    },
    watchBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
    },
    watchText: {
        color: '#4A90E2',
        fontSize: 10,
        fontWeight: 'bold',
        marginRight: 4,
    }
});

export default WorkoutLibraryScreen;

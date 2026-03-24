import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    Platform,
    Dimensions,
    TextInput,
    Modal,
    KeyboardAvoidingView,
    ActivityIndicator,
    Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { NotificationService } from '../utils/NotificationService';

const { width } = Dimensions.get('window');

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const POPULAR_CARDIO = [
    { id: 'running', name: 'Running', icon: 'walk-outline' },
    { id: 'walking', name: 'Walking', icon: 'footsteps-outline' },
    { id: 'cycling', name: 'Cycling', icon: 'bicycle-outline' },
    { id: 'swimming', name: 'Swimming', icon: 'water-outline' }
];

const EXERCISES_BY_MUSCLE = {
    'Chest': ['Bench Press (Barbell)', 'Push-ups', 'Incline Dumbbell Press', 'Chest Fly (Machine / Dumbbell)', 'Cable Fly', 'Decline Bench Press', 'Dips (Chest variation)', 'Pec Deck Machine'],
    'Shoulder': ['Overhead Press (Barbell/Dumbbell)', 'Dumbbell Lateral Raise', 'Front Raise', 'Rear Delt Fly', 'Arnold Press', 'Machine Shoulder Press', 'Cable Lateral Raise', 'Upright Row'],
    'Triceps': ['Tricep Pushdown (Cable)', 'Tricep Dips', 'Overhead Tricep Extension', 'Close Grip Bench Press', 'Skull Crushers', 'Kickbacks', 'Machine Tricep Extension'],
    'Back': ['Pull-ups / Chin-ups', 'Lat Pulldown', 'Bent Over Barbell Row', 'Seated Cable Row', 'Single-arm Dumbbell Row', 'T-Bar Row', 'Face Pull', 'Machine Row'],
    'Biceps': ['Barbell Curl', 'Dumbbell Curl', 'Hammer Curl', 'Preacher Curl', 'Cable Curl', 'Concentration Curl', 'EZ Bar Curl'],
    'Legs': ['Squats (Barbell / Bodyweight)', 'Leg Press', 'Lunges', 'Leg Extension', 'Romanian Deadlift', 'Bulgarian Split Squat', 'Hack Squat Machine'],
    'Abs': ['Plank', 'Crunches', 'Leg Raises', 'Russian Twists', 'Ab Wheel Rollout', 'Cable Crunch'],
    'Glutes': ['Hip Thrust', 'Glute Bridge', 'Bulgarian Split Squat', 'Cable Kickbacks', 'Step-ups'],
};

const WorkoutScreen = ({ navigation, route }) => {
    const { profile, refreshProfile } = useAuth();
    const { startStep } = route.params || {};

    // Flow state
    const [currentStep, setCurrentStep] = useState(0); // 0: Options, 1: Location, 2: Setup
    const [location, setLocation] = useState(''); // 'Home' or 'Gym'
    const [trainingDays, setTrainingDays] = useState('5');
    const [restDays, setRestDays] = useState([]);
    const [workoutSplits, setWorkoutSplits] = useState({});
    const [editingDay, setEditingDay] = useState(null);
    const [tempSplit, setTempSplit] = useState('');
    const [avgSets, setAvgSets] = useState('3');
    const [avgReps, setAvgReps] = useState('10');
    const [workoutTime, setWorkoutTime] = useState({ hour: '07', minute: '00', period: 'AM' });
    const [isPlanCreated, setIsPlanCreated] = useState(false);
    const [showPlanOptions, setShowPlanOptions] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Cardio Stats & State
    const [cardioFavorites, setCardioFavorites] = useState([]);
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const [customCardio, setCustomCardio] = useState('');
    const [customWeightExercise, setCustomWeightExercise] = useState('');

    const [showAdviceModal, setShowAdviceModal] = useState(false);
    const [workoutHistory, setWorkoutHistory] = useState([]);
    const [activeExercise, setActiveExercise] = useState('');
    const [seconds, setSeconds] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [workoutLog, setWorkoutLog] = useState({
        name: '',
        distance: '',
        pace: '',
        feeling: ''
    });

    // Weight Training state
    const [weightTrainingLog, setWeightTrainingLog] = useState([]); // [{exercise, sets: [{weight, reps}]}]
    const [selectedMuscle, setSelectedMuscle] = useState(null);
    const [currentWeightExercise, setCurrentWeightExercise] = useState(null);
    const [currentSets, setCurrentSets] = useState([{ id: Date.now(), weight: '', reps: '' }]);
    const [sessionName, setSessionName] = useState('');
    const [savedSessionData, setSavedSessionData] = useState(null);
    const [restSeconds, setRestSeconds] = useState(0);
    const [isResting, setIsResting] = useState(false);
    const [showRestModal, setShowRestModal] = useState(false);
    const [showRestOver, setShowRestOver] = useState(false);
    const [tempRestMins, setTempRestMins] = useState('1');
    const [tempRestSecs, setTempRestSecs] = useState('0');
    const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);

    // Animation Values
    const rotateAnim = useRef(new Animated.Value(0)).current;

    // Load data on mount or profile change
    React.useEffect(() => {
        if (profile) {
            loadPlan();
            loadCardioFavorites();
            loadWorkoutHistory();
        }
    }, [profile]);


    const loadWorkoutHistory = async () => {
        if (!profile?.id) return;
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('workouts')
                .select('*')
                .eq('user_id', profile.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            // Map Supabase columns to UI format
            const formatted = data.map(item => ({
                    id: item.id,
                    type: item.type,
                    name: item.exercise_name || item.type,
                    distance: item.distance,
                    pace: item.pace,
                    feeling: item.feeling,
                    duration: item.duration_minutes * 60,
                    volume: item.total_volume,
                    sets_count: item.sets ? item.sets.length : 0,
                    sets: item.sets || [],
                    timestamp: item.created_at
                }));

            setWorkoutHistory(formatted);
        } catch (err) {
            console.error('Error loading history:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const saveWorkoutToHistory = async (logData) => {
        if (!profile?.id) return;
        try {
            const { error } = await supabase
                .from('workouts')
                .insert([{
                    user_id: profile.id,
                    type: 'Cardio',
                    exercise_name: logData.name,
                    duration_minutes: Math.ceil(seconds / 60),
                    distance: parseFloat(logData.distance) || 0,
                    pace: logData.pace,
                    feeling: logData.feeling
                }]);

            if (error) throw error;
            
            // Refresh local history
            loadWorkoutHistory();
        } catch (err) {
            console.error('Error saving history:', err);
        }
    };

    const loadCardioFavorites = () => {
        if (profile?.cardio_favorites) {
            setCardioFavorites(profile.cardio_favorites);
        }
    };

    const toggleCardioFavorite = async (name) => {
        if (!profile?.id) return;
        try {
            let newFavs;
            if (cardioFavorites.includes(name)) {
                newFavs = cardioFavorites.filter(f => f !== name);
            } else {
                newFavs = [...cardioFavorites, name];
            }
            setCardioFavorites(newFavs);

            const { error } = await supabase
                .from('profiles')
                .update({ cardio_favorites: newFavs })
                .eq('id', profile.id);

            if (error) throw error;
            await refreshProfile();
        } catch (err) {
            console.error('Error toggling cardio favorite:', err);
        }
    };

    // Timer Logic
    useEffect(() => {
        let interval = null;
        if (isActive) {
            interval = setInterval(() => {
                setSeconds(prev => prev + 1);
            }, 1000);
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isActive]);

    // Rest Timer Countdown
    useEffect(() => {
        let interval = null;
        if (isResting && restSeconds > 0) {
            interval = setInterval(() => {
                setRestSeconds(prev => prev - 1);
            }, 1000);
        } else if (isResting && restSeconds === 0) {
            setIsResting(false);
            setShowRestOver(true);
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isResting, restSeconds]);

    // Looping Circle Animation with Pause/Resume Persistence
    const animationRef = useRef(null);
    const rotationValue = useRef(0);

    const startRotation = (fromValue = 0) => {
        if (animationRef.current) animationRef.current.stop();

        const duration = 3000 * (1 - fromValue);
        
        animationRef.current = Animated.timing(rotateAnim, {
            toValue: 1,
            duration: duration,
            easing: (t) => t, // Linear
            useNativeDriver: true,
        });

        animationRef.current.start(({ finished }) => {
            if (finished) {
                rotateAnim.setValue(0);
                startRotation(0);
            }
        });
    };

    useEffect(() => {
        if (isActive) {
            rotateAnim.addListener(({ value }) => {
                rotationValue.current = value;
            });
            startRotation(rotationValue.current);
        } else {
            rotateAnim.removeAllListeners();
            if (animationRef.current) animationRef.current.stop();
        }
        return () => rotateAnim.removeAllListeners();
    }, [isActive]);

    const downloadSummaryCard = () => {
        if (Platform.OS !== 'web') {
            alert('Sharing is currently optimized for Web.');
            return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = 500;
        canvas.height = 650;
        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = '#0F0F0F';
        ctx.fillRect(0, 0, 500, 650);

        // --- Avatar / User Info Section ---
        // Avatar Circle
        ctx.beginPath();
        ctx.arc(80, 80, 35, 0, Math.PI * 2);
        ctx.fillStyle = '#1A1A1A';
        ctx.fill();
        
        // Simple Person Icon inside avatar
        ctx.fillStyle = '#888';
        ctx.beginPath();
        ctx.arc(80, 72, 10, 0, Math.PI * 2); // Head
        ctx.fill();
        ctx.beginPath();
        ctx.arc(80, 100, 18, Math.PI, 0, false); // Shoulders
        ctx.fill();

        // Name & Date
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 28px Arial';
        ctx.fillText(profile?.full_name || profile?.username || 'Sanjeev', 135, 75);
        
        ctx.fillStyle = '#666';
        ctx.font = '16px Arial';
        const dateStr = new Date().toLocaleDateString() + ' • ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toUpperCase();
        ctx.fillText(dateStr, 135, 105);

        // --- Exercise Title ---
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 36px Arial';
        ctx.fillText(workoutLog.name, 40, 200);

        // Divider Line 1
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(40, 240);
        ctx.lineTo(460, 240);
        ctx.stroke();

        // --- Stats Row ---
        // Distance
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 30px Arial';
        ctx.fillText(`${workoutLog.distance || '0'} km`, 40, 310);
        ctx.fillStyle = '#666';
        ctx.font = '16px Arial';
        ctx.fillText('Distance', 40, 345);

        // Pace
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 30px Arial';
        ctx.fillText(`${workoutLog.pace || '0:00'} /km`, 190, 310);
        ctx.fillStyle = '#666';
        ctx.font = '16px Arial';
        ctx.fillText('Pace', 190, 345);

        // Time
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 30px Arial';
        ctx.fillText(formatTime(seconds), 360, 310);
        ctx.fillStyle = '#666';
        ctx.font = '16px Arial';
        ctx.fillText('Time', 360, 345);

        // Divider Line 2
        ctx.strokeStyle = '#222';
        ctx.beginPath();
        ctx.moveTo(40, 390);
        ctx.lineTo(460, 390);
        ctx.stroke();

        // --- Feeling ---
        if (workoutLog.feeling) {
            ctx.fillStyle = '#888';
            ctx.font = 'italic 20px Arial';
            ctx.fillText(`"${workoutLog.feeling}"`, 40, 450);
        }

        // --- Branding ---
        ctx.fillStyle = '#4A90E2';
        ctx.font = 'italic bold 52px Arial';
        ctx.fillText('Grit.', 360, 600);

        // Trigger Download
        const link = document.createElement('a');
        link.download = `grit_workout_${new Date().getTime()}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 1.0);
        link.click();
    };

    const downloadWeightSummary = () => {
        if (Platform.OS !== 'web' || !savedSessionData) {
            alert('Sharing is currently optimized for Web.');
            return;
        }

        const d = savedSessionData;
        const exerciseLines = d.exercises || [];
        const canvasHeight = 650;

        const canvas = document.createElement('canvas');
        canvas.width = 500;
        canvas.height = Math.max(650, canvasHeight);
        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = '#0F0F0F';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Avatar Circle
        ctx.beginPath();
        ctx.arc(80, 80, 35, 0, Math.PI * 2);
        ctx.fillStyle = '#1A1A1A';
        ctx.fill();
        ctx.fillStyle = '#888';
        ctx.beginPath();
        ctx.arc(80, 72, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(80, 100, 18, Math.PI, 0, false);
        ctx.fill();

        // Name & Date
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 28px Arial';
        ctx.fillText(profile?.full_name || 'Athlete', 135, 75);
        ctx.fillStyle = '#666';
        ctx.font = '16px Arial';
        const dStr = d.date.toLocaleDateString() + ' • ' + d.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toUpperCase();
        ctx.fillText(dStr, 135, 105);

        // Session Title
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 36px Arial';
        ctx.fillText(d.name, 40, 200);

        // Divider
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(40, 240);
        ctx.lineTo(460, 240);
        ctx.stroke();

        // Stats Row
        const mins = Math.floor(d.duration / 60);
        const scs = d.duration % 60;
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 30px Arial';
        ctx.fillText(`${mins}:${scs.toString().padStart(2, '0')}`, 40, 310);
        ctx.fillStyle = '#666';
        ctx.font = '16px Arial';
        ctx.fillText('Duration', 40, 345);

        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 30px Arial';
        ctx.fillText(`${d.volume.toLocaleString()} kg`, 190, 310);
        ctx.fillStyle = '#666';
        ctx.font = '16px Arial';
        ctx.fillText('Volume', 190, 345);

        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 30px Arial';
        ctx.fillText(`${d.exerciseCount}`, 400, 310);
        ctx.fillStyle = '#666';
        ctx.font = '16px Arial';
        ctx.fillText('Exercises', 400, 345);

        // Divider
        ctx.strokeStyle = '#222';
        ctx.beginPath();
        ctx.moveTo(40, 390);
        ctx.lineTo(460, 390);
        ctx.stroke();

        // Note
        let yPos = 430;
        if (d.note) {
            yPos += 10;
            ctx.fillStyle = '#888';
            ctx.font = 'italic 18px Arial';
            ctx.fillText(`"${d.note}"`, 40, yPos);
            yPos += 40;
        }

        // Branding
        ctx.fillStyle = '#4A90E2';
        ctx.font = 'italic bold 52px Arial';
        ctx.fillText('Grit.', 360, Math.max(yPos + 30, canvas.height - 40));

        // Trigger Download
        const link = document.createElement('a');
        link.download = `grit_weight_${new Date().getTime()}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 1.0);
        link.click();
    };

    const formatTime = (totalSeconds) => {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        if (h > 0) {
            return `${h}h ${m}m ${s}s`;
        }
        if (m > 0) {
            return `${m}m ${s}s`;
        }
        return `${s}s`;
    };

    const startSession = (name) => {
        setActiveExercise(name);
        setSeconds(0);
        setWorkoutLog({
            name: `${name} Session`,
            distance: '',
            pace: '',
            feeling: ''
        });
        setShowAdviceModal(true);
    };

    const confirmStart = () => {
        setShowAdviceModal(false);
        setIsActive(true);
        setCurrentStep(10);
    };

    // --- Weight Training Helpers ---
    const addSet = () => {
        const lastSet = currentSets[currentSets.length - 1];
        setCurrentSets([
            ...currentSets, 
            { 
                id: Date.now(), 
                weight: lastSet ? lastSet.weight : '', 
                reps: lastSet ? lastSet.reps : '' 
            }
        ]);
    };

    const updateSet = (id, field, value) => {
        setCurrentSets(currentSets.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const removeSet = (id) => {
        if (currentSets.length > 1) {
            setCurrentSets(currentSets.filter(s => s.id !== id));
        }
    };

    const saveExerciseToWorkout = () => {
        const validSets = currentSets.filter(s => s.weight && s.reps);
        if (validSets.length === 0) {
            alert('Please log at least one set with weight and reps.');
            return;
        }
        
        const newLogEntry = {
            exercise: currentWeightExercise,
            sets: validSets.map(s => ({ weight: s.weight, reps: s.reps }))
        };
        
        setWeightTrainingLog([...weightTrainingLog, newLogEntry]);
        setCurrentWeightExercise(null);
        setSelectedMuscle(null);
        setCurrentSets([{ id: Date.now(), weight: '', reps: '' }]);
        setCurrentStep(16);
    };

    const finishWeightWorkout = async () => {
        if (!profile?.id) return;
        if (weightTrainingLog.length === 0) {
            setCurrentStep(0);
            return;
        }

        // Calculate total volume across all exercises
        let totalVolume = 0;
        weightTrainingLog.forEach(ex => {
            ex.sets.forEach(set => {
                totalVolume += (parseFloat(set.weight) || 0) * (parseFloat(set.reps) || 0);
            });
        });

        const sessionDuration = seconds;
        const exerciseCount = weightTrainingLog.length;
        const name = sessionName.trim() || 'Weight Training';

        // Save data for summary card FIRST
        setSavedSessionData({
            name,
            duration: sessionDuration,
            volume: totalVolume,
            exerciseCount,
            exercises: [...weightTrainingLog],
            note: workoutLog.feeling,
            date: new Date(),
        });

        // Navigate to summary card immediately
        setIsActive(false);
        setIsResting(false);
        setSeconds(0);
        setCurrentStep(17);

        // Save to Supabase in the background
        try {
            const { error } = await supabase
                .from('workouts')
                .insert([{
                    user_id: profile.id,
                    type: 'Weight Training',
                    exercise_name: name,
                    duration_minutes: sessionDuration ? Math.ceil(sessionDuration / 60) : 0,
                    total_volume: totalVolume,
                    sets: weightTrainingLog, // JSONB
                    feeling: workoutLog.feeling
                }]);

            if (error) console.error('Error saving weight workout:', error);
            
            await loadWorkoutHistory();
            await refreshProfile();
        } catch (err) {
            console.error('Error saving weight workout:', err);
        }

        // Clear after save
        setWeightTrainingLog([]);
        setWorkoutLog({ name: '', distance: '', pace: '', feeling: '' });
        setSessionName('');
    };

    const renderStep14 = () => (
        <View style={styles.stepContainer}>
            <View style={styles.stepHeaderRow}>
                <TouchableOpacity style={styles.backBtnHeader} onPress={() => {
                    if (selectedMuscle) setSelectedMuscle(null);
                    else setCurrentStep(8);
                }}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                {isActive && (
                    <View style={styles.stopwatchContainer}>
                        <Ionicons name="time-outline" size={16} color="#4A90E2" />
                        <Text style={styles.stopwatchText}>{formatTime(seconds)}</Text>
                    </View>
                )}
            </View>

            <Text style={styles.setupTitle}>
                {selectedMuscle ? `${selectedMuscle} Exercises` : "Select Muscle"}
            </Text>
            <Text style={styles.setupSubtitle}>
                {selectedMuscle ? "Which exercise are you crushing?" : "What muscle group are we hitting?"}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                {!selectedMuscle ? (
                    <View style={styles.muscleGrid}>
                        {Object.keys(EXERCISES_BY_MUSCLE).map(muscle => (
                            <TouchableOpacity 
                                key={muscle} 
                                style={styles.muscleCard}
                                onPress={() => {
                                    setSelectedMuscle(muscle);
                                    if (!isActive) {
                                        setIsActive(true);
                                        setSeconds(0);
                                    }
                                }}
                            >
                                <Ionicons 
                                    name={
                                        muscle === 'Chest' ? 'fitness' : 
                                        muscle === 'Back' ? 'body' : 
                                        muscle === 'Legs' ? 'walk' : 
                                        muscle === 'Abs' ? 'apps' : 
                                        muscle === 'Glutes' ? 'body' : 
                                        'barbell'
                                    } 
                                    size={30} 
                                    color="#4A90E2" 
                                />
                                <Text style={styles.muscleName}>{muscle}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                ) : (
                    <View style={styles.exerciseList}>
                        {EXERCISES_BY_MUSCLE[selectedMuscle].map(ex => (
                            <TouchableOpacity 
                                key={ex} 
                                style={styles.cardioItem}
                                onPress={() => {
                                    setCurrentWeightExercise(ex);
                                    setCurrentStep(15);
                                }}
                            >
                                <Ionicons name="barbell-outline" size={22} color="#4A90E2" />
                                <Text style={[styles.cardioName, { marginLeft: 15 }]}>{ex}</Text>
                                <Ionicons name="chevron-forward" size={18} color="#333" />
                            </TouchableOpacity>
                        ))}

                        <View style={styles.otherCardioContainer}>
                            <Text style={styles.otherTitle}>Other</Text>
                            <View style={styles.otherInputWrapper}>
                                <TextInput
                                    style={styles.otherInput}
                                    placeholder="Type exercise name..."
                                    placeholderTextColor="#444"
                                    value={customWeightExercise}
                                    onChangeText={setCustomWeightExercise}
                                />
                                <TouchableOpacity 
                                    style={[styles.otherAddBtn, !customWeightExercise.trim() && styles.otherAddBtnDisabled]}
                                    disabled={!customWeightExercise.trim()}
                                    onPress={() => {
                                        setCurrentWeightExercise(customWeightExercise.trim());
                                        setCustomWeightExercise('');
                                        setCurrentStep(15);
                                    }}
                                >
                                    <Ionicons name="arrow-forward" size={20} color="#000" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
            </ScrollView>

            {!selectedMuscle && (
                <TouchableOpacity 
                    style={[styles.discardBtn, { marginTop: 10, paddingVertical: 15 }]}
                    onPress={() => {
                        setIsActive(false);
                        setSeconds(0);
                        setWeightTrainingLog([]);
                        setCurrentStep(0);
                    }}
                >
                    <Ionicons name="trash-outline" size={18} color="#666" />
                    <Text style={styles.discardText}>Cancel Session</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    const renderStep15 = () => {
        const Content = (
            <View style={[styles.stepContainer, { flex: 1 }]}>
            <View style={styles.stepHeaderRow}>
                <TouchableOpacity style={styles.backBtnHeader} onPress={() => setCurrentStep(14)}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <View style={styles.stopwatchContainer}>
                    <Ionicons name="time-outline" size={16} color="#4A90E2" />
                    <Text style={styles.stopwatchText}>{formatTime(seconds)}</Text>
                </View>
            </View>

            <Text style={styles.setupTitle}>{currentWeightExercise}</Text>
            <Text style={styles.setupSubtitle}>How heavy and how many?</Text>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                <View style={[styles.setRowHeader, { paddingHorizontal: 22 }]}>
                    <View style={{ width: 35 }} />
                    <Text style={[styles.setLabel, { flex: 1, textAlign: 'center' }]}>WEIGHT (KG)</Text>
                    <Text style={[styles.setLabel, { flex: 1, textAlign: 'center' }]}>REPS</Text>
                    <View style={{ width: 30 }} />
                </View>

                {currentSets.map((set, index) => (
                    <View key={set.id} style={styles.setRow}>
                        <View style={styles.setNumberCircle}>
                            <Text style={styles.setNumberText}>{index + 1}</Text>
                        </View>
                        <TextInput 
                            style={[styles.setIntake, { flex: 1, marginHorizontal: 5 }]}
                            placeholder="0"
                            placeholderTextColor="#444"
                            keyboardType="numeric"
                            value={set.weight}
                            onChangeText={(val) => updateSet(set.id, 'weight', val)}
                        />
                        <TextInput 
                            style={[styles.setIntake, { flex: 1, marginHorizontal: 5 }]}
                            placeholder="0"
                            placeholderTextColor="#444"
                            keyboardType="numeric"
                            value={set.reps}
                            onChangeText={(val) => updateSet(set.id, 'reps', val)}
                        />
                        <TouchableOpacity 
                            style={[styles.removeSetBtn, { width: 30, alignItems: 'center' }]}
                            onPress={() => removeSet(set.id)}
                            disabled={currentSets.length === 1}
                        >
                            <Ionicons name="close-circle" size={20} color={currentSets.length === 1 ? "#222" : "#E24A4A"} />
                        </TouchableOpacity>
                    </View>
                ))}

                <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.addSetBtnSmall} onPress={addSet}>
                        <Ionicons name="add" size={20} color="#4A90E2" />
                        <Text style={styles.addSetText}>Add New Set</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.restBtn, isResting && styles.restBtnActive]} 
                        onPress={() => setShowRestModal(true)}
                    >
                        <Ionicons name="timer-outline" size={20} color={isResting ? "#FFF" : "#4A90E2"} />
                        <Text style={[styles.restBtnText, isResting && styles.restBtnTextActive]}>
                            {isResting ? `Resting: ${Math.floor(restSeconds / 60)}:${(restSeconds % 60).toString().padStart(2, '0')}` : "Rest Timer"}
                        </Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity 
                    style={[styles.finishBtn, styles.finishBtnActive, { marginTop: 40 }]}
                    onPress={saveExerciseToWorkout}
                >
                    <Text style={styles.finishBtnText}>ADD TO WORKOUT</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.discardBtn, { marginTop: 20, marginBottom: 40 }]}
                    onPress={() => {
                        setIsActive(false);
                        setSeconds(0);
                        setWeightTrainingLog([]);
                        setCurrentStep(0);
                    }}
                >
                    <Ionicons name="trash-outline" size={18} color="#666" />
                    <Text style={styles.discardText}>Cancel Session</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
        );

        if (Platform.OS === 'web') return Content;

        return (
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                {Content}
            </KeyboardAvoidingView>
        );
    };

    const renderStep16 = () => {
        let sessionVolume = 0;
        weightTrainingLog.forEach(ex => {
            ex.sets.forEach(s => {
                sessionVolume += (parseFloat(s.weight) || 0) * (parseFloat(s.reps) || 0);
            });
        });

        return (
            <View style={styles.stepContainer}>
                <View style={styles.historyHeader}>
                    <View>
                        <Text style={styles.setupTitle}>Session Review</Text>
                        <Text style={styles.setupSubtitle}>{weightTrainingLog.length} Exercises Logged</Text>
                    </View>
                    <View style={styles.volumeBadge}>
                        <Ionicons name="barbell" size={14} color="#FFF" style={{ marginRight: 5 }} />
                        <Text style={styles.volumeBadgeText}>{sessionVolume} kg Vol.</Text>
                    </View>
                </View>

                <ScrollView style={{ minHeight: 150, maxHeight: 400 }} showsVerticalScrollIndicator={false}>
                    {weightTrainingLog.map((ex, idx) => (
                        <View key={idx} style={styles.logReviewCard}>
                            <View style={styles.logReviewHeader}>
                                <Text style={styles.logReviewTitle}>{ex.exercise}</Text>
                                <Text style={styles.logReviewSets}>{ex.sets.length} Sets • {ex.sets.reduce((acc, s) => acc + (parseFloat(s.weight)*parseFloat(s.reps) || 0), 0)} kg</Text>
                            </View>
                            <View style={styles.logReviewSetsRow}>
                                {ex.sets.map((s, sidx) => (
                                    <View key={sidx} style={styles.setSummaryBadge}>
                                        <Text style={styles.setSummaryText}>{s.weight}x{s.reps}</Text>
                                    </View>
                                ))}
                            </View>
                            <TouchableOpacity 
                                style={styles.removeLogBtn}
                                onPress={() => setWeightTrainingLog(weightTrainingLog.filter((_, i) => i !== idx))}
                            >
                                <Ionicons name="close" size={18} color="#444" />
                            </TouchableOpacity>
                        </View>
                    ))}

                    <TouchableOpacity 
                        style={styles.addMoreBtn}
                        onPress={() => setCurrentStep(14)}
                    >
                        <Ionicons name="add-circle-outline" size={20} color="#888" />
                        <Text style={styles.addMoreText}>Add Another Exercise</Text>
                    </TouchableOpacity>
                </ScrollView>

                <View style={[styles.inputGroup, { marginTop: 20 }]}>
                    <Text style={styles.inputLabel}>Session Name</Text>
                    <TextInput 
                        style={styles.logInput}
                        value={sessionName}
                        onChangeText={setSessionName}
                        placeholder="e.g. Push Day, Chest & Triceps..."
                        placeholderTextColor="#444"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Session Notes</Text>
                    <TextInput 
                        style={[styles.logInput, { height: 80, textAlignVertical: 'top' }]}
                        value={workoutLog.feeling}
                        onChangeText={(val) => setWorkoutLog({...workoutLog, feeling: val})}
                        placeholder="Feeling more Grit today..."
                        placeholderTextColor="#444"
                        multiline
                    />
                </View>

                <TouchableOpacity 
                    style={[styles.finishBtn, styles.finishBtnActive, { marginTop: 20 }]}
                    onPress={finishWeightWorkout}
                >
                    <Text style={styles.finishBtnText}>COMPLETE WORKOUT</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={[styles.discardBtn, { marginTop: 15 }]}
                    onPress={() => {
                        setIsActive(false);
                        setSeconds(0);
                        setWeightTrainingLog([]);
                        setCurrentStep(0);
                    }}
                >
                    <Text style={styles.discardText}>Cancel Session</Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderStep17 = () => {
        if (!savedSessionData) return null;
        const d = savedSessionData;
        const mins = Math.floor(d.duration / 60);
        const secs = d.duration % 60;
        const dateStr = d.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        const timeStr = d.date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        return (
            <View style={styles.stepContainer}>
                <Text style={styles.setupTitle}>Session Complete 🎉</Text>
                <Text style={styles.setupSubtitle}>Great work! Here's your summary.</Text>

                <View style={styles.summaryCardStrava}>
                    <View style={styles.stravaHeader}>
                        <View style={styles.stravaUserIcon}>
                            <Ionicons name="person" size={20} color="#FFF" />
                        </View>
                        <View>
                            <Text style={styles.stravaUserName}>{profile?.full_name || 'Athlete'}</Text>
                            <Text style={styles.stravaDate}>{dateStr} at {timeStr}</Text>
                        </View>
                    </View>

                    <Text style={styles.stravaTitle}>{d.name}</Text>

                    <View style={styles.stravaStatsRow}>
                        <View style={styles.stravaStatItem}>
                            <Text style={styles.stravaStatValue}>{mins}:{secs.toString().padStart(2, '0')}</Text>
                            <Text style={styles.stravaStatLabel}>Duration</Text>
                        </View>
                        <View style={styles.stravaStatItem}>
                            <Text style={styles.stravaStatValue}>{d.volume.toLocaleString()} kg</Text>
                            <Text style={styles.stravaStatLabel}>Volume</Text>
                        </View>
                        <View style={styles.stravaStatItem}>
                            <Text style={styles.stravaStatValue}>{d.exerciseCount}</Text>
                            <Text style={styles.stravaStatLabel}>Exercises</Text>
                        </View>
                    </View>


                    {d.note ? (
                        <View style={styles.stravaNote}>
                            <Ionicons name="chatbubble-outline" size={16} color="#666" />
                            <Text style={styles.stravaNoteText}>{d.note}</Text>
                        </View>
                    ) : null}

                    <View style={styles.summaryFooter}>
                        <Ionicons name="fitness-outline" size={16} color="#888" />
                        <Text style={styles.footerText}>Grit. • Better everyday</Text>
                        <TouchableOpacity style={styles.shareBtn} onPress={downloadWeightSummary}>
                            <Ionicons name="download-outline" size={20} color="#4A90E2" />
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.finishBtn, styles.finishBtnActive, { marginTop: 40 }]}
                    onPress={() => {
                        setSavedSessionData(null);
                        setCurrentStep(0);
                    }}
                >
                    <Text style={styles.finishBtnText}>Back to Hub</Text>
                </TouchableOpacity>
            </View>
        );
    };

    const loadPlan = () => {
        if (profile?.workout_plan) {
            const plan = profile.workout_plan;
            setLocation(plan.location || '');
            setTrainingDays(plan.trainingDays || '5');
            setRestDays(plan.restDays || []);
            setWorkoutSplits(plan.workoutSplits || {});
            setAvgSets(plan.avgSets || '3');
            setAvgReps(plan.avgReps || '10');
            setWorkoutTime(plan.workoutTime || { hour: '07', minute: '00', period: 'AM' });
            setIsPlanCreated(true);
            if (startStep === 6 || startStep === 7) {
                setCurrentStep(7);
            }
        }
        setIsLoading(false);
    };

    const savePlan = async () => {
        if (!profile?.id) return;
        try {
            const planData = {
                location,
                trainingDays,
                restDays,
                workoutSplits,
                avgSets,
                avgReps,
                workoutTime,
                timestamp: new Date().toISOString()
            };

            const { error } = await supabase
                .from('profiles')
                .update({ workout_plan: planData })
                .eq('id', profile.id);

            if (error) throw error;
            await refreshProfile();
            
            // Schedule real notifications
            await NotificationService.scheduleWorkoutReminders(planData);
            
            setIsPlanCreated(true);
        } catch (err) {
            console.error('Error saving plan:', err);
        }
    };

    const clearPlan = async () => {
        if (!profile?.id) return;
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ workout_plan: null })
                .eq('id', profile.id);
            if (error) throw error;
        } catch (err) {
            console.error('Error clearing plan:', err);
        }
    };

    const renderNavTab = (label, icon, isActive = false, screenName) => (
        <TouchableOpacity
            style={styles.navTab}
            onPress={() => screenName && navigation.navigate(screenName)}
        >
            <Ionicons name={icon} size={24} color={isActive ? '#4A90E2' : '#888'} />
            <Text style={[styles.navTabText, isActive && styles.navTabActiveText]}>{label}</Text>
        </TouchableOpacity>
    );

    const WorkoutOption = ({ title, subtitle, icon, color, onPress }) => (
        <TouchableOpacity style={styles.optionCard} onPress={onPress}>
            <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
                <Ionicons name={icon} size={32} color={color} />
            </View>
            <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>{title}</Text>
                <Text style={styles.optionSubtitle}>{subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#333" />
        </TouchableOpacity>
    );

    const toggleRestDay = (day) => {
        const trDays = parseInt(trainingDays || 0);
        const maxRestDays = 7 - trDays;

        if (restDays.includes(day)) {
            setRestDays(restDays.filter(d => d !== day));
        } else {
            if (restDays.length < maxRestDays) {
                setRestDays([...restDays, day]);
            }
        }
    };

    const handleSaveSplit = () => {
        if (editingDay) {
            setWorkoutSplits({
                ...workoutSplits,
                [editingDay]: tempSplit
            });
            setEditingDay(null);
            setTempSplit('');
        }
    };

    const renderStep0 = () => (
        <>
            <Text style={styles.sectionTitle}>Choose your path</Text>
            <WorkoutOption
                title="Daily Log"
                subtitle="Log your exercises, sets, and reps for today."
                icon="calendar-outline"
                color="#4A90E2"
                onPress={() => setCurrentStep(8)}
            />
            <WorkoutOption
                title="My Workout Plan"
                subtitle={isPlanCreated ? "View or manage your current routine." : "Follow your custom routine and track progress."}
                icon="list-outline"
                color="#FF9800"
                onPress={() => {
                    if (isPlanCreated) {
                        setShowPlanOptions(true);
                    } else {
                        setCurrentStep(1);
                    }
                }}
            />
            <WorkoutOption
                title="Workouts History"
                subtitle="Review your past sessions and progress."
                icon="time-outline"
                color="#8E44AD"
                onPress={() => setCurrentStep(13)}
            />

            {showPlanOptions && (
                <View style={styles.planOptionsContainer}>
                    <TouchableOpacity 
                        style={styles.planOptionBtn} 
                        onPress={() => {
                            setShowPlanOptions(false);
                            setCurrentStep(7); // Go to summary
                        }}
                    >
                        <Ionicons name="eye-outline" size={20} color="#FFF" />
                        <Text style={styles.planOptionBtnText}>View Current Plan</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.planOptionBtn, { backgroundColor: '#222' }]} 
                        onPress={async () => {
                            // Reset state for new plan
                            await clearPlan();
                            setLocation('');
                            setTrainingDays('5');
                            setRestDays([]);
                            setWorkoutSplits({});
                            setAvgSets('3');
                            setAvgReps('10');
                            setWorkoutTime({ hour: '07', minute: '00', period: 'AM' });
                            setIsPlanCreated(false);
                            setShowPlanOptions(false);
                            setCurrentStep(1);
                        }}
                    >
                        <Ionicons name="add-circle-outline" size={20} color="#FFF" />
                        <Text style={styles.planOptionBtnText}>Create New Plan</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.planOptionCancel} 
                        onPress={() => setShowPlanOptions(false)}
                    >
                        <Text style={styles.planOptionCancelText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            )}

            <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={20} color="#888" />
                <Text style={styles.infoText}>
                    Consistency is the key to progress. Keep logging every session!
                </Text>
            </View>
        </>
    );

    const renderStep1 = () => (
        <View style={styles.stepContainer}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setCurrentStep(0)}>
                <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>

            <Text style={styles.setupTitle}>Where do you train?</Text>
            <Text style={styles.setupSubtitle}>We'll tailor your plan based on your equipment.</Text>

            <View style={styles.locationContainer}>
                <TouchableOpacity
                    style={[styles.locationCard, location === 'Home' && styles.locationCardActive]}
                    onPress={() => {
                        setLocation('Home');
                        setCurrentStep(2);
                    }}
                >
                    <Ionicons name="home-outline" size={48} color={location === 'Home' ? '#4A90E2' : '#555'} />
                    <Text style={[styles.locationText, location === 'Home' && styles.locationTextActive]}>Home</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.locationCard, location === 'Gym' && styles.locationCardActive]}
                    onPress={() => {
                        setLocation('Gym');
                        setCurrentStep(2);
                    }}
                >
                    <Ionicons name="business-outline" size={48} color={location === 'Gym' ? '#4A90E2' : '#555'} />
                    <Text style={[styles.locationText, location === 'Gym' && styles.locationTextActive]}>GYM</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderStep2 = () => {
        const trDays = parseInt(trainingDays) || 0;
        const maxRestDays = 7 - trDays;

        return (
            <View style={styles.stepContainer}>
                <TouchableOpacity style={styles.backBtn} onPress={() => setCurrentStep(1)}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>

                <Text style={styles.setupTitle}>Weekly Schedule</Text>
                <Text style={styles.setupSubtitle}>How often do you plan to push your limits?</Text>

                <View style={styles.inputSection}>
                    <Text style={styles.inputLabel}>Days per week (1-7)</Text>
                    <TextInput
                        style={styles.daysInput}
                        value={trainingDays}
                        onChangeText={(val) => {
                            const num = parseInt(val);
                            if (!val || (num >= 1 && num <= 7)) {
                                setTrainingDays(val);
                                setRestDays([]); // Reset rest days when frequency changes
                            }
                        }}
                        keyboardType="numeric"
                        placeholder="5"
                        placeholderTextColor="#444"
                    />
                </View>

                {trDays > 0 && trDays < 7 && (
                    <View style={styles.restDaySection}>
                        <View style={styles.restHeader}>
                            <Text style={styles.inputLabel}>Choose your rest days</Text>
                            <Text style={styles.restCount}>
                                {restDays.length}/{maxRestDays} selected
                            </Text>
                        </View>
                        <View style={styles.daysGrid}>
                            {DAYS.map((day) => {
                                const isRest = restDays.includes(day);
                                return (
                                    <TouchableOpacity
                                        key={day}
                                        style={[styles.dayCircle, isRest && styles.dayCircleRest]}
                                        onPress={() => toggleRestDay(day)}
                                    >
                                        <Text style={[styles.dayText, isRest && styles.dayTextRest]}>
                                            {isRest ? 'Rest' : day}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                )}

                <TouchableOpacity
                    style={[styles.finishBtn, (trDays === 7 || restDays.length === maxRestDays) && trDays > 0 ? styles.finishBtnActive : styles.finishBtnDisabled]}
                    disabled={!(trDays === 7 || (trDays > 0 && restDays.length === maxRestDays))}
                    onPress={() => {
                        setCurrentStep(3);
                    }}
                >
                    <Text style={styles.finishBtnText}>Next: Define Splits</Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderStep3 = () => {
        return (
            <View style={styles.stepContainer}>
                <TouchableOpacity style={styles.backBtn} onPress={() => setCurrentStep(2)}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>

                <Text style={styles.setupTitle}>Daily Splits</Text>
                <Text style={styles.setupSubtitle}>Tap a day to define its workout focus.</Text>

                <View style={styles.daysGrid}>
                    {DAYS.map((day) => {
                        const isRest = restDays.includes(day);
                        const splitText = workoutSplits[day];

                        return (
                            <TouchableOpacity
                                key={day}
                                style={[
                                    styles.splitCard,
                                    isRest && styles.splitCardRest,
                                    splitText && styles.splitCardActive
                                ]}
                                onPress={() => {
                                    if (!isRest) {
                                        setEditingDay(day);
                                        setTempSplit(workoutSplits[day] || '');
                                    }
                                }}
                                disabled={isRest}
                            >
                                <Text style={styles.dayLabel}>{day}</Text>
                                <Text
                                    style={[
                                        styles.splitText,
                                        isRest && styles.splitTextRest
                                    ]}
                                    numberOfLines={2}
                                >
                                    {isRest ? 'REST' : (splitText || 'Set Split')}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <TouchableOpacity
                    style={[styles.finishBtn, styles.finishBtnActive, { marginTop: 40 }]}
                    onPress={() => {
                        setCurrentStep(4);
                    }}
                >
                    <Text style={styles.finishBtnText}>Next: Training Style</Text>
                </TouchableOpacity>

                {/* Split Input Modal */}
                <Modal
                    visible={editingDay !== null}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setEditingDay(null)}
                >
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.modalOverlay}
                    >
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>What's the plan for {editingDay}?</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={tempSplit}
                                onChangeText={setTempSplit}
                                placeholder="e.g. Chest & Triceps"
                                placeholderTextColor="#555"
                                autoFocus={true}
                            />
                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={styles.modalBtn}
                                    onPress={() => setEditingDay(null)}
                                >
                                    <Text style={styles.modalBtnTextCancel}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalBtn, styles.modalBtnSave]}
                                    onPress={handleSaveSplit}
                                >
                                    <Text style={styles.modalBtnTextSave}>Save</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </Modal>
            </View>
        );
    };

    const renderStep4 = () => (
        <View style={styles.stepContainer}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setCurrentStep(3)}>
                <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>

            <Text style={styles.setupTitle}>Training Volume</Text>
            <Text style={styles.setupSubtitle}>How many sets and reps do you typically do for one exercise?</Text>

            <View style={styles.volumeRow}>
                <View style={styles.volumeInputContainer}>
                    <Text style={styles.inputLabel}>Avg. Sets</Text>
                    <TextInput
                        style={styles.volumeInput}
                        value={avgSets}
                        onChangeText={setAvgSets}
                        keyboardType="numeric"
                        placeholder="3"
                        placeholderTextColor="#444"
                    />
                </View>

                <View style={styles.volumeInputContainer}>
                    <Text style={styles.inputLabel}>Avg. Reps</Text>
                    <TextInput
                        style={styles.volumeInput}
                        value={avgReps}
                        onChangeText={setAvgReps}
                        keyboardType="numeric"
                        placeholder="10"
                        placeholderTextColor="#444"
                    />
                </View>
            </View>

            <TouchableOpacity
                style={[styles.finishBtn, styles.finishBtnActive, { marginTop: 40 }]}
                onPress={() => setCurrentStep(5)}
            >
                <Text style={styles.finishBtnText}>Next: Guidance</Text>
            </TouchableOpacity>
        </View>
    );

    const renderStep5 = () => (
        <View style={styles.stepContainer}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setCurrentStep(4)}>
                <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>

            <Text style={styles.setupTitle}>Pro Tips</Text>
            <Text style={styles.setupSubtitle}>Important advice for your fitness journey.</Text>

            <View style={styles.noteCard}>
                <Ionicons name="trending-up-outline" size={32} color="#4A90E2" />
                <View style={styles.noteContent}>
                    <Text style={styles.noteTitle}>Progressive Overload</Text>
                    <Text style={styles.noteText}>To keep making gains, aim to increase weight or reps every week.</Text>
                </View>
            </View>

            <View style={[styles.noteCard, { marginTop: 20 }]}>
                <Ionicons name="medical-outline" size={32} color="#E24A4A" />
                <View style={styles.noteContent}>
                    <Text style={styles.noteTitle}>Listen to your Body</Text>
                    <Text style={styles.noteText}>If you feel any sharp pain or injury, skip training and rest. Safety first!</Text>
                </View>
            </View>

            <TouchableOpacity
                style={[styles.finishBtn, styles.finishBtnActive, { marginTop: 40 }]}
                onPress={async () => {
                    setCurrentStep(6);
                }}
            >
                <Text style={styles.finishBtnText}>Next: Schedule Reminder</Text>
            </TouchableOpacity>
        </View>
    );

    const renderStep6 = () => {
        const adjustHour = (delta) => {
            let h = parseInt(workoutTime.hour);
            h = (h + delta);
            if (h > 12) h = 1;
            if (h < 1) h = 12;
            setWorkoutTime({ ...workoutTime, hour: h.toString().padStart(2, '0') });
        };

        const adjustMinute = (delta) => {
            let m = parseInt(workoutTime.minute);
            m = (m + delta);
            if (m >= 60) m = 0;
            if (m < 0) m = 45;
            setWorkoutTime({ ...workoutTime, minute: m.toString().padStart(2, '0') });
        };

        return (
            <View style={styles.stepContainer}>
                <TouchableOpacity style={styles.backBtn} onPress={() => setCurrentStep(5)}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>

                <Text style={styles.setupTitle}>Workout Time</Text>
                <Text style={styles.setupSubtitle}>When should we remind you to crush it?</Text>

                <View style={styles.timePickerContainer}>
                    <View style={styles.timeColumn}>
                        <Text style={styles.timeLabel}>Hour</Text>
                        <View style={styles.controlGroup}>
                            <TouchableOpacity style={styles.controlBtn} onPress={() => adjustHour(1)}>
                                <Ionicons name="add" size={24} color="#4A90E2" />
                            </TouchableOpacity>
                            <View style={styles.timeDisplay}>
                                <Text style={styles.timeDisplayText}>{workoutTime.hour}</Text>
                            </View>
                            <TouchableOpacity style={styles.controlBtn} onPress={() => adjustHour(-1)}>
                                <Ionicons name="remove" size={24} color="#4A90E2" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <Text style={styles.timeSeparator}>:</Text>

                    <View style={styles.timeColumn}>
                        <Text style={styles.timeLabel}>Min</Text>
                        <View style={styles.controlGroup}>
                            <TouchableOpacity style={styles.controlBtn} onPress={() => adjustMinute(15)}>
                                <Ionicons name="add" size={24} color="#4A90E2" />
                            </TouchableOpacity>
                            <View style={styles.timeDisplay}>
                                <Text style={styles.timeDisplayText}>{workoutTime.minute}</Text>
                            </View>
                            <TouchableOpacity style={styles.controlBtn} onPress={() => adjustMinute(-15)}>
                                <Ionicons name="remove" size={24} color="#4A90E2" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.periodColumn}>
                        <TouchableOpacity 
                            style={[styles.periodBtn, workoutTime.period === 'AM' && styles.periodBtnActive]}
                            onPress={() => setWorkoutTime({ ...workoutTime, period: 'AM' })}
                        >
                            <Text style={[styles.periodText, workoutTime.period === 'AM' && styles.periodTextActive]}>AM</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.periodBtn, workoutTime.period === 'PM' && styles.periodBtnActive]}
                            onPress={() => setWorkoutTime({ ...workoutTime, period: 'PM' })}
                        >
                            <Text style={[styles.periodText, workoutTime.period === 'PM' && styles.periodTextActive]}>PM</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.finishBtn, styles.finishBtnActive, { marginTop: 40 }]}
                    onPress={async () => {
                        await savePlan();
                        setCurrentStep(7);
                    }}
                >
                    <Text style={styles.finishBtnText}>Finish and View Summary</Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderStep12 = () => {
        return (
            <View style={styles.stepContainer}>
                <View style={styles.summaryCardStrava}>
                    <View style={styles.stravaHeader}>
                        <View style={styles.stravaUserIcon}>
                            <Ionicons name="person" size={20} color="#FFF" />
                        </View>
                        <View>
                            <Text style={styles.stravaUserName}>{profile?.full_name || profile?.username || 'Sanjeev'}</Text>
                            <Text style={styles.stravaDate}>{new Date().toLocaleDateString()} • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                        </View>
                        <TouchableOpacity 
                            style={styles.shareBtn}
                            onPress={downloadSummaryCard}
                        >
                            <Ionicons name="download-outline" size={20} color="#4A90E2" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.stravaTitle}>{workoutLog.name}</Text>

                    <View style={styles.stravaStatsRow}>
                        <View style={styles.stravaStatItem}>
                            <Text style={styles.stravaStatValue}>{workoutLog.distance || '0'} km</Text>
                            <Text style={styles.stravaStatLabel}>Distance</Text>
                        </View>
                        <View style={styles.stravaStatItem}>
                            <Text style={styles.stravaStatValue}>{workoutLog.pace || '0:00'} /km</Text>
                            <Text style={styles.stravaStatLabel}>Pace</Text>
                        </View>
                        <View style={styles.stravaStatItem}>
                            <Text style={styles.stravaStatValue}>{formatTime(seconds)}</Text>
                            <Text style={styles.stravaStatLabel}>Time</Text>
                        </View>
                    </View>

                    {workoutLog.feeling ? (
                        <View style={styles.stravaNote}>
                            <Ionicons name="chatbubble-outline" size={14} color="#888" />
                            <Text style={styles.stravaNoteText}>"{workoutLog.feeling}"</Text>
                        </View>
                    ) : null}

                    <View style={styles.stravaFooter}>
                        <Text style={styles.stravaBranding}>Grit.</Text>
                    </View>
                </View>

                <TouchableOpacity 
                    style={[styles.finishBtn, styles.finishBtnActive, { marginTop: 30 }]}
                    onPress={async () => {
                        await saveWorkoutToHistory(workoutLog);
                        setSeconds(0);
                        setIsActive(false);
                        setCurrentStep(0);
                    }}
                >
                    <Text style={styles.finishBtnText}>DONE</Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderStep13 = () => {
        return (
            <View style={styles.stepContainer}>
                <TouchableOpacity style={styles.backBtn} onPress={() => setCurrentStep(0)}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>

                <Text style={styles.setupTitle}>Workouts History</Text>
                <Text style={styles.setupSubtitle}>Your journey, one session at a time.</Text>

                <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 20 }}>
                    {workoutHistory.length === 0 ? (
                        <View style={styles.emptyHistory}>
                            <Ionicons name="journal-outline" size={64} color="#222" />
                            <Text style={styles.emptyHistoryText}>No workouts logged yet.</Text>
                            <TouchableOpacity 
                                style={styles.startFirstBtn}
                                onPress={() => setCurrentStep(8)}
                            >
                                <Text style={styles.startFirstBtnText}>Log your first workout</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        workoutHistory.map(item => (
                            <TouchableOpacity 
                                key={item.id} 
                                style={styles.historyCard}
                                onPress={() => {
                                    if (item.type === 'Weight Training') {
                                        setSelectedHistoryItem(item);
                                        setCurrentStep(18);
                                    }
                                }}
                            >
                                <View style={styles.historyHeader}>
                                    <View style={[styles.historyIcon, { backgroundColor: item.type === 'Cardio' ? '#4A90E220' : '#E24A4A20' }]}>
                                        <Ionicons 
                                            name={item.type === 'Cardio' ? "walk" : "barbell"} 
                                            size={20} 
                                            color={item.type === 'Cardio' ? "#4A90E2" : "#E24A4A"} 
                                        />
                                    </View>
                                    <View style={styles.historyInfo}>
                                        <Text style={styles.historyName}>{item.name}</Text>
                                        <Text style={styles.historyDate}>
                                            {new Date(item.timestamp).toLocaleDateString()} • {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                    </View>
                                </View>
                                
                                <View style={styles.historyStats}>
                                    {item.type === 'Weight Training' ? (
                                        <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Text style={{ color: '#666', fontSize: 13, fontStyle: 'italic' }}>Tap for details</Text>
                                            <Ionicons name="apps-outline" size={16} color="#4A90E2" />
                                        </View>
                                    ) : (
                                        <>
                                            <View style={styles.hStat}>
                                                <Text style={styles.hStatText}>{item.distance || '0'} km</Text>
                                                <Text style={styles.hStatLabel}>Distance</Text>
                                            </View>
                                            <View style={styles.hStat}>
                                                <Text style={styles.hStatText}>{formatTime(item.duration)}</Text>
                                                <Text style={styles.hStatLabel}>Time</Text>
                                            </View>
                                            <View style={styles.hStat}>
                                                <Text style={styles.hStatText}>{item.pace || '0:00'}</Text>
                                                <Text style={styles.hStatLabel}>Pace</Text>
                                            </View>
                                        </>
                                    )}
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                    <View style={{ height: 100 }} />
                </ScrollView>
                
            </View>
        );
    };

    const renderHistoryDetail = () => {
        if (!selectedHistoryItem) return null;
        const d = selectedHistoryItem;
        const dateObj = new Date(d.timestamp);
        const dateStr = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const mins = Math.floor(d.duration / 60);
        const scs = d.duration % 60;

        return (
            <View style={styles.stepContainer}>
                <TouchableOpacity style={styles.backBtn} onPress={() => {
                    setSelectedHistoryItem(null);
                    setCurrentStep(13);
                }}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>

                <Text style={styles.setupTitle}>Session Detail</Text>
                <Text style={styles.setupSubtitle}>Reviewing your past Grit.</Text>

                <View style={styles.summaryCardStrava}>
                    <View style={styles.stravaHeader}>
                        <View style={styles.stravaUserIcon}>
                            <Ionicons name="person" size={20} color="#FFF" />
                        </View>
                        <View>
                            <Text style={styles.stravaUserName}>{profile?.full_name || 'Athlete'}</Text>
                            <Text style={styles.stravaDate}>{dateStr} at {timeStr}</Text>
                        </View>
                    </View>

                    <Text style={styles.stravaTitle}>{d.name}</Text>

                    <View style={styles.stravaStatsRow}>
                        <View style={styles.stravaStatItem}>
                            <Text style={styles.stravaStatValue}>{mins}:{scs.toString().padStart(2, '0')}</Text>
                            <Text style={styles.stravaStatLabel}>Duration</Text>
                        </View>
                        <View style={styles.stravaStatItem}>
                            <Text style={styles.stravaStatValue}>{d.volume?.toLocaleString() || 0} kg</Text>
                            <Text style={styles.stravaStatLabel}>Volume</Text>
                        </View>
                        <View style={styles.stravaStatItem}>
                            <Text style={styles.stravaStatValue}>{d.sets_count || 0}</Text>
                            <Text style={styles.stravaStatLabel}>Exercises</Text>
                        </View>
                    </View>

                    <View style={{ marginVertical: 15 }}>
                        <Text style={{ color: '#4A90E2', fontSize: 12, fontWeight: 'bold', marginBottom: 10, letterSpacing: 1 }}>EXERCISE BREAKDOWN</Text>
                        {d.sets && d.sets.map((ex, idx) => (
                            <View key={idx} style={{ marginBottom: 15, paddingBottom: 15, borderBottomWidth: idx < d.sets.length - 1 ? 1 : 0, borderBottomColor: '#1A1A1A' }}>
                                <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '600', marginBottom: 8 }}>{ex.exercise}</Text>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                    {ex.sets.map((s, sidx) => (
                                        <View key={sidx} style={styles.setSummaryBadge}>
                                            <Text style={styles.setSummaryText}>{s.weight}x{s.reps}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        ))}
                    </View>

                    {d.feeling ? (
                        <View style={styles.stravaNote}>
                            <Ionicons name="chatbubble-outline" size={16} color="#666" />
                            <Text style={styles.stravaNoteText}>{d.feeling}</Text>
                        </View>
                    ) : null}

                    <View style={styles.summaryFooter}>
                        <Ionicons name="fitness-outline" size={16} color="#888" />
                        <Text style={styles.footerText}>Grit. • Better everyday</Text>
                    </View>
                </View>

                <TouchableOpacity 
                    style={[styles.finishBtn, styles.finishBtnActive, { marginTop: 30 }]}
                    onPress={() => {
                        setSelectedHistoryItem(null);
                        setCurrentStep(13);
                    }}
                >
                    <Text style={styles.finishBtnText}>Close Details</Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderStep11 = () => {
        return (
            <View style={styles.stepContainer}>
                <TouchableOpacity style={styles.backBtn} onPress={() => setCurrentStep(10)}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>

                <Text style={styles.setupTitle}>Log your session</Text>
                <Text style={styles.setupSubtitle}>Great work! Tell us how it went.</Text>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Session Name</Text>
                        <TextInput 
                            style={styles.logInput}
                            value={workoutLog.name}
                            onChangeText={(val) => setWorkoutLog({...workoutLog, name: val})}
                            placeholder="Morning Run..."
                            placeholderTextColor="#444"
                        />
                    </View>

                    <View style={styles.logStatsGrid}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                            <Text style={styles.inputLabel}>Distance (km)</Text>
                            <TextInput 
                                style={styles.logInput}
                                value={workoutLog.distance}
                                onChangeText={(val) => setWorkoutLog({...workoutLog, distance: val})}
                                placeholder="5.0"
                                keyboardType="numeric"
                                placeholderTextColor="#444"
                            />
                        </View>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.inputLabel}>Avg. Pace (/km)</Text>
                            <TextInput 
                                style={styles.logInput}
                                value={workoutLog.pace}
                                onChangeText={(val) => setWorkoutLog({...workoutLog, pace: val})}
                                placeholder="5:30"
                                placeholderTextColor="#444"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Duration</Text>
                        <View style={[styles.logInput, { backgroundColor: '#111', justifyContent: 'center' }]}>
                            <Text style={{ color: '#888', fontSize: 16 }}>{formatTime(seconds)}</Text>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>How do you feel?</Text>
                        <TextInput 
                            style={[styles.logInput, { height: 100, textAlignVertical: 'top' }]}
                            value={workoutLog.feeling}
                            onChangeText={(val) => setWorkoutLog({...workoutLog, feeling: val})}
                            placeholder="Crushed it! Feeling stronger."
                            placeholderTextColor="#444"
                            multiline
                        />
                    </View>

                    <View style={styles.gratitudeNote}>
                        <Ionicons name="heart" size={20} color="#E24A4A" />
                        <Text style={styles.gratitudeText}>You're building the version of yourself you'll be proud of.</Text>
                    </View>

                    <TouchableOpacity 
                        style={[styles.finishBtn, styles.finishBtnActive, { marginTop: 20 }]}
                        onPress={() => setCurrentStep(12)}
                    >
                        <Text style={styles.finishBtnText}>SAVE RECORD</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        );
    };

    const renderStep10 = () => {
        const spin = rotateAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '360deg']
        });

        return (
            <View style={styles.stepContainer}>
                {/* Top Left Stopwatch */}
                <View style={styles.liveTimerContainer}>
                    <Text style={styles.liveTimerLabel}>Duration</Text>
                    <Text style={styles.liveTimerText}>{formatTime(seconds)}</Text>
                </View>

                {/* Center Content */}
                <View style={styles.sessionCenter}>
                    <Text style={styles.activeExerciseName}>{activeExercise}</Text>
                    
                    <View style={styles.animationContainer}>
                        <Animated.View style={[styles.orbitingCircle, { transform: [{ rotate: spin }] }]}>
                            <View style={styles.orbitingDot} />
                        </Animated.View>
                        <View style={styles.innerCircle}>
                            <Ionicons name="pulse" size={60} color={isActive ? "#4A90E2" : "#444"} />
                        </View>
                    </View>

                    <Text style={styles.sessionStatus}>
                        {isActive ? "SESSION ACTIVE" : "SESSION PAUSED"}
                    </Text>
                </View>

                {/* Controls */}
                <View style={styles.sessionControls}>
                    <TouchableOpacity 
                        style={[styles.sessionBtn, isActive ? styles.pauseBtn : styles.resumeBtn]} 
                        onPress={() => setIsActive(!isActive)}
                    >
                        <Ionicons name={isActive ? "pause" : "play"} size={22} color="#FFF" />
                        <Text style={styles.sessionBtnText}>{isActive ? "PAUSE" : "RESUME"}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.sessionBtn, styles.finishSessionBtn]} 
                        onPress={() => {
                            setIsActive(false);
                            setCurrentStep(11);
                        }}
                    >
                        <Ionicons name="checkmark-done" size={22} color="#FFF" />
                        <Text style={styles.sessionBtnText}>FINISH</Text>
                    </TouchableOpacity>
                </View>
                {/* Discard Button */}
                <TouchableOpacity 
                    style={styles.discardBtn}
                    onPress={() => {
                        setIsActive(false);
                        setSeconds(0);
                        setCurrentStep(0);
                    }}
                >
                    <Ionicons name="trash-outline" size={16} color="#666" />
                    <Text style={styles.discardText}>Discard Workout</Text>
                </TouchableOpacity>
            </View>
        );
    };


    const renderStep9 = () => {
        // Build a list of all favorites (Popular + Custom)
        const allFavorites = cardioFavorites.map(name => {
            const popular = POPULAR_CARDIO.find(p => p.name === name);
            return popular || { id: name.toLowerCase(), name: name, icon: 'sparkles-outline' };
        });

        const filteredCardio = showFavoritesOnly 
            ? allFavorites
            : POPULAR_CARDIO;

        return (
            <View style={styles.stepContainer}>
                <View style={styles.cardioHeader}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => setCurrentStep(8)}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.setupTitle}>Cardio</Text>
                    <TouchableOpacity 
                        style={[styles.favFilterBtn, showFavoritesOnly && styles.favFilterBtnActive]}
                        onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
                    >
                        <Ionicons name={showFavoritesOnly ? "heart" : "heart-outline"} size={20} color={showFavoritesOnly ? "#E24A4A" : "#888"} />
                        <Text style={[styles.favFilterText, showFavoritesOnly && styles.favFilterTextActive]}>Favorites</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.setupSubtitle}>
                    {showFavoritesOnly ? "Your favorite activities." : "Popular cardio exercises to get your heart pumping."}
                </Text>

                <View style={styles.cardioList}>
                    {filteredCardio.map((item) => (
                        <TouchableOpacity 
                            key={item.id} 
                            style={styles.cardioItem}
                        onPress={() => {
                            startSession(item.name);
                        }}
                        >
                            <View style={styles.cardioIconContainer}>
                                <Ionicons name={item.icon} size={24} color="#FFF" />
                            </View>
                            <Text style={styles.cardioName}>{item.name}</Text>
                            <TouchableOpacity 
                                style={styles.heartBtn}
                                onPress={() => toggleCardioFavorite(item.name)}
                            >
                                <Ionicons 
                                    name={cardioFavorites.includes(item.name) ? "heart" : "heart-outline"} 
                                    size={24} 
                                    color={cardioFavorites.includes(item.name) ? "#E24A4A" : "#444"} 
                                />
                            </TouchableOpacity>
                        </TouchableOpacity>
                    ))}

                    {filteredCardio.length === 0 && showFavoritesOnly && (
                        <View style={styles.emptyFavs}>
                            <Ionicons name="heart-dislike-outline" size={48} color="#222" />
                            <Text style={styles.emptyFavsText}>No favorites yet. Tap the heart on any exercise to add it here!</Text>
                        </View>
                    )}
                </View>

                {!showFavoritesOnly && (
                    <View style={styles.otherCardioContainer}>
                        <Text style={styles.otherTitle}>Other</Text>
                        <View style={styles.otherInputWrapper}>
                            <TextInput
                                style={styles.otherInput}
                                placeholder="Type your cardio here..."
                                placeholderTextColor="#444"
                                value={customCardio}
                                onChangeText={setCustomCardio}
                            />
                            {customCardio.trim().length > 0 && (
                                <TouchableOpacity 
                                    style={styles.customHeartBtn}
                                    onPress={() => toggleCardioFavorite(customCardio.trim())}
                                >
                                    <Ionicons 
                                        name={cardioFavorites.includes(customCardio.trim()) ? "heart" : "heart-outline"} 
                                        size={24} 
                                        color={cardioFavorites.includes(customCardio.trim()) ? "#E24A4A" : "#444"} 
                                    />
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity 
                                style={[styles.otherAddBtn, !customCardio && styles.otherAddBtnDisabled]}
                                disabled={!customCardio}
                                onPress={() => {
                                    startSession(customCardio.trim());
                                    setCustomCardio('');
                                }}
                            >
                                <Ionicons name="arrow-forward" size={20} color="#000" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>
        );
    };

    const renderStep8 = () => (
        <View style={styles.stepContainer}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setCurrentStep(0)}>
                <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>

            <Text style={styles.setupTitle}>Daily Log</Text>
            <Text style={styles.setupSubtitle}>Which one do you wanna log today?</Text>

            <View style={{ marginTop: 20 }}>
                <WorkoutOption
                    title="Weight Training"
                    subtitle="Log your lifts, sets, and progression."
                    icon="barbell-outline"
                    color="#4A90E2"
                    onPress={() => {
                        setCurrentStep(14);
                    }}
                />

                <WorkoutOption
                    title="Cardio"
                    subtitle="Log your run, cycle, or other cardio activities."
                    icon="fitness-outline"
                    color="#E24A4A"
                    onPress={() => {
                        setCurrentStep(9);
                    }}
                />
            </View>

            <View style={styles.infoBox}>
                <Ionicons name="sparkles-outline" size={20} color="#888" />
                <Text style={styles.infoText}>
                    Tracking every session is how you build true Grit.
                </Text>
            </View>
        </View>
    );

    const renderStep7 = () => {
        const trDays = parseInt(trainingDays) || 0;
        
        return (
            <View style={styles.stepContainer}>
                <TouchableOpacity style={styles.backBtn} onPress={() => {
                    if (isPlanCreated) {
                        setCurrentStep(0);
                    } else {
                        setCurrentStep(6);
                    }
                }}>
                    <Ionicons name="close" size={24} color="#FFF" />
                </TouchableOpacity>

                <View style={styles.summaryCard}>
                    <View style={styles.summaryHeader}>
                        <View style={styles.avatarCircle}>
                            <Ionicons name="person" size={24} color="#FFF" />
                        </View>
                        <View>
                            <Text style={styles.summaryName}>My Workout Plan</Text>
                            <Text style={styles.summaryDate}>{new Date().toLocaleDateString()}</Text>
                        </View>
                        <View style={styles.stravaLogo}>
                            <Ionicons name="flash" size={24} color="#FF4500" />
                        </View>
                    </View>

                    <View style={styles.summaryStatsRow}>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>Location</Text>
                            <Text style={styles.statValue}>{location}</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>Freq</Text>
                            <Text style={styles.statValue}>{trDays}d/wk</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>Style</Text>
                            <Text style={styles.statValue}>{avgSets}x{avgReps}</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>Time</Text>
                            <Text style={styles.statValue}>{workoutTime.hour}:{workoutTime.minute} {workoutTime.period}</Text>
                        </View>
                    </View>

                    <View style={styles.summarySplits}>
                        <Text style={styles.splitsTitle}>Weekly Splits</Text>
                        <View style={styles.summaryGrid}>
                            {DAYS.map(day => {
                                const isRest = restDays.includes(day);
                                return (
                                    <View key={day} style={styles.summaryDayItem}>
                                        <Text style={styles.summaryDayLabel}>{day.substring(0, 1)}</Text>
                                        <View style={[styles.summaryDayBox, isRest && styles.summaryDayBoxRest]}>
                                            <Text 
                                                style={styles.summaryDayText} 
                                                numberOfLines={2}
                                                adjustsFontSizeToFit={true}
                                                minimumFontScale={0.7}
                                            >
                                                {isRest ? 'Rest' : (workoutSplits[day] || 'Train')}
                                            </Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    </View>

                    <View style={styles.summaryFooter}>
                        <Ionicons name="fitness-outline" size={16} color="#888" />
                        <Text style={styles.footerText}>Grit. • Better everyday</Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.finishBtn, styles.finishBtnActive, { marginTop: 40 }]}
                    onPress={() => setCurrentStep(0)}
                >
                    <Text style={styles.finishBtnText}>Back to Hub</Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Workouts</Text>
                        <Text style={styles.subGreeting}>Let's crush your goals today</Text>
                    </View>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {isLoading ? (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 }}>
                            <ActivityIndicator size="large" color="#4A90E2" />
                        </View>
                    ) : (
                        <>
                            {currentStep === 0 && renderStep0()}
                            {currentStep === 1 && renderStep1()}
                            {currentStep === 2 && renderStep2()}
                            {currentStep === 3 && renderStep3()}
                            {currentStep === 4 && renderStep4()}
                            {currentStep === 5 && renderStep5()}
                            {currentStep === 6 && renderStep6()}
                            {currentStep === 7 && renderStep7()}
                            {currentStep === 8 && renderStep8()}
                            {currentStep === 9 && renderStep9()}
                            {currentStep === 10 && renderStep10()}
                            {currentStep === 11 && renderStep11()}
                            {currentStep === 12 && renderStep12()}
                            {currentStep === 13 && renderStep13()}
                            {currentStep === 14 && renderStep14()}
                            {currentStep === 15 && renderStep15()}
                            {currentStep === 16 && renderStep16()}
                            {currentStep === 17 && renderStep17()}
                            {currentStep === 18 && renderHistoryDetail()}
                        </>
                    )}
                </ScrollView>

                {/* Advice Modal */}
                <Modal
                    visible={showAdviceModal}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowAdviceModal(false)}
                >
                    <View style={styles.adviceOverlay}>
                        <View style={styles.adviceContent}>
                            <View style={styles.adviceHeader}>
                                <Ionicons name="information-circle" size={32} color="#4A90E2" />
                                <Text style={styles.adviceTitle}>Tracking Advice</Text>
                            </View>
                            
                            <Text style={styles.adviceText}>
                                For the most accurate session data, we recommend using a fitness tracker like an Apple Watch or other apps while you work out.
                            </Text>

                            <View style={styles.adviceTipRow}>
                                <Ionicons name="watch-outline" size={20} color="#888" />
                                <Text style={styles.adviceTipText}>Sync your data after the session</Text>
                            </View>

                            <TouchableOpacity 
                                style={styles.adviceStartBtn}
                                onPress={confirmStart}
                            >
                                <Text style={styles.adviceStartText}>START SESSION</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={styles.adviceCancelBtn}
                                onPress={() => setShowAdviceModal(false)}
                            >
                                <Text style={styles.adviceCancelText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* Rest Timer Setup Modal */}
                <Modal
                    visible={showRestModal}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => {}}
                >
                    <View style={styles.adviceOverlay}>
                        <View style={styles.adviceContent}>
                            <View style={styles.adviceHeader}>
                                <Ionicons name="timer-outline" size={32} color="#4A90E2" />
                                <Text style={styles.adviceTitle}>Rest Timer</Text>
                            </View>
                            
                            <Text style={styles.adviceText}>
                                Set your rest duration
                            </Text>

                            <View style={styles.restTimerInputRow}>
                                <View style={styles.restTimerInputGroup}>
                                    <TextInput
                                        style={styles.restTimerInput}
                                        value={tempRestMins}
                                        onChangeText={setTempRestMins}
                                        keyboardType="numeric"
                                        maxLength={2}
                                        placeholder="0"
                                        placeholderTextColor="#444"
                                    />
                                    <Text style={styles.restTimerLabel}>min</Text>
                                </View>
                                <Text style={styles.restTimerSeparator}>:</Text>
                                <View style={styles.restTimerInputGroup}>
                                    <TextInput
                                        style={styles.restTimerInput}
                                        value={tempRestSecs}
                                        onChangeText={setTempRestSecs}
                                        keyboardType="numeric"
                                        maxLength={2}
                                        placeholder="0"
                                        placeholderTextColor="#444"
                                    />
                                    <Text style={styles.restTimerLabel}>sec</Text>
                                </View>
                            </View>

                            <TouchableOpacity 
                                style={styles.adviceStartBtn}
                                onPress={() => {
                                    const totalSecs = (parseInt(tempRestMins) || 0) * 60 + (parseInt(tempRestSecs) || 0);
                                    if (totalSecs > 0) {
                                        setRestSeconds(totalSecs);
                                        setIsResting(true);
                                        setShowRestModal(false);
                                    }
                                }}
                            >
                                <Text style={styles.adviceStartText}>SET</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={styles.adviceCancelBtn}
                                onPress={() => setShowRestModal(false)}
                            >
                                <Text style={styles.adviceCancelText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* Full-Screen Rest Countdown (Locked) */}
                <Modal
                    visible={isResting}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => {}}
                >
                    <View style={styles.restCountdownOverlay}>
                        <Ionicons name="timer-outline" size={48} color="#4A90E2" style={{ marginBottom: 20 }} />
                        <Text style={styles.restCountdownLabel}>REST</Text>
                        <Text style={styles.restCountdownTime}>
                            {Math.floor(restSeconds / 60)}:{(restSeconds % 60).toString().padStart(2, '0')}
                        </Text>
                        <Text style={styles.restCountdownHint}>Take a breather. You earned it.</Text>
                        
                        <TouchableOpacity 
                            style={styles.endRestBtn}
                            onPress={() => setRestSeconds(0)}
                        >
                            <Text style={styles.endRestText}>End Rest</Text>
                        </TouchableOpacity>
                    </View>
                </Modal>

                {/* Rest Over Modal */}
                <Modal
                    visible={showRestOver}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowRestOver(false)}
                >
                    <View style={styles.adviceOverlay}>
                        <View style={styles.adviceContent}>
                            <Ionicons name="checkmark-circle" size={64} color="#4A90E2" style={{ marginBottom: 20 }} />
                            <Text style={[styles.adviceTitle, { marginLeft: 0, fontSize: 24, marginBottom: 10 }]}>Rest Time Over!</Text>
                            <Text style={styles.adviceText}>
                                You're ready to crush the next set.
                            </Text>
                            <TouchableOpacity 
                                style={styles.adviceStartBtn}
                                onPress={() => setShowRestOver(false)}
                            >
                                <Text style={styles.adviceStartText}>OK</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </SafeAreaView>

            {/* Bottom Navigation */}
            <View style={styles.bottomNav}>
                {renderNavTab('Home', 'home-outline', false, 'Home')}
                {renderNavTab('Explore', 'search-outline', false, 'Explore')}
                <TouchableOpacity style={styles.addBtnContainer}>
                    <View style={styles.addBtn}>
                        <Ionicons name="add" size={32} color="#000" />
                    </View>
                    <Text style={[styles.navTabText, { color: '#4A90E2', fontWeight: '700' }]}>Workout</Text>
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
    safeArea: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 40 : 20,
        paddingBottom: 20,
    },
    greeting: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFF',
    },
    subGreeting: {
        fontSize: 14,
        color: '#888',
        marginTop: 4,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
        marginTop: 20,
        marginBottom: 15,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111',
        borderRadius: 20,
        padding: 20,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#222',
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionContent: {
        flex: 1,
        marginLeft: 15,
    },
    optionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
    },
    optionSubtitle: {
        fontSize: 13,
        color: '#888',
        marginTop: 4,
        lineHeight: 18,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0A0A0A',
        padding: 15,
        borderRadius: 15,
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#111',
    },
    infoText: {
        color: '#888',
        fontSize: 13,
        marginLeft: 10,
        flex: 1,
        lineHeight: 18,
    },
    // Flow Styles
    stepContainer: {
        marginTop: 10,
    },
    backBtn: {
        marginBottom: 20,
    },
    stepHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    backBtnHeader: {
        padding: 0,
    },
    stopwatchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(74, 144, 226, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(74, 144, 226, 0.2)',
    },
    stopwatchText: {
        color: '#4A90E2',
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 6,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
        gap: 10,
    },
    addSetBtnSmall: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 12,
        backgroundColor: '#111',
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: '#4A90E2',
    },
    restBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 12,
        backgroundColor: '#111',
        borderWidth: 1,
        borderColor: '#4A90E2',
    },
    restBtnActive: {
        backgroundColor: '#4A90E2',
        borderColor: '#4A90E2',
    },
    restBtnText: {
        color: '#4A90E2',
        fontWeight: 'bold',
        marginLeft: 5,
        fontSize: 13,
    },
    restBtnTextActive: {
        color: '#FFF',
    },
    restTimerInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 25,
    },
    restTimerInputGroup: {
        alignItems: 'center',
    },
    restTimerInput: {
        backgroundColor: '#000',
        color: '#FFF',
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        width: 80,
        height: 70,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#333',
    },
    restTimerLabel: {
        color: '#888',
        fontSize: 12,
        fontWeight: '600',
        marginTop: 5,
    },
    restTimerSeparator: {
        color: '#FFF',
        fontSize: 28,
        fontWeight: 'bold',
        marginHorizontal: 15,
    },
    restCountdownOverlay: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    restCountdownLabel: {
        color: '#888',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 4,
        textTransform: 'uppercase',
        marginBottom: 10,
    },
    restCountdownTime: {
        color: '#4A90E2',
        fontSize: 72,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    restCountdownHint: {
        color: '#444',
        fontSize: 14,
        fontStyle: 'italic',
        marginBottom: 40,
    },
    endRestBtn: {
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#4A90E2',
        backgroundColor: 'rgba(74, 144, 226, 0.1)',
    },
    endRestText: {
        color: '#4A90E2',
        fontSize: 16,
        fontWeight: 'bold',
    },
    setupTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 8,
    },
    setupSubtitle: {
        fontSize: 15,
        color: '#888',
        marginBottom: 30,
    },
    locationContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    locationCard: {
        flex: 1,
        height: 120,
        backgroundColor: '#111',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#222',
        marginHorizontal: 5,
    },
    // --- Weight Training Specific Styles ---
    muscleGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    muscleCard: {
        width: '48%',
        height: 110,
        backgroundColor: '#111',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#222',
    },
    muscleName: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 10,
    },
    exerciseList: {
        marginTop: 10,
    },
    setRowHeader: {
        flexDirection: 'row',
        paddingHorizontal: 10,
        marginBottom: 10,
    },
    setLabel: {
        color: '#444',
        fontSize: 12,
        fontWeight: 'bold',
    },
    setRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111',
        borderRadius: 15,
        padding: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#222',
    },
    setNumberCircle: {
        width: 25,
        height: 25,
        borderRadius: 12.5,
        backgroundColor: '#222',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    setNumberText: {
        color: '#888',
        fontSize: 12,
        fontWeight: 'bold',
    },
    setIntake: {
        backgroundColor: '#000',
        color: '#FFF',
        borderRadius: 10,
        height: 45,
        fontSize: 18,
        fontWeight: 'bold',
        borderWidth: 1,
        borderColor: '#333',
        textAlign: 'center',
        paddingHorizontal: 5,
        minWidth: 0,
    },
    addSetBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 12,
        backgroundColor: '#111',
        marginTop: 10,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: '#4A90E2',
    },
    addSetText: {
        color: '#4A90E2',
        fontWeight: 'bold',
        marginLeft: 5,
    },
    removeSetBtn: {
        padding: 5,
        marginLeft: 5,
    },
    volumeBadge: {
        flexDirection: 'row',
        backgroundColor: '#4A90E2',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignItems: 'center',
    },
    volumeBadgeText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    logReviewCard: {
        backgroundColor: '#111',
        borderRadius: 20,
        padding: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#222',
        position: 'relative',
    },
    logReviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    logReviewTitle: {
        color: '#FFF',
        fontSize: 17,
        fontWeight: 'bold',
    },
    logReviewSets: {
        color: '#4A90E2',
        fontSize: 13,
        fontWeight: '600',
    },
    logReviewSetsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    setSummaryBadge: {
        backgroundColor: '#222',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        marginRight: 6,
        marginBottom: 6,
    },
    setSummaryText: {
        color: '#AAA',
        fontSize: 12,
    },
    removeLogBtn: {
        position: 'absolute',
        top: 15,
        right: 15,
    },
    addMoreBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        backgroundColor: '#0A0A0A',
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#111',
    },
    addMoreText: {
        color: '#888',
        marginLeft: 10,
        fontSize: 14,
        fontWeight: '600',
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    volumeBadge: {
        flexDirection: 'row',
        backgroundColor: '#4A90E2',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignItems: 'center',
    },
    volumeBadgeText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    logReviewCard: {
        backgroundColor: '#111',
        borderRadius: 20,
        padding: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#222',
        position: 'relative',
    },
    logReviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    logReviewTitle: {
        color: '#FFF',
        fontSize: 17,
        fontWeight: 'bold',
    },
    logReviewSets: {
        color: '#4A90E2',
        fontSize: 13,
        fontWeight: '600',
    },
    logReviewSetsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    setSummaryBadge: {
        backgroundColor: '#222',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        marginRight: 6,
        marginBottom: 6,
    },
    setSummaryText: {
        color: '#AAA',
        fontSize: 12,
    },
    removeLogBtn: {
        position: 'absolute',
        top: 15,
        right: 15,
    },
    addMoreBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        backgroundColor: '#0A0A0A',
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#111',
    },
    addMoreText: {
        color: '#888',
        marginLeft: 10,
        fontSize: 14,
        fontWeight: '600',
    },
    locationCardActive: {
        borderColor: '#4A90E2',
        backgroundColor: 'rgba(74, 144, 226, 0.1)',
    },
    locationText: {
        color: '#555',
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 12,
    },
    locationTextActive: {
        color: '#FFF',
    },
    inputSection: {
        marginBottom: 30,
    },
    inputLabel: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    daysInput: {
        backgroundColor: '#111',
        borderRadius: 15,
        padding: 15,
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        borderWidth: 1,
        borderColor: '#222',
    },
    restDaySection: {
        marginBottom: 30,
    },
    restHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    restCount: {
        color: '#4A90E2',
        fontSize: 14,
        fontWeight: '600',
    },
    daysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    dayCircle: {
        width: '23%',
        height: 50,
        backgroundColor: '#111',
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#222',
        marginBottom: 10,
    },
    dayCircleRest: {
        backgroundColor: '#4A90E2',
        borderColor: '#4A90E2',
    },
    dayText: {
        color: '#888',
        fontSize: 14,
        fontWeight: '600',
    },
    dayTextRest: {
        color: '#FFF',
    },
    finishBtn: {
        height: 56,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    finishBtnActive: {
        backgroundColor: '#4A90E2',
    },
    finishBtnDisabled: {
        backgroundColor: '#222',
        opacity: 0.5,
    },
    finishBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    // Step 3 Styles
    splitCard: {
        width: '48%',
        height: 80,
        backgroundColor: '#111',
        borderRadius: 15,
        padding: 12,
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#222',
        marginBottom: 12,
    },
    splitCardActive: {
        borderColor: '#4A90E2',
        backgroundColor: 'rgba(74, 144, 226, 0.05)',
    },
    splitCardRest: {
        backgroundColor: '#0A0A0A',
        borderColor: '#111',
        opacity: 0.6,
    },
    dayLabel: {
        color: '#888',
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    splitText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '600',
    },
    splitTextRest: {
        color: '#444',
        fontSize: 14,
        fontStyle: 'italic',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#111',
        borderRadius: 25,
        padding: 25,
        width: '100%',
        maxWidth: 400,
        borderWidth: 1,
        borderColor: '#222',
    },
    modalTitle: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    modalInput: {
        backgroundColor: '#000',
        borderRadius: 15,
        padding: 18,
        color: '#FFF',
        fontSize: 18,
        borderWidth: 1,
        borderColor: '#333',
        marginBottom: 25,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    modalBtn: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
    },
    modalBtnSave: {
        backgroundColor: '#4A90E2',
    },
    modalBtnTextCancel: {
        color: '#888',
        fontSize: 16,
        fontWeight: '600',
    },
    modalBtnTextSave: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    // Volume Step Styles
    volumeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    volumeInputContainer: {
        flex: 1,
    },
    volumeInput: {
        backgroundColor: '#111',
        borderRadius: 15,
        padding: 15,
        color: '#FFF',
        fontSize: 24,
        fontWeight: 'bold',
        borderWidth: 1,
        borderColor: '#222',
        textAlign: 'center',
    },
    // Note Styles
    noteCard: {
        flexDirection: 'row',
        backgroundColor: '#111',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#222',
    },
    noteContent: {
        marginLeft: 15,
        flex: 1,
    },
    noteTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    noteText: {
        color: '#888',
        fontSize: 14,
        lineHeight: 20,
    },
    // Summary Styles
    summaryCard: {
        backgroundColor: '#111',
        borderRadius: 25,
        padding: 20,
        borderWidth: 1,
        borderColor: '#222',
    },
    summaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    avatarCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    summaryName: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    summaryDate: {
        color: '#888',
        fontSize: 12,
        marginTop: 2,
    },
    stravaLogo: {
        marginLeft: 'auto',
    },
    summaryStatsRow: {
        flexDirection: 'row',
        backgroundColor: '#0A0A0A',
        borderRadius: 15,
        padding: 15,
        marginBottom: 20,
        justifyContent: 'space-around',
    },
    statBox: {
        alignItems: 'center',
    },
    statLabel: {
        color: '#888',
        fontSize: 11,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    statValue: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    statDivider: {
        width: 1,
        backgroundColor: '#222',
    },
    summarySplits: {
        marginBottom: 20,
    },
    splitsTitle: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    summaryGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 5,
    },
    summaryDayItem: {
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 2,
    },
    summaryDayLabel: {
        color: '#666',
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    summaryDayBox: {
        width: '100%',
        height: 60,
        backgroundColor: '#4A90E2',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 2,
    },
    summaryDayBoxRest: {
        backgroundColor: '#222',
    },
    summaryDayText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    summaryFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#222',
        paddingTop: 15,
    },
    footerText: {
        color: '#888',
        fontSize: 12,
        marginLeft: 8,
        fontWeight: '500',
    },
    // Plan Options Styles
    planOptionsContainer: {
        marginTop: -10,
        marginBottom: 20,
        padding: 15,
        backgroundColor: '#111',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#222',
    },
    planOptionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4A90E2',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
    },
    planOptionBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    planOptionCancel: {
        alignItems: 'center',
        padding: 5,
    },
    planOptionCancelText: {
        color: '#888',
        fontSize: 14,
    },
    bottomNav: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        height: 85,
        backgroundColor: '#000',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingBottom: 20,
        borderTopWidth: 1,
        borderTopColor: '#1A1A1A',
    },
    navTab: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    navTabText: {
        fontSize: 10,
        color: '#888',
        marginTop: 4,
    },
    navTabActiveText: {
        color: '#4A90E2',
    },
    addBtnContainer: {
        alignItems: 'center',
        marginTop: -30,
    },
    addBtn: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#FFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    // Time Picker Styles
    timePickerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 250,
        backgroundColor: '#111',
        borderRadius: 25,
        padding: 20,
        borderWidth: 1,
        borderColor: '#222',
    },
    timeColumn: {
        flex: 1,
        alignItems: 'center',
    },
    timeLabel: {
        color: '#666',
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 15,
    },
    controlGroup: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    controlBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#0A0A0A',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#222',
        marginVertical: 5,
    },
    timeDisplay: {
        width: 60,
        height: 60,
        borderRadius: 15,
        backgroundColor: 'rgba(74, 144, 226, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(74, 144, 226, 0.2)',
    },
    timeDisplayText: {
        color: '#4A90E2',
        fontSize: 28,
        fontWeight: 'bold',
    },
    timeSeparator: {
        color: '#333',
        fontSize: 32,
        fontWeight: 'bold',
        marginHorizontal: 10,
        marginTop: 40,
    },
    periodColumn: {
        width: 70,
        justifyContent: 'center',
        marginLeft: 15,
    },
    periodBtn: {
        height: 45,
        borderRadius: 12,
        backgroundColor: '#0A0A0A',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#222',
        marginBottom: 15,
    },
    periodBtnActive: {
        backgroundColor: '#4A90E2',
        borderColor: '#4A90E2',
    },
    periodText: {
        color: '#888',
        fontSize: 16,
        fontWeight: 'bold',
    },
    periodTextActive: {
        color: '#FFF',
    },
    // Cardio Selection Styles
    cardioHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    favFilterBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#222',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    favFilterBtnActive: {
        borderColor: '#E24A4A60',
        backgroundColor: 'rgba(226, 74, 74, 0.1)',
    },
    favFilterText: {
        color: '#888',
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    favFilterTextActive: {
        color: '#E24A4A',
    },
    cardioList: {
        marginTop: 10,
    },
    cardioItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111',
        borderRadius: 20,
        padding: 18,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#222',
    },
    cardioIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#1A1A1A',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 18,
    },
    cardioName: {
        color: '#FFF',
        fontSize: 17,
        fontWeight: '600',
        flex: 1,
    },
    heartBtn: {
        padding: 10,
        marginRight: -5,
    },
    customHeartBtn: {
        padding: 10,
        marginRight: 10,
    },
    otherCardioContainer: {
        marginTop: 25,
        paddingBottom: 20,
    },
    otherTitle: {
        color: '#666',
        fontSize: 13,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 15,
        marginLeft: 5,
    },
    otherInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111',
        borderRadius: 20,
        paddingLeft: 20,
        paddingRight: 10,
        height: 65,
        borderWidth: 1,
        borderColor: '#222',
    },
    otherInput: {
        flex: 1,
        color: '#FFF',
        fontSize: 16,
    },
    otherAddBtn: {
        width: 45,
        height: 45,
        borderRadius: 15,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#FFF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    otherAddBtnDisabled: {
        backgroundColor: '#222',
        opacity: 0.5,
    },
    emptyFavs: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
    },
    emptyFavsText: {
        color: '#444',
        fontSize: 15,
        textAlign: 'center',
        marginTop: 20,
        paddingHorizontal: 40,
        lineHeight: 22,
    },
    // Step 10: Active Session Styles
    liveTimerContainer: {
        position: 'absolute',
        top: -10,
        left: 0,
    },
    liveTimerLabel: {
        color: '#888',
        fontSize: 14,
        fontWeight: '600',
    },
    liveTimerText: {
        color: '#4A90E2',
        fontSize: 28,
        fontWeight: 'bold',
        marginTop: 4,
    },
    sessionCenter: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 100,
    },
    activeExerciseName: {
        color: '#FFF',
        fontSize: 28,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: 40,
        textTransform: 'uppercase',
    },
    animationContainer: {
        width: 220,
        height: 220,
        justifyContent: 'center',
        alignItems: 'center',
    },
    orbitingCircle: {
        width: 220,
        height: 220,
        borderRadius: 110,
        borderWidth: 2,
        borderColor: 'rgba(74, 144, 226, 0.1)',
        position: 'absolute',
    },
    orbitingDot: {
        width: 15,
        height: 15,
        borderRadius: 8,
        backgroundColor: '#4A90E2',
        position: 'absolute',
        top: -7,
        left: 103,
        shadowColor: '#4A90E2',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 10,
    },
    innerCircle: {
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: '#0A0A0A',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#111',
    },
    sessionStatus: {
        color: '#4A90E2',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 2,
        marginTop: 40,
    },
    sessionControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    sessionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 65,
        borderRadius: 20,
        marginHorizontal: 8,
    },
    pauseBtn: {
        backgroundColor: '#111',
        borderWidth: 1,
        borderColor: '#333',
    },
    resumeBtn: {
        backgroundColor: '#4A90E2',
    },
    finishSessionBtn: {
        backgroundColor: '#E24A4A',
    },
    sessionBtnText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    // Step 11: Logging Styles
    inputGroup: {
        marginBottom: 20,
    },
    logInput: {
        backgroundColor: '#000',
        borderRadius: 15,
        padding: 18,
        color: '#FFF',
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#222',
    },
    logStatsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    gratitudeNote: {
        padding: 20,
        backgroundColor: 'rgba(226, 74, 74, 0.05)',
        borderRadius: 15,
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    gratitudeText: {
        color: '#AAA',
        fontSize: 13,
        marginLeft: 15,
        flex: 1,
        fontStyle: 'italic',
    },
    // Step 12: Summary Card Styles
    summaryCardStrava: {
        backgroundColor: '#111',
        borderRadius: 25,
        padding: 25,
        borderWidth: 1,
        borderColor: '#222',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
    },
    stravaHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    stravaUserIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#222',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    stravaUserName: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    stravaDate: {
        color: '#666',
        fontSize: 12,
        marginTop: 2,
    },
    stravaTitle: {
        color: '#FFF',
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    stravaStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 20,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#222',
        marginBottom: 20,
    },
    stravaStatItem: {
        flex: 1,
    },
    stravaStatValue: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    stravaStatLabel: {
        color: '#666',
        fontSize: 12,
        marginTop: 4,
    },
    stravaNote: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    stravaNoteText: {
        color: '#AAA',
        fontSize: 14,
        fontStyle: 'italic',
        lineHeight: 20,
        marginLeft: 8,
        flex: 1,
    },
    stravaFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 10,
    },
    stravaBranding: {
        color: '#4A90E2',
        fontSize: 32,
        fontWeight: 'bold',
        fontStyle: 'italic',
        letterSpacing: 1,
    },
    shareBtn: {
        marginLeft: 'auto',
        padding: 8,
        backgroundColor: '#1A1A1A',
        borderRadius: 10,
    },
    discardBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        padding: 10,
    },
    discardText: {
        color: '#666',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
    adviceOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.92)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
    },
    adviceContent: {
        backgroundColor: '#111',
        borderRadius: 25,
        padding: 30,
        width: '100%',
        maxWidth: 400,
        borderWidth: 1,
        borderColor: '#222',
        alignItems: 'center',
    },
    adviceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    adviceTitle: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    adviceText: {
        color: '#888',
        fontSize: 16,
        lineHeight: 24,
        textAlign: 'center',
        marginBottom: 25,
    },
    adviceTipRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0A0A0A',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 15,
        marginBottom: 30,
        borderWidth: 1,
        borderColor: '#151515',
    },
    adviceTipText: {
        color: '#666',
        fontSize: 13,
        fontWeight: '600',
        marginLeft: 10,
    },
    adviceStartBtn: {
        backgroundColor: '#FFF',
        height: 56,
        borderRadius: 15,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    adviceStartText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    adviceCancelBtn: {
        padding: 10,
    },
    adviceCancelText: {
        color: '#444',
        fontSize: 14,
        fontWeight: '600',
    },
    // History Styles
    historyCard: {
        backgroundColor: '#111',
        borderRadius: 20,
        padding: 20,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#222',
        position: 'relative',
    },
    hideBtn: {
        padding: 5,
        marginLeft: 10,
    },
    historyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    historyIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    historyInfo: {
        flex: 1,
    },
    historyName: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    historyDate: {
        color: '#666',
        fontSize: 13,
    },
    historyStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#1A1A1A',
        paddingTop: 15,
    },
    hStat: {
        alignItems: 'center',
        flex: 1,
    },
    hStatText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    hStatLabel: {
        color: '#444',
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    emptyHistory: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 80,
    },
    emptyHistoryText: {
        color: '#444',
        fontSize: 16,
        marginTop: 20,
        marginBottom: 30,
    },
    startFirstBtn: {
        backgroundColor: '#4A90E2',
        paddingHorizontal: 25,
        paddingVertical: 12,
        borderRadius: 12,
    },
    startFirstBtnText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    clearHistoryBtn: {
        padding: 15,
        alignItems: 'center',
        marginTop: 10,
    },
    clearHistoryText: {
        color: '#FF4B4B60',
        fontSize: 13,
        fontWeight: '500',
    }
});

export default WorkoutScreen;

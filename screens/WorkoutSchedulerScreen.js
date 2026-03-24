import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Platform,
    Modal,
    TextInput,
    Alert,
    ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

const DAYS_OF_WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const WorkoutSchedulerScreen = ({ navigation }) => {
    const { session } = useAuth();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [scheduledWorkouts, setScheduledWorkouts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [workoutType, setWorkoutType] = useState('');
    const [workoutTime, setWorkoutTime] = useState('');
    const [editingWorkout, setEditingWorkout] = useState(null);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    useEffect(() => {
        fetchScheduledWorkouts();
    }, []);

    const fetchScheduledWorkouts = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('scheduled_workouts')
                .select('*')
                .eq('user_id', session?.user?.id)
                .gte('scheduled_date', new Date(currentYear, currentMonth, 1).toISOString())
                .lte('scheduled_date', new Date(currentYear, currentMonth + 1, 0).toISOString());

            if (error) throw error;
            setScheduledWorkouts(data || []);
        } catch (error) {
            console.error('Error fetching schedules:', error);
            // If table doesn't exist, we might get an error.
            // In a real app, we'd handle migration. For now, we'll gracefully fail.
        } finally {
            setLoading(false);
        }
    };

    const getDaysInMonth = (year, month) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year, month) => {
        // 0=Sun, 1=Mon, ..., 6=Sat
        const day = new Date(year, month, 1).getDay();
        // Convert to 0=Mon, ..., 6=Sun
        return day === 0 ? 6 : day - 1;
    };

    const handleDateClick = (day) => {
        const clickedDate = new Date(currentYear, currentMonth, day);
        if (clickedDate < today) {
            if (Platform.OS === 'web') {
                window.alert('Cannot schedule workouts in the past.');
            } else {
                Alert.alert('Restricted', 'Cannot schedule workouts in the past.');
            }
            return;
        }
        setSelectedDate(clickedDate);
    };

    const handleAddWorkout = () => {
        setEditingWorkout(null);
        setWorkoutType('');
        setWorkoutTime('');
        setModalVisible(true);
    };

    const handleEditWorkout = (workout) => {
        setEditingWorkout(workout);
        setWorkoutType(workout.workout_type);
        setWorkoutTime(workout.scheduled_time);
        setModalVisible(true);
    };

    const saveWorkout = async () => {
        if (!workoutType || !workoutTime) {
            if (Platform.OS === 'web') {
                window.alert('Please enter workout type and time.');
            } else {
                Alert.alert('Missing Info', 'Please enter workout type and time.');
            }
            return;
        }

        setLoading(true);
        try {
            const dateStr = selectedDate.toISOString().split('T')[0];
            const workoutData = {
                user_id: session?.user?.id,
                workout_type: workoutType,
                scheduled_date: dateStr,
                scheduled_time: workoutTime,
            };

            if (editingWorkout) {
                const { error } = await supabase
                    .from('scheduled_workouts')
                    .update(workoutData)
                    .eq('id', editingWorkout.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('scheduled_workouts')
                    .insert([workoutData]);
                if (error) throw error;
            }

            setModalVisible(false);
            fetchScheduledWorkouts();
        } catch (error) {
            if (Platform.OS === 'web') {
                window.alert('Could not save schedule. Ensure database table exists.');
            } else {
                Alert.alert('Error', 'Could not save schedule. Ensure database table exists.');
            }
        } finally {
            setLoading(false);
        }
    };

    const confirmAction = (title, message, onConfirm) => {
        if (Platform.OS === 'web') {
            const confirmed = window.confirm(`${title}\n\n${message}`);
            if (confirmed) onConfirm();
        } else {
            Alert.alert(title, message, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: onConfirm }
            ]);
        }
    };

    const deleteWorkout = async (id) => {
        confirmAction('Delete', 'Remove this scheduled workout?', async () => {
            setLoading(true);
            try {
                const { error } = await supabase
                    .from('scheduled_workouts')
                    .delete()
                    .eq('id', id);
                if (error) throw error;
                fetchScheduledWorkouts();
            } catch (error) {
                if (Platform.OS === 'web') {
                    window.alert('Could not delete schedule.');
                } else {
                    Alert.alert('Error', 'Could not delete schedule.');
                }
            } finally {
                setLoading(false);
            }
        });
    };

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(currentYear, currentMonth);
        const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
        const days = [];

        // Padding for first week
        for (let i = 0; i < firstDay; i++) {
            days.push(<View key={`empty-${i}`} style={styles.calendarDayEmpty} />);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(currentYear, currentMonth, i);
            const isToday = date.getDate() === today.getDate() && 
                           date.getMonth() === today.getMonth() && 
                           date.getFullYear() === today.getFullYear();
            const isSelected = date.getTime() === selectedDate.getTime();
            const isPast = date < today && !isToday;
            const hasWorkout = scheduledWorkouts.some(w => w.scheduled_date === date.toISOString().split('T')[0]);
            const isSunday = date.getDay() === 0;

            days.push(
                <TouchableOpacity
                    key={i}
                    style={[
                        styles.calendarDay,
                        isSelected && styles.selectedDay,
                        isToday && styles.todayDay
                    ]}
                    onPress={() => handleDateClick(i)}
                    disabled={isPast}
                >
                    <Text style={[
                        styles.dayText,
                        isPast && styles.pastDayText,
                        isSelected && styles.selectedDayText,
                        isToday && styles.todayDayText,
                        isSunday && !isToday && !isSelected && styles.sundayText
                    ]}>{i}</Text>
                    {hasWorkout && <View style={styles.workoutBar} />}
                </TouchableOpacity>
            );
        }

        return days;
    };

    const selectedDateWorkouts = scheduledWorkouts.filter(
        w => w.scheduled_date === selectedDate.toISOString().split('T')[0]
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <View style={styles.headerCentral}>
                    <Text style={styles.headerMonth}>
                        {new Intl.DateTimeFormat('en-US', { month: 'short' }).format(today).toUpperCase()}
                    </Text>
                </View>
                <View style={styles.headerRightPlaceholder} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Compact Calendar */}
                <View style={styles.calendarContainer}>
                    <View style={styles.daysHeader}>
                        {DAYS_OF_WEEK.map((day, ix) => (
                            <Text key={ix} style={[styles.dayHeadText, ix === 6 && styles.sundayHeader]}>{day}</Text>
                        ))}
                    </View>
                    <View style={styles.calendarGrid}>
                        {renderCalendar()}
                    </View>
                </View>

                {/* Selected Date Workouts */}
                <View style={styles.scheduleSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>
                            Scheduled for {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </Text>
                        <TouchableOpacity style={styles.addSmallBtn} onPress={handleAddWorkout}>
                            <Ionicons name="add" size={24} color="#FFF" />
                        </TouchableOpacity>
                    </View>

                    {selectedDateWorkouts.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="calendar-outline" size={48} color="#333" />
                            <Text style={styles.emptyText}>No workouts planned for this day</Text>
                            <TouchableOpacity style={styles.planBtn} onPress={handleAddWorkout}>
                                <Text style={styles.planBtnText}>Plan Now</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        selectedDateWorkouts.map(workout => (
                            <View key={workout.id} style={styles.workoutItem}>
                                <TouchableOpacity
                                    style={styles.workoutMainContent}
                                    onPress={() => handleEditWorkout(workout)}
                                >
                                    <View style={styles.workoutIcon}>
                                        <Ionicons name="barbell" size={24} color="#A076F9" />
                                    </View>
                                    <View style={styles.workoutInfo}>
                                        <Text style={styles.workoutName}>{workout.workout_type}</Text>
                                        <Text style={styles.workoutTime}>{workout.scheduled_time}</Text>
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => deleteWorkout(workout.id)}
                                    style={styles.deleteBtn}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Ionicons name="trash-outline" size={20} color="#FF5252" />
                                </TouchableOpacity>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {editingWorkout ? 'Edit Workout' : 'Schedule Workout'}
                        </Text>
                        <Text style={styles.modalSubtitle}>
                            {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </Text>

                        <Text style={styles.inputLabel}>Workout Type</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Chest & Triceps, Morning Run"
                            placeholderTextColor="#666"
                            value={workoutType}
                            onChangeText={setWorkoutType}
                        />

                        <Text style={styles.inputLabel}>Time</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. 07:00 AM"
                            placeholderTextColor="#666"
                            value={workoutTime}
                            onChangeText={setWorkoutTime}
                        />

                        <View style={styles.modalBtns}>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.cancelBtn]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.saveBtn]}
                                onPress={saveWorkout}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#000" />
                                ) : (
                                    <Text style={styles.saveBtnText}>Save</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
        paddingBottom: 20,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#111',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    headerMonth: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    headerCentral: {
        flex: 1,
        alignItems: 'center',
    },
    headerRightPlaceholder: {
        width: 40,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 40,
    },
    calendarContainer: {
        backgroundColor: '#000',
        borderRadius: 25,
        padding: 16,
        marginBottom: 24,
    },
    daysHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    dayHeadText: {
        color: '#666',
        fontSize: 14,
        fontWeight: 'bold',
        width: '14.28%',
        textAlign: 'center',
    },
    sundayHeader: {
        color: '#FF5252',
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    calendarDay: {
        width: '14.28%',
        height: 55,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 5,
    },
    calendarDayEmpty: {
        width: '14.28%',
        height: 55,
    },
    dayText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '500',
    },
    sundayText: {
        color: '#FF5252',
    },
    pastDayText: {
        color: '#333',
    },
    selectedDay: {
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 12,
    },
    todayDay: {
        backgroundColor: '#FF5252',
        borderRadius: 12,
    },
    selectedDayText: {
        color: '#FFF',
    },
    todayDayText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    workoutBar: {
        width: '60%',
        height: 3,
        backgroundColor: '#4CAF50',
        borderRadius: 2,
        marginTop: 4,
    },
    scheduleSection: {
        flex: 1,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    addSmallBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#A076F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        backgroundColor: '#111',
        borderRadius: 20,
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        color: '#666',
        fontSize: 14,
        marginTop: 12,
        marginBottom: 20,
    },
    planBtn: {
        backgroundColor: '#FFF',
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 15,
    },
    planBtnText: {
        color: '#000',
        fontWeight: 'bold',
    },
    workoutItem: {
        backgroundColor: '#111',
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    workoutMainContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    deleteBtn: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    workoutIcon: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#1A101C',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    workoutInfo: {
        flex: 1,
    },
    workoutName: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    workoutTime: {
        color: '#666',
        fontSize: 14,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#111',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    modalTitle: {
        color: '#FFF',
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    modalSubtitle: {
        color: '#666',
        fontSize: 14,
        marginBottom: 24,
    },
    inputLabel: {
        color: '#AAA',
        fontSize: 14,
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        backgroundColor: '#1A1A1A',
        borderRadius: 15,
        padding: 16,
        color: '#FFF',
        fontSize: 16,
        marginBottom: 20,
    },
    modalBtns: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    modalBtn: {
        flex: 0.48,
        height: 55,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelBtn: {
        backgroundColor: '#1A1A1A',
    },
    saveBtn: {
        backgroundColor: '#FFF',
    },
    cancelBtnText: {
        color: '#666',
        fontSize: 16,
        fontWeight: 'bold',
    },
    saveBtnText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default WorkoutSchedulerScreen;

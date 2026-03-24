import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    SafeAreaView,
    Platform,
    KeyboardAvoidingView,
    Alert,
    Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const STORAGE_KEY = '@calorie_logs';
const LIMIT_KEY = '@calorie_limit';

const CalorieCounterScreen = ({ navigation }) => {
    const [calorieLimit, setCalorieLimit] = useState('2500');
    const [foodName, setFoodName] = useState('');
    const [foodCalories, setFoodCalories] = useState('');
    const [foodLogs, setFoodLogs] = useState([]);
    const [isEditingLimit, setIsEditingLimit] = useState(false);

    // Calculate total consumed
    const totalConsumed = foodLogs.reduce((sum, item) => sum + item.calories, 0);
    const limitNum = parseInt(calorieLimit) || 0;
    const progress = limitNum > 0 ? Math.min(totalConsumed / limitNum, 1) : 0;
    const isExceeding = totalConsumed > limitNum && limitNum > 0;

    // Load data on mount
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const savedLogs = await AsyncStorage.getItem(STORAGE_KEY);
            const savedLimit = await AsyncStorage.getItem(LIMIT_KEY);
            
            if (savedLogs) setFoodLogs(JSON.parse(savedLogs));
            if (savedLimit) setCalorieLimit(savedLimit);
        } catch (e) {
            console.error('Failed to load calorie data', e);
        }
    };

    const saveLogs = async (newLogs) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newLogs));
        } catch (e) {
            console.error('Failed to save logs', e);
        }
    };

    const saveLimit = async (newLimit) => {
        try {
            await AsyncStorage.setItem(LIMIT_KEY, newLimit);
        } catch (e) {
            console.error('Failed to save limit', e);
        }
    };

    const addFoodItem = () => {
        if (!foodName || !foodCalories) {
            Alert.alert('Error', 'Please enter both food name and calories.');
            return;
        }

        const calories = parseInt(foodCalories);
        if (isNaN(calories)) {
            Alert.alert('Error', 'Calories must be a number.');
            return;
        }

        const newItem = {
            id: Date.now().toString(),
            name: foodName,
            calories: calories,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        const newLogs = [newItem, ...foodLogs];
        setFoodLogs(newLogs);
        saveLogs(newLogs);
        setFoodName('');
        setFoodCalories('');
    };

    const deleteFoodItem = (id) => {
        const newLogs = foodLogs.filter(item => item.id !== id);
        setFoodLogs(newLogs);
        saveLogs(newLogs);
    };

    const clearAll = () => {
        Alert.alert(
            'Clear All',
            'Are you sure you want to clear all logs for today?',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Clear', 
                    style: 'destructive',
                    onPress: () => {
                        setFoodLogs([]);
                        saveLogs([]);
                    }
                }
            ]
        );
    };

    const handleLimitSave = () => {
        setIsEditingLimit(false);
        saveLimit(calorieLimit);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Calorie Counter</Text>
                <TouchableOpacity onPress={clearAll}>
                    <Ionicons name="trash-outline" size={24} color="#666" />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    
                    {/* Goal Section */}
                    <View style={styles.goalSection}>
                        <View style={styles.goalHeader}>
                            <Text style={styles.sectionLabel}>Daily Goal</Text>
                            {!isEditingLimit ? (
                                <TouchableOpacity onPress={() => setIsEditingLimit(true)} style={styles.editBtn}>
                                    <Text style={styles.editBtnText}>Edit</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity onPress={handleLimitSave} style={styles.saveBtn}>
                                    <Text style={styles.saveBtnText}>Save</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        
                        {isEditingLimit ? (
                            <TextInput
                                style={styles.limitInput}
                                value={calorieLimit}
                                onChangeText={setCalorieLimit}
                                keyboardType="numeric"
                                autoFocus
                                placeholder="e.g. 2500"
                                placeholderTextColor="#444"
                            />
                        ) : (
                            <Text style={styles.limitDisplay}>{calorieLimit} kcal</Text>
                        )}
                    </View>

                    {/* Progress Card */}
                    <View style={[styles.progressCard, isExceeding && styles.progressCardExceeding]}>
                        <View style={styles.progressTextRow}>
                            <View>
                                <Text style={styles.progressLabel}>Consumed</Text>
                                <Text style={styles.consumedValue}>{totalConsumed} kcal</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={styles.progressLabel}>Remaining</Text>
                                <Text style={[
                                    styles.remainingValue, 
                                    isExceeding && { color: '#FF5252' }
                                ]}>
                                    {Math.max(0, limitNum - totalConsumed)} kcal
                                </Text>
                            </View>
                        </View>

                        {/* Bar */}
                        <View style={styles.progressBarBg}>
                            <View style={[
                                styles.progressBarFill, 
                                { width: `${progress * 100}%` },
                                isExceeding && { backgroundColor: '#FF5252' }
                            ]} />
                        </View>

                        {isExceeding && (
                            <View style={styles.warningBox}>
                                <Ionicons name="warning" size={16} color="#FF5252" />
                                <Text style={styles.warningText}>CALORIE EXCEEDING!</Text>
                            </View>
                        )}
                    </View>

                    {/* Add Food Form */}
                    <View style={styles.addFoodCard}>
                        <Text style={styles.sectionLabel}>Log Food</Text>
                        <View style={styles.inputRow}>
                            <TextInput
                                style={styles.foodNameInput}
                                value={foodName}
                                onChangeText={setFoodName}
                                placeholder="Food Name"
                                placeholderTextColor="#666"
                            />
                            <TextInput
                                style={styles.calorieInput}
                                value={foodCalories}
                                onChangeText={setFoodCalories}
                                placeholder="kcal"
                                placeholderTextColor="#666"
                                keyboardType="numeric"
                            />
                        </View>
                        <TouchableOpacity style={styles.addBtn} onPress={addFoodItem}>
                            <Ionicons name="add" size={24} color="#000" />
                            <Text style={styles.addBtnText}>Add Food</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Log List */}
                    <View style={styles.logSection}>
                        <Text style={styles.sectionLabel}>Today's Logs</Text>
                        {foodLogs.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyText}>No food logged today.</Text>
                            </View>
                        ) : (
                            foodLogs.map(item => (
                                <View key={item.id} style={styles.logItem}>
                                    <View style={styles.logInfo}>
                                        <Text style={styles.foodName}>{item.name}</Text>
                                        <Text style={styles.foodTime}>{item.timestamp}</Text>
                                    </View>
                                    <View style={styles.logRight}>
                                        <Text style={styles.foodCalories}>{item.calories} kcal</Text>
                                        <TouchableOpacity onPress={() => deleteFoodItem(item.id)} style={styles.deleteBtn}>
                                            <Ionicons name="close-circle" size={20} color="#FF5252" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>
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
    scrollContent: {
        padding: 16,
    },
    sectionLabel: {
        color: '#888',
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 10,
    },
    goalSection: {
        marginBottom: 25,
        paddingHorizontal: 4,
    },
    goalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    editBtnText: {
        color: '#4A90E2',
        fontSize: 14,
        fontWeight: '600',
    },
    saveBtnText: {
        color: '#4CAF50',
        fontSize: 14,
        fontWeight: 'bold',
    },
    limitDisplay: {
        color: '#FFF',
        fontSize: 32,
        fontWeight: 'bold',
        marginTop: 5,
    },
    limitInput: {
        color: '#FFF',
        fontSize: 32,
        fontWeight: 'bold',
        borderBottomWidth: 2,
        borderBottomColor: '#4A90E2',
        paddingVertical: 5,
        marginTop: 5,
        width: '50%',
    },
    progressCard: {
        backgroundColor: '#111',
        borderRadius: 20,
        padding: 20,
        marginBottom: 25,
    },
    progressCardExceeding: {
        borderColor: 'rgba(255, 82, 82, 0.3)',
        borderWidth: 1,
    },
    progressTextRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    progressLabel: {
        color: '#666',
        fontSize: 12,
        marginBottom: 4,
    },
    consumedValue: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: 'bold',
    },
    remainingValue: {
        color: '#4A90E2',
        fontSize: 24,
        fontWeight: 'bold',
    },
    progressBarBg: {
        height: 12,
        backgroundColor: '#222',
        borderRadius: 6,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#4A90E2',
        borderRadius: 6,
    },
    warningBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 15,
        backgroundColor: 'rgba(255, 82, 82, 0.1)',
        paddingVertical: 6,
        borderRadius: 8,
    },
    warningText: {
        color: '#FF5252',
        fontWeight: 'bold',
        fontSize: 12,
        marginLeft: 6,
    },
    addFoodCard: {
        backgroundColor: '#111',
        borderRadius: 20,
        padding: 20,
        marginBottom: 25,
    },
    inputRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        width: '100%',
    },
    input: {
        backgroundColor: '#000',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 12,
        color: '#FFF',
        fontSize: 14,
        borderWidth: 1,
        borderColor: '#222',
    },
    foodNameInput: {
        backgroundColor: '#000',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 12,
        color: '#FFF',
        fontSize: 14,
        borderWidth: 1,
        borderColor: '#222',
        flex: 2,
        marginRight: 10,
    },
    calorieInput: {
        backgroundColor: '#000',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 12,
        color: '#FFF',
        fontSize: 14,
        borderWidth: 1,
        borderColor: '#222',
        flex: 1,
        maxWidth: 100,
    },
    addBtn: {
        backgroundColor: '#FFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
    },
    addBtnText: {
        color: '#000',
        fontWeight: 'bold',
        marginLeft: 8,
    },
    logSection: {
        paddingHorizontal: 4,
    },
    logItem: {
        backgroundColor: '#111',
        borderRadius: 15,
        padding: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    logInfo: {
        flex: 1,
    },
    foodName: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    foodTime: {
        color: '#555',
        fontSize: 11,
    },
    logRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    foodCalories: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: 'bold',
        marginRight: 12,
    },
    deleteBtn: {
        padding: 4,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 30,
    },
    emptyText: {
        color: '#333',
        fontSize: 14,
    }
});

export default CalorieCounterScreen;

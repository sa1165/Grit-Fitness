import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    SafeAreaView,
    Platform,
    Modal,
    KeyboardAvoidingView,
    TouchableWithoutFeedback,
    Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ACTIVITY_LEVELS = [
    { label: 'Basal Metabolic Rate (BMR)', multiplier: 1, desc: 'No activity' },
    { label: 'Sedentary: little or no exercise', multiplier: 1.2, desc: 'Desk job, low activity' },
    { label: 'Light: exercise 1-3 times/week', multiplier: 1.375, desc: 'Light activity' },
    { label: 'Moderate: exercise 4-5 times/week', multiplier: 1.465, desc: 'Moderate activity' },
    { label: 'Active: daily exercise or intense exercise 3-4 times/week', multiplier: 1.55, desc: 'High activity' },
    { label: 'Very Active: intense exercise 6-7 times/week', multiplier: 1.725, desc: 'Very high activity' },
    { label: 'Extra Active: very intense exercise daily, or physical job', multiplier: 1.9, desc: 'Extreme activity' }
];

const CalorieCalculatorScreen = ({ navigation }) => {
    const [age, setAge] = useState('20');
    const [gender, setGender] = useState('male');
    const [height, setHeight] = useState('185');
    const [weight, setWeight] = useState('72');
    const [activity, setActivity] = useState(ACTIVITY_LEVELS[3]);
    const [showActivityModal, setShowActivityModal] = useState(false);
    const [results, setResults] = useState(null);

    const calculateCalories = () => {
        const a = parseInt(age);
        const h = parseInt(height);
        const w = parseInt(weight);

        if (!a || !h || !w) return;

        // Mifflin-St Jeor Equation
        let bmr;
        if (gender === 'male') {
            bmr = (10 * w) + (6.25 * h) - (5 * a) + 5;
        } else {
            bmr = (10 * w) + (6.25 * h) - (5 * a) - 161;
        }

        const maintenance = Math.round(bmr * activity.multiplier);

        setResults({
            maintenance,
            mildLoss: Math.round(maintenance - 250),
            loss: Math.round(maintenance - 500),
            extremeLoss: Math.round(maintenance - 1000)
        });
    };

    const clearForm = () => {
        setAge('');
        setGender('male');
        setHeight('');
        setWeight('');
        setActivity(ACTIVITY_LEVELS[3]);
        setResults(null);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Calorie Calculator</Text>
                <View style={{ width: 28 }} />
            </View>

            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.formCard}>
                        {/* Age */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Age</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    value={age}
                                    onChangeText={setAge}
                                    keyboardType="numeric"
                                    placeholder="20"
                                    placeholderTextColor="#444"
                                />
                                <Text style={styles.unitText}>ages 15 - 80</Text>
                            </View>
                        </View>

                        {/* Gender */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Gender</Text>
                            <View style={styles.radioGroup}>
                                <TouchableOpacity 
                                    style={styles.radioButton} 
                                    onPress={() => setGender('male')}
                                >
                                    <View style={[styles.radioOuter, gender === 'male' && styles.radioOuterActive]}>
                                        {gender === 'male' && <View style={styles.radioInner} />}
                                    </View>
                                    <Text style={styles.radioLabel}>male</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={styles.radioButton} 
                                    onPress={() => setGender('female')}
                                >
                                    <View style={[styles.radioOuter, gender === 'female' && styles.radioOuterActive]}>
                                        {gender === 'female' && <View style={styles.radioInner} />}
                                    </View>
                                    <Text style={styles.radioLabel}>female</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Height */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Height</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    value={height}
                                    onChangeText={setHeight}
                                    keyboardType="numeric"
                                    placeholder="185"
                                    placeholderTextColor="#444"
                                />
                                <Text style={styles.unitTextLabel}>cm</Text>
                            </View>
                        </View>

                        {/* Weight */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Weight</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    value={weight}
                                    onChangeText={setWeight}
                                    keyboardType="numeric"
                                    placeholder="72"
                                    placeholderTextColor="#444"
                                />
                                <Text style={styles.unitTextLabel}>kg</Text>
                            </View>
                        </View>

                        {/* Activity */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Activity</Text>
                            <TouchableOpacity 
                                style={styles.selectBox}
                                onPress={() => setShowActivityModal(true)}
                            >
                                <Text style={styles.selectText} numberOfLines={1}>{activity.label}</Text>
                                <Ionicons name="chevron-down" size={20} color="#4A90E2" />
                            </TouchableOpacity>
                        </View>

                        {/* Buttons */}
                        <View style={styles.buttonRow}>
                            <TouchableOpacity style={styles.calculateBtn} onPress={calculateCalories}>
                                <Text style={styles.calculateBtnText}>Calculate</Text>
                                <Ionicons name="play-circle" size={20} color="#FFF" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.clearBtn} onPress={clearForm}>
                                <Text style={styles.clearBtnText}>Clear</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Results */}
                    {results && (
                        <View style={styles.resultsContainer}>
                            <Text style={styles.resultsHeader}>Results</Text>
                            <Text style={styles.resultsSub}>Daily calorie estimates for your goals:</Text>

                            <View style={styles.resultItem}>
                                <View style={styles.resultLabelBox}>
                                    <Text style={styles.resultLabel}>Maintain weight</Text>
                                </View>
                                <View style={styles.resultValueBox}>
                                    <Text style={styles.resultValue}>{results.maintenance.toLocaleString()}</Text>
                                    <Text style={styles.resultUnit}>Calories/day</Text>
                                    <Text style={styles.resultPercent}>100%</Text>
                                </View>
                            </View>

                            <View style={styles.resultItem}>
                                <View style={styles.resultLabelBox}>
                                    <Text style={styles.resultLabel}>Mild weight loss</Text>
                                    <Text style={styles.resultExtra}>0.25 kg/week</Text>
                                </View>
                                <View style={styles.resultValueBox}>
                                    <Text style={styles.resultValue}>{results.mildLoss.toLocaleString()}</Text>
                                    <Text style={styles.resultUnit}>Calories/day</Text>
                                    <Text style={styles.resultPercent}>90%</Text>
                                </View>
                            </View>

                            <View style={styles.resultItem}>
                                <View style={styles.resultLabelBox}>
                                    <Text style={styles.resultLabel}>Weight loss</Text>
                                    <Text style={styles.resultExtra}>0.5 kg/week</Text>
                                </View>
                                <View style={styles.resultValueBox}>
                                    <Text style={styles.resultValue}>{results.loss.toLocaleString()}</Text>
                                    <Text style={styles.resultUnit}>Calories/day</Text>
                                    <Text style={styles.resultPercent}>81%</Text>
                                </View>
                            </View>

                            <View style={styles.resultItem}>
                                <View style={styles.resultLabelBox}>
                                    <Text style={styles.resultLabel}>Extreme weight loss</Text>
                                    <Text style={styles.resultExtra}>1 kg/week</Text>
                                </View>
                                <View style={styles.resultValueBox}>
                                    <Text style={styles.resultValue}>{results.extremeLoss.toLocaleString()}</Text>
                                    <Text style={styles.resultUnit}>Calories/day</Text>
                                    <Text style={styles.resultPercent}>62%</Text>
                                </View>
                            </View>
                        </View>
                    )}

                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Activity Modal */}
            <Modal
                visible={showActivityModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowActivityModal(false)}
            >
                <TouchableWithoutFeedback onPress={() => setShowActivityModal(false)}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Select Activity Level</Text>
                            {ACTIVITY_LEVELS.map((item, index) => (
                                <TouchableOpacity 
                                    key={index}
                                    style={[styles.modalItem, activity.label === item.label && styles.modalItemActive]}
                                    onPress={() => {
                                        setActivity(item);
                                        setShowActivityModal(false);
                                    }}
                                >
                                    <Text style={[styles.modalItemText, activity.label === item.label && styles.modalItemTextActive]}>
                                        {item.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
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
    formCard: {
        backgroundColor: '#111',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        color: '#FFF',
        fontSize: 16,
        marginBottom: 10,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 8,
        paddingHorizontal: 12,
        backgroundColor: '#000',
    },
    input: {
        flex: 1,
        color: '#FFF',
        fontSize: 16,
        paddingVertical: 12,
    },
    unitText: {
        color: '#666',
        fontSize: 12,
        marginLeft: 10,
    },
    unitTextLabel: {
        color: '#666',
        fontSize: 14,
    },
    radioGroup: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    radioButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 30,
    },
    radioOuter: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#444',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    radioOuterActive: {
        borderColor: '#4A90E2',
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#4A90E2',
    },
    radioLabel: {
        color: '#FFF',
        fontSize: 15,
    },
    selectBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        backgroundColor: '#000',
    },
    selectText: {
        color: '#FFF',
        fontSize: 14,
        flex: 1,
        marginRight: 10,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    calculateBtn: {
        backgroundColor: '#4CAF50',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        flex: 2,
        marginRight: 10,
    },
    calculateBtnText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
        marginRight: 8,
    },
    clearBtn: {
        backgroundColor: '#444',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        flex: 1,
    },
    clearBtnText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    resultsContainer: {
        marginTop: 10,
    },
    resultsHeader: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    resultsSub: {
        color: '#888',
        fontSize: 13,
        marginBottom: 15,
    },
    resultItem: {
        flexDirection: 'row',
        marginBottom: 12,
        borderRadius: 12,
        overflow: 'hidden',
    },
    resultLabelBox: {
        flex: 1,
        backgroundColor: '#111',
        padding: 15,
        justifyContent: 'center',
        borderRightWidth: 1,
        borderRightColor: '#222',
    },
    resultLabel: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '600',
    },
    resultExtra: {
        color: '#666',
        fontSize: 12,
        marginTop: 2,
    },
    resultValueBox: {
        flex: 1,
        backgroundColor: '#161616',
        padding: 15,
        alignItems: 'flex-start',
    },
    resultValue: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    resultUnit: {
        color: '#888',
        fontSize: 12,
    },
    resultPercent: {
        position: 'absolute',
        right: 15,
        top: 15,
        color: '#4CAF50',
        fontSize: 12,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#111',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '70%',
    },
    modalTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    modalItem: {
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    modalItemActive: {
        backgroundColor: '#1a1a1a',
    },
    modalItemText: {
        color: '#CCC',
        fontSize: 15,
    },
    modalItemTextActive: {
        color: '#4A90E2',
        fontWeight: 'bold',
    }
});

export default CalorieCalculatorScreen;

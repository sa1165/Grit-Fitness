import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Animated,
    Dimensions,
    FlatList,
    Platform,
    ActivityIndicator,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Logger } from '../utils/Logger';

const { width } = Dimensions.get('window');

const OnboardingScreen = ({ navigation }) => {
    const { user, refreshProfile } = useAuth();
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isReady, setIsReady] = useState(false);

    // Form Data
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('Male');
    const [weight, setWeight] = useState(70);
    const [weightUnit, setWeightUnit] = useState('kg');
    const [height, setHeight] = useState(170);
    const [heightUnit, setHeightUnit] = useState('cm');
    const [goal, setGoal] = useState('Fat Loss');
    const [experience, setExperience] = useState('Beginner');
    const [workoutDays, setWorkoutDays] = useState(4);
    const [trainingLocation, setTrainingLocation] = useState('Gym');

    const progress = useRef(new Animated.Value(0)).current;

    const steps = [
        'Physical Info',
        'Weight',
        'Height',
        'Goal',
        'Experience',
        'Frequency',
        'Location'
    ];

    const handleNext = () => {
        if (step < steps.length - 1) {
            setStep(step + 1);
            Animated.timing(progress, {
                toValue: (step + 1) / (steps.length - 1),
                duration: 300,
                useNativeDriver: false
            }).start();
        } else {
            startPlanGeneration();
        }
    };

    const startPlanGeneration = () => {
        setIsGenerating(true);
        // Step 1: Show "Generating" for 10 seconds
        setTimeout(() => {
            setIsGenerating(false);
            setIsReady(true);
        }, 10000);
    };

    const handleBack = () => {
        if (isReady) {
            setIsReady(false);
            return;
        }
        if (isGenerating) return; // Can't go back while generating

        if (step > 0) {
            setStep(step - 1);
            Animated.timing(progress, {
                toValue: (step - 1) / (steps.length - 1),
                duration: 300,
                useNativeDriver: false
            }).start();
        }
    };

    const saveOnboardingData = async () => {
        setLoading(true);
        Logger.info('Onboarding', 'Saving physical data...');

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    age: parseInt(age),
                    gender,
                    weight,
                    weight_unit: weightUnit,
                    height,
                    height_unit: heightUnit,
                    goal,
                    experience_level: experience,
                    workout_days: workoutDays,
                    training_location: trainingLocation,
                    onboarding_completed: true,
                    updated_at: new Date()
                })
                .eq('id', user.id);

            if (error) throw error;

            Logger.info('Onboarding', 'Onboarding completed successfully');
            await refreshProfile();
        } catch (error) {
            Logger.error('Onboarding', 'Save failed', error);
            Alert.alert('Error', 'Failed to save your profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Sub-components for steps
    const renderPhysicalInfo = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.title}>What is your Age and Gender?</Text>
            <Text style={styles.subtitle}>What you are going to select will effect your workout program</Text>

            <View style={styles.inputRow}>
                <Text style={styles.label}>Age :</Text>
                <TextInput
                    style={styles.ageInput}
                    keyboardType="numeric"
                    placeholder=""
                    placeholderTextColor="#666"
                    value={age}
                    onChangeText={setAge}
                />
            </View>

            <View style={styles.genderContainer}>
                <Text style={styles.label}>Gender :</Text>
                <View style={styles.genderOptions}>
                    {['Male', 'Female', 'Other'].map((g) => (
                        <TouchableOpacity
                            key={g}
                            style={[styles.genderChip, gender === g && styles.activeChip]}
                            onPress={() => setGender(g)}
                        >
                            <Text style={[styles.genderText, gender === g && styles.activeTabText]}>{g}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </View>
    );

    const ValuePicker = ({ value, min, max, unit, onValueChange, color = '#FFF9C4' }) => {
        const adjustValue = (delta) => {
            const newValue = value + delta;
            if (newValue >= min && newValue <= max) {
                onValueChange(newValue);
            } else if (newValue < min) {
                onValueChange(min);
            } else if (newValue > max) {
                onValueChange(max);
            }
        };

        return (
            <View style={[styles.rulerContainer, { backgroundColor: color, height: 200 }]}>
                <View style={styles.valueRow}>
                    <View style={styles.adjustGroup}>
                        <TouchableOpacity onPress={() => adjustValue(-10)} style={styles.adjustBtnLarge}>
                            <Text style={styles.adjustText}>-10</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => adjustValue(-1)} style={styles.adjustBtn}>
                            <Ionicons name="remove-circle-outline" size={44} color="#000" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.valueDisplay}>
                        <Text style={styles.displayValue}>{value}</Text>
                        <Text style={styles.unitLabel}>{unit}</Text>
                    </View>

                    <View style={styles.adjustGroup}>
                        <TouchableOpacity onPress={() => adjustValue(1)} style={styles.adjustBtn}>
                            <Ionicons name="add-circle-outline" size={44} color="#000" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => adjustValue(10)} style={styles.adjustBtnLarge}>
                            <Text style={styles.adjustText}>+10</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    const renderWeight = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.title}>What is your weight?</Text>

            <View style={styles.toggleContainer}>
                <TouchableOpacity
                    style={[styles.toggleButton, weightUnit === 'lb' && styles.toggleActive]}
                    onPress={() => setWeightUnit('lb')}
                >
                    <Text style={[styles.toggleText, weightUnit === 'lb' && styles.toggleActiveText]}>lb</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.toggleButton, weightUnit === 'kg' && styles.toggleActive]}
                    onPress={() => setWeightUnit('kg')}
                >
                    <Text style={[styles.toggleText, weightUnit === 'kg' && styles.toggleActiveText]}>kg</Text>
                </TouchableOpacity>
            </View>

            <ValuePicker
                value={weight}
                min={weightUnit === 'kg' ? 30 : 60}
                max={weightUnit === 'kg' ? 200 : 450}
                unit={weightUnit}
                onValueChange={setWeight}
                color="#FFF9C4"
            />
        </View>
    );

    const renderHeight = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.title}>What is your height?</Text>

            <View style={styles.toggleContainer}>
                <TouchableOpacity
                    style={[styles.toggleButton, heightUnit === 'inches' && styles.toggleActive]}
                    onPress={() => setHeightUnit('inches')}
                >
                    <Text style={[styles.toggleText, heightUnit === 'inches' && styles.toggleActiveText]}>inches</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.toggleButton, heightUnit === 'cm' && styles.toggleActive]}
                    onPress={() => setHeightUnit('cm')}
                >
                    <Text style={[styles.toggleText, heightUnit === 'cm' && styles.toggleActiveText]}>cm</Text>
                </TouchableOpacity>
            </View>

            <ValuePicker
                value={height}
                min={heightUnit === 'cm' ? 100 : 40}
                max={heightUnit === 'cm' ? 250 : 100}
                unit={heightUnit}
                onValueChange={setHeight}
                color="#E0F2F1"
            />
        </View>
    );

    const renderGoal = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.title}>What do you want to achieve?</Text>
            <Text style={styles.subtitle}>What you are going to select will effect your workout program</Text>

            <View style={styles.optionsList}>
                {['Fat Loss', 'Muscle Gain', 'Body Recomposition', 'Overall Fitness'].map(g => (
                    <TouchableOpacity
                        key={g}
                        style={[styles.optionCard, goal === g && styles.activeOption]}
                        onPress={() => setGoal(g)}
                    >
                        <Text style={[styles.optionText, goal === g && styles.activeOptionText]}>{g}</Text>
                        {goal === g && <Ionicons name="checkmark-circle" size={24} color="#000" />}
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const renderExperience = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.title}>What is your Experience Level?</Text>
            <Text style={styles.subtitle}>What you are going to select will effect your workout program</Text>

            <View style={styles.optionsList}>
                {['Beginner', 'Intermediate', 'Advanced'].map(e => (
                    <TouchableOpacity
                        key={e}
                        style={[styles.optionCard, experience === e && styles.activeOption]}
                        onPress={() => setExperience(e)}
                    >
                        <Text style={[styles.optionText, experience === e && styles.activeOptionText]}>{e}</Text>
                        {experience === e && <Ionicons name="checkmark-circle" size={24} color="#000" />}
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const renderWorkoutDays = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.title}>Workout Days Per Week?</Text>
            <Text style={styles.subtitle}>What you are going to select will effect your workout program</Text>

            <View style={[styles.rulerContainer, { backgroundColor: '#F3E5F5', height: 200 }]}>
                <View style={styles.valueRow}>
                    <TouchableOpacity
                        onPress={() => setWorkoutDays(Math.max(1, workoutDays - 1))}
                        style={styles.adjustBtn}
                    >
                        <Ionicons name="remove-circle-outline" size={60} color="#000" />
                    </TouchableOpacity>

                    <View style={styles.valueDisplay}>
                        <Text style={styles.displayValue}>{workoutDays}</Text>
                        <Text style={styles.unitLabel}>Days</Text>
                    </View>

                    <TouchableOpacity
                        onPress={() => setWorkoutDays(Math.min(7, workoutDays + 1))}
                        style={styles.adjustBtn}
                    >
                        <Ionicons name="add-circle-outline" size={60} color="#000" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    const renderLocation = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.title}>Where Do you Train?</Text>
            <Text style={styles.subtitle}>What you are going to select will effect your workout program</Text>

            <View style={styles.optionsList}>
                {['Home workout', 'Gym', 'Other'].map(l => (
                    <TouchableOpacity
                        key={l}
                        style={[styles.optionCard, trainingLocation === l && styles.activeOption]}
                        onPress={() => setTrainingLocation(l)}
                    >
                        <Text style={[styles.optionText, trainingLocation === l && styles.activeOptionText]}>{l}</Text>
                        {trainingLocation === l && <Ionicons name="checkmark-circle" size={24} color="#000" />}
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const renderGenerating = () => (
        <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#000" style={{ transform: [{ scale: 2 }] }} />
            <Text style={styles.generatingText}>your personalized plan is generating.......</Text>
        </View>
    );

    const renderReady = () => (
        <View style={styles.centerContainer}>
            <Text style={styles.readyTitle}>Your personalized{"\n"}plan is Ready</Text>

            <View style={styles.checkInnerContainer}>
                <View style={styles.checkCircle}>
                    <Ionicons name="checkmark" size={80} color="#000" />
                </View>
            </View>

            <TouchableOpacity
                style={styles.finishButton}
                onPress={saveOnboardingData}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#FFF" />
                ) : (
                    <Text style={styles.finishButtonText}>Start Now</Text>
                )}
            </TouchableOpacity>
        </View>
    );

    const renderStep = () => {
        if (isGenerating) return renderGenerating();
        if (isReady) return renderReady();

        switch (step) {
            case 0: return renderPhysicalInfo();
            case 1: return renderWeight();
            case 2: return renderHeight();
            case 3: return renderGoal();
            case 4: return renderExperience();
            case 5: return renderWorkoutDays();
            case 6: return renderLocation();
            default: return null;
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                {!isGenerating && !isReady && renderStep()}
                {(isGenerating || isReady) && renderStep()}
            </View>

            {!isGenerating && !isReady && (
                <View style={styles.footer}>
                    <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                        <Ionicons name="chevron-back" size={30} color="#000" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.nextButton} onPress={handleNext} disabled={loading}>
                        {loading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <View style={styles.nextButtonContent}>
                                <Text style={styles.nextButtonText}>{step === steps.length - 1 ? 'Finish' : 'Next'}</Text>
                                <Ionicons name="chevron-forward-outline" size={20} color="#666" />
                                <Ionicons name="chevron-forward-outline" size={20} color="#999" />
                                <Ionicons name="chevron-forward-outline" size={20} color="#CCC" />
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            {isReady && (
                <View style={styles.footer}>
                    <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                        <Ionicons name="chevron-back" size={30} color="#000" />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F9FA',
    },
    content: {
        flex: 1,
        paddingHorizontal: 30,
        paddingTop: 60,
    },
    stepContainer: {
        flex: 1,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#000',
        textAlign: 'center',
        marginBottom: 10,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
    },
    subtitle: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        marginBottom: 40,
        lineHeight: 20,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 40,
    },
    label: {
        fontSize: 24,
        fontWeight: '600',
        color: '#000',
        marginRight: 15,
    },
    ageInput: {
        fontSize: 24,
        color: '#000',
        borderBottomWidth: 2,
        borderBottomColor: '#000',
        minWidth: 60,
        textAlign: 'center',
    },
    genderContainer: {
        alignItems: 'center',
    },
    genderOptions: {
        flexDirection: 'row',
        marginTop: 20,
    },
    genderChip: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#DDD',
        marginHorizontal: 5,
    },
    activeChip: {
        backgroundColor: '#000',
        borderColor: '#000',
    },
    genderText: {
        fontSize: 16,
        color: '#666',
    },
    activeTabText: {
        color: '#FFF',
    },
    toggleContainer: {
        flexDirection: 'row',
        alignSelf: 'center',
        backgroundColor: '#FFF',
        borderRadius: 25,
        padding: 5,
        marginBottom: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    toggleButton: {
        paddingHorizontal: 25,
        paddingVertical: 10,
        borderRadius: 20,
    },
    toggleActive: {
        backgroundColor: '#000',
    },
    toggleText: {
        fontSize: 16,
        color: '#666',
    },
    toggleActiveText: {
        color: '#FFF',
    },
    rulerContainer: {
        backgroundColor: '#FFF9C4', // Pale yellow for weight
        borderRadius: 30,
        padding: 40,
        alignItems: 'center',
        height: 300,
        justifyContent: 'center',
    },
    valueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 30,
    },
    valueDisplay: {
        alignItems: 'center',
    },
    adjustBtn: {
        padding: 5,
    },
    adjustGroup: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    adjustBtnLarge: {
        backgroundColor: '#000',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 15,
        marginHorizontal: 8,
    },
    adjustText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    hiddenInput: {
        position: 'absolute',
        opacity: 0,
        width: '100%',
        height: '100%',
    },
    displayValue: {
        fontSize: 64,
        fontWeight: 'bold',
        color: '#000',
    },
    unitLabel: {
        fontSize: 18,
        color: '#666',
        marginBottom: 20,
    },
    activeGrad: {
        backgroundColor: '#000',
        height: 50,
        width: 3,
    },
    gradLine: {
        width: 2,
        height: 30,
        backgroundColor: '#CCC',
    },
    optionsList: {
        marginTop: 20,
    },
    optionCard: {
        backgroundColor: '#FFF',
        padding: 20,
        borderRadius: 15,
        marginBottom: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#EEE',
    },
    activeOption: {
        borderColor: '#000',
        borderWidth: 2,
    },
    optionText: {
        fontSize: 18,
        color: '#333',
        fontWeight: '500',
    },
    activeOptionText: {
        color: '#000',
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    backButton: {
        width: 60,
        height: 60,
        borderRadius: 20,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    nextButton: {
        backgroundColor: '#000',
        borderRadius: 30,
        height: 60,
        paddingHorizontal: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    nextButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    nextButtonText: {
        color: '#FFF',
        fontSize: 22,
        fontWeight: 'bold',
        marginRight: 10,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    generatingText: {
        marginTop: 40,
        fontSize: 18,
        color: '#666',
        textAlign: 'center',
    },
    readyTitle: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#000',
        textAlign: 'center',
        marginBottom: 60,
    },
    checkInnerContainer: {
        marginBottom: 100,
    },
    checkCircle: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: '#E0F2F1',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 10,
        borderColor: '#F0F7F7',
    },
    finishButton: {
        backgroundColor: '#000',
        borderRadius: 30,
        height: 70,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    finishButtonText: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: 'bold',
    },
});

export default OnboardingScreen;

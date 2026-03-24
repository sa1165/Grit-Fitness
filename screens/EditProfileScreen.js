import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    SafeAreaView,
    Platform,
    Alert,
    ActivityIndicator,
    ScrollView,
    KeyboardAvoidingView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Logger } from '../utils/Logger';

const EXPERIENCES = ['Beginner', 'Intermediate', 'Advanced'];
const GOALS = ['Weight Loss', 'Muscle Gain', 'Endurance', 'General Fitness'];

const EditProfileScreen = ({ navigation }) => {
    const { user, profile, refreshProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    
    // Form States
    const [fullName, setFullName] = useState('');
    const [experience, setExperience] = useState('');
    const [goal, setGoal] = useState('');

    useEffect(() => {
        if (profile) {
            setFullName(profile.full_name || '');
            setExperience(profile.experience_level || '');
            setGoal(profile.goal || '');
        }
    }, [profile]);

    const handleSave = async () => {
        if (!fullName.trim()) {
            Alert.alert('Error', 'Name cannot be empty.');
            return;
        }

        setLoading(true);
        try {
            const updates = {
                id: user.id,
                full_name: fullName.trim(),
                experience_level: experience,
                goal: goal,
                updated_at: new Date(),
            };

            const { error } = await supabase
                .from('profiles')
                .upsert(updates);

            if (error) throw error;

            // Trigger a refetch in AuthContext so the rest of the app updates instantly
            if (refreshProfile) {
                await refreshProfile();
            }

            Logger.info('EditProfile', 'Profile updated successfully');
            Alert.alert('Success', 'Your profile has been updated!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
            
        } catch (error) {
            Logger.error('EditProfile', 'Error updating profile', error);
            Alert.alert('Error', 'Could not update profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const SelectionGroup = ({ title, options, selected, onSelect }) => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <View style={styles.optionsGrid}>
                {options.map((option) => (
                    <TouchableOpacity
                        key={option}
                        style={[
                            styles.optionCard,
                            selected === option && styles.optionCardActive
                        ]}
                        onPress={() => onSelect(option)}
                    >
                        <Text style={[
                            styles.optionText,
                            selected === option && styles.optionTextActive
                        ]}>
                            {option}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Profile</Text>
                <View style={{ width: 24 }} /> {/* Spacer */}
            </View>

            <KeyboardAvoidingView 
                style={{ flex: 1 }} 
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput
                            style={styles.input}
                            value={fullName}
                            onChangeText={setFullName}
                            placeholder="Enter your name"
                            placeholderTextColor="#666"
                        />
                    </View>

                    <SelectionGroup
                        title="Experience Level"
                        options={EXPERIENCES}
                        selected={experience}
                        onSelect={setExperience}
                    />

                    <SelectionGroup
                        title="Primary Goal"
                        options={GOALS}
                        selected={goal}
                        onSelect={setGoal}
                    />

                    <TouchableOpacity 
                        style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#000" />
                        ) : (
                            <Text style={styles.saveBtnText}>Save Changes</Text>
                        )}
                    </TouchableOpacity>

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
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#111',
    },
    backBtn: {
        padding: 5,
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    inputContainer: {
        marginBottom: 30,
    },
    label: {
        color: '#888',
        fontSize: 14,
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        backgroundColor: '#111',
        borderRadius: 12,
        padding: 16,
        color: '#FFF',
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#222',
    },
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        color: '#888',
        fontSize: 14,
        marginBottom: 12,
        marginLeft: 4,
    },
    optionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    optionCard: {
        backgroundColor: '#111',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#222',
        marginBottom: 10,
        marginRight: 10,
    },
    optionCardActive: {
        backgroundColor: '#4A90E2',
        borderColor: '#4A90E2',
    },
    optionText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '500',
    },
    optionTextActive: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    saveBtn: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 20,
    },
    saveBtnDisabled: {
        opacity: 0.7,
    },
    saveBtnText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
    }
});

export default EditProfileScreen;

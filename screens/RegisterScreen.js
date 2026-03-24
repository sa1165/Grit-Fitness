import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ScrollView
} from 'react-native';
import { supabase } from '../lib/supabase';
import { Logger } from '../utils/Logger';
import { Ionicons } from '@expo/vector-icons';

const RegisterScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleInputChange = (setter) => (text) => {
        setter(text);
        if (errorMsg) setErrorMsg('');
    };

    async function signUpWithEmail() {
        if (!email || !password || !fullName) {
            setErrorMsg('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            setErrorMsg('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setErrorMsg('Password must be at least 6 characters');
            return;
        }

        setErrorMsg('');

        setLoading(true);
        Logger.info('Register', `Attempting registration for: ${email}`);

        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: fullName,
                }
            }
        });

        if (error) {
            Logger.error('Register', 'Registration failed', error);

            const errorMsg = error.message.toLowerCase();
            // Expanded checks for "already registered"
            if (errorMsg.includes('already registered') || errorMsg.includes('email_exists') || (error.status === 400 && errorMsg.includes('user already registered'))) {
                const prompt = 'Email ID already registered. Do you want to login?';

                if (Platform.OS === 'web') {
                    if (window.confirm(prompt)) {
                        navigation.navigate('Login');
                    }
                } else {
                    Alert.alert(
                        'Login Required',
                        prompt,
                        [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Login', onPress: () => navigation.navigate('Login') }
                        ]
                    );
                }
            } else {
                setErrorMsg(error.message);
            }
        } else {
            Logger.info('Register', 'Registration successful', { userId: data?.user?.id });

            // If a user object exists but session is null, it usually means confirmation is required
            // In some cases, Supabase returns success with an empty user if stealth is on.
            if (Platform.OS === 'web') {
                setErrorMsg('Account created! Please check your email for confirmation.');
                setTimeout(() => navigation.navigate('Login'), 3000);
            } else {
                Alert.alert(
                    'Success!',
                    'Your account has been created. Please check your email for a confirmation link.',
                    [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
                );
            }
        }
        setLoading(false);
    }

    async function signUpWithGoogle() {
        setLoading(true);
        Logger.info('Register', 'Attempting Google registration');

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: Platform.OS === 'web' ? window.location.origin : undefined,
            }
        });

        if (error) {
            Logger.error('Register', 'Google registration failed', error);
            setErrorMsg(error.message);
        }
        setLoading(false);
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.formContainer}>
                    <Text style={styles.title}>Join Grit.</Text>
                    <Text style={styles.subtitle}>Start your personalized fitness journey today.</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="John Doe"
                            placeholderTextColor="#666"
                            value={fullName}
                            onChangeText={handleInputChange(setFullName)}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="example@email.com"
                            placeholderTextColor="#666"
                            autoCapitalize="none"
                            keyboardType="email-address"
                            value={email}
                            onChangeText={handleInputChange(setEmail)}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Password</Text>
                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={styles.passwordInput}
                                placeholder="••••••••"
                                placeholderTextColor="#666"
                                secureTextEntry={!showPassword}
                                value={password}
                                onChangeText={handleInputChange(setPassword)}
                            />
                            <TouchableOpacity
                                style={styles.eyeIcon}
                                onPress={() => setShowPassword(!showPassword)}
                            >
                                <Ionicons
                                    name={showPassword ? "eye-off" : "eye"}
                                    size={22}
                                    color="#AAA"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Confirm Password</Text>
                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={styles.passwordInput}
                                placeholder="••••••••"
                                placeholderTextColor="#666"
                                secureTextEntry={!showConfirmPassword}
                                value={confirmPassword}
                                onChangeText={handleInputChange(setConfirmPassword)}
                            />
                            <TouchableOpacity
                                style={styles.eyeIcon}
                                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                <Ionicons
                                    name={showConfirmPassword ? "eye-off" : "eye"}
                                    size={22}
                                    color="#AAA"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {errorMsg ? (
                        <View style={errorMsg.includes('Account created') ? styles.successContainer : styles.errorContainer}>
                            <Ionicons
                                name={errorMsg.includes('Account created') ? "checkmark-circle" : "alert-circle"}
                                size={20}
                                color={errorMsg.includes('Account created') ? "#4CAF50" : "#FF4B4B"}
                            />
                            <Text style={errorMsg.includes('Account created') ? styles.successText : styles.errorText}>
                                {errorMsg}
                            </Text>
                        </View>
                    ) : null}

                    <TouchableOpacity
                        style={styles.button}
                        onPress={signUpWithEmail}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#000" />
                        ) : (
                            <Text style={styles.buttonText}>Create Account</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.dividerContainer}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>or</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    <TouchableOpacity
                        style={styles.googleButton}
                        onPress={signUpWithGoogle}
                        disabled={loading}
                    >
                        <Ionicons name="logo-google" size={20} color="#000" style={{ marginRight: 10 }} />
                        <Text style={styles.googleButtonText}>Continue with Google</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.linkButton}
                        onPress={() => navigation.navigate('Login')}
                    >
                        <Text style={styles.linkText}>
                            Already have an account? <Text style={styles.highlightText}>Sign In</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    scrollContainer: {
        flexGrow: 1,
    },
    formContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 25,
        paddingVertical: 50,
    },
    title: {
        color: '#FFF',
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        color: '#AAA',
        fontSize: 16,
        marginBottom: 40,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        backgroundColor: '#1A1A1A',
        color: '#FFF',
        height: 54,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#333',
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1A1A1A',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333',
        height: 54,
    },
    passwordInput: {
        flex: 1,
        color: '#FFF',
        paddingHorizontal: 16,
        fontSize: 16,
        height: '100%',
    },
    eyeIcon: {
        paddingHorizontal: 16,
    },
    button: {
        backgroundColor: '#FFF',
        height: 54,
        borderRadius: 27,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    buttonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 25,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#333',
    },
    dividerText: {
        color: '#666',
        marginHorizontal: 15,
        fontSize: 14,
    },
    googleButton: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        height: 54,
        borderRadius: 27,
        justifyContent: 'center',
        alignItems: 'center',
    },
    googleButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '600',
    },
    linkButton: {
        marginTop: 25,
        alignItems: 'center',
        paddingBottom: 20,
    },
    linkText: {
        color: '#AAA',
        fontSize: 14,
    },
    highlightText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 75, 75, 0.1)',
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 75, 75, 0.3)',
    },
    errorText: {
        color: '#FF4B4B',
        fontSize: 14,
        marginLeft: 8,
        flex: 1,
    },
    successContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(76, 175, 80, 0.3)',
    },
    successText: {
        color: '#4CAF50',
        fontSize: 14,
        marginLeft: 8,
        flex: 1,
    },
});

export default RegisterScreen;

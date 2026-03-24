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
    Alert
} from 'react-native';
import { supabase } from '../lib/supabase';
import { Logger } from '../utils/Logger';
import { colors } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleEmailChange = (text) => {
        setEmail(text);
        if (errorMsg) setErrorMsg('');
    };

    const handlePasswordChange = (text) => {
        setPassword(text);
        if (errorMsg) setErrorMsg('');
    };

    async function signInWithEmail() {
        if (!email || !password) {
            setErrorMsg('Please enter email and password');
            return;
        }

        setErrorMsg('');

        setLoading(true);
        Logger.info('Login', `Attempting sign-in for: ${email}`);

        const { error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            Logger.error('Login', 'Sign-in failed', error);

            const supabaseMsg = error.message.toLowerCase();
            if (supabaseMsg.includes('invalid login credentials') || supabaseMsg.includes('invalid credentials')) {
                setErrorMsg('No user found with this email or invalid password. Please check your credentials.');
            } else {
                setErrorMsg(error.message);
            }
        } else {
            Logger.info('Login', 'Sign-in successful');
        }
        setLoading(false);
    }

    async function signInWithGoogle() {
        setLoading(true);
        Logger.info('Login', 'Attempting Google sign-in');

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: Platform.OS === 'web' ? window.location.origin : undefined,
            }
        });

        if (error) {
            Logger.error('Login', 'Google sign-in failed', error);
            setErrorMsg(error.message);
        }
        setLoading(false);
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.formContainer}>
                <Text style={styles.title}>Welcome Back.</Text>
                <Text style={styles.subtitle}>Sign in to continue your journey.</Text>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="example@email.com"
                        placeholderTextColor="#666"
                        autoCapitalize="none"
                        keyboardType="email-address"
                        value={email}
                        onChangeText={handleEmailChange}
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
                            onChangeText={handlePasswordChange}
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

                {errorMsg ? (
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle" size={20} color="#FF4B4B" />
                        <Text style={styles.errorText}>{errorMsg}</Text>
                    </View>
                ) : null}

                <TouchableOpacity
                    style={styles.button}
                    onPress={signInWithEmail}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#000" />
                    ) : (
                        <Text style={styles.buttonText}>Sign In</Text>
                    )}
                </TouchableOpacity>

                <View style={styles.dividerContainer}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or</Text>
                    <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity
                    style={styles.googleButton}
                    onPress={signInWithGoogle}
                    disabled={loading}
                >
                    <Ionicons name="logo-google" size={20} color="#000" style={{ marginRight: 10 }} />
                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.linkButton}
                    onPress={() => navigation.navigate('Register')}
                >
                    <Text style={styles.linkText}>
                        Don't have an account? <Text style={styles.highlightText}>Register</Text>
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    formContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 25,
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
});

export default LoginScreen;

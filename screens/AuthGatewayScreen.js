import React from 'react';
import { View, Image, StyleSheet, StatusBar, Text, TouchableOpacity } from 'react-native';

const AuthGatewayScreen = ({ navigation }) => {
    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000000" />

            {/* Logo and Title Section */}
            <View style={styles.logoContainer}>
                <Image
                    source={require('../assets/splash-design.png')}
                    style={styles.splashImage}
                    resizeMode="contain"
                />
                <View style={styles.textContainer}>
                    <Text style={styles.title}>Grit.</Text>
                </View>
            </View>

            {/* Buttons Section */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={styles.loginButton}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('Login')}
                >
                    <Text style={styles.loginText}>Login</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.registerButton}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('Register')}
                >
                    <Text style={styles.registerText}>Register</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
        paddingHorizontal: 25,
    },
    logoContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -50, // Shift up slightly to balance with buttons below
    },
    splashImage: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    textContainer: {
        marginTop: 140, // Matching refined splash placement
        marginLeft: 8,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 42,
        fontWeight: '600',
        letterSpacing: -1,
    },
    buttonContainer: {
        width: '100%',
        paddingBottom: 60,
    },
    loginButton: {
        backgroundColor: '#2E2E2E',
        height: 54,
        borderRadius: 27,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    loginText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    registerButton: {
        backgroundColor: '#FFFFFF',
        height: 54, // Reduced from 65 for a more slender profile
        borderRadius: 27,
        justifyContent: 'center',
        alignItems: 'center',
    },
    registerText: {
        color: '#000000',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default AuthGatewayScreen;

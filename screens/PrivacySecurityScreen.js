import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PrivacySecurityScreen = ({ navigation }) => {
    
    const InfoSection = ({ title, icon, content }) => (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <View style={styles.iconContainer}>
                    <Ionicons name={icon} size={24} color="#4A90E2" />
                </View>
                <Text style={styles.sectionTitle}>{title}</Text>
            </View>
            <Text style={styles.sectionContent}>{content}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Privacy & Security</Text>
                <View style={{ width: 24 }} /> {/* Spacer */}
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                <View style={styles.heroSection}>
                    <Ionicons name="shield-checkmark" size={64} color="#4A90E2" />
                    <Text style={styles.heroTitle}>Your Data is Safe</Text>
                    <Text style={styles.heroSubtitle}>
                        We believe your fitness journey is personal. Here is how we protect your information.
                    </Text>
                </View>

                <InfoSection 
                    title="End-to-End Authentication" 
                    icon="lock-closed-outline" 
                    content="Your account is secured using industry-standard authentication via Supabase. We never store your raw password, and all login requests are encrypted." 
                />

                <InfoSection 
                    title="Profile & Progress Data" 
                    icon="analytics-outline" 
                    content="Your profile information, goals, and experience levels are stored securely in our database. This information is only used to personalize your app experience and is never sold to third parties." 
                />

                <InfoSection 
                    title="Local Storage" 
                    icon="save-outline" 
                    content="To ensure maximum privacy and offline capability, sensitive data like your specific Workout Plans and Notification Histories are stored locally right on your device, not on our servers." 
                />

                <InfoSection 
                    title="Notifications" 
                    icon="notifications-outline" 
                    content="Workout reminders are scheduled directly through your device's operating system natively. No background tracking or continuous server connection is required to deliver your alerts." 
                />

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        If you have any specific concerns about your data, please visit the Help & Support section.
                    </Text>
                </View>

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
        padding: 24,
    },
    heroSection: {
        alignItems: 'center',
        paddingVertical: 30,
        borderBottomWidth: 1,
        borderBottomColor: '#111',
        marginBottom: 30,
    },
    heroTitle: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 15,
        marginBottom: 8,
    },
    heroSubtitle: {
        color: '#888',
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 20,
    },
    section: {
        marginBottom: 30,
        backgroundColor: '#111',
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#222',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#1A1A1A',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    sectionTitle: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        flex: 1,
    },
    sectionContent: {
        color: '#AAA',
        fontSize: 14,
        lineHeight: 22,
    },
    footer: {
        marginTop: 10,
        marginBottom: 40,
        paddingHorizontal: 10,
    },
    footerText: {
        color: '#666',
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 20,
    }
});

export default PrivacySecurityScreen;

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    Platform,
    Alert,
    Image,
    ActivityIndicator,
    Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { Logger } from '../utils/Logger';
import { NotificationService } from '../utils/NotificationService';

const YouScreen = ({ navigation }) => {
    const { user, profile, signOut } = useAuth();
    const [loading, setLoading] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [isMenuVisible, setIsMenuVisible] = useState(false);

    const fetchNotifications = async () => {
        const history = await NotificationService.getHistory();
        setNotifications(history);
        setIsMenuVisible(true);
    };

    const handleClearNotifications = () => {
        const confirmClear = async () => {
            const success = await NotificationService.clearHistory();
            if (success) {
                setNotifications([]);
            } else {
                Alert.alert('Error', 'Failed to clear notifications.');
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm('Are you sure you want to delete all notification history?')) {
                confirmClear();
            }
        } else {
            Alert.alert(
                'Clear Notifications',
                'Are you sure you want to delete all notification history?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Clear All', style: 'destructive', onPress: confirmClear }
                ]
            );
        }
    };

    const handleLogout = async () => {
        const confirmLogout = () => {
            setLoading(true);
            signOut()
                .then(() => Logger.info('YouScreen', 'User logged out successfully'))
                .catch((err) => {
                    Logger.error('YouScreen', 'Logout failed', err);
                    Alert.alert('Error', 'Failed to log out. Please try again.');
                })
                .finally(() => setLoading(false));
        };

        if (Platform.OS === 'web') {
            if (window.confirm('Are you sure you want to log out?')) {
                confirmLogout();
            }
        } else {
            Alert.alert(
                'Logout',
                'Are you sure you want to log out?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Logout', style: 'destructive', onPress: confirmLogout }
                ]
            );
        }
    };

    const renderNavTab = (name, icon, active = false, route) => (
        <TouchableOpacity
            style={styles.navTab}
            onPress={() => route && navigation.navigate(route)}
        >
            <Ionicons name={icon} size={24} color={active ? '#FFF' : '#666'} />
            <Text style={[styles.navTabText, active && styles.navTabTextActive]}>{name}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.title}>You</Text>
                    <TouchableOpacity style={styles.settingsBtn}>
                        <Ionicons name="settings-outline" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>

                {/* Profile Section */}
                <View style={styles.profileContainer}>
                    <View style={styles.avatarContainer}>
                        {profile?.avatar_url ? (
                            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Ionicons name="person" size={40} color="#666" />
                            </View>
                        )}
                    </View>
                    <Text style={styles.userName}>{profile?.full_name || 'Grit User'}</Text>
                    <Text style={styles.userEmail}>{user?.email}</Text>
                </View>

                {/* Stats Summary */}
                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{profile?.experience_level || '-'}</Text>
                        <Text style={styles.statLabel}>Level</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{profile?.grit_score || 0}</Text>
                        <Text style={styles.statLabel}>Grit Score</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{profile?.goal || '-'}</Text>
                        <Text style={styles.statLabel}>Goal</Text>
                    </View>
                </View>

                {/* Menu Items */}
                <View style={styles.menuContainer}>
                    <TouchableOpacity 
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('EditProfile')}
                    >
                        <View style={[styles.menuIcon, { backgroundColor: '#1A1A1A' }]}>
                            <Ionicons name="person-outline" size={20} color="#FFF" />
                        </View>
                        <Text style={styles.menuText}>Edit Profile</Text>
                        <Ionicons name="chevron-forward" size={16} color="#333" />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.menuItem}
                        onPress={fetchNotifications}
                    >
                        <View style={[styles.menuIcon, { backgroundColor: '#1A1A1A' }]}>
                            <Ionicons name="notifications-outline" size={20} color="#FFF" />
                        </View>
                        <Text style={styles.menuText}>Notifications</Text>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{notifications.length}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color="#333" />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('PrivacySecurity')}
                    >
                        <View style={[styles.menuIcon, { backgroundColor: '#1A1A1A' }]}>
                            <Ionicons name="shield-checkmark-outline" size={20} color="#FFF" />
                        </View>
                        <Text style={styles.menuText}>Privacy & Security</Text>
                        <Ionicons name="chevron-forward" size={16} color="#333" />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('HelpSupport')}
                    >
                        <View style={[styles.menuIcon, { backgroundColor: '#1A1A1A' }]}>
                            <Ionicons name="help-circle-outline" size={20} color="#FFF" />
                        </View>
                        <Text style={styles.menuText}>Help & Support</Text>
                        <Ionicons name="chevron-forward" size={16} color="#333" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.menuItem, styles.logoutItem]}
                        onPress={handleLogout}
                        disabled={loading}
                    >
                        <View style={[styles.menuIcon, { backgroundColor: '#2A0000' }]}>
                            <Ionicons name="log-out-outline" size={20} color="#FF4B4B" />
                        </View>
                        <Text style={[styles.menuText, { color: '#FF4B4B' }]}>Log Out</Text>
                        {loading ? (
                            <ActivityIndicator size="small" color="#FF4B4B" />
                        ) : (
                            <Ionicons name="chevron-forward" size={16} color="#333" />
                        )}
                    </TouchableOpacity>
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Notifications Modal */}
            <Modal
                visible={isMenuVisible}
                animationType="slide"
                transparent={false}
                onRequestClose={() => setIsMenuVisible(false)}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setIsMenuVisible(false)}>
                            <Ionicons name="close" size={28} color="#FFF" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Notifications</Text>
                        {notifications.length > 0 ? (
                            <TouchableOpacity onPress={handleClearNotifications}>
                                <Text style={styles.clearBtnText}>Clear All</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={{ width: 65 }} />
                        )}
                    </View>
                    
                    <ScrollView contentContainerStyle={styles.notificationList}>
                        {notifications.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="notifications-off-outline" size={64} color="#333" />
                                <Text style={styles.emptyText}>No notifications yet.</Text>
                                <Text style={styles.emptySubtext}>Your motivational reminders will appear here.</Text>
                            </View>
                        ) : (
                            notifications.map(item => (
                                <View key={item.id} style={styles.notificationCard}>
                                    <View style={[styles.typeIndicator, { 
                                        backgroundColor: item.type === 'motivational' ? '#4A90E2' : '#FF9800' 
                                    }]} />
                                    <View style={styles.notificationContent}>
                                        <Text style={styles.notificationTitle}>{item.title}</Text>
                                        <Text style={styles.notificationBody}>{item.body}</Text>
                                        <Text style={styles.notificationTime}>
                                            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                    </View>
                                </View>
                            ))
                        )}
                    </ScrollView>
                </SafeAreaView>
            </Modal>

            {/* Bottom Navigation */}
            <View style={styles.bottomNav}>
                {renderNavTab('Home', 'home-outline', false, 'Home')}
                {renderNavTab('Explore', 'search-outline', false, 'Explore')}
                <TouchableOpacity
                    style={styles.addBtnContainer}
                    onPress={() => navigation.navigate('Workout')}
                >
                    <View style={styles.addBtn}>
                        <Ionicons name="add" size={32} color="#000" />
                    </View>
                    <Text style={styles.navTabText}>Workout</Text>
                </TouchableOpacity>
                {renderNavTab('Progress', 'analytics-outline', false, 'Progress')}
                {renderNavTab('You', 'person', true)}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 50,
        paddingBottom: 100,
    },
    // Adding SafeAreaView for modal
    modalContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#111',
    },
    modalTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    clearBtnText: {
        color: '#FF4B4B',
        fontSize: 14,
        fontWeight: '500',
    },
    notificationList: {
        padding: 20,
    },
    notificationCard: {
        flexDirection: 'row',
        backgroundColor: '#111',
        borderRadius: 15,
        padding: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#222',
    },
    typeIndicator: {
        width: 4,
        height: '100%',
        borderRadius: 2,
        marginRight: 15,
    },
    notificationContent: {
        flex: 1,
    },
    notificationTitle: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    notificationBody: {
        color: '#AAA',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 8,
    },
    notificationTime: {
        color: '#444',
        fontSize: 12,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 20,
    },
    emptySubtext: {
        color: '#666',
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    },
    badge: {
        backgroundColor: '#4A90E2',
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 2,
        marginRight: 10,
    },
    badgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
    },
    title: {
        color: '#FFF',
        fontSize: 32,
        fontWeight: 'bold',
    },
    settingsBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#111',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#111',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        borderWidth: 2,
        borderColor: '#333',
        overflow: 'hidden',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    avatarPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    userName: {
        color: '#FFF',
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    userEmail: {
        color: '#666',
        fontSize: 14,
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: '#111',
        borderRadius: 20,
        padding: 20,
        marginBottom: 30,
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
        textAlign: 'center',
    },
    statLabel: {
        color: '#666',
        fontSize: 12,
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: '#222',
    },
    menuContainer: {
        backgroundColor: '#111',
        borderRadius: 25,
        paddingVertical: 10,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 20,
    },
    menuIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    menuText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '500',
        flex: 1,
    },
    logoutItem: {
        borderTopWidth: 1,
        borderTopColor: '#222',
        marginTop: 10,
    },
    bottomNav: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#000',
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'ios' ? 30 : 15,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#111',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    navTab: {
        alignItems: 'center',
    },
    navTabText: {
        color: '#666',
        fontSize: 9,
        marginTop: 4,
    },
    navTabTextActive: {
        color: '#FFF',
    },
    addBtnContainer: {
        alignItems: 'center',
        bottom: 10,
    },
    addBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
});

export default YouScreen;

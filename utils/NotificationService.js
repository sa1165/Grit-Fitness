import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Logger } from './Logger';

// Configure notification behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

export const NotificationService = {
    requestPermissionsAsync: async () => {
        if (Platform.OS === 'web') {
            if (!('Notification' in window)) return false;
            
            if (Notification.permission === 'granted') return true;
            if (Notification.permission !== 'denied') {
                const permission = await Notification.requestPermission();
                return permission === 'granted';
            }
            return false;
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        return finalStatus === 'granted';
    },

    scheduleWorkoutReminders: async () => {
        try {
            if (!(await NotificationService.requestPermissionsAsync())) {
                Logger.warn('NotificationService', 'Permissions not granted for reminders');
                return false;
            }

            // Cancel any existing notifications first to avoid duplicates
            await Notifications.cancelAllScheduledNotificationsAsync();

            await Notifications.scheduleNotificationAsync({
                content: {
                    title: '🎯 Time for Grit!',
                    body: 'Log your daily progress and keep the streak alive. Open the app to update your Grit score.',
                    data: { type: 'workout_reminder' },
                    sound: true, 
                },
                trigger: {
                    hour: 12,
                    minute: 0,
                    repeats: true,
                },
            });

            Logger.info('NotificationService', 'Scheduled daily 12 PM reminder');
            return true;
        } catch (error) {
            Logger.error('NotificationService', 'Failed to schedule daily reminders', error);
            return false;
        }
    },

    deliverManualNotification: async () => {
        try {
            if (!(await NotificationService.requestPermissionsAsync())) {
                Logger.warn('NotificationService', 'Permissions not granted for manual notification');
                return null;
            }

            // Get a random engaging message from our list
            const { WORKOUT_NOTIFICATIONS } = require('../constants/notifications');
            const randomIndex = Math.floor(Math.random() * WORKOUT_NOTIFICATIONS.length);
            const message = WORKOUT_NOTIFICATIONS[randomIndex];

            const title = message.title;
            const body = message.body;
            let notificationId = Date.now().toString();

            if (Platform.OS === 'web' && 'Notification' in window) {
                new Notification(title, { body });
            } else {
                const id = await Notifications.presentNotificationAsync({
                    title,
                    body,
                    data: { type: 'test_engaging' },
                });
                if (id) notificationId = id;
            }

            const newEntry = {
                id: notificationId,
                title,
                body,
                type: 'test_engaging',
                timestamp: new Date().toISOString()
            };

            // Save to history
            const history = await NotificationService.getHistory();
            const updatedHistory = [newEntry, ...history].slice(0, 50);
            await AsyncStorage.setItem('notificationHistory', JSON.stringify(updatedHistory));

            Logger.info('NotificationService', 'Manual test notification delivered');
            return newEntry;
        } catch (error) {
            Logger.error('NotificationService', 'Failed to deliver manual notification', error);
            return null;
        }
    },

    getHistory: async () => {
        try {
            const historyStr = await AsyncStorage.getItem('notificationHistory');
            return historyStr ? JSON.parse(historyStr) : [];
        } catch (error) {
            Logger.error('NotificationService', 'Failed to get history', error);
            return [];
        }
    },

    clearHistory: async () => {
        try {
            await AsyncStorage.removeItem('notificationHistory');
            Logger.info('NotificationService', 'Notification history cleared');
            return true;
        } catch (error) {
            Logger.error('NotificationService', 'Failed to clear history', error);
            return false;
        }
    }
};

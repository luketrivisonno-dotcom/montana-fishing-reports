import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATIONS_ENABLED_KEY = '@notifications_enabled';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const requestNotificationPermissions = async () => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus === 'granted') {
    await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, 'true');
    return true;
  }
  return false;
};

export const scheduleFishingReportNotification = async (riverName) => {
  try {
    await cancelRiverNotifications(riverName);
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(8, 0, 0, 0);
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🎣 ${riverName} Update`,
        body: 'New fishing report available! Check current conditions.',
        data: { river: riverName, type: 'new_report' },
      },
      trigger: {
        date: tomorrow,
        repeats: true,
      },
      identifier: `report_${riverName.replace(/\s+/g, '_')}`,
    });
    
    console.log(`Scheduled notification for ${riverName}`);
  } catch (e) {
    console.error('Error scheduling notification:', e);
  }
};

export const cancelRiverNotifications = async (riverName) => {
  try {
    const identifier = `report_${riverName.replace(/\s+/g, '_')}`;
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch (e) {
    console.error('Error canceling notification:', e);
  }
};

export const sendTestNotification = async () => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🎣 Montana Fishing Reports',
      body: 'Notifications are working! You\'ll get alerts for your favorite rivers.',
    },
    trigger: null,
  });
};

export const areNotificationsEnabled = async () => {
  const value = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
  return value === 'true';
};

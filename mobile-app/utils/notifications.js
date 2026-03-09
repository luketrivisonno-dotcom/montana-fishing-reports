import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://montana-fishing-reports-production.up.railway.app';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Request permission and get push token
export async function registerForPushNotificationsAsync() {
  let token;
  
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }
  
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.log('Push notification permission denied');
    return null;
  }
  
  try {
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: 'your-project-id' // Will be set during EAS build
    })).data;
    
    console.log('Push token:', token);
    
    // Save token locally
    await AsyncStorage.setItem('pushToken', token);
    
    // Register with server
    await registerTokenWithServer(token);
    
  } catch (error) {
    console.error('Error getting push token:', error);
  }
  
  // Configure Android notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('fishing-alerts', {
      name: 'Fishing Alerts',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
    });
    
    await Notifications.setNotificationChannelAsync('flow-updates', {
      name: 'Flow Updates',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });
  }
  
  return token;
}

// Register token with server
async function registerTokenWithServer(token) {
  try {
    const response = await fetch(`${API_URL}/api/notifications/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, platform: Platform.OS }),
    });
    
    if (!response.ok) {
      console.error('Failed to register token with server');
    }
  } catch (error) {
    console.error('Error registering token:', error);
  }
}

// Subscribe to river notifications
export async function subscribeToRiverNotifications(riverName) {
  try {
    const token = await AsyncStorage.getItem('pushToken');
    if (!token) return false;
    
    const response = await fetch(`${API_URL}/api/notifications/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, river: riverName }),
    });
    
    if (response.ok) {
      // Save subscription locally
      const subscriptions = JSON.parse(await AsyncStorage.getItem('riverSubscriptions') || '[]');
      if (!subscriptions.includes(riverName)) {
        subscriptions.push(riverName);
        await AsyncStorage.setItem('riverSubscriptions', JSON.stringify(subscriptions));
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error subscribing:', error);
    return false;
  }
}

// Unsubscribe from river notifications
export async function unsubscribeFromRiverNotifications(riverName) {
  try {
    const token = await AsyncStorage.getItem('pushToken');
    if (!token) return false;
    
    const response = await fetch(`${API_URL}/api/notifications/unsubscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, river: riverName }),
    });
    
    if (response.ok) {
      // Remove subscription locally
      const subscriptions = JSON.parse(await AsyncStorage.getItem('riverSubscriptions') || '[]');
      const updated = subscriptions.filter(r => r !== riverName);
      await AsyncStorage.setItem('riverSubscriptions', JSON.stringify(updated));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error unsubscribing:', error);
    return false;
  }
}

// Get subscribed rivers
export async function getSubscribedRivers() {
  try {
    const subscriptions = await AsyncStorage.getItem('riverSubscriptions');
    return subscriptions ? JSON.parse(subscriptions) : [];
  } catch {
    return [];
  }
}

// Check if subscribed to a river
export async function isSubscribedToRiver(riverName) {
  const subscriptions = await getSubscribedRivers();
  return subscriptions.includes(riverName);
}

// Schedule a local notification (for testing)
export async function scheduleLocalNotification(title, body, data = {}) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
    },
    trigger: { seconds: 2 },
  });
}

// Setup notification listeners
export function setupNotificationListeners(onNotificationReceived, onNotificationResponse) {
  // Notification received while app is in foreground
  const receivedSubscription = Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification received:', notification);
    if (onNotificationReceived) {
      onNotificationReceived(notification);
    }
  });
  
  // User tapped on notification
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('Notification tapped:', response);
    if (onNotificationResponse) {
      onNotificationResponse(response);
    }
  });
  
  // Return unsubscribe function
  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
}

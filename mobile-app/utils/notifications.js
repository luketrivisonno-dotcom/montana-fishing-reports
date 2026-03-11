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
    // Try to get push token - this requires a development build or production app
    // In Expo Go, this will fail - that's expected
    const expoPushToken = await Notifications.getExpoPushTokenAsync();
    token = expoPushToken.data;
    
    console.log('Push token:', token);
    
    // Save token locally
    await AsyncStorage.setItem('pushToken', token);
    
    // Register with server
    await registerTokenWithServer(token);
    
  } catch (error) {
    console.log('Push notifications not available:', error.message);
    console.log('👉 To test push notifications, create a development build:');
    console.log('   eas build --profile development --platform ios');
    // In Expo Go, push tokens won't work - that's OK for development
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

// ============================================
// HATCH ALERT SUBSCRIPTIONS (Premium Feature)
// ============================================

// Subscribe to hatch alerts for a river
export async function subscribeToHatchAlerts(riverName, hatchType = 'all') {
  try {
    const token = await AsyncStorage.getItem('pushToken');
    if (!token) return { success: false, error: 'No push token' };
    
    const response = await fetch(`${API_URL}/api/hatch-alerts/subscribe`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-api-key': await getApiKey(), // Premium users have API key
      },
      body: JSON.stringify({ token, river: riverName, hatch: hatchType }),
    });
    
    if (response.status === 403) {
      return { success: false, error: 'premium_required' };
    }
    
    if (response.ok) {
      // Save locally
      const key = `hatchAlerts_${riverName}`;
      await AsyncStorage.setItem(key, JSON.stringify({ hatch: hatchType, subscribed: true }));
      return { success: true };
    }
    
    return { success: false, error: 'Failed to subscribe' };
  } catch (error) {
    console.error('Error subscribing to hatch alerts:', error);
    return { success: false, error: error.message };
  }
}

// Unsubscribe from hatch alerts
export async function unsubscribeFromHatchAlerts(riverName, hatchType = null) {
  try {
    const token = await AsyncStorage.getItem('pushToken');
    if (!token) return false;
    
    const response = await fetch(`${API_URL}/api/hatch-alerts/unsubscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, river: riverName, hatch: hatchType }),
    });
    
    if (response.ok) {
      const key = `hatchAlerts_${riverName}`;
      await AsyncStorage.removeItem(key);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error unsubscribing from hatch alerts:', error);
    return false;
  }
}

// Check if subscribed to hatch alerts for a river
export async function isSubscribedToHatchAlerts(riverName) {
  try {
    const key = `hatchAlerts_${riverName}`;
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

// Get available hatch types
export async function getHatchTypes() {
  try {
    const response = await fetch(`${API_URL}/api/hatch-alerts/types`);
    if (response.ok) {
      const data = await response.json();
      return data.hatches;
    }
    return [];
  } catch (error) {
    console.error('Error fetching hatch types:', error);
    return [];
  }
}

// Helper to get API key (for premium check)
async function getApiKey() {
  // This would be set during premium subscription
  return await AsyncStorage.getItem('apiKey') || '';
}

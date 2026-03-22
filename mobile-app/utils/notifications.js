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

// Subscribe to river notifications (PREMIUM ONLY)
export async function subscribeToRiverNotifications(riverName) {
  try {
    const token = await AsyncStorage.getItem('pushToken');
    if (!token) return { success: false, error: 'no_token' };
    
    // Get API key for premium check
    const apiKey = await AsyncStorage.getItem('apiKey');
    const email = await AsyncStorage.getItem('userEmail');
    
    const response = await fetch(`${API_URL}/api/notifications/subscribe`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-api-key': apiKey || '',
        'x-user-email': email || '',
      },
      body: JSON.stringify({ token, river: riverName }),
    });
    
    if (response.status === 403) {
      return { success: false, error: 'premium_required' };
    }
    
    if (response.ok) {
      // Save subscription locally
      const subscriptions = JSON.parse(await AsyncStorage.getItem('riverSubscriptions') || '[]');
      if (!subscriptions.includes(riverName)) {
        subscriptions.push(riverName);
        await AsyncStorage.setItem('riverSubscriptions', JSON.stringify(subscriptions));
      }
      return { success: true };
    }
    return { success: false, error: 'subscription_failed' };
  } catch (error) {
    console.error('Error subscribing:', error);
    return { success: false, error: error.message };
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

// Check if notification permissions are granted
export async function checkNotificationPermissions() {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.log('Error checking permissions:', error);
    return false;
  }
}

// Request notification permissions
export async function requestNotificationPermissions() {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.log('Error requesting permissions:', error);
    return false;
  }
}


// ============================================
// SMART NOTIFICATIONS - NEW FEATURES v2.1
// ============================================

// Check HatchCast scores and send alerts for rivers exceeding threshold
export async function checkHatchCastScoreAlerts() {
  try {
    const prefs = JSON.parse(await AsyncStorage.getItem('userSettings') || '{}');
    
    // Check if feature is enabled
    if (!prefs.scoreAlertsEnabled) return;
    
    const threshold = prefs.scoreThreshold || 85;
    const subscribedRivers = await getSubscribedRivers();
    
    // Track which rivers we've already notified for today
    const today = new Date().toDateString();
    const alertHistory = JSON.parse(await AsyncStorage.getItem('scoreAlertHistory') || '{}');
    
    for (const river of subscribedRivers) {
      // Skip if already notified today
      if (alertHistory[river] === today) continue;
      
      // Fetch HatchCast score
      const response = await fetch(`${API_URL}/api/smartcast/${encodeURIComponent(river)}`);
      if (!response.ok) continue;
      
      const data = await response.json();
      const score = data.smartcast?.score || 0;
      
      if (score >= threshold) {
        // Send local notification
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `🎣 ${river} is HOT!`,
            body: `HatchCast score: ${score}/100 - Excellent fishing conditions!`,
            data: { river, score, type: 'score_alert' },
          },
          trigger: null, // Send immediately
        });
        
        // Mark as notified
        alertHistory[river] = today;
      }
    }
    
    // Save updated history
    await AsyncStorage.setItem('scoreAlertHistory', JSON.stringify(alertHistory));
    
  } catch (error) {
    console.error('Error checking HatchCast scores:', error);
  }
}

// Check for flow spikes and send alerts
export async function checkFlowSpikeAlerts() {
  try {
    const prefs = JSON.parse(await AsyncStorage.getItem('userSettings') || '{}');
    
    // Check if feature is enabled
    if (!prefs.flowSpikeAlertsEnabled) return;
    
    const threshold = prefs.flowSpikeThreshold || 300;
    const checkDangerous = prefs.dangerousFlowAlerts !== false;
    const subscribedRivers = await getSubscribedRivers();
    
    // Track alert history to prevent spam
    const alertHistory = JSON.parse(await AsyncStorage.getItem('flowAlertHistory') || '{}');
    const now = Date.now();
    
    for (const river of subscribedRivers) {
      // Check cooldown (4 hours)
      const lastAlert = alertHistory[river];
      if (lastAlert && (now - lastAlert) < (4 * 60 * 60 * 1000)) continue;
      
      // Fetch current and historical flow data
      const response = await fetch(`${API_URL}/api/river-details/${encodeURIComponent(river)}`);
      if (!response.ok) continue;
      
      const data = await response.json();
      const currentFlow = data.flow;
      
      if (!currentFlow || currentFlow === 'N/A' || currentFlow === 'Seasonal') continue;
      
      // Get flow history (would need API endpoint for this)
      // For now, we'll use a simple comparison if we have cached data
      const cachedFlow = await AsyncStorage.getItem(`flow_${river}`);
      const currentFlowNum = parseInt(currentFlow);
      
      if (cachedFlow) {
        const previousFlow = parseInt(cachedFlow);
        const change = currentFlowNum - previousFlow;
        const percentChange = (change / previousFlow) * 100;
        
        // Flow spike (increase)
        if (change > threshold) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `🌊 Flow Spike on ${river}!`,
              body: `Jumped ${change} CFS (${Math.round(percentChange)}%) - Fishing will be tough. Try edges & slower water.`,
              data: { river, type: 'flow_spike', change, currentFlow: currentFlowNum },
            },
            trigger: null,
          });
          
          alertHistory[river] = now;
        }
        
        // Flow drop (decrease)
        else if (change < -threshold) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `⬇️ Flow Dropping on ${river}`,
              body: `Down ${Math.abs(change)} CFS - Fish are moving to deeper runs`,
              data: { river, type: 'flow_drop', change, currentFlow: currentFlowNum },
            },
            trigger: null,
          });
          
          alertHistory[river] = now;
        }
      }
      
      // Check dangerous flows
      if (checkDangerous) {
        const dangerLevel = getDangerousFlowLevel(river);
        if (currentFlowNum > dangerLevel) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `⚠️ High Water Warning: ${river}`,
              body: `${currentFlowNum} CFS is dangerous. Safety first - consider postponing.`,
              data: { river, type: 'flow_danger', currentFlow: currentFlowNum },
              priority: 'high',
            },
            trigger: null,
          });
          
          alertHistory[river] = now;
        }
      }
      
      // Cache current flow for next comparison
      await AsyncStorage.setItem(`flow_${river}`, String(currentFlowNum));
    }
    
    // Save updated history
    await AsyncStorage.setItem('flowAlertHistory', JSON.stringify(alertHistory));
    
  } catch (error) {
    console.error('Error checking flow spikes:', error);
  }
}

// Get dangerous flow level for a river
function getDangerousFlowLevel(river) {
  const dangerLevels = {
    'Madison River': 5000,
    'Yellowstone River': 10000,
    'Missouri River': 8000,
    'Bighorn River': 5000,
    'Gallatin River': 4000,
    'Bitterroot River': 6000,
    'Big Hole River': 4000,
    'Beaverhead River': 3000,
  };
  
  return dangerLevels[river] || 5000; // Default 5000 CFS
}

// Check weather conditions and send alerts
export async function checkWeatherAlerts() {
  try {
    const prefs = JSON.parse(await AsyncStorage.getItem('userSettings') || '{}');
    
    // Check if feature is enabled
    if (!prefs.weatherAlertsEnabled) return;
    
    const windEnabled = prefs.windAlerts !== false;
    const tempEnabled = prefs.tempAlerts !== false;
    const pressureEnabled = prefs.pressureAlerts === true;
    
    const subscribedRivers = await getSubscribedRivers();
    const alertHistory = JSON.parse(await AsyncStorage.getItem('weatherAlertHistory') || '{}');
    const now = Date.now();
    
    for (const river of subscribedRivers) {
      // Check cooldown (6 hours)
      if (alertHistory[river] && (now - alertHistory[river]) < (6 * 60 * 60 * 1000)) continue;
      
      // Fetch weather data
      const response = await fetch(`${API_URL}/api/weather/${encodeURIComponent(river)}`);
      if (!response.ok) continue;
      
      const weather = await response.json();
      
      // Wind drop alert (ideal for fishing)
      if (windEnabled && weather.windSpeed < 10) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `🌤️ ${river} - Perfect Wind Conditions`,
            body: `Wind at ${weather.windSpeed}mph - Ideal for delicate dry fly presentations`,
            data: { river, type: 'weather_wind', windSpeed: weather.windSpeed },
          },
          trigger: null,
        });
        
        alertHistory[river] = now;
      }
      
      // Optimal temperature (50-65°F is ideal for trout)
      if (tempEnabled && weather.waterTemp >= 50 && weather.waterTemp <= 65) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `🌡️ Prime Water Temps on ${river}`,
            body: `Water temp at ${weather.waterTemp}°F - Trout will be actively feeding!`,
            data: { river, type: 'weather_temp', temp: weather.waterTemp },
          },
          trigger: null,
        });
        
        alertHistory[river] = now;
      }
    }
    
    await AsyncStorage.setItem('weatherAlertHistory', JSON.stringify(alertHistory));
    
  } catch (error) {
    console.error('Error checking weather alerts:', error);
  }
}

// Check solunar feeding times
export async function checkSolunarAlerts() {
  try {
    const prefs = JSON.parse(await AsyncStorage.getItem('userSettings') || '{}');
    
    // Check if feature is enabled
    if (!prefs.solunarAlertsEnabled) return;
    
    const reminderMinutes = prefs.solunarReminderMinutes || 30;
    const subscribedRivers = await getSubscribedRivers();
    
    for (const river of subscribedRivers) {
      // Fetch solunar data
      const response = await fetch(`${API_URL}/api/solunar/${encodeURIComponent(river)}`);
      if (!response.ok) continue;
      
      const solunar = await response.json();
      const now = new Date();
      
      for (const period of solunar.periods) {
        const periodTime = new Date(period.time);
        const timeUntil = periodTime - now;
        const minutesUntil = Math.floor(timeUntil / 60000);
        
        // Major feeding period upcoming
        if (period.type === 'major' && 
            minutesUntil <= reminderMinutes && 
            minutesUntil > 0) {
          
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `🌙 Major Feeding Period - ${river}`,
              body: `Moon ${period.position} in ${minutesUntil} mins. Peak activity predicted!`,
              data: { 
                river, 
                type: 'solunar_major', 
                time: period.time,
                rating: period.rating 
              },
            },
            trigger: null,
          });
        }
      }
    }
    
  } catch (error) {
    console.error('Error checking solunar alerts:', error);
  }
}

// Master function to run all smart notification checks
export async function runSmartNotificationChecks() {
  console.log('Running smart notification checks...');
  
  // Check permissions first
  const hasPermission = await checkNotificationPermissions();
  if (!hasPermission) {
    console.log('No notification permission');
    return;
  }
  
  // Run all checks
  await Promise.all([
    checkHatchCastScoreAlerts(),
    checkFlowSpikeAlerts(),
    checkWeatherAlerts(),
    checkSolunarAlerts(),
  ]);
  
  console.log('Smart notification checks complete');
}

// Schedule a test notification
export async function scheduleTestNotification(title, body, delaySeconds = 5) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { type: 'test' },
    },
    trigger: { seconds: delaySeconds },
  });
}

// Export all notification types for reference
export const NOTIFICATION_TYPES = {
  SCORE_ALERT: 'score_alert',
  FLOW_SPIKE: 'flow_spike',
  FLOW_DROP: 'flow_drop',
  FLOW_DANGER: 'flow_danger',
  WEATHER_WIND: 'weather_wind',
  WEATHER_TEMP: 'weather_temp',
  WEATHER_PRESSURE: 'weather_pressure',
  SOLUNAR_MAJOR: 'solunar_major',
  SOLUNAR_PEAK: 'solunar_peak',
  SOLUNAR_MOON: 'solunar_moon',
  HATCH_PREDICTION: 'hatch_prediction',
  SHOP_REPORT: 'shop_report',
  DAILY_BRIEFING: 'daily_briefing',
};

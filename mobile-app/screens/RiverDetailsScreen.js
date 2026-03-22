import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, Linking
} from 'react-native';
import { isFavorite, addFavorite, removeFavorite } from '../utils/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  subscribeToRiverNotifications, 
  unsubscribeFromRiverNotifications,
  isSubscribedToRiver,
  registerForPushNotificationsAsync,
  scheduleLocalNotification,
  subscribeToHatchAlerts,
  unsubscribeFromHatchAlerts,
  isSubscribedToHatchAlerts,
} from '../utils/notifications';
import { getAccessPoints } from '../data/accessPoints';
import RiverInfoCard from '../components/RiverInfoCard';
import TheHatchCastCard from '../components/TheHatchCastCard';
import RiverReportModal from '../components/RiverReportModal';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RIVER_INFO } from '../data/riverInfo';
import { isTrialActive } from '../hooks/trialManager';
import { checkCachedPremiumStatus } from '../hooks/useRevenueCat';

const API_URL = 'https://montana-fishing-reports-production.up.railway.app';

const RiverDetailsScreen = ({ route, navigation }) => {
  console.log('[RiverDetailsScreen] MOUNTED, river:', route.params?.river);
  const { river } = route.params;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [hatchAlertSub, setHatchAlertSub] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [accessPoints, setAccessPoints] = useState([]);
  const [smartcastData, setSmartcastData] = useState(null);
  const [smartcastLoading, setSmartcastLoading] = useState(true);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [userReports, setUserReports] = useState([]);
  const [userReportCount, setUserReportCount] = useState(0);

  useEffect(() => {
    checkFavoriteStatus();
    checkSubscriptionStatus();
    checkHatchAlertStatus();
    checkPremiumStatus();
    fetchRiverData();
    loadAccessPoints();
  }, []);

  // Fetch SmartCast separately so it loads independently
  useEffect(() => {
    fetchSmartCastData();
  }, [river]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row' }}>
          {/* Notification Bell */}
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={toggleNotificationSubscription}
          >
            <MaterialCommunityIcons 
              name={isSubscribed ? "bell" : "bell-outline"} 
              size={24} 
              color={isSubscribed ? '#f39c12' : '#7f8c8d'} 
            />
          </TouchableOpacity>
          {/* Favorite Star */}
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={toggleFavorite}
          >
            <MaterialCommunityIcons 
              name={isFav ? "star" : "star-outline"} 
              size={24} 
              color={isFav ? '#e74c3c' : '#7f8c8d'} 
            />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [isFav, isSubscribed, navigation]);

  const checkFavoriteStatus = async () => {
    const fav = await isFavorite(river);
    setIsFav(fav);
  };

  const checkSubscriptionStatus = async () => {
    const subscribed = await isSubscribedToRiver(river);
    setIsSubscribed(subscribed);
  };

  const checkHatchAlertStatus = async () => {
    const sub = await isSubscribedToHatchAlerts(river);
    setHatchAlertSub(sub);
  };

  const checkPremiumStatus = async () => {
    // Check multiple sources for premium status:
    // 1. RevenueCat cached premium status
    // 2. Active trial
    // 3. Legacy API key (for backward compatibility)
    const { isPremium: rcPremium } = await checkCachedPremiumStatus();
    const trialActive = await isTrialActive();
    const apiKey = await AsyncStorage.getItem('apiKey');
    
    const hasPremium = rcPremium || trialActive || !!apiKey;
    setIsPremium(hasPremium);
  };

  const toggleFavorite = async () => {
    if (isFav) {
      await removeFavorite(river);
      Alert.alert('Removed from Favorites', `${river} removed from your favorites.`);
    } else {
      await addFavorite(river);
      Alert.alert('Added to Favorites', `${river} added to favorites!`);
    }
    setIsFav(!isFav);
  };

  const toggleNotificationSubscription = async () => {
    if (isSubscribed) {
      const success = await unsubscribeFromRiverNotifications(river);
      if (success) {
        setIsSubscribed(false);
        Alert.alert('Unsubscribed', `You'll no longer receive notifications for ${river}`);
      }
      return;
    }
    
    // Check if premium
    if (!isPremium) {
      Alert.alert(
        '🔒 Premium Feature',
        'Get instant push notifications when new fishing reports are posted. Upgrade to Premium to unlock!',
        [
          { text: 'Not Now', style: 'cancel' },
          { 
            text: 'Upgrade to Premium', 
            style: 'default',
            onPress: () => {
              // Navigate to premium or show modal
              Alert.alert('Coming Soon', 'Premium upgrade will be available in the App Store!');
            }
          }
        ]
      );
      return;
    }
    
    // Premium user - proceed with subscription
    await registerForPushNotificationsAsync();
    const result = await subscribeToRiverNotifications(river);
    
    if (result.success) {
      setIsSubscribed(true);
      Alert.alert(
        '🎣 Notifications Enabled!', 
        `You'll receive push notifications when new fishing reports are posted for ${river}.`,
        [
          { text: 'Great!', style: 'default' },
          { 
            text: 'Send Test', 
            onPress: async () => {
              await scheduleLocalNotification(
                `🎣 ${river}`,
                'Test notification - This is how you\'ll be alerted to new reports!',
                { river, type: 'test' }
              );
            }
          }
        ]
      );
    } else if (result.error === 'premium_required') {
      Alert.alert('Premium Required', 'Push notifications are a premium feature.');
    } else {
      Alert.alert(
        'Enable Notifications',
        'Please enable push notifications in your device settings.',
        [{ text: 'OK' }]
      );
    }
  };

  const toggleHatchAlerts = async () => {
    if (!isPremium) {
      Alert.alert(
        '🔒 Premium Feature',
        'Get instant alerts when Salmonflies, PMDs, or other major hatches are reported on this river. Upgrade to Premium to unlock hatch alerts!',
        [
          { text: 'Not Now', style: 'cancel' },
          { 
            text: 'Upgrade to Premium', 
            style: 'default',
            onPress: () => {
              // Navigate to premium screen or show upgrade modal
              Alert.alert('Coming Soon', 'Premium upgrade will be available shortly!');
            }
          }
        ]
      );
      return;
    }

    if (hatchAlertSub) {
      const success = await unsubscribeFromHatchAlerts(river);
      if (success) {
        setHatchAlertSub(null);
        Alert.alert('Unsubscribed', `You'll no longer receive hatch alerts for ${river}`);
      }
    } else {
      const result = await subscribeToHatchAlerts(river, 'all');
      if (result.success) {
        setHatchAlertSub({ hatch: 'all', subscribed: true });
        Alert.alert(
          '🦋 Hatch Alerts Enabled!', 
          `You'll get notified when major hatches (Salmonflies, PMDs, Caddis, etc.) are reported on ${river}.`,
          [
            { text: 'Great!', style: 'default' },
            { 
              text: 'Send Test', 
              onPress: async () => {
                await scheduleLocalNotification(
                  `🦋 Salmonflies on ${river}!`,
                  'This is a test: Salmonflies are coming off strong from Varney to Ennis!',
                  { river, type: 'hatch_test', hatch: 'Salmonflies' }
                );
              }
            }
          ]
        );
      } else if (result.error === 'premium_required') {
        Alert.alert('Premium Required', 'Hatch alerts are a premium feature. Please upgrade your subscription.');
      } else {
        Alert.alert('Error', 'Failed to subscribe to hatch alerts. Please try again.');
      }
    }
  };

  const fetchSmartCastData = async () => {
    try {
      setSmartcastLoading(true);
      const res = await fetch(`${API_URL}/api/smartcast/${encodeURIComponent(river)}`);
      if (res.ok) {
        const data = await res.json();
        console.log('[SmartCast] Fetched:', data.smartcast);
        setSmartcastData(data.smartcast);
      } else {
        console.log('[SmartCast] API error:', res.status);
      }
    } catch (error) {
      console.error('[SmartCast] Fetch error:', error);
    } finally {
      setSmartcastLoading(false);
    }
  };

  const fetchRiverData = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(`${API_URL}/api/river-details/${encodeURIComponent(river)}`, {
        signal: controller.signal,
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error('Network failed');

      const result = await res.json();
      setData(result);
      
      // Extract user reports if available
      console.log('[RiverDetails] userReports from API:', result.userReports);
      if (result.userReports) {
        setUserReports(result.userReports.recent || []);
        setUserReportCount(result.userReports.count || 0);
        console.log('[RiverDetails] Set userReportCount to:', result.userReports.count || 0);
      } else {
        console.log('[RiverDetails] No userReports in API response');
      }
      
      setIsOffline(false);
    } catch (error) {
      console.error('Fetch error:', error);
      setIsOffline(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadAccessPoints = () => {
    const points = getAccessPoints(river);
    setAccessPoints(points);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRiverData();
    fetchSmartCastData();
  };

  const openUSGS = () => {
    if (data?.usgsId) {
      Linking.openURL(`https://waterdata.usgs.gov/monitoring-location/${data.usgsId}`);
    }
  };

  const viewOnMap = () => {
    navigation.navigate('Map', { highlightRiver: river });
  };

  const viewAccessPoints = () => {
    navigation.navigate('Map', { 
      highlightRiver: river,
      showAccessPoints: true 
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        {/* THE HATCHCAST - SHOW EVEN DURING LOADING */}
        <TheHatchCastCard data={smartcastData} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1a5f7a" />
          <Text style={styles.loadingText}>Loading fishing report...</Text>
        </View>
      </View>
    );
  }

  // Debug: Log render values
  console.log('[RiverDetails] RENDER - userReportCount:', userReportCount, 'userReports.length:', userReports.length);

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* THE HATCHCAST - FIRST COMPONENT */}
      <TheHatchCastCard data={smartcastData} />
      
      {/* River Info - TEMPORARILY AT TOP FOR TESTING */}
      <RiverInfoCard riverName={river} />

      {/* River Header */}
      <View style={styles.header}>
        <Text style={styles.riverName}>{river}</Text>
        <Text style={styles.reportDate}>Report Date: {data?.date || new Date().toLocaleDateString()}</Text>
        {isOffline && <Text style={styles.offlineBadge}>📴 Offline Mode</Text>}
      </View>

      {/* Conditions Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🌊 Current Conditions</Text>
        <View style={styles.conditionsGrid}>
          <View style={styles.conditionItem}>
            <Text style={styles.conditionLabel}>Flow</Text>
            <Text style={styles.conditionValue}>{data?.flow || (data?.isSeasonal ? 'Seasonal' : 'N/A')}</Text>
          </View>
          <View style={styles.conditionItem}>
            <Text style={styles.conditionLabel}>Water Temp</Text>
            <Text style={styles.conditionValue}>{data?.waterTemp || 'N/A'}</Text>
          </View>
        </View>
        
        {/* Seasonal Gauge Warning */}
        {data?.isSeasonal && (data?.flow === 'Seasonal' || data?.flow === 'Seasonal Gauge' || data?.flow === 'N/A') && (
          <View style={styles.seasonalWarning}>
            <MaterialCommunityIcons name="information-outline" size={16} color="#856404" />
            <Text style={styles.seasonalWarningText}>
              {RIVER_INFO[river]?.seasonalNote || 'USGS gauge is seasonal and may be unavailable during winter months.'}
            </Text>
          </View>
        )}
      </View>

      {/* Fishing Report */}
      <View style={styles.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialCommunityIcons name="hook" size={18} color="#2d4a3e" style={{ marginRight: 8 }} />
          <Text style={styles.cardTitle}>Fishing Report</Text>
        </View>
        <Text style={styles.reportText}>{data?.report || 'No report available'}</Text>
      </View>

      {/* Hatches - Premium Only */}
      {isPremium ? (
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialCommunityIcons name="bug" size={18} color="#2d4a3e" style={{ marginRight: 8 }} />
            <Text style={styles.cardTitle}>Current Hatches</Text>
          </View>
          <Text style={styles.hatchText}>{data?.hatches || 'Not reported'}</Text>
          
          {/* Hatch Alert Subscription - Premium Feature */}
          <TouchableOpacity 
            style={[styles.hatchAlertButton, hatchAlertSub && styles.hatchAlertButtonActive]}
            onPress={toggleHatchAlerts}
          >
            <MaterialCommunityIcons 
              name={hatchAlertSub ? "bell" : "bell-outline"} 
              size={16} 
              color={hatchAlertSub ? '#fff' : '#f39c12'} 
            />
            <Text style={[styles.hatchAlertText, hatchAlertSub && styles.hatchAlertTextActive]}>
              {hatchAlertSub 
                ? `🔔 Hatch alerts enabled` 
                : 'Get hatch alerts 🦋'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Recommended Patterns - Premium Only */}
      {isPremium ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🪝 Recommended Patterns</Text>
          <Text style={styles.patternText}>{data?.patterns || 'Not reported'}</Text>
        </View>
      ) : null}

      {/* Live River Reports - Always show, with empty state */}
      <View style={[styles.card, { borderWidth: 3, borderColor: '#ff0000' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <MaterialCommunityIcons name="account-group" size={20} color="#2d4a3e" style={{ marginRight: 8 }} />
          <Text style={styles.cardTitle}>Live Angler Reports</Text>
          {userReportCount > 0 && (
            <View style={styles.reportCountBadge}>
              <Text style={styles.reportCountText}>{userReportCount}</Text>
            </View>
          )}
        </View>
        
        {userReportCount > 0 ? (
          <>
            {userReports.slice(0, 3).map((report, index) => (
              <View key={index} style={styles.userReportItem}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={styles.userReportDate}>
                    {new Date(report.created_at).toLocaleDateString()}
                  </Text>
                  {report.fish_caught > 0 && (
                    <Text style={styles.userReportFish}>🎣 {report.fish_caught} fish</Text>
                  )}
                </View>
                
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                  {report.water_color && (
                    <Text style={styles.userReportTag}>💧 {report.water_color}</Text>
                  )}
                  {report.fish_activity && (
                    <Text style={styles.userReportTag}>🐟 {report.fish_activity}</Text>
                  )}
                  {report.fish_rising && (
                    <Text style={styles.userReportTag}>↗️ rising</Text>
                  )}
                </View>
                
                {report.notes && (
                  <Text style={styles.userReportNotes} numberOfLines={2}>
                    {report.notes}
                  </Text>
                )}
              </View>
            ))}
            
            <TouchableOpacity 
              style={styles.viewAllReportsButton}
              onPress={() => setReportModalVisible(true)}
            >
              <Text style={styles.viewAllReportsText}>
                {userReportCount > 3 ? `View all ${userReportCount} reports + Submit yours →` : 'Submit Your Report →'}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.emptyReportsState}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={40} color="#9e9e9e" />
            <Text style={styles.emptyReportsTitle}>No reports yet today</Text>
            <Text style={styles.emptyReportsSubtitle}>
              Be the first to share current conditions and help other anglers!
            </Text>
            <TouchableOpacity 
              style={styles.submitReportButton}
              onPress={() => setReportModalVisible(true)}
            >
              <Text style={styles.submitReportButtonText}>📝 Submit River Report</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>⚡ Quick Actions</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={viewOnMap}>
            <Text style={styles.actionButtonText}>🗺️ View on Map</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={viewAccessPoints}>
            <Text style={styles.actionButtonText}>🚗 Access Points ({accessPoints.length})</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.actionButton, styles.reportButton]} onPress={() => setReportModalVisible(true)}>
            <Text style={styles.reportButtonText}>📝 Submit River Report</Text>
          </TouchableOpacity>
          
          {data?.usgsId && (
            <TouchableOpacity style={styles.actionButton} onPress={openUSGS}>
              <Text style={styles.actionButtonText}>📊 USGS Data</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Access Points Preview */}
      {accessPoints.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🚗 Access Points</Text>
          {accessPoints.slice(0, 3).map((point, index) => (
            <View key={index} style={styles.accessPointItem}>
              <Text style={styles.accessPointName}>
                {point.type === 'boat' ? '🚤' : point.type === 'both' ? '🚤🚶' : '🚶'} {point.name}
              </Text>
              {point.parking && <Text style={styles.accessPointDetail}>🅿️ Parking</Text>}
              {point.restrooms && <Text style={styles.accessPointDetail}>🚻 Restrooms</Text>}
            </View>
          ))}
          {accessPoints.length > 3 && (
            <TouchableOpacity onPress={viewAccessPoints}>
              <Text style={styles.viewAllText}>View all {accessPoints.length} access points →</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* River Information */}
      <RiverInfoCard riverName={river} />
      
      {/* River Report Modal */}
      <RiverReportModal
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        riverName={river}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#7f8c8d',
  },
  headerButton: {
    padding: 8,
    marginRight: 8,
  },
  hatchAlertButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  hatchAlertButtonActive: {
    backgroundColor: '#f39c12',
    borderColor: '#f39c12',
  },
  hatchAlertText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#856404',
  },
  hatchAlertTextActive: {
    color: '#fff',
  },
  seasonalWarning: {
    flexDirection: 'row',
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#ffc107',
    alignItems: 'flex-start',
  },
  seasonalWarningText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#856404',
    lineHeight: 18,
  },
  favoriteBanner: {
    backgroundColor: '#ecf0f1',
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#bdc3c7',
  },
  favoriteBannerActive: {
    backgroundColor: '#fff3cd',
    borderBottomColor: '#ffc107',
  },
  favoriteBannerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  header: {
    backgroundColor: '#1a5f7a',
    padding: 20,
    paddingTop: 60,
  },
  riverName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  reportDate: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  offlineBadge: {
    fontSize: 12,
    color: '#fff',
    backgroundColor: '#e74c3c',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  card: {
    backgroundColor: '#fff',
    margin: 12,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  conditionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  conditionItem: {
    alignItems: 'center',
  },
  conditionLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  conditionValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a5f7a',
  },
  reportText: {
    fontSize: 16,
    color: '#2c3e50',
    lineHeight: 24,
  },
  hatchText: {
    fontSize: 16,
    color: '#27ae60',
  },
  patternText: {
    fontSize: 16,
    color: '#e67e22',
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#1a5f7a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    minWidth: 100,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  reportButton: {
    backgroundColor: '#c9a227',
  },
  reportButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  userReportItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  userReportDate: {
    fontSize: 13,
    color: '#7f8c8d',
  },
  userReportFish: {
    fontSize: 13,
    fontWeight: '600',
    color: '#27ae60',
  },
  userReportTag: {
    fontSize: 12,
    backgroundColor: '#ecf0f1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    color: '#2c3e50',
  },
  userReportNotes: {
    fontSize: 14,
    color: '#2c3e50',
    marginTop: 6,
    fontStyle: 'italic',
  },
  accessPointItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  accessPointName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  accessPointDetail: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
  },
  viewAllText: {
    color: '#3498db',
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  reportCountBadge: {
    backgroundColor: '#d4af37',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  reportCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  viewAllReportsButton: {
    marginTop: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
    alignItems: 'center',
  },
  viewAllReportsText: {
    color: '#d4af37',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyReportsState: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  emptyReportsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 12,
  },
  emptyReportsSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  submitReportButton: {
    backgroundColor: '#d4af37',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  submitReportButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default RiverDetailsScreen;

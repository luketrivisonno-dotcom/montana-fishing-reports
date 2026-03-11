import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, Linking
} from 'react-native';
import { isFavorite, addFavorite, removeFavorite } from '../utils/storage';
import { 
  subscribeToRiverNotifications, 
  unsubscribeFromRiverNotifications,
  isSubscribedToRiver,
  registerForPushNotificationsAsync,
  scheduleLocalNotification
} from '../utils/notifications';
import { getAccessPoints } from '../data/accessPoints';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const API_URL = 'https://montana-fishing-reports-production.up.railway.app';

const RiverDetailsScreen = ({ route, navigation }) => {
  const { river } = route.params;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [accessPoints, setAccessPoints] = useState([]);

  useEffect(() => {
    checkFavoriteStatus();
    checkSubscriptionStatus();
    fetchRiverData();
    loadAccessPoints();
  }, []);

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
    // First ensure we have push permission
    await registerForPushNotificationsAsync();
    
    if (isSubscribed) {
      const success = await unsubscribeFromRiverNotifications(river);
      if (success) {
        setIsSubscribed(false);
        Alert.alert('Unsubscribed', `You'll no longer receive notifications for ${river}`);
      }
    } else {
      const success = await subscribeToRiverNotifications(river);
      if (success) {
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
      } else {
        Alert.alert(
          'Enable Notifications',
          'Please enable push notifications in your device settings to receive fishing report alerts.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const fetchRiverData = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(`${API_URL}/api/river-details/${encodeURIComponent(river)}`, {
        signal: controller.signal,
        headers: { 'Cache-Control': 'no-cache' }
      });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error('Network failed');

      const result = await response.json();
      setData(result);
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
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a5f7a" />
        <Text style={styles.loadingText}>Loading fishing report...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Favorite Banner */}
      <TouchableOpacity 
        style={[styles.favoriteBanner, isFav && styles.favoriteBannerActive]}
        onPress={toggleFavorite}
      >
        <Text style={styles.favoriteBannerText}>
          {isFav ? 'In Your Favorites (Tap to Remove)' : 'Add to Favorites'}
        </Text>
      </TouchableOpacity>

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
            <Text style={styles.conditionValue}>{data?.flow || 'N/A'}</Text>
          </View>
          <View style={styles.conditionItem}>
            <Text style={styles.conditionLabel}>Water Temp</Text>
            <Text style={styles.conditionValue}>{data?.waterTemp || 'N/A'}</Text>
          </View>

        </View>
      </View>

      {/* Fishing Report */}
      <View style={styles.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialCommunityIcons name="hook" size={18} color="#2d4a3e" style={{ marginRight: 8 }} />
          <Text style={styles.cardTitle}>Fishing Report</Text>
        </View>
        <Text style={styles.reportText}>{data?.report || 'No report available'}</Text>
      </View>

      {/* Hatches */}
      <View style={styles.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialCommunityIcons name="bug" size={18} color="#2d4a3e" style={{ marginRight: 8 }} />
          <Text style={styles.cardTitle}>Current Hatches</Text>
        </View>
        <Text style={styles.hatchText}>{data?.hatches || 'Not reported'}</Text>
      </View>

      {/* Recommended Patterns */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🪝 Recommended Patterns</Text>
        <Text style={styles.patternText}>{data?.patterns || 'Not reported'}</Text>
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
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
});

export default RiverDetailsScreen;

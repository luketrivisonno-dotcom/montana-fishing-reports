import React, { useState, useEffect } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, 
  RefreshControl, StyleSheet, Linking, ActivityIndicator,
  StatusBar, ImageBackground, ScrollView, Modal,
  Alert, Platform, Dimensions, TextInput, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { 
  Ionicons, MaterialCommunityIcons, FontAwesome5,
  MaterialIcons 
} from '@expo/vector-icons';
import { cacheRiverData, getCachedRiverData, clearOldCache } from './utils/offlineStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HatchChart from './components/HatchChart';
import SolunarTimes from './components/SolunarTimes';
import FlowChart from './components/FlowChart';
import FishingLogList from './components/FishingLogList';
import FishingLogModal from './components/FishingLogModal';
import RegulationsInfo from './components/RegulationsInfo';
import RiverMileCalculator from './components/RiverMileCalculator';
import AdBanner from './components/AdBanner';
import AdManager from './components/AdManager';

// Try to import mobile ads SDK - will be null in Expo Go or if module not available
let mobileAds = null;
try {
  const adsModule = require('react-native-google-mobile-ads');
  // The module exports an object with methods, not a function
  mobileAds = adsModule;
  console.log('Google Mobile Ads module loaded:', !!mobileAds);
} catch (e) {
  console.log('Google Mobile Ads SDK not available:', e.message);
}
import { 
  registerForPushNotificationsAsync, 
  subscribeToRiverNotifications,
  unsubscribeFromRiverNotifications,
  isSubscribedToRiver,
  setupNotificationListeners 
} from './utils/notifications';
import RiverMap from './components/RiverMap';
import Paywall from './components/Paywall';
import { initializePurchases, useRevenueCat, checkCachedPremiumStatus } from './hooks/useRevenueCat';
import { getRiverImage, DEFAULT_RIVER_IMAGE } from './assets/river-images/riverImages';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// YNP Rivers - show YNP badge
const YNP_RIVERS = ['Slough Creek', 'Soda Butte Creek', 'Lamar River', 'Gardner River', 'Firehole River'];

// ============================================
// DEVELOPMENT MODE
// ============================================
const DEV_MODE = true;

// Force free mode for testing (set to true to simulate free user)
const FORCE_FREE_MODE = false;

const API_URL = 'https://montana-fishing-reports-production.up.railway.app';

// ============================================
// EARTH-TONED COLOR SCHEME
// ============================================
const COLORS = {
  primary: '#2d4a3e',
  primaryDark: '#1a2f27',
  primaryLight: '#4a6b5c',
  secondary: '#8b7355',
  secondaryDark: '#5c4a35',
  accent: '#c9a227',
  accentDark: '#9a7b1a',
  background: '#f5f1e8',
  surface: '#faf8f3',
  text: '#2c2416',
  textSecondary: '#6b5d4d',
  textLight: '#9a8b7a',
  border: '#d4cfc3',
  success: '#5a7d5a',
  warning: '#c4a35a',
  error: '#a65d57',
  premium: '#b87333',
  premiumDark: '#8b5520',
  overlay: 'rgba(26, 47, 39, 0.5)',
  shadow: 'rgba(44, 36, 22, 0.15)',
  wade: '#5a7d5a',
  boat: '#8b4513',
  both: '#cd853f',
};

// ============================================
// GLOBAL STATE
// ============================================
let globalIsPremium = DEV_MODE;
let globalFavorites = [];
let globalShowPaywall = null; // Function to show paywall, set by App component

// Free vs Premium limits
const FREE_FAVORITES_LIMIT = 2;

const formatDate = (dateString) => {
  if (!dateString || dateString === 'null' || dateString === 'Date unknown') return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const removeDuplicateReports = (reports) => {
  if (!reports || !Array.isArray(reports)) return [];
  const seen = new Set();
  return reports.filter(report => {
    if (!report.url || report.url.trim() === '') return false;
    const source = (report.source || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (seen.has(source)) return false;
    seen.add(source);
    return true;
  });
};

const getRiverTypeColor = (type) => {
  switch (type) {
    case 'tailwater': return '#4a90d9'; // Blue for dam-controlled
    case 'spring_creek': return '#5a9e6e'; // Green for spring-fed
    case 'freestone':
    default: return '#c9a227'; // Gold for freestone
  }
};

const openReport = (url) => {
  if (url) {
    Linking.openURL(url).catch(err => {
      console.error('Failed to open URL:', err);
      Alert.alert('Error', 'Could not open the report.');
    });
  }
};

// ============================================
// TAB NAVIGATION
// ============================================
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function TabIcon({ name, focused, color }) {
  const iconProps = { size: 24, color };
  switch (name) {
    case 'Rivers': return <MaterialCommunityIcons name="waves" {...iconProps} />;
    case 'Map': return <Ionicons name="map-outline" {...iconProps} />;
    case 'Favorites': return <Ionicons name={focused ? "heart" : "heart-outline"} {...iconProps} />;
    case 'Premium': return <MaterialIcons name="diamond" {...iconProps} />;
    default: return <Ionicons name="ellipse" {...iconProps} />;
  }
}

function DevModeBanner() {
  if (!DEV_MODE) return null;
  return (
    <View style={styles.devBanner}>
      <MaterialIcons name="code" size={14} color="#f5f1e8" />
      <Text style={styles.devBannerText}>DEV MODE</Text>
    </View>
  );
}

// Parse flow string like "301 CFS" to get numeric value
const parseFlow = (flowString) => {
  if (!flowString || flowString === 'N/A') return null;
  const match = flowString.match(/(\d+)/);
  return match ? parseInt(match[1]) : null;
};

// Get flow condition badge text and color
const getFlowCondition = (flowString, riverName) => {
  const cfs = parseFlow(flowString);
  if (!cfs) return null;
  
  // Simple thresholds - could be refined per river
  if (cfs < 200) return { text: 'Low Flow', color: '#e74c3c', bgColor: '#ffebee' };
  if (cfs > 3000) return { text: 'High Flow', color: '#e67e22', bgColor: '#fff3e0' };
  return { text: 'Good Flow', color: '#27ae60', bgColor: '#e8f5e9' };
};

// ============================================
// RIVERS LIST SCREEN
// ============================================
function RiversScreen({ navigation }) {
  const [rivers, setRivers] = useState([]);
  const [riverData, setRiverData] = useState({}); // Store flow/temp data for each river
  const [filteredRivers, setFilteredRivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { 
    // Clear river list cache on app load to ensure fresh data
    AsyncStorage.removeItem('river_river_list');
    fetchRivers(); 
    clearOldCache(); 
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = rivers.filter(r => r.toLowerCase().includes(searchQuery.toLowerCase()));
      setFilteredRivers(filtered);
    } else {
      setFilteredRivers(rivers);
    }
  }, [searchQuery, rivers]);

  // Ensure these rivers always appear even if API doesn't return them
  const ESSENTIAL_RIVERS = ['Boulder River'];

  const fetchRivers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/rivers`);
      if (!response.ok) throw new Error('Network failed');
      const data = await response.json();
      
      // Merge with essential rivers to ensure they always appear
      const mergedRivers = [...new Set([...data.rivers, ...ESSENTIAL_RIVERS])];
      const sortedRivers = mergedRivers.sort((a, b) => a.localeCompare(b));
      
      setRivers(sortedRivers);
      setFilteredRivers(sortedRivers);
      setIsOffline(false);
      await cacheRiverData('river_list', sortedRivers);
      
      // Fetch summary data for each river
      fetchAllRiverData(sortedRivers);
    } catch (error) {
      setIsOffline(true);
      const cachedRivers = await getCachedRiverData('river_list');
      if (cachedRivers) {
        setRivers(cachedRivers);
        // Try to load cached river data
        const cachedData = {};
        for (const river of cachedRivers) {
          const riverCache = await getCachedRiverData(river);
          if (riverCache) cachedData[river] = riverCache;
        }
        setRiverData(cachedData);
      } else {
        // Fallback to essential rivers if no cache
        setRivers(ESSENTIAL_RIVERS.sort());
        setFilteredRivers(ESSENTIAL_RIVERS.sort());
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch data for all rivers in parallel (with delay to not overwhelm API)
  const fetchAllRiverData = async (riverList) => {
    const data = {};
    // Fetch first 10 rivers immediately, rest with delay
    const priorityRivers = riverList.slice(0, 10);
    const otherRivers = riverList.slice(10);
    
    // Fetch priority rivers
    await Promise.all(priorityRivers.map(async (river) => {
      try {
        const response = await fetch(`${API_URL}/api/river-details/${encodeURIComponent(river)}`);
        if (response.ok) {
          const result = await response.json();
          data[river] = result;
        }
      } catch (e) {
        // Ignore errors for individual rivers
      }
    }));
    
    setRiverData(prev => ({ ...prev, ...data }));
    
    // Fetch remaining rivers with delay
    if (otherRivers.length > 0) {
      setTimeout(async () => {
        const remainingData = {};
        for (const river of otherRivers) {
          try {
            const response = await fetch(`${API_URL}/api/river-details/${encodeURIComponent(river)}`);
            if (response.ok) {
              const result = await response.json();
              remainingData[river] = result;
            }
            // Small delay between requests
            await new Promise(r => setTimeout(r, 100));
          } catch (e) {
            // Ignore errors
          }
        }
        setRiverData(prev => ({ ...prev, ...remainingData }));
      }, 500);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRivers();
    setRefreshing(false);
  };

  // Format last updated date - just the date, no source name
  const formatLastUpdated = (reports) => {
    if (!reports || reports.length === 0) return null;
    const mostRecent = reports.reduce((latest, report) => {
      if (!report.last_updated) return latest;
      if (!latest) return report;
      return new Date(report.last_updated) > new Date(latest.last_updated) ? report : latest;
    }, null);
    return mostRecent ? formatDate(mostRecent.last_updated) : null;
  };

  const RiverListCard = ({ river }) => {
    const data = riverData[river];
    const flow = data?.usgs?.flow;
    const temp = data?.usgs?.temp;
    const reports = data?.reports;
    const lastUpdated = formatLastUpdated(reports);
    const isYnp = YNP_RIVERS.includes(river);
    const [isFav, setIsFav] = useState(globalFavorites.includes(river));
    
    const toggleFavorite = async (e) => {
      e.stopPropagation();
      
      if (isFav) {
        // Remove from favorites
        const newFavorites = globalFavorites.filter(r => r !== river);
        globalFavorites = newFavorites;
        setIsFav(false);
        await AsyncStorage.setItem('favorites', JSON.stringify(newFavorites));
      } else {
        // Check limit for free users
        if (!globalIsPremium && globalFavorites.length >= FREE_FAVORITES_LIMIT) {
          Alert.alert(
            'Free Plan Limit Reached',
            `Free users can save ${FREE_FAVORITES_LIMIT} favorite rivers.`,
            [{ text: 'OK' }]
          );
          return;
        }
        // Add to favorites
        globalFavorites.push(river);
        setIsFav(true);
        await AsyncStorage.setItem('favorites', JSON.stringify(globalFavorites));
      }
    };
    
    return (
      <TouchableOpacity 
        style={styles.newRiverCard} 
        onPress={() => navigation.navigate('Rivers', { screen: 'RiverDetails', params: { river } })} 
        activeOpacity={0.9}
      >
        {/* Card Header with River Image */}
        <ImageBackground 
          source={getRiverImage(river)} 
          style={styles.cardHeaderImage}
          imageStyle={styles.cardHeaderImageStyle}
        >
          <View style={styles.cardHeaderOverlay}>
            {/* Heart button - top right, transparent */}
            <TouchableOpacity 
              style={styles.heartButton}
              onPress={toggleFavorite}
            >
              <Ionicons 
                name={isFav ? "heart" : "heart-outline"} 
                size={24} 
                color={isFav ? '#e74c3c' : 'white'} 
              />
            </TouchableOpacity>
            
            {/* YNP badge - bottom right */}
            {isYnp && (
              <View style={styles.ynpBadgeNew}>
                <Text style={styles.ynpBadgeTextNew}>🏔️ YNP</Text>
              </View>
            )}
            
            <Text style={styles.cardHeaderTitle}>{river}</Text>
          </View>
        </ImageBackground>
        
        {/* Card Body with Flow/Temp */}
        <View style={styles.cardBody}>
          {/* Flow row */}
          <View style={styles.infoRowNew}>
            <Text style={styles.infoLabelNew}>Flow</Text>
            <Text style={styles.infoValueNew}>
              {flow && flow !== 'N/A' ? flow : data?.usgs ? 'N/A' : 'Loading...'}
            </Text>
          </View>
          
          {/* Temp row */}
          <View style={styles.infoRowNew}>
            <Text style={styles.infoLabelNew}>Temp</Text>
            <Text style={styles.infoValueNew}>
              {temp && temp !== 'N/A' ? temp : data?.usgs ? 'N/A' : 'Loading...'}
            </Text>
          </View>
          
          {lastUpdated && (
            <View style={styles.reportChips}>
              <View style={styles.reportChip}>
                <Text style={styles.reportChipText} numberOfLines={1}>
                  Updated report {lastUpdated}
                </Text>
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading Rivers...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      <DevModeBanner />
      
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline" size={14} color="#f5f1e8" />
          <Text style={styles.offlineText}>Offline Mode</Text>
        </View>
      )}
      
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTitleRow}>
            <MaterialCommunityIcons name="waves" size={26} color="#c9a227" />
            <Text style={styles.headerTitle}>Montana Fishing</Text>
            {globalIsPremium && (
              <View style={styles.premiumBadge}>
                <MaterialIcons name="diamond" size={12} color={COLORS.premiumDark} />
                <Text style={styles.premiumBadgeText}>PRO</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={COLORS.textLight} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search rivers..."
          placeholderTextColor={COLORS.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={COLORS.textLight} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredRivers}
        keyExtractor={(item) => item}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => <RiverListCard river={item} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color={COLORS.textLight} />
            <Text style={styles.emptyText}>No rivers found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

// ============================================
// REPORT CARD COMPONENT (with icon error handling)
// ============================================
function ReportCard({ report }) {
  const [iconError, setIconError] = useState(false);
  
  return (
    <TouchableOpacity style={styles.reportCard} onPress={() => openReport(report.url)} activeOpacity={0.9}>
      <View style={styles.reportContent}>
        <View style={styles.reportSourceRow}>
          {report.icon_url && !iconError ? (
            <Image 
              source={{ uri: report.icon_url }} 
              style={styles.sourceIcon} 
              resizeMode="contain"
              onError={() => setIconError(true)}
            />
          ) : (
            <View style={styles.sourceIconFallback}>
              <Text style={styles.sourceIconText}>{report.source.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <Text style={styles.reportSource} numberOfLines={1}>{report.source}</Text>
        </View>
        <Text style={styles.reportDate}>{formatDate(report.last_updated)}</Text>

      </View>
      <Ionicons name="open-outline" size={18} color={COLORS.primary} />
    </TouchableOpacity>
  );
}

// ============================================
// RIVER DETAILS SCREEN
// ============================================
function RiverDetailsScreen({ route, navigation }) {
  const { river } = route.params;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [isFavorite, setIsFavorite] = useState(globalFavorites.includes(river));
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [logRefreshKey, setLogRefreshKey] = useState(0);
  const [isPremium, setIsPremium] = useState(FORCE_FREE_MODE ? false : globalIsPremium);

  useEffect(() => { 
    loadFavorites();
    fetchRiverData();
    checkSubscription();
    setupNotifications();
    // Show interstitial ad every 3rd river view
    AdManager.showInterstitialWithFrequency('river_details', 3);
    
    // Sync premium status periodically
    const interval = setInterval(() => {
      setIsPremium(globalIsPremium);
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  
  const loadFavorites = async () => {
    try {
      const saved = await AsyncStorage.getItem('favorites');
      if (saved) {
        globalFavorites = JSON.parse(saved);
        setIsFavorite(globalFavorites.includes(river));
      }
    } catch (e) {
      console.error('Error loading favorites:', e);
    }
  };

  const checkSubscription = async () => {
    const subscribed = await isSubscribedToRiver(river);
    setIsSubscribed(subscribed);
  };

  const setupNotifications = async () => {
    try {
      const token = await registerForPushNotificationsAsync();
      setNotificationsEnabled(!!token);
      setupNotificationListeners();
    } catch (error) {
      console.log('Notifications setup skipped:', error.message);
      setNotificationsEnabled(false);
    }
  };

  const toggleNotifications = async () => {
    if (!notificationsEnabled) {
      const token = await registerForPushNotificationsAsync();
      if (!token) {
        Alert.alert('Notifications', 'Please enable notifications in settings');
        return;
      }
      setNotificationsEnabled(true);
    }
    
    if (isSubscribed) {
      await unsubscribeFromRiverNotifications(river);
      setIsSubscribed(false);
    } else {
      await subscribeToRiverNotifications(river);
      setIsSubscribed(true);
    }
  };

  const saveCatch = async (catchData) => {
    try {
      const existingStr = await AsyncStorage.getItem('fishingLog');
      const existing = existingStr ? JSON.parse(existingStr) : [];
      const newCatch = {
        ...catchData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      existing.push(newCatch);
      await AsyncStorage.setItem('fishingLog', JSON.stringify(existing));
      Alert.alert('Success', 'Catch logged!');
      setLogRefreshKey(prev => prev + 1); // Trigger refresh
      return true;
    } catch (error) {
      console.error('Save catch error:', error);
      Alert.alert('Error', 'Failed to save catch: ' + error.message);
      return false;
    }
  };

  const fetchRiverData = async () => {
    try {
      const cached = await getCachedRiverData(river);
      if (cached) { setData(cached); setLoading(false); }

      const response = await fetch(`${API_URL}/api/river-details/${encodeURIComponent(river)}`);
      if (!response.ok) throw new Error('Network failed');
      
      const result = await response.json();
      if (result.reports) result.reports = removeDuplicateReports(result.reports);
      
      setData(result);
      setIsOffline(false);
      await cacheRiverData(river, result);
    } catch (error) {
      if (!data) setIsOffline(true);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRiverData();
    setRefreshing(false);
  };

  const toggleFavorite = async () => {
    let newFavorites;
    
    // If removing favorite, always allow
    if (isFavorite) {
      newFavorites = globalFavorites.filter(r => r !== river);
      globalFavorites = newFavorites;
      setIsFavorite(false);
      AsyncStorage.setItem('favorites', JSON.stringify(newFavorites)).catch(console.error);
      return;
    }
    
    // Check if free user has hit the limit (2 favorites)
    if (!globalIsPremium && globalFavorites.length >= FREE_FAVORITES_LIMIT) {
      Alert.alert(
        'Free Plan Limit Reached',
        `Free users can save ${FREE_FAVORITES_LIMIT} favorite rivers. Upgrade for unlimited.`,
        [
          { text: 'Not Now', style: 'cancel' },
          { 
            text: 'Upgrade', 
            style: 'default',
            onPress: () => globalShowPaywall && globalShowPaywall()
          }
        ]
      );
      return;
    }
    
    // Add to favorites
    newFavorites = [...globalFavorites, river];
    globalFavorites = newFavorites;
    setIsFavorite(true);
    AsyncStorage.setItem('favorites', JSON.stringify(newFavorites)).catch(console.error);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading River Data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      <DevModeBanner />
      
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline" size={14} color="#f5f1e8" />
          <Text style={styles.offlineText}>Offline Mode</Text>
        </View>
      )}
      
      <ImageBackground source={getRiverImage(river)} style={styles.heroHeader}>
        <View style={styles.heroOverlay}>
          <View style={styles.heroNav}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.heroButton}>
              <Ionicons name="arrow-back" size={22} color="#f5f1e8" />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity onPress={toggleNotifications} style={styles.heroButton}>
                <Ionicons 
                  name={isSubscribed ? "notifications" : "notifications-outline"} 
                  size={22} 
                  color={isSubscribed ? COLORS.accent : "#f5f1e8"} 
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={toggleFavorite} style={styles.heroButton}>
                <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={22} color="#f5f1e8" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>{river}</Text>
            {data?.riverType && (
              <View style={[styles.riverTypeBadge, { backgroundColor: getRiverTypeColor(data.riverType) }]}>
                <Text style={styles.riverTypeText}>{data.riverType}</Text>
              </View>
            )}
          </View>
        </View>
      </ImageBackground>

      <ScrollView style={styles.detailScroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}>
        
        {/* FISHING REPORTS - NOW AT TOP */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Fishing Reports</Text>
          <Text style={styles.sectionCount}>{data?.reports?.length || 0} sources</Text>
        </View>

        {data?.reports?.map((report, index) => (
          <ReportCard key={report.id || index} report={report} />
        ))}

        {(!data?.reports || data.reports.length === 0) && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="fish-off" size={48} color={COLORS.textLight} />
            <Text style={styles.emptyTitle}>No reports available</Text>
            <Text style={styles.emptyText}>Check back later for updates</Text>
          </View>
        )}

        {/* CONDITIONS GRID - Weather & Flow side by side */}
        <View style={styles.conditionsGrid}>
          {data?.weather && (
            <TouchableOpacity 
              style={styles.conditionCard} 
              onPress={() => data.weather.noaaUrl && openReport(data.weather.noaaUrl)}
              activeOpacity={data.weather.noaaUrl ? 0.8 : 1}
            >
              <View style={styles.conditionIconContainer}>
                <Text style={styles.weatherEmoji}>{data.weather.icon || '☁️'}</Text>
              </View>
              <View style={styles.conditionInfo}>
                <View style={styles.conditionHeader}>
                  <Text style={styles.conditionLabel}>Weather</Text>
                  {data.weather.station && (
                    <View style={styles.sourceRow}>
                      <Text style={styles.locationText}>{data.weather.station}</Text>
                      {data.weather.noaaUrl && (
                        <Ionicons name="open-outline" size={12} color={COLORS.textLight} style={{marginLeft: 4}} />
                      )}
                    </View>
                  )}
                </View>
                <Text style={styles.conditionValue}>{data.weather.high}° / {data.weather.low}°</Text>
                <Text style={styles.conditionSubtext}>{data.weather.condition}</Text>
                {data.weather.wind && (
                  <Text style={styles.conditionSubtext}>💨 {data.weather.wind}</Text>
                )}
              </View>
              {data.weather.noaaUrl && (
                <Ionicons name="open-outline" size={16} color={COLORS.textLight} style={styles.openIcon} />
              )}
            </TouchableOpacity>
          )}

          {/* Show flow card for all rivers with USGS data, including seasonal */}
          {data?.usgs && !data.usgs.flow?.includes('No USGS') ? (
            <TouchableOpacity style={styles.conditionCard} onPress={() => data.usgs.url && openReport(data.usgs.url)}>
              <View style={[styles.conditionIconContainer, { backgroundColor: COLORS.primary + '15' }]}>
                <MaterialCommunityIcons name="waves" size={22} color={COLORS.primary} />
              </View>
              <View style={styles.conditionInfo}>
                <View style={styles.conditionHeader}>
                  <Text style={styles.conditionLabel}>Flow</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {data.usgs.location && (
                      <Text style={styles.locationText}>{data.usgs.location}</Text>
                    )}
                    {data.usgs.isSeasonal && (
                      <Text style={{ fontSize: 10, color: COLORS.textLight, marginLeft: 4 }}>(Seasonal)</Text>
                    )}
                  </View>
                </View>
                <Text style={styles.conditionValue}>{data.usgs.flow}</Text>
                <Text style={styles.conditionSubtext}>
                  Temp: {data.usgs.temp}
                  {data.usgs.tempSource && data.usgs.tempSource !== 'USGS Live' && (
                    <Text style={{ fontSize: 10, color: COLORS.textLight }}> ({data.usgs.tempSource})</Text>
                  )}
                </Text>
                {(() => {
                  const flowCondition = getFlowCondition(data.usgs.flow, river);
                  return flowCondition ? (
                    <View style={[styles.flowBadge, { backgroundColor: flowCondition.bgColor, marginTop: 6 }]}>
                      <Text style={[styles.flowBadgeText, { color: flowCondition.color }]}>
                        {flowCondition.text}
                      </Text>
                    </View>
                  ) : null;
                })()}
              </View>
              {data.usgs.url && (
                <Ionicons name="open-outline" size={16} color={COLORS.textLight} style={styles.openIcon} />
              )}
            </TouchableOpacity>
          ) : null}
        </View>

        {/* HATCH CHART - Premium for full details, free gets teaser */}
        <HatchChart 
          riverName={river} 
          isPremium={isPremium} 
          hatchData={data?.hatchData}
          onUpgrade={() => setShowPremiumModal(true)}
        />

        {/* SOLUNAR FISHING TIMES */}
        <SolunarTimes riverName={river} />

        {/* 7-DAY FLOW HISTORY - PREMIUM ONLY */}
        {river !== 'Spring Creeks' && river !== 'Yellowstone National Park' && river !== 'Slough Creek' && river !== 'Soda Butte Creek' && river !== 'Lamar River' && river !== 'Gardner River' && river !== 'Firehole River' && (
          isPremium ? (
            <FlowChart riverName={river} />
          ) : (
            <TouchableOpacity style={styles.premiumFeatureCard} onPress={() => setShowPremiumModal(true)}>
              <MaterialIcons name="show-chart" size={24} color={COLORS.premium} />
              <View style={styles.premiumFeatureText}>
                <Text style={styles.premiumFeatureTitle}>7-Day Flow History</Text>
                <Text style={styles.premiumFeatureSubtitle}>Track water levels and trends over time</Text>
              </View>
              <MaterialIcons name="lock" size={20} color={COLORS.premium} />
            </TouchableOpacity>
          )
        )}

        {/* AD BANNER */}
        <AdBanner size="banner" />

        {/* RIVER MILE CALCULATOR - PREMIUM ONLY */}
        {isPremium ? (
          <RiverMileCalculator riverName={river} />
        ) : (
          <TouchableOpacity style={styles.premiumFeatureCard} onPress={() => setShowPremiumModal(true)}>
            <MaterialIcons name="straighten" size={24} color={COLORS.premium} />
            <View style={styles.premiumFeatureText}>
              <Text style={styles.premiumFeatureTitle}>River Mile Calculator</Text>
              <Text style={styles.premiumFeatureSubtitle}>Calculate distances between access points</Text>
            </View>
            <MaterialIcons name="lock" size={20} color={COLORS.premium} />
          </TouchableOpacity>
        )}

        {/* PERSONAL FISHING LOG - PREMIUM ONLY */}
        {isPremium ? (
          <>
            <FishingLogList 
              riverName={river} 
              onAddNew={() => setShowLogModal(true)}
              refreshKey={logRefreshKey}
            />
            <FishingLogModal
              visible={showLogModal}
              onClose={() => setShowLogModal(false)}
              riverName={river}
              onSave={saveCatch}
            />
          </>
        ) : (
          <TouchableOpacity style={styles.premiumFeatureCard} onPress={() => setShowPremiumModal(true)}>
            <MaterialIcons name="format-list-bulleted" size={24} color={COLORS.premium} />
            <View style={styles.premiumFeatureText}>
              <Text style={styles.premiumFeatureTitle}>Personal Fishing Log</Text>
              <Text style={styles.premiumFeatureSubtitle}>Track your catches, flies used, and conditions</Text>
            </View>
            <MaterialIcons name="lock" size={20} color={COLORS.premium} />
          </TouchableOpacity>
        )}

        {/* REGULATIONS & SEASONS - PREMIUM ONLY */}
        {isPremium ? (
          <RegulationsInfo riverName={river} />
        ) : (
          <TouchableOpacity style={styles.premiumFeatureCard} onPress={() => setShowPremiumModal(true)}>
            <MaterialIcons name="gavel" size={24} color={COLORS.premium} />
            <View style={styles.premiumFeatureText}>
              <Text style={styles.premiumFeatureTitle}>Regulations & Seasons</Text>
              <Text style={styles.premiumFeatureSubtitle}>Detailed fishing regulations and season dates</Text>
            </View>
            <MaterialIcons name="lock" size={20} color={COLORS.premium} />
          </TouchableOpacity>
        )}
      </ScrollView>

      <Modal visible={showPremiumModal} transparent={true} animationType="slide" onRequestClose={() => setShowPremiumModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <MaterialIcons name="diamond" size={32} color={COLORS.premium} />
              <Text style={styles.modalTitle}>Go Premium</Text>
              <Text style={styles.modalSubtitle}>Unlock everything</Text>
            </View>
            <View style={styles.featuresList}>
              <View style={styles.modalFeatureItem}>
                <View style={styles.modalFeatureIcon}><MaterialCommunityIcons name="bug-outline" size={18} color={COLORS.primary} /></View>
                <Text style={styles.modalFeatureText}>Detailed hatch charts & timing</Text>
              </View>
              <View style={styles.modalFeatureItem}>
                <View style={styles.modalFeatureIcon}><MaterialCommunityIcons name="hook" size={18} color={COLORS.primary} /></View>
                <Text style={styles.modalFeatureText}>Exact fly recommendations & sizes</Text>
              </View>
              <View style={styles.modalFeatureItem}>
                <View style={styles.modalFeatureIcon}><MaterialIcons name="show-chart" size={18} color={COLORS.primary} /></View>
                <Text style={styles.modalFeatureText}>7-Day flow history & trends</Text>
              </View>
              <View style={styles.modalFeatureItem}>
                <View style={styles.modalFeatureIcon}><MaterialIcons name="straighten" size={18} color={COLORS.primary} /></View>
                <Text style={styles.modalFeatureText}>River mile calculator</Text>
              </View>
              <View style={styles.modalFeatureItem}>
                <View style={styles.modalFeatureIcon}><MaterialIcons name="format-list-bulleted" size={18} color={COLORS.primary} /></View>
                <Text style={styles.modalFeatureText}>Personal fishing log</Text>
              </View>
              <View style={styles.modalFeatureItem}>
                <View style={styles.modalFeatureIcon}><MaterialIcons name="gavel" size={18} color={COLORS.primary} /></View>
                <Text style={styles.modalFeatureText}>Detailed regulations & seasons</Text>
              </View>
              <View style={styles.modalFeatureItem}>
                <View style={styles.modalFeatureIcon}><MaterialIcons name="favorite" size={18} color={COLORS.primary} /></View>
                <Text style={styles.modalFeatureText}>Unlimited favorites (free: 2)</Text>
              </View>
              <View style={styles.modalFeatureItem}>
                <View style={styles.modalFeatureIcon}><Ionicons name="notifications" size={18} color={COLORS.primary} /></View>
                <Text style={styles.modalFeatureText}>Push notifications</Text>
              </View>
              <View style={styles.modalFeatureItem}>
                <View style={styles.modalFeatureIcon}><MaterialIcons name="block" size={18} color={COLORS.primary} /></View>
                <Text style={styles.modalFeatureText}>Ad-free experience</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.subscribeButton}><Text style={styles.subscribeButtonText}>Subscribe $4.99/mo</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setShowPremiumModal(false)}><Text style={styles.modalClose}>Maybe Later</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ============================================
// MAP SCREEN
// ============================================
function MapScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      <DevModeBanner />
      <View style={styles.mapHeader}>
        <Text style={styles.mapHeaderTitle}>Access Points</Text>
      </View>
      <RiverMap navigation={navigation} isPremium={true} />
    </SafeAreaView>
  );
}

// ============================================
// FAVORITES SCREEN
// ============================================
function FavoritesScreen({ navigation }) {
  const [favorites, setFavorites] = useState([]);
  const [isPremium, setIsPremium] = useState(globalIsPremium);
  
  useEffect(() => { 
    setFavorites(globalFavorites);
    // Refresh premium status periodically
    const interval = setInterval(() => {
      setIsPremium(globalIsPremium);
      setFavorites([...globalFavorites]);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (favorites.length === 0) {
    return (
      <SafeAreaView style={[styles.container, styles.center]} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
        <DevModeBanner />
        <View style={styles.emptyFavorites}>
          <Ionicons name="heart-outline" size={64} color={COLORS.textLight} />
          <Text style={styles.emptyTitle}>No Favorites Yet</Text>
          <Text style={styles.emptyText}>Tap the heart on any river to save it here</Text>
          {!isPremium && (
            <TouchableOpacity 
              style={styles.upgradeHintButton}
              onPress={() => globalShowPaywall && globalShowPaywall()}
            >
              <MaterialIcons name="diamond" size={16} color={COLORS.premium} />
              <Text style={styles.upgradeHintText}>Upgrade for unlimited favorites (free: 2)</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  const atLimit = !isPremium && favorites.length >= FREE_FAVORITES_LIMIT;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      <DevModeBanner />
      <View style={styles.favoritesHeader}>
        <View>
          <Text style={styles.favoritesHeaderTitle}>Your Favorites</Text>
          {!isPremium && (
            <Text style={styles.favoritesLimitText}>
              {favorites.length}/{FREE_FAVORITES_LIMIT} free limit
            </Text>
          )}
        </View>
        <Text style={styles.favoritesCount}>{favorites.length} rivers</Text>
      </View>
      
      {/* Upgrade banner for free users at limit */}
      {atLimit && (
        <TouchableOpacity 
          style={styles.upgradeBanner}
          onPress={() => globalShowPaywall && globalShowPaywall()}
        >
          <MaterialIcons name="diamond" size={20} color="#fff" />
          <Text style={styles.upgradeBannerText}>
            Free limit reached ({FREE_FAVORITES_LIMIT}). Tap to upgrade for unlimited.
          </Text>
        </TouchableOpacity>
      )}
      <FlatList
        data={favorites}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.riverCard} onPress={() => navigation.navigate('Rivers', { screen: 'RiverDetails', params: { river: item } })} activeOpacity={0.9}>
            <ImageBackground source={getRiverImage(item)} style={styles.riverCardBackground} imageStyle={styles.riverCardImage}>
              <View style={styles.riverCardOverlay}>
                <View style={styles.riverCardContent}>
                  <MaterialIcons name="favorite" size={22} color={COLORS.error} />
                  <View style={styles.riverInfo}>
                    <Text style={styles.riverName}>{item}</Text>
                    <Text style={styles.riverMeta}>Tap to view conditions</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={22} color="#c9a227" />
                </View>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

// ============================================
// PREMIUM SCREEN
// ============================================
function PremiumScreen() {
  const [isPremium, setIsPremium] = useState(globalIsPremium);
  const [showPaywall, setShowPaywall] = useState(false);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setIsPremium(globalIsPremium);
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  
  const handlePurchaseSuccess = () => {
    setIsPremium(true);
    globalIsPremium = true;
    setShowPaywall(false);
  };
  
  // If already premium, show premium status screen
  if (isPremium) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
        <DevModeBanner />
        <ScrollView contentContainerStyle={[styles.center, { padding: 32 }]}>
          <MaterialIcons name="diamond" size={80} color={COLORS.premium} />
          <Text style={[styles.premiumHeroTitle, { marginTop: 24, color: COLORS.text }]}>
            You're Premium!
          </Text>
          <Text style={{ textAlign: 'center', color: COLORS.textSecondary, marginTop: 12, lineHeight: 20 }}>
            You have access to all premium features including detailed hatch charts, fly recommendations, river mile calculator, and unlimited favorites.
          </Text>
          <View style={{ marginTop: 32, width: '100%', gap: 12 }}>
            <View style={styles.premiumFeatureRow}>
              <View style={styles.premiumFeatureIcon}><MaterialCommunityIcons name="bug-outline" size={20} color={COLORS.primary} /></View>
              <Text style={styles.premiumFeatureText}>Detailed hatch charts</Text>
            </View>
            <View style={styles.premiumFeatureRow}>
              <View style={styles.premiumFeatureIcon}><MaterialCommunityIcons name="hook" size={20} color={COLORS.primary} /></View>
              <Text style={styles.premiumFeatureText}>Exact fly recommendations</Text>
            </View>
            <View style={styles.premiumFeatureRow}>
              <View style={styles.premiumFeatureIcon}><MaterialIcons name="show-chart" size={20} color={COLORS.primary} /></View>
              <Text style={styles.premiumFeatureText}>7-Day flow history</Text>
            </View>
            <View style={styles.premiumFeatureRow}>
              <View style={styles.premiumFeatureIcon}><MaterialIcons name="straighten" size={20} color={COLORS.primary} /></View>
              <Text style={styles.premiumFeatureText}>River mile calculator</Text>
            </View>
            <View style={styles.premiumFeatureRow}>
              <View style={styles.premiumFeatureIcon}><MaterialIcons name="format-list-bulleted" size={20} color={COLORS.primary} /></View>
              <Text style={styles.premiumFeatureText}>Personal fishing log</Text>
            </View>
            <View style={styles.premiumFeatureRow}>
              <View style={styles.premiumFeatureIcon}><MaterialIcons name="favorite" size={20} color={COLORS.primary} /></View>
              <Text style={styles.premiumFeatureText}>Unlimited favorites</Text>
            </View>
            <View style={styles.premiumFeatureRow}>
              <View style={styles.premiumFeatureIcon}><Ionicons name="notifications" size={20} color={COLORS.primary} /></View>
              <Text style={styles.premiumFeatureText}>Push notifications</Text>
            </View>
            <View style={styles.premiumFeatureRow}>
              <View style={styles.premiumFeatureIcon}><MaterialIcons name="block" size={20} color={COLORS.primary} /></View>
              <Text style={styles.premiumFeatureText}>Ad-free experience</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      <DevModeBanner />
      <ScrollView contentContainerStyle={styles.premiumScroll}>
        <View style={styles.premiumHero}>
          <MaterialIcons name="diamond" size={72} color={COLORS.premium} />
          <Text style={styles.premiumHeroTitle}>Go Premium</Text>
          <Text style={styles.premiumHeroSubtitle}>Unlock the ultimate Montana fishing experience</Text>
        </View>
        
        <View style={styles.pricingSection}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 16 }}>Premium Features</Text>
          
          <View style={styles.premiumFeatureRow}>
            <View style={styles.premiumFeatureIcon}><MaterialCommunityIcons name="bug-outline" size={20} color={COLORS.primary} /></View>
            <Text style={styles.premiumFeatureText}>Detailed hatch charts & timing</Text>
          </View>
          <View style={styles.premiumFeatureRow}>
            <View style={styles.premiumFeatureIcon}><MaterialCommunityIcons name="hook" size={20} color={COLORS.primary} /></View>
            <Text style={styles.premiumFeatureText}>Exact fly recommendations & sizes</Text>
          </View>
          <View style={styles.premiumFeatureRow}>
            <View style={styles.premiumFeatureIcon}><MaterialIcons name="show-chart" size={20} color={COLORS.primary} /></View>
            <Text style={styles.premiumFeatureText}>7-Day flow history & trends</Text>
          </View>
          <View style={styles.premiumFeatureRow}>
            <View style={styles.premiumFeatureIcon}><MaterialIcons name="straighten" size={20} color={COLORS.primary} /></View>
            <Text style={styles.premiumFeatureText}>River mile calculator</Text>
          </View>
          <View style={styles.premiumFeatureRow}>
            <View style={styles.premiumFeatureIcon}><MaterialIcons name="format-list-bulleted" size={20} color={COLORS.primary} /></View>
            <Text style={styles.premiumFeatureText}>Personal fishing log</Text>
          </View>
          <View style={styles.premiumFeatureRow}>
            <View style={styles.premiumFeatureIcon}><MaterialIcons name="favorite" size={20} color={COLORS.primary} /></View>
            <Text style={styles.premiumFeatureText}>Unlimited favorites</Text>
          </View>
          <View style={styles.premiumFeatureRow}>
            <View style={styles.premiumFeatureIcon}><Ionicons name="notifications" size={20} color={COLORS.primary} /></View>
            <Text style={styles.premiumFeatureText}>Push notifications</Text>
          </View>
          <View style={styles.premiumFeatureRow}>
            <View style={styles.premiumFeatureIcon}><MaterialIcons name="block" size={20} color={COLORS.primary} /></View>
            <Text style={styles.premiumFeatureText}>Ad-free experience</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.monthlyButton, { marginTop: 24 }]} 
            onPress={() => setShowPaywall(true)}
          >
            <Text style={styles.monthlyButtonText}>View Pricing</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      <Paywall 
        visible={showPaywall} 
        onClose={() => setShowPaywall(false)}
        onPurchaseSuccess={handlePurchaseSuccess}
      />
    </SafeAreaView>
  );
}

// ============================================
// NAVIGATION SETUP
// ============================================
function RiversStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="RiversList" component={RiversScreen} />
      <Stack.Screen name="RiverDetails" component={RiverDetailsScreen} />
    </Stack.Navigator>
  );
}

// Error Boundary Component to catch and display errors
// Use hardcoded colors to avoid COLORS dependency issues
const ERROR_BG = '#f5f1e8';
const ERROR_TEXT = '#a65d57';
const ERROR_DARK = '#2c2416';
const ERROR_LIGHT = '#6b5d4d';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error:', error);
    console.error('Error Info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: ERROR_BG }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: ERROR_TEXT, marginBottom: 10 }}>
            Something went wrong
          </Text>
          <Text style={{ fontSize: 14, color: ERROR_DARK, textAlign: 'center', marginBottom: 20 }}>
            {this.state.error?.toString()}
          </Text>
          <Text style={{ fontSize: 12, color: ERROR_LIGHT, textAlign: 'center' }}>
            Check the console for more details
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [showPaywall, setShowPaywall] = useState(false);
  const [isPremium, setIsPremium] = useState(DEV_MODE);
  const [favoritesCount, setFavoritesCount] = useState(0);
  
  // Use RevenueCat hook for real premium status
  const { isPremium: revenueCatPremium, isLoading: rcLoading } = useRevenueCat();
  
  // Sync RevenueCat status with app state
  useEffect(() => {
    if (!DEV_MODE) {
      const premiumStatus = FORCE_FREE_MODE ? false : revenueCatPremium;
      setIsPremium(premiumStatus);
      globalIsPremium = premiumStatus;
    }
  }, [revenueCatPremium]);
  
  // Set up global paywall function
  useEffect(() => {
    globalShowPaywall = () => setShowPaywall(true);
    
    // Load cached favorites count
    const loadFavorites = async () => {
      try {
        const saved = await AsyncStorage.getItem('favorites');
        if (saved) {
          const parsed = JSON.parse(saved);
          globalFavorites = parsed;
          setFavoritesCount(parsed.length);
        }
      } catch (e) {
        console.error('Error loading favorites:', e);
      }
    };
    loadFavorites();
    
    // Set up interval to refresh favorites count
    const interval = setInterval(() => {
      setFavoritesCount(globalFavorites.length);
    }, 1000);
    
    return () => {
      globalShowPaywall = null;
      clearInterval(interval);
    };
  }, []);
  
  useEffect(() => {
    // Initialize RevenueCat first
    console.log('[APP] Initializing RevenueCat...');
    initializePurchases().then((success) => {
      console.log('[APP] RevenueCat init result:', success);
      if (success) {
        console.log('[APP] RevenueCat ready for purchases');
      } else {
        console.error('[APP] RevenueCat failed to initialize');
        Alert.alert('Purchase System Error', 'RevenueCat failed to initialize. Check console logs.');
      }
    }).catch(err => {
      console.error('[APP] RevenueCat init threw:', err);
      Alert.alert('Purchase System Error', err.message);
    });
    
    // Check cached premium status for faster UI
    checkCachedPremiumStatus().then(({ isPremium: cached }) => {
      if (!DEV_MODE && cached && !FORCE_FREE_MODE) {
        setIsPremium(true);
        globalIsPremium = true;
      }
    });
    
    // Initialize Google Mobile Ads SDK if available
    if (mobileAds && mobileAds.default) {
      try {
        mobileAds.default()
          .initialize()
          .then(() => console.log('Google Mobile Ads initialized'))
          .catch(err => console.log('Ad initialization error:', err));
      } catch (err) {
        console.log('Google Mobile Ads init error:', err.message);
      }
    } else {
      console.log('Google Mobile Ads not available (running in Expo Go or development)');
    }
  }, []);
  
  const handlePurchaseSuccess = () => {
    setIsPremium(true);
    globalIsPremium = true;
    setShowPaywall(false);
  };
  
  const openPaywall = () => {
    setShowPaywall(true);
  };

  return (
    <ErrorBoundary>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarIcon: ({ focused, color }) => <TabIcon name={route.name} focused={focused} color={color} />,
            tabBarActiveTintColor: COLORS.primary,
            tabBarInactiveTintColor: COLORS.textLight,
            tabBarStyle: styles.tabBar,
            tabBarLabelStyle: styles.tabLabel,
          })}
        >
          <Tab.Screen name="Rivers" component={RiversStack} />
          <Tab.Screen name="Map" component={MapScreen} />
          <Tab.Screen name="Favorites" component={FavoritesScreen} />
          <Tab.Screen name="Premium" component={PremiumScreen} />
        </Tab.Navigator>
        
        {/* RevenueCat Paywall */}
        <Paywall 
          visible={showPaywall} 
          onClose={() => setShowPaywall(false)}
          onPurchaseSuccess={handlePurchaseSuccess}
        />
      </NavigationContainer>
    </ErrorBoundary>
  );
}

// ============================================
// EARTH-TONED STYLES
// ============================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  devBanner: { backgroundColor: COLORS.secondaryDark, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 5, gap: 6 },
  devBannerText: { color: '#f5f1e8', fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
  offlineBanner: { backgroundColor: COLORS.warning, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 5, gap: 6 },
  offlineText: { color: '#2c2416', fontSize: 11, fontWeight: '600' },
  header: { backgroundColor: COLORS.primaryDark, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 },
  headerContent: { gap: 4 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#f5f1e8', flex: 1 },
  premiumBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.accent, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  premiumBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.premiumDark },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, marginHorizontal: 16, marginVertical: 12, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 15, color: COLORS.text },
  listContainer: { padding: 16, paddingTop: 4 },
  loadingText: { marginTop: 12, fontSize: 15, color: COLORS.textSecondary },
  riverCard: { marginBottom: 12, borderRadius: 14, overflow: 'hidden', elevation: 3, shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },
  riverCardBackground: { height: 110 },
  riverCardImage: { borderRadius: 14 },
  riverCardOverlay: { flex: 1, backgroundColor: 'rgba(26, 47, 39, 0.55)', justifyContent: 'center' },
  riverCardContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12 },
  riverInfo: { flex: 1 },
  riverName: { fontSize: 17, fontWeight: '700', color: '#f5f1e8' },
  riverMeta: { fontSize: 12, color: 'rgba(245, 241, 232, 0.8)', marginTop: 2 },
  ynpBadge: { backgroundColor: '#f1c40f', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  ynpBadgeText: { fontSize: 10, fontWeight: '700', color: '#2c2416' },
  heroHeader: { height: 200 },
  heroOverlay: { flex: 1, backgroundColor: 'rgba(26, 47, 39, 0.5)', justifyContent: 'space-between', padding: 16 },
  heroNav: { flexDirection: 'row', justifyContent: 'space-between' },
  heroButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(26, 47, 39, 0.5)', justifyContent: 'center', alignItems: 'center' },
  heroContent: { gap: 4 },
  heroTitle: { fontSize: 26, fontWeight: '800', color: '#f5f1e8' },
  riverTypeBadge: { 
    alignSelf: 'flex-start', 
    paddingHorizontal: 12, 
    paddingVertical: 4, 
    borderRadius: 12,
    marginTop: 6 
  },
  riverTypeText: { 
    fontSize: 12, 
    fontWeight: '700', 
    color: '#fff', 
    textTransform: 'uppercase',
    letterSpacing: 0.5 
  },
  detailScroll: { flex: 1, padding: 16 },
  conditionsGrid: { flexDirection: 'column', gap: 12, marginBottom: 16 },
  conditionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, padding: 14, borderRadius: 12, gap: 10, elevation: 2, shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3 },
  conditionIconContainer: { width: 44, height: 44, borderRadius: 10, backgroundColor: COLORS.accent + '20', justifyContent: 'center', alignItems: 'center' },
  weatherEmoji: { fontSize: 26 },

  conditionInfo: { flex: 1 },
  conditionLabel: { fontSize: 11, color: COLORS.textLight, textTransform: 'uppercase', letterSpacing: 0.5 },
  conditionValue: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginTop: 1 },
  conditionSubtext: { fontSize: 12, color: COLORS.textSecondary, marginTop: 1 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 8 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  sectionCount: { fontSize: 12, color: COLORS.textLight },
  reportCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, padding: 14, borderRadius: 10, marginBottom: 8, elevation: 1, shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  reportContent: { flex: 1, gap: 3 },
  reportSourceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sourceDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  sourceIcon: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#fff' },
  sourceIconFallback: { width: 36, height: 36, borderRadius: 8, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  sourceIconText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  reportSource: { fontSize: 14, fontWeight: '600', color: COLORS.text, flex: 1 },
  reportDate: { fontSize: 12, color: COLORS.textLight, marginLeft: 15 },
  conditionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  locationBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: COLORS.primary + '20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  locationContainer: { alignItems: 'flex-end', marginLeft: 'auto' },
  locationText: { fontSize: 11, color: COLORS.textLight, fontWeight: '500', fontStyle: 'italic' },
  sourceRow: { flexDirection: 'row', alignItems: 'center' },
  openIcon: { marginLeft: 'auto' },
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyText: { fontSize: 15, color: COLORS.textLight },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: COLORS.text },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(26, 47, 39, 0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 32 },
  modalHeader: { alignItems: 'center', marginBottom: 24, gap: 8 },
  modalTitle: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  modalSubtitle: { fontSize: 14, color: COLORS.textLight },
  featuresList: { marginBottom: 24, gap: 8 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureText: { fontSize: 15, color: COLORS.text },
  subscribeButton: { backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginBottom: 12 },
  subscribeButtonText: { color: '#f5f1e8', fontSize: 15, fontWeight: '700' },
  modalClose: { textAlign: 'center', color: COLORS.textLight, fontSize: 14 },
  mapHeader: { backgroundColor: COLORS.primaryDark, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  mapHeaderTitle: { fontSize: 17, fontWeight: '700', color: '#f5f1e8' },
  mapBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.accent, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
  mapBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.premiumDark },
  favoritesHeader: { backgroundColor: COLORS.primaryDark, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  favoritesHeaderTitle: { fontSize: 17, fontWeight: '700', color: '#f5f1e8' },
  favoritesCount: { fontSize: 12, color: 'rgba(245, 241, 232, 0.8)' },
  emptyFavorites: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  upsellContainer: { alignItems: 'center', paddingHorizontal: 32, gap: 16 },
  upsellTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  upsellButton: { backgroundColor: COLORS.premium, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 10, marginTop: 8 },
  upsellButtonText: { color: '#f5f1e8', fontSize: 15, fontWeight: '700' },
  premiumScroll: { paddingBottom: 32 },
  premiumHero: { backgroundColor: COLORS.primaryDark, alignItems: 'center', paddingVertical: 36, gap: 12 },
  premiumHeroTitle: { fontSize: 26, fontWeight: '800', color: '#f5f1e8' },
  premiumHeroSubtitle: { fontSize: 14, color: 'rgba(245, 241, 232, 0.8)', textAlign: 'center', paddingHorizontal: 32 },
  pricingSection: { paddingHorizontal: 16, gap: 12, marginTop: 24 },
  monthlyButton: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 10, alignItems: 'center' },
  monthlyButtonText: { color: '#f5f1e8', fontSize: 15, fontWeight: '700' },
  yearlyCard: { backgroundColor: COLORS.surface, paddingVertical: 20, borderRadius: 10, alignItems: 'center', borderWidth: 2, borderColor: COLORS.premium, position: 'relative' },
  yearlyBadge: { position: 'absolute', top: -10, backgroundColor: COLORS.premium, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  yearlyBadgeText: { fontSize: 10, fontWeight: '800', color: '#f5f1e8' },
  yearlyPrice: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  yearlySave: { fontSize: 13, color: COLORS.success, fontWeight: '600', marginTop: 4 },
  tabBar: { backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 8, paddingBottom: Platform.OS === 'ios' ? 24 : 12, height: Platform.OS === 'ios' ? 88 : 68 },
  tabLabel: { fontSize: 11, fontWeight: '500', marginTop: 4 },
  premiumFeatureCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, marginHorizontal: 16, marginVertical: 8, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: COLORS.premium, gap: 12 },
  premiumFeatureText: { flex: 1 },
  premiumFeatureTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  premiumFeatureSubtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  // Upgrade banner and hints
  upgradeBanner: { 
    backgroundColor: COLORS.premium, 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    gap: 10,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 10 
  },
  upgradeBannerText: { 
    flex: 1, 
    color: '#fff', 
    fontSize: 13, 
    fontWeight: '600' 
  },
  upgradeHintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.premium + '15',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    marginTop: 8
  },
  upgradeHintText: {
    color: COLORS.premium,
    fontSize: 13,
    fontWeight: '600'
  },
  favoritesLimitText: {
    fontSize: 11,
    color: 'rgba(245, 241, 232, 0.7)',
    marginTop: 2
  },
  // Premium page feature rows (professional style)
  premiumFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  premiumFeatureIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  premiumFeatureText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  // Modal feature items (inline premium modal)
  modalFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f1e8',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 6,
  },
  modalFeatureIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  modalFeatureText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text,
    flex: 1,
  },
  // New River Card Styles (Marketing Preview Design)
  newRiverCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  cardHeaderImage: {
    height: 120,
    position: 'relative',
  },
  cardHeaderImageStyle: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  cardHeaderOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 47, 39, 0.4)',
    justifyContent: 'flex-end',
    padding: 12,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  cardHeaderTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  heartButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 36,
    height: 36,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  ynpBadgeNew: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
  },
  ynpBadgeTextNew: {
    color: '#c9a227',
    fontSize: 11,
    fontWeight: '600',
  },
  cardBody: {
    padding: 16,
  },
  infoRowNew: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabelNew: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  infoValueNew: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  flowBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  flowBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  reportChips: {
    flexDirection: 'row',
    marginTop: 12,
  },
  reportChip: {
    backgroundColor: '#f5f1e8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  reportChipText: {
    fontSize: 12,
    color: COLORS.text,
  },
});

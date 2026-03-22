import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, 
  RefreshControl, StyleSheet, Linking, ActivityIndicator,
  StatusBar, ImageBackground, ScrollView, Modal,
  Alert, Platform, Dimensions, TextInput, Image, AppState
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { 
  Ionicons, MaterialCommunityIcons, FontAwesome5,
  MaterialIcons 
} from '@expo/vector-icons';
import { cacheRiverData, getCachedRiverData, clearOldCache } from './utils/offlineStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FishingLogList from './components/FishingLogList';
import FishingLogModal from './components/FishingLogModal';
import BragCard from './components/BragCard';
import SimpleLeaderboard from './components/SimpleLeaderboard';
import LeaderboardScreen from './components/LeaderboardScreen';
import RiverSelectorModal from './components/RiverSelectorModal';
import RegulationsInfo from './components/RegulationsInfo';
import RiverMileCalculator from './components/RiverMileCalculator';
import AdBanner from './components/AdBanner';
import AdManager from './components/AdManager';
import RiverInfoCard from './components/RiverInfoCard';
import TheHatchCastCard from './components/TheHatchCastCard';
import TheHatchCastFlyRecs from './components/TheHatchCastFlyRecs';
import TheHatchCastForecast from './components/TheHatchCastForecast';
import RiverReportsCard from './components/RiverReportsCard';
import LiveAnglerReportsCard from './components/LiveAnglerReportsCard';
import RiverReportModal from './components/RiverReportModal';
import ConditionsCard from './components/ConditionsCard';


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
  setupNotificationListeners,
  checkNotificationPermissions,
  requestNotificationPermissions,
  runSmartNotificationChecks,
} from './utils/notifications';
import RiverMap from './components/RiverMap';
import Paywall from './components/Paywall';
import { initializePurchases, useRevenueCat, checkCachedPremiumStatus } from './hooks/useRevenueCat';
import { isTrialActive, hasTrialStarted, startTrial, getTrialDaysRemaining, getTrialStatus } from './hooks/trialManager';
import { getRiverImage, DEFAULT_RIVER_IMAGE } from './assets/river-images/riverImages';
import { RIVER_INFO } from './data/riverInfo';
import SettingsScreen from './screens/SettingsScreen';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// YNP Rivers - show YNP badge
const YNP_RIVERS = ['Slough Creek', 'Soda Butte Creek', 'Lamar River', 'Gardner River', 'Firehole River'];

// River basins for filtering (based on major drainage systems)
const RIVER_REGIONS = {
  'All': null, // Special case - show all
  'Favorites': 'favorites', // Special case - handled separately
  'Yellowstone': ['Yellowstone River', 'Stillwater River', 'Boulder River', 'Bighorn River', 'Spring Creeks'],
  'Missouri': ['Missouri River', 'Upper Madison River', 'Lower Madison River', 'Gallatin River', 'Jefferson River', 'Beaverhead River', 'Big Hole River', 'Ruby River', 'Smith River', 'Dearborn River'],
  'Columbia': ['Clark Fork River', 'Bitterroot River', 'Blackfoot River', 'Rock Creek', 'North Fork Flathead River', 'Middle Fork Flathead River', 'South Fork Flathead River', 'Swan River'],
  'YNP': ['Slough Creek', 'Soda Butte Creek', 'Lamar River', 'Gardner River', 'Firehole River']
};

// ============================================
// DEVELOPMENT MODE
// ============================================
const DEV_MODE = false;  // Set to false for production builds

// Force free mode for testing (set to true to simulate free user)
const FORCE_FREE_MODE = false;

// API URL based on dev mode
// Use your Mac's local IP for iOS simulator (not localhost)
const API_URL = DEV_MODE 
  ? 'http://192.168.0.109:8080'  // Your Mac's current IP
  : 'https://montana-fishing-reports-production.up.railway.app';

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
const FREE_FAVORITES_LIMIT = 1;

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
const Drawer = createDrawerNavigator();

function TabIcon({ name, focused, color }) {
  const iconProps = { size: 24, color };
  switch (name) {
    case 'Rivers': return <MaterialCommunityIcons name="waves" {...iconProps} />;
    case 'Map': return <Ionicons name="map-outline" {...iconProps} />;
    case 'Favorites': return <Ionicons name={focused ? "heart" : "heart-outline"} {...iconProps} />;
    case 'Premium': return <MaterialIcons name="diamond" {...iconProps} />;
    case 'Leaderboard': return <Ionicons name="trophy" {...iconProps} />;
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
// If serverCondition is provided (from API), use that for consistency
const getFlowCondition = (flowString, riverName, serverCondition) => {
  // Use server-provided condition if available
  if (serverCondition) {
    return {
      text: serverCondition.label || serverCondition.text,
      color: serverCondition.color,
      bgColor: serverCondition.bgColor
    };
  }
  
  // Fallback to local calculation
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
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [favorites, setFavorites] = useState(globalFavorites);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showRiverSelector, setShowRiverSelector] = useState(false);

  // Sync with global favorites only on focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setFavorites([...globalFavorites]);
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => { 
    // Load cached data first for immediate display, then fetch fresh data
    loadCachedRivers();
    clearOldCache(); 
  }, []);

  // Filter rivers based on search query and selected region
  useEffect(() => {
    let filtered = rivers;
    
    // Apply region filter
    if (selectedRegion === 'Favorites') {
      filtered = rivers.filter(r => favorites.includes(r));
    } else if (selectedRegion !== 'All' && RIVER_REGIONS[selectedRegion]) {
      filtered = rivers.filter(r => RIVER_REGIONS[selectedRegion].includes(r));
    }
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(r => r.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    
    setFilteredRivers(filtered);
  }, [searchQuery, rivers, selectedRegion, favorites]);

  // Ensure these rivers always appear even if API doesn't return them
  const ESSENTIAL_RIVERS = ['Boulder River'];

  // Load cached rivers first for immediate display (even when offline)
  const loadCachedRivers = async () => {
    try {
      const cachedRivers = await getCachedRiverData('river_list');
      if (cachedRivers && cachedRivers.length > 0) {
        console.log(`[OFFLINE] Loaded ${cachedRivers.length} cached rivers`);
        setRivers(cachedRivers);
        setFilteredRivers(cachedRivers);
        
        // Load cached data for each river
        const cachedData = {};
        for (const river of cachedRivers) {
          const riverCache = await getCachedRiverData(river);
          if (riverCache) cachedData[river] = riverCache;
        }
        setRiverData(cachedData);
        setLoading(false);
      }
    } catch (error) {
      console.error('[OFFLINE] Error loading cached rivers:', error);
    } finally {
      // Always try to fetch fresh data
      fetchRivers();
    }
  };

  const fetchRivers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/rivers`, { timeout: 10000 });
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
      console.log('[OFFLINE] Failed to fetch rivers:', error.message);
      setIsOffline(true);
      // Only show fallback if we don't already have cached rivers displayed
      const currentRivers = await getCachedRiverData('river_list');
      if (!currentRivers || currentRivers.length === 0) {
        console.log('[OFFLINE] No cached data, showing essential rivers only');
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
    
    // Fetch priority rivers (river details + SmartCast)
    await Promise.all(priorityRivers.map(async (river) => {
      try {
        const [detailsRes, smartcastRes] = await Promise.all([
          fetch(`${API_URL}/api/river-details/${encodeURIComponent(river)}`),
          fetch(`${API_URL}/api/smartcast/${encodeURIComponent(river)}`)
        ]);
        
        const result = {};
        if (detailsRes.ok) {
          const details = await detailsRes.json();
          Object.assign(result, details);
        }
        if (smartcastRes.ok) {
          const smartcast = await smartcastRes.json();
          result.smartcast = smartcast.smartcast;
        }
        
        if (Object.keys(result).length > 0) {
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
            const [detailsRes, smartcastRes] = await Promise.all([
              fetch(`${API_URL}/api/river-details/${encodeURIComponent(river)}`),
              fetch(`${API_URL}/api/smartcast/${encodeURIComponent(river)}`)
            ]);
            
            const result = {};
            if (detailsRes.ok) {
              const details = await detailsRes.json();
              Object.assign(result, details);
            }
            if (smartcastRes.ok) {
              const smartcast = await smartcastRes.json();
              result.smartcast = smartcast.smartcast;
            }
            
            if (Object.keys(result).length > 0) {
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
    const smartcast = data?.smartcast;
    const isYnp = YNP_RIVERS.includes(river);
    const isSeasonal = RIVER_INFO[river]?.seasonalGauge || false;
    const [isFav, setIsFav] = useState(globalFavorites.includes(river));
    
    // Sync with global favorites
    useEffect(() => {
      const interval = setInterval(() => {
        setIsFav(globalFavorites.includes(river));
      }, 500);
      return () => clearInterval(interval);
    }, [river]);
    
    // Get SmartCast score color
    const getSmartCastColor = (score) => {
      if (!score) return '#9a8b7a';
      if (score >= 76) return '#2d8659';
      if (score >= 51) return '#5a7d5a';
      if (score >= 26) return '#d4a574';
      return '#a65d57';
    };
    
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
              {flow && flow !== 'N/A' ? flow : isSeasonal ? 'Seasonal' : data?.usgs ? 'N/A' : 'Loading...'}
            </Text>
          </View>
          
          {/* Temp row */}
          <View style={styles.infoRowNew}>
            <Text style={styles.infoLabelNew}>Temp</Text>
            <Text style={styles.infoValueNew}>
              {temp && temp !== 'N/A' ? temp : data?.usgs ? 'N/A' : 'Loading...'}
            </Text>
          </View>
          
          {/* SmartCast Score */}
          <View style={[styles.smartCastRow, { 
            backgroundColor: smartcast ? getSmartCastColor(smartcast.score) + '15' : '#f5f1e8',
            borderColor: smartcast ? getSmartCastColor(smartcast.score) : '#e8e4da'
          }]}>
            <MaterialCommunityIcons 
              name="radar" 
              size={16} 
              color={smartcast ? getSmartCastColor(smartcast.score) : '#9a8b7a'} 
            />
            <Text style={[styles.smartCastLabel, { 
              color: smartcast ? getSmartCastColor(smartcast.score) : '#9a8b7a' 
            }]}>
              HatchCast
            </Text>
            <Text style={[styles.smartCastScore, { 
              color: smartcast ? getSmartCastColor(smartcast.score) : '#9a8b7a' 
            }]}>
              {smartcast ? `${smartcast.score}/100 ${smartcast.quality?.label || ''}` : 'Loading...'}
            </Text>
          </View>
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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
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
            {/* Menu Button */}
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => navigation.openDrawer()}
            >
              <MaterialCommunityIcons name="waves" size={26} color="#c9a227" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Montana Fishing</Text>
            {/* Add Catch Button */}
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => setShowRiverSelector(true)}
            >
              <Ionicons name="add" size={26} color="#c9a227" />
            </TouchableOpacity>
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

      {/* Region Filter Tabs */}
      <View style={styles.regionTabsContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.regionTabsContent}
        >
          {Object.keys(RIVER_REGIONS).map((region) => (
            <TouchableOpacity
              key={region}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 20,
                backgroundColor: selectedRegion === region ? COLORS.primary : '#faf8f3',
                borderWidth: 1,
                borderColor: COLORS.border,
                marginRight: 8,
              }}
              onPress={() => setSelectedRegion(region)}
              activeOpacity={0.7}
            >
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: selectedRegion === region ? '#f5f1e8' : COLORS.textSecondary,
              }}>
                {region}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={{ marginTop: 8 }}>
        <FlatList
          data={filteredRivers}
          keyExtractor={(item) => item}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
          contentContainerStyle={[styles.listContainer, { paddingBottom: 150 }]}
          renderItem={({ item }) => <RiverListCard river={item} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color={COLORS.textLight} />
            <Text style={styles.emptyText}>No rivers found</Text>
          </View>
        }
      />
      </View>
      
      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <SimpleLeaderboard
          onClose={() => setShowLeaderboard(false)}
        />
      )}
      
      {/* River Selector Modal */}
      <RiverSelectorModal
        visible={showRiverSelector}
        onClose={() => setShowRiverSelector(false)}
        onSelectRiver={(river) => {
          setShowRiverSelector(false);
          navigation.navigate('RiverDetails', { 
            river: river,
            showLogModal: true 
          });
        }}
      />
    </View>
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
  const [editingCatch, setEditingCatch] = useState(null);
  const [shareCatchData, setShareCatchData] = useState(null);
  const [showBragCard, setShowBragCard] = useState(false);
  const [pendingLogLocation, setPendingLogLocation] = useState(null);

  // Auto-open log modal if requested from navigation
  useEffect(() => {
    if (route.params?.showLogModal) {
      setShowLogModal(true);
      // Clear the param so it doesn't reopen on refresh
      navigation.setParams({ showLogModal: undefined });
    }
  }, [route.params?.showLogModal]);

  // Handle location selected from map
  useEffect(() => {
    if (route.params?.selectedLocation) {
      setPendingLogLocation(route.params.selectedLocation);
      setShowLogModal(true);
      // Clear the param so it doesn't reopen on refresh
      navigation.setParams({ selectedLocation: undefined });
    }
  }, [route.params?.selectedLocation]);

  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const [isPremium, setIsPremium] = useState(FORCE_FREE_MODE ? false : globalIsPremium);
  const [smartcastData, setSmartcastData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [userReports, setUserReports] = useState([]);
  const [userReportCount, setUserReportCount] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);


  const fetchSmartCastData = async () => {
    try {
      const [smartcastRes, forecastRes] = await Promise.all([
        fetch(`${API_URL}/api/smartcast/${encodeURIComponent(river)}?_t=${Date.now()}`, {
          headers: { 'Cache-Control': 'no-cache' }
        }),
        fetch(`${API_URL}/api/hatchcast/forecast/${encodeURIComponent(river)}?_t=${Date.now()}`, {
          headers: { 'Cache-Control': 'no-cache' }
        })
      ]);
      
      if (smartcastRes.ok) {
        const result = await smartcastRes.json();
        setSmartcastData(result);  // Pass full result with conditions, hatches, solunar
      }
      
      if (forecastRes.ok) {
        const forecast = await forecastRes.json();
        setForecastData(forecast);
      }
    } catch (e) {
      console.log('SmartCast error:', e);
    }
  };

  useEffect(() => { 
    loadFavorites();
    fetchRiverData();
    fetchSmartCastData();
    checkSubscription();
    setupNotifications();
    // Show interstitial ad every 3rd river view
    AdManager.showInterstitialWithFrequency('river_details', 3);
    
    // Sync premium status periodically
    const interval = setInterval(() => {
      setIsPremium(globalIsPremium);
    }, 1000);
    
    // Refresh subscription status when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      checkSubscription();
    });
    
    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [navigation]);
  
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
      // Check permissions separately from token
      const hasPermission = await checkNotificationPermissions();
      setNotificationsEnabled(hasPermission);
      
      // Try to get token if on physical device
      const token = await registerForPushNotificationsAsync();
      if (token) {
        setNotificationsEnabled(true);
      }
      
      setupNotificationListeners();
    } catch (error) {
      console.log('Notifications setup skipped:', error.message);
      // Don't disable UI just because we can't get a token (simulator case)
      const hasPermission = await checkNotificationPermissions();
      setNotificationsEnabled(hasPermission);
    }
  };

  const toggleNotifications = async () => {
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
            onPress: () => setShowPremiumModal(true)
          }
        ]
      );
      return;
    }
    
    // Check/request permissions first
    let hasPermission = await checkNotificationPermissions();
    
    if (!hasPermission) {
      hasPermission = await requestNotificationPermissions();
    }
    
    if (!hasPermission) {
      Alert.alert(
        'Notifications Disabled',
        'Please enable notifications in your device settings to receive fishing alerts.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() }
        ]
      );
      return;
    }
    
    setNotificationsEnabled(true);
    
    // Try to get token (for physical devices)
    const token = await registerForPushNotificationsAsync();
    
    if (isSubscribed) {
      await unsubscribeFromRiverNotifications(river);
      setIsSubscribed(false);
    } else {
      await subscribeToRiverNotifications(river);
      setIsSubscribed(true);
    }
  };

  const saveCatch = async (catchData, isEdit = false) => {
    try {
      // Save locally first
      const existingStr = await AsyncStorage.getItem('fishingLog');
      const existing = existingStr ? JSON.parse(existingStr) : [];
      
      if (isEdit && catchData.id) {
        // Update existing catch
        const index = existing.findIndex(c => c.id === catchData.id);
        if (index !== -1) {
          existing[index] = { ...catchData };
        } else {
          // If not found, add as new (shouldn't happen)
          existing.push(catchData);
        }
      } else {
        // New catch
        const newCatch = {
          ...catchData,
          id: catchData.id || Date.now().toString(),
          createdAt: catchData.createdAt || new Date().toISOString(),
        };
        existing.push(newCatch);
      }
      
      await AsyncStorage.setItem('fishingLog', JSON.stringify(existing));
      
      // Sync to backend for data aggregation (helps improve fly recommendations)
      try {
        await fetch(`${API_URL}/api/fishing-log/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            river: catchData.river,
            date: catchData.date,
            species: catchData.species,
            length: catchData.length,
            fly: catchData.fly,
            notes: catchData.notes,
            location: catchData.location
          })
        });
        console.log('[FishingLog] Synced to backend for analysis');
      } catch (syncError) {
        // Don't fail if sync fails - data is saved locally
        console.log('[FishingLog] Local save successful, backend sync failed:', syncError.message);
      }
      
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
      // Only use cache if it has weather data (old cache might be missing it)
      if (cached && cached.weather) { 
        setData(cached); 
        setLoading(false); 
      }

      const response = await fetch(`${API_URL}/api/river-details/${encodeURIComponent(river)}`);
      if (!response.ok) throw new Error('Network failed');
      
      const result = await response.json();
      if (result.reports) result.reports = removeDuplicateReports(result.reports);
      
      setData(result);
      setIsOffline(false);
      
      // Extract user reports if available
      if (result.userReports) {
        setUserReports(result.userReports.recent || []);
        setUserReportCount(result.userReports.count || 0);
      }
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
    await fetchSmartCastData();
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
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <DevModeBanner />
        {/* THE HATCHCAST - SHOW EVEN DURING LOADING */}
        <TheHatchCastCard data={smartcastData} riverName={river} />
        <TheHatchCastFlyRecs data={smartcastData} riverName={river} />
        <TheHatchCastForecast data={forecastData} riverName={river} />
        <View style={[styles.container, styles.center]}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading River Data...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <DevModeBanner />
      
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline" size={14} color="#f5f1e8" />
          <Text style={styles.offlineText}>Offline Mode</Text>
        </View>
      )}
      
      <ImageBackground 
        source={getRiverImage(river)} 
        style={styles.heroHeader}
        onError={(e) => console.error(`[IMAGE ERROR] Failed to load hero image for ${river}:`, e.nativeEvent.error)}
      >
        <View style={styles.heroOverlay}>
          <View style={styles.heroNav}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()} 
              style={styles.heroButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={22} color="#f5f1e8" />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {/* Notifications - Premium Only */}
              <TouchableOpacity 
                onPress={toggleNotifications} 
                style={styles.heroButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons 
                  name={isSubscribed ? "notifications" : "notifications-outline"} 
                  size={22} 
                  color={isSubscribed ? COLORS.accent : isPremium ? "#f5f1e8" : "#f5f1e899"} 
                />
                {!isPremium && (
                  <View style={styles.lockIconSmall}>
                    <MaterialIcons name="lock" size={8} color={COLORS.accent} />
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={toggleFavorite} 
                style={styles.heroButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
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
        
        {/* THE HATCHCAST - PREMIUM ONLY */}
        {isPremium ? (
          <>
            <TheHatchCastCard data={smartcastData} riverName={river} />
            <TheHatchCastFlyRecs data={smartcastData} riverName={river} />
            <TheHatchCastForecast data={forecastData} riverName={river} />
          </>
        ) : (
          <TouchableOpacity style={styles.premiumFeatureCard} onPress={() => setShowPremiumModal(true)}>
            <MaterialIcons name="psychology" size={24} color={COLORS.premium} />
            <View style={styles.premiumFeatureText}>
              <Text style={styles.premiumFeatureTitle}>The HatchCast</Text>
              <Text style={styles.premiumFeatureSubtitle}>AI-powered hatch predictions, fly recommendations & 5-day forecast</Text>
            </View>
            <MaterialIcons name="lock" size={20} color={COLORS.premium} />
          </TouchableOpacity>
        )}

        {/* SHOP REPORTS - FREE */}
        <RiverReportsCard reports={data?.reports} />

        {/* RIVER CONDITIONS - Weather, Flow, Solunar Combined - FREE */}
        <ConditionsCard 
          weather={data?.weather}
          usgs={data?.usgs}
          solunar={smartcastData?.solunar}
          riverName={river}
          isPremium={isPremium}
        />

        {/* 7-DAY FLOW CHART - Premium Only */}


        {/* AD BANNER */}
        <AdBanner size="banner" />

        {/* RIVER MILE CALCULATOR - PREMIUM ONLY (Not shown for Spring Creeks or YNP rivers) */}
        {!['Spring Creeks', 'Slough Creek', 'Soda Butte Creek', 'Lamar River', 'Gardner River', 'Firehole River'].includes(river) && (
          isPremium ? (
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
          )
        )}

        {/* PERSONAL FISHING LOG - FREE */}
        <FishingLogList 
          riverName={river} 
          onAddNew={() => {
            setEditingCatch(null);
            setShowLogModal(true);
          }}
          refreshKey={logRefreshKey}
          onShowLeaderboard={() => setShowLeaderboard(true)}
          onEditCatch={(catchItem) => {
            setEditingCatch(catchItem);
            setShowLogModal(true);
          }}
          onShareCatch={(catchItem) => {
            setShareCatchData(catchItem);
            setShowBragCard(true);
          }}
        />
        <FishingLogModal
          visible={showLogModal}
          onClose={() => {
            setShowLogModal(false);
            setEditingCatch(null);
            setPendingLogLocation(null);
          }}
          riverName={river}
          onSave={saveCatch}
          existingCatch={editingCatch}
          initialLocation={pendingLogLocation}
          onRequestMapLocation={() => {
            navigation.navigate('Map', { 
              selectingLocation: true, 
              returnScreen: 'RiverDetails',
              returnParams: { river }
            });
          }}
        />
        
        {/* Brag Card for Sharing */}
        {showBragCard && shareCatchData && (
          <BragCard
            catchData={shareCatchData}
            onClose={() => {
              setShowBragCard(false);
              setShareCatchData(null);
            }}
            onShareComplete={() => {
              setShowBragCard(false);
              setShareCatchData(null);
            }}
          />
        )}
        
        {/* Leaderboard Modal */}
        {showLeaderboard && (
          <SimpleLeaderboard
            currentRiver={river}
            onClose={() => setShowLeaderboard(false)}
          />
        )}

        {/* LIVE ANGLER REPORTS - FREE */}
        <LiveAnglerReportsCard 
          reports={userReports}
          count={userReportCount}
          riverName={river}
          onSubmitReport={() => setShowReportModal(true)}
        />

        {/* RIVER INFORMATION */}
        <RiverInfoCard riverName={river} />

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
      
      {/* River Report Modal */}
      <RiverReportModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        riverName={river}
      />
    </View>
  );
}

// ============================================
// MAP SCREEN
// ============================================
function MapScreen({ navigation, route }) {
  const [showLogModal, setShowLogModal] = useState(false);
  const [logModalRiver, setLogModalRiver] = useState(null);
  const [logModalLocation, setLogModalLocation] = useState(null);
  const [logRefreshKey, setLogRefreshKey] = useState(0);
  const [editingCatch, setEditingCatch] = useState(null);
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isPremium, setIsPremium] = useState(globalIsPremium);
  
  // Refresh premium status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setIsPremium(globalIsPremium);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Check if we're in location selection mode
  useEffect(() => {
    if (route.params?.selectingLocation) {
      setIsSelectingLocation(true);
      setSelectedLocation(null);
    }
  }, [route.params?.selectingLocation]);

  const handleLogCatchFromMap = ({ river, coordinate }) => {
    setEditingCatch(null);
    setLogModalRiver(river);
    setLogModalLocation(coordinate);
    setShowLogModal(true);
  };

  const handleMapPress = (coordinate) => {
    if (isSelectingLocation) {
      setSelectedLocation(coordinate);
    }
  };

  const confirmLocationSelection = () => {
    if (selectedLocation && route.params?.returnScreen) {
      const { returnScreen, returnParams } = route.params;
      setIsSelectingLocation(false);
      setSelectedLocation(null);
      // Navigate back with the selected location
      navigation.navigate(returnScreen, {
        ...returnParams,
        selectedLocation: {
          ...selectedLocation,
          type: 'map'
        }
      });
    }
  };

  const cancelLocationSelection = () => {
    setIsSelectingLocation(false);
    setSelectedLocation(null);
    navigation.setParams({ selectingLocation: false });
  };

  const saveCatchFromMap = async (catchData, isEdit = false) => {
    try {
      const existingStr = await AsyncStorage.getItem('fishingLog');
      const existing = existingStr ? JSON.parse(existingStr) : [];
      
      if (isEdit && catchData.id) {
        // Update existing catch
        const index = existing.findIndex(c => c.id === catchData.id);
        if (index !== -1) {
          existing[index] = { ...catchData };
        } else {
          existing.push(catchData);
        }
      } else {
        // New catch
        const newCatch = {
          ...catchData,
          id: catchData.id || Date.now().toString(),
          createdAt: catchData.createdAt || new Date().toISOString(),
        };
        existing.push(newCatch);
      }
      
      await AsyncStorage.setItem('fishingLog', JSON.stringify(existing));
      
      setLogRefreshKey(prev => prev + 1);
      
      Alert.alert('Success', 'Catch logged successfully!');
      return true;
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save catch. Please try again.');
      return false;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <DevModeBanner />
      <View style={styles.mapHeader}>
        <Text style={styles.mapHeaderTitle}>
          {isSelectingLocation ? 'Tap to Select Location' : 'Access Points'}
        </Text>
        {isSelectingLocation && (
          <TouchableOpacity 
            style={styles.cancelSelectionButton}
            onPress={cancelLocationSelection}
          >
            <Text style={styles.cancelSelectionText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
      <RiverMap 
        navigation={navigation} 
        isPremium={isPremium}
        onLogCatch={handleLogCatchFromMap}
        onMapPress={isSelectingLocation ? handleMapPress : null}
        selectionMarker={selectedLocation}
      />
      
      {/* Location Selection Confirmation */}
      {isSelectingLocation && selectedLocation && (
        <View style={styles.selectionOverlay}>
          <View style={styles.selectionCard}>
            <Text style={styles.selectionText}>
              {selectedLocation.latitude.toFixed(5)}, {selectedLocation.longitude.toFixed(5)}
            </Text>
            <TouchableOpacity 
              style={styles.confirmSelectionButton}
              onPress={confirmLocationSelection}
            >
              <Text style={styles.confirmSelectionText}>Confirm Location</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {/* Log Modal for Map Screen */}
      {showLogModal && logModalRiver && (
        <FishingLogModal
          visible={showLogModal}
          onClose={() => {
            setShowLogModal(false);
            setLogModalRiver(null);
            setLogModalLocation(null);
            setEditingCatch(null);
          }}
          riverName={logModalRiver}
          onSave={saveCatchFromMap}
          initialLocation={logModalLocation}
          existingCatch={editingCatch}
        />
      )}
    </View>
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
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <DevModeBanner />
        <View style={styles.favoritesHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialCommunityIcons name="fish" size={26} color="#f5f1e8" />
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#f5f1e8', marginLeft: 8, letterSpacing: 1 }}>MFR</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.favoritesHeaderTitle}>Your Favorites</Text>
            <Text style={styles.favoritesCount}>0 rivers</Text>
          </View>
        </View>
        <View style={[styles.emptyFavorites, { flex: 1, justifyContent: 'center' }]}>
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
      </View>
    );
  }

  const atLimit = !isPremium && favorites.length >= FREE_FAVORITES_LIMIT;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <DevModeBanner />
      <View style={styles.favoritesHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialCommunityIcons name="fish" size={26} color="#f5f1e8" />
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#f5f1e8', marginLeft: 8, letterSpacing: 1 }}>MFR</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.favoritesHeaderTitle}>Your Favorites</Text>
          {!isPremium && (
            <Text style={styles.favoritesLimitText}>
              {favorites.length}/{FREE_FAVORITES_LIMIT} free limit
            </Text>
          )}
          {isPremium && (
            <Text style={styles.favoritesCount}>{favorites.length} rivers</Text>
          )}
        </View>
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
            <ImageBackground 
              source={getRiverImage(item)} 
              style={styles.riverCardBackground} 
              imageStyle={styles.riverCardImage}
              onError={(e) => console.error(`[IMAGE ERROR] Failed to load card image for ${item}:`, e.nativeEvent.error)}
            >
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
    </View>
  );
}

// ============================================
// PREMIUM SCREEN
// ============================================
function PremiumScreen() {
  const [isPremium, setIsPremium] = useState(globalIsPremium);
  const [showPaywall, setShowPaywall] = useState(false);
  const [trialStatus, setTrialStatus] = useState(null);
  const [isPaidSubscriber, setIsPaidSubscriber] = useState(false);
  const [hasPromoCode, setHasPromoCode] = useState(false);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setIsPremium(globalIsPremium);
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  
  // Load trial status and check if paid subscriber
  useEffect(() => {
    const loadStatus = async () => {
      const status = await getTrialStatus();
      setTrialStatus(status);
      
      // Check if user has active RevenueCat subscription
      const { isPremium: rcPremium } = await checkCachedPremiumStatus();
      setIsPaidSubscriber(rcPremium);
      
      // Check if user unlocked via promo code
      const premiumSource = await AsyncStorage.getItem('premiumSource');
      setHasPromoCode(premiumSource === 'friend');
    };
    loadStatus();
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
        <ScrollView 
          style={{ flex: 1 }} 
          contentContainerStyle={{ padding: 32, paddingTop: 20, paddingBottom: 100 }}
        >
          {/* Header: MFR left, Diamond right */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialCommunityIcons name="fish" size={26} color={COLORS.primary} />
              <Text style={{ fontSize: 18, fontWeight: '800', color: COLORS.primary, marginLeft: 8, letterSpacing: 1 }}>MFR</Text>
            </View>
            <MaterialIcons name="diamond" size={40} color={COLORS.premium} />
          </View>
          
          <Text style={[styles.premiumHeroTitle, { color: COLORS.text }]}>
            You're Premium!
          </Text>
          
          {/* Status Banner - Shows trial, paid, or promo status */}
          {isPaidSubscriber ? (
            // Paid subscriber - show thank you message
            <View style={{ backgroundColor: COLORS.success + '20', borderRadius: 12, padding: 16, marginTop: 16, borderWidth: 1, borderColor: COLORS.success }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialIcons name="check-circle" size={24} color={COLORS.success} />
                <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.success, marginLeft: 8 }}>
                  Active Subscriber
                </Text>
              </View>
              <Text style={{ fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginTop: 6 }}>
                Thank you for supporting Montana Fishing Reports!
              </Text>
            </View>
          ) : hasPromoCode ? (
            // Promo code user
            <View style={{ backgroundColor: COLORS.accent + '20', borderRadius: 12, padding: 16, marginTop: 16, borderWidth: 1, borderColor: COLORS.accent }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialIcons name="card-giftcard" size={24} color={COLORS.accent} />
                <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.accent, marginLeft: 8 }}>
                  Premium Access Unlocked
                </Text>
              </View>
              <Text style={{ fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginTop: 6 }}>
                Enjoy your complimentary premium access
              </Text>
            </View>
          ) : trialStatus?.isActive ? (
            // Trial user - show days remaining and subscribe button
            <View style={{ backgroundColor: COLORS.premium + '20', borderRadius: 12, padding: 16, marginTop: 16, borderWidth: 1, borderColor: COLORS.premium }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialIcons name="schedule" size={24} color={COLORS.premium} />
                <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.premium, marginLeft: 8 }}>
                  {trialStatus.daysRemaining} days left in trial
                </Text>
              </View>
              <Text style={{ fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginTop: 6 }}>
                Subscribe now to keep premium access
              </Text>
              
              {/* Subscribe Now Button for Trial Users */}
              <TouchableOpacity 
                style={{ backgroundColor: COLORS.premium, paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 12 }}
                onPress={() => setShowPaywall(true)}
              >
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>
                  Subscribe Now
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
          
          {/* HatchCast Feature - Main Selling Point */}
          <View style={{ marginTop: 24, backgroundColor: COLORS.primary + '15', borderRadius: 16, padding: 20, borderWidth: 2, borderColor: COLORS.primary + '30' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <MaterialCommunityIcons name="bug-outline" size={32} color={COLORS.primary} />
              <Text style={{ fontSize: 22, fontWeight: '800', color: COLORS.primary, marginLeft: 12 }}>
                The HatchCast
              </Text>
            </View>
            <Text style={{ fontSize: 14, color: COLORS.text, lineHeight: 22, marginBottom: 12 }}>
              Our flagship feature! Real-time hatch predictions, exact fly recommendations, and optimal fishing times based on weather, flow data, and historical patterns.
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <View style={{ backgroundColor: COLORS.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>Hatch Predictions</Text>
              </View>
              <View style={{ backgroundColor: COLORS.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>Fly Recommendations</Text>
              </View>
              <View style={{ backgroundColor: COLORS.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>7-Day Forecast</Text>
              </View>
            </View>
          </View>

          <Text style={{ textAlign: 'center', color: COLORS.textSecondary, marginTop: 24, marginBottom: 16, fontSize: 14 }}>
            Plus all these premium features:
          </Text>

          <View style={{ width: '100%', gap: 10 }}>
            <View style={styles.premiumFeatureRow}>
              <View style={styles.premiumFeatureIcon}><MaterialIcons name="format-list-bulleted" size={20} color={COLORS.primary} /></View>
              <Text style={styles.premiumFeatureText}>Personal fishing log</Text>
            </View>
            <View style={styles.premiumFeatureRow}>
              <View style={styles.premiumFeatureIcon}><MaterialIcons name="location-pin" size={20} color={COLORS.primary} /></View>
              <Text style={styles.premiumFeatureText}>Personal pins on map</Text>
            </View>
            <View style={styles.premiumFeatureRow}>
              <View style={styles.premiumFeatureIcon}><MaterialIcons name="favorite" size={20} color={COLORS.primary} /></View>
              <Text style={styles.premiumFeatureText}>Unlimited favorites</Text>
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
              <View style={styles.premiumFeatureIcon}><Ionicons name="notifications" size={20} color={COLORS.primary} /></View>
              <Text style={styles.premiumFeatureText}>Push notifications</Text>
            </View>
            <View style={styles.premiumFeatureRow}>
              <View style={styles.premiumFeatureIcon}><MaterialIcons name="block" size={20} color={COLORS.primary} /></View>
              <Text style={styles.premiumFeatureText}>Ad-free experience</Text>
            </View>
          </View>
          
          {/* MFR Footer */}
          <View style={{ alignItems: 'center', marginTop: 40, paddingTop: 24, borderTopWidth: 2, borderTopColor: COLORS.primary + '30' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialCommunityIcons name="fish" size={22} color={COLORS.primary} />
              <Text style={{ fontSize: 16, fontWeight: '800', color: COLORS.primary, marginLeft: 8, letterSpacing: 1 }}>MFR</Text>
            </View>
            <Text style={{ fontSize: 12, color: COLORS.textLight, marginTop: 6 }}>Montana Fishing Reports</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
              <MaterialIcons name="diamond" size={14} color={COLORS.premium} />
              <Text style={{ fontSize: 11, color: COLORS.accent, marginLeft: 4, fontWeight: '700' }}>Premium Member</Text>
            </View>
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
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      <DevModeBanner />
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={[styles.premiumScroll, { paddingTop: 8, paddingBottom: 100 }]}
      >
        {/* Header with MFR Branding */}
        <View style={{ backgroundColor: COLORS.primary, paddingVertical: 22, paddingHorizontal: 20 }}>
          {/* Top row: MFR left, Diamond right */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialCommunityIcons name="fish" size={28} color={COLORS.accent} />
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#fff', marginLeft: 8, letterSpacing: 2 }}>MFR</Text>
            </View>
            <MaterialIcons name="diamond" size={36} color={COLORS.premium} />
          </View>
          
          {/* Title */}
          <Text style={{ fontSize: 32, fontWeight: '800', color: '#fff' }}>Go Premium</Text>
          <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', marginTop: 8 }}>Unlock the ultimate Montana fishing experience</Text>
          
          {/* Free Trial Badge */}
          <View style={{ backgroundColor: COLORS.premium, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginTop: 16, alignSelf: 'flex-start' }}>
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>
              🎉 10-Day Free Trial
            </Text>
          </View>
        </View>
        
        {/* HatchCast Hero Feature */}
        <View style={{ backgroundColor: COLORS.primary, marginHorizontal: 16, marginTop: 8, borderRadius: 20, padding: 24, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 10, marginRight: 14 }}>
              <MaterialCommunityIcons name="bug-outline" size={36} color={COLORS.primary} />
            </View>
            <View>
              <Text style={{ fontSize: 24, fontWeight: '800', color: '#fff' }}>
                The HatchCast
              </Text>
              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>
                Our #1 Feature
              </Text>
            </View>
          </View>
          <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.95)', lineHeight: 24, marginBottom: 16 }}>
            Know exactly what's hatching, when, and what fly to use. Our intelligent system combines real-time weather, flow data, and historical patterns to predict the best fishing opportunities.
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>🦟 Real-time Hatch Predictions</Text>
            </View>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>🎣 Exact Fly Recommendations</Text>
            </View>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>📊 7-Day Fishing Forecast</Text>
            </View>
          </View>
        </View>

        <View style={styles.pricingSection}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 16 }}>Also Included:</Text>
          
          <View style={styles.premiumFeatureRow}>
            <View style={styles.premiumFeatureIcon}><MaterialIcons name="format-list-bulleted" size={20} color={COLORS.primary} /></View>
            <Text style={styles.premiumFeatureText}>Personal fishing log</Text>
          </View>
          <View style={styles.premiumFeatureRow}>
            <View style={styles.premiumFeatureIcon}><MaterialIcons name="location-pin" size={20} color={COLORS.primary} /></View>
            <Text style={styles.premiumFeatureText}>Personal pins on map</Text>
          </View>
          <View style={styles.premiumFeatureRow}>
            <View style={styles.premiumFeatureIcon}><MaterialIcons name="favorite" size={20} color={COLORS.primary} /></View>
            <Text style={styles.premiumFeatureText}>Unlimited favorites</Text>
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
            <View style={styles.premiumFeatureIcon}><Ionicons name="notifications" size={20} color={COLORS.primary} /></View>
            <Text style={styles.premiumFeatureText}>Push notifications</Text>
          </View>
          <View style={styles.premiumFeatureRow}>
            <View style={styles.premiumFeatureIcon}><MaterialIcons name="block" size={20} color={COLORS.primary} /></View>
            <Text style={styles.premiumFeatureText}>Ad-free experience</Text>
          </View>
          
          <View style={{ marginTop: 24, paddingTop: 24, borderTopWidth: 1, borderTopColor: '#e8e4da' }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 12 }}>Free Version Includes:</Text>
            <View style={{ gap: 8 }}>
              <Text style={styles.freeFeatureText}>• River conditions & flow data</Text>
              <Text style={styles.freeFeatureText}>• Fly shop reports</Text>
              <Text style={styles.freeFeatureText}>• River overview & access points</Text>
              <Text style={styles.freeFeatureText}>• Interactive maps (no pins)</Text>
              <Text style={styles.freeFeatureText}>• 2 favorite rivers</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={{ backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 24, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 5 }} 
            onPress={() => setShowPaywall(true)}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>Upgrade to Premium</Text>
          </TouchableOpacity>
          
          {/* MFR Footer */}
          <View style={{ alignItems: 'center', marginTop: 32, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialCommunityIcons name="fish" size={20} color={COLORS.primary} />
              <Text style={{ fontSize: 14, fontWeight: '800', color: COLORS.primary, marginLeft: 6, letterSpacing: 1 }}>MFR</Text>
            </View>
            <Text style={{ fontSize: 11, color: COLORS.textLight, marginTop: 4 }}>Montana Fishing Reports</Text>
          </View>
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

// Custom Drawer Content
function CustomDrawerContent({ navigation, state }) {
  const [isPremium, setIsPremium] = useState(globalIsPremium);
  const [favoritesCount, setFavoritesCount] = useState(globalFavorites.length);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setIsPremium(globalIsPremium);
      setFavoritesCount(globalFavorites.length);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const DrawerItem = ({ icon, label, onPress, badge, isActive }) => (
    <TouchableOpacity 
      style={[
        styles.drawerItem,
        isActive && styles.drawerItemActive
      ]} 
      onPress={onPress}
    >
      <View style={styles.drawerIconContainer}>
        {icon}
      </View>
      <Text style={[
        styles.drawerLabel,
        isActive && styles.drawerLabelActive
      ]}>{label}</Text>
      {badge > 0 && (
        <View style={styles.drawerBadge}>
          <Text style={styles.drawerBadgeText}>{badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const activeRoute = state?.routeNames[state?.index];

  return (
    <SafeAreaView style={styles.drawerContainer} edges={['top', 'bottom']}>
      {/* Drawer Header */}
      <View style={styles.drawerHeader}>
        <View style={styles.drawerHeaderContent}>
          <MaterialCommunityIcons name="fish" size={40} color={COLORS.primary} />
          <Text style={styles.drawerHeaderTitle}>MFR</Text>
        </View>
        <Text style={styles.drawerHeaderSubtitle}>Montana Fishing Reports</Text>
        {isPremium && (
          <View style={styles.drawerPremiumBadge}>
            <MaterialIcons name="diamond" size={14} color={COLORS.accent} />
            <Text style={styles.drawerPremiumText}>Premium</Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.drawerScroll}>
        {/* Main Navigation */}
        <View style={styles.drawerSection}>
          <Text style={styles.drawerSectionTitle}>Navigation</Text>
          
          <DrawerItem 
            icon={<MaterialCommunityIcons name="waves" size={22} color={activeRoute === 'MainTabs' ? COLORS.accent : COLORS.textLight} />}
            label="Rivers"
            onPress={() => navigation.navigate('MainTabs', { screen: 'Rivers' })}
            isActive={activeRoute === 'MainTabs'}
          />
          
          <DrawerItem 
            icon={<Ionicons name="map-outline" size={22} color={activeRoute === 'Map' ? COLORS.accent : COLORS.textLight} />}
            label="Map"
            onPress={() => navigation.navigate('MainTabs', { screen: 'Map' })}
            isActive={activeRoute === 'Map'}
          />
          
          <DrawerItem 
            icon={<Ionicons name="heart-outline" size={22} color={activeRoute === 'Favorites' ? COLORS.accent : COLORS.textLight} />}
            label="Favorites"
            badge={favoritesCount}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Favorites' })}
            isActive={activeRoute === 'Favorites'}
          />
          
          <DrawerItem 
            icon={<MaterialCommunityIcons name="trophy-outline" size={22} color={activeRoute === 'Leaderboard' ? COLORS.accent : COLORS.textLight} />}
            label="Leaderboard"
            onPress={() => navigation.navigate('MainTabs', { screen: 'Leaderboard' })}
            isActive={activeRoute === 'Leaderboard'}
          />
          
          <DrawerItem 
            icon={<MaterialIcons name="diamond" size={22} color={activeRoute === 'Premium' ? COLORS.accent : COLORS.textLight} />}
            label="Premium"
            onPress={() => navigation.navigate('MainTabs', { screen: 'Premium' })}
            isActive={activeRoute === 'Premium'}
          />
        </View>

        {/* Settings & More */}
        <View style={styles.drawerSection}>
          <Text style={styles.drawerSectionTitle}>Settings</Text>
          
          <DrawerItem 
            icon={<MaterialCommunityIcons name="bell-outline" size={22} color={activeRoute === 'Settings' ? COLORS.accent : COLORS.textLight} />}
            label="Notifications"
            onPress={() => navigation.navigate('Settings')}
            isActive={activeRoute === 'Settings'}
          />
          
          <DrawerItem 
            icon={<Ionicons name="help-circle-outline" size={22} color={activeRoute === 'Settings' ? COLORS.accent : COLORS.textLight} />}
            label="Help & Support"
            onPress={() => navigation.navigate('Settings', { openModal: 'help' })}
            isActive={activeRoute === 'Settings'}
          />
          
          <DrawerItem 
            icon={<MaterialIcons name="info-outline" size={22} color={activeRoute === 'Settings' ? COLORS.accent : COLORS.textLight} />}
            label="About"
            onPress={() => navigation.navigate('Settings', { openModal: 'about' })}
            isActive={activeRoute === 'Settings'}
          />
        </View>
      </ScrollView>

      {/* Drawer Footer */}
      <View style={styles.drawerFooter}>
        <Text style={styles.drawerVersion}>Version 2.0.41</Text>
      </View>
    </SafeAreaView>
  );
}

// Main Tabs Navigator (inside Drawer)
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color }) => <TabIcon name={route.name} focused={focused} color={color} />,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarStyle: { 
          backgroundColor: COLORS.surface,
          borderTopWidth: 2,
          borderTopColor: COLORS.border,
          height: 75,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500', marginBottom: 6 },
      })}        
    >
      <Tab.Screen name="Rivers" component={RiversStack} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} />
      <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Tab.Screen name="Premium" component={PremiumScreen} />
    </Tab.Navigator>
  );
}

// Root Drawer Navigator
function RootNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: {
          width: 280,
          backgroundColor: COLORS.surface,
        },
        overlayColor: 'rgba(0,0,0,0.5)',
        swipeEnabled: true,
        swipeEdgeWidth: 100,
      }}
    >
      <Drawer.Screen name="MainTabs" component={MainTabs} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
    </Drawer.Navigator>
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
  const [isInitializing, setIsInitializing] = useState(true);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState(0);
  const [showTrialBanner, setShowTrialBanner] = useState(false);
  
  // Use RevenueCat hook for real premium status
  const { isPremium: revenueCatPremium, isLoading: rcLoading } = useRevenueCat();
  
  // Loading progress state
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState('Initializing...');
  
  // Preload all necessary data
  useEffect(() => {
    const preloadData = async () => {
      try {
        // Step 1: Initialize RevenueCat
        setLoadingStatus('Setting up purchases...');
        setLoadingProgress(0.1);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Step 2: Load cached favorites
        setLoadingStatus('Loading your favorites...');
        setLoadingProgress(0.3);
        const saved = await AsyncStorage.getItem('favorites');
        if (saved) {
          const parsed = JSON.parse(saved);
          globalFavorites = parsed;
          setFavoritesCount(parsed.length);
        }
        
        // Step 3: Preload river list from API
        setLoadingStatus('Loading river data...');
        setLoadingProgress(0.5);
        try {
          const response = await fetch(`${API_URL}/api/rivers`, { timeout: 5000 });
          if (response.ok) {
            const data = await response.json();
            // Cache river list
            await AsyncStorage.setItem('river_list_cache', JSON.stringify(data));
          }
        } catch (e) {
          console.log('River preload failed, will use cache');
        }
        
        // Step 4: Skip image preloading (local images load instantly)
        setLoadingStatus('Preparing...');
        setLoadingProgress(0.8);
        
        // Step 5: Check cached premium status
        setLoadingStatus('Finalizing...');
        setLoadingProgress(0.95);
        await checkCachedPremiumStatus();
        
        // Step 6: Check and auto-start trial
        const trialAlreadyStarted = await hasTrialStarted();
        if (!trialAlreadyStarted) {
          // First time user - start their 10-day trial
          console.log('[TRIAL] Starting 10-day free trial for new user');
          await startTrial();
        }
        
        const trialActive = await isTrialActive();
        const daysRemaining = await getTrialDaysRemaining();
        
        if (trialActive) {
          console.log(`[TRIAL] Trial active - ${daysRemaining} days remaining`);
          setTrialDaysRemaining(daysRemaining);
          setShowTrialBanner(true);
          globalIsPremium = true;
          if (!FORCE_FREE_MODE) {
            setIsPremium(true);
          }
        } else if (trialAlreadyStarted) {
          console.log('[TRIAL] Trial expired');
          setShowTrialBanner(false);
        }
        
        // Done
        setLoadingProgress(1);
        setTimeout(() => {
          setIsInitializing(false);
        }, 300);
        
      } catch (error) {
        console.error('Preload error:', error);
        // Even if preload fails, show the app after max 5 seconds
        setTimeout(() => {
          setIsInitializing(false);
        }, 5000);
      }
    };
    
    preloadData();
  }, []);
  
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
    
    // Refresh trial status every hour to update days remaining
    const trialInterval = setInterval(async () => {
      if (!isPremium) {
        const trialActive = await isTrialActive();
        const daysRemaining = await getTrialDaysRemaining();
        if (trialActive) {
          setTrialDaysRemaining(daysRemaining);
          setShowTrialBanner(true);
        } else {
          setShowTrialBanner(false);
        }
      }
    }, 3600000); // Check every hour
    
    return () => {
      globalShowPaywall = null;
      clearInterval(interval);
      clearInterval(trialInterval);
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
    
    // Listen for app state changes to check trial expiration and smart notifications
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active') {
        // App came to foreground - check trial status
        if (!isPremium) {
          const trialActive = await isTrialActive();
          const daysRemaining = await getTrialDaysRemaining();
          if (trialActive) {
            setTrialDaysRemaining(daysRemaining);
            setShowTrialBanner(true);
          } else {
            setShowTrialBanner(false);
            // If trial just expired, update premium status
            const hadTrialBefore = await hasTrialStarted();
            if (hadTrialBefore && globalIsPremium) {
              console.log('[TRIAL] Trial expired while app was in background');
              globalIsPremium = false;
              setIsPremium(false);
            }
          }
        }
        
        // Run smart notification checks when app comes to foreground
        if (globalIsPremium) {
          runSmartNotificationChecks();
        }
      }
    });
    
    return () => {
      subscription.remove();
    };
  }, []);
  
  const handlePurchaseSuccess = () => {
    setIsPremium(true);
    globalIsPremium = true;
    setShowPaywall(false);
  };
  
  const openPaywall = () => {
    setShowPaywall(true);
  };

  // Professional Loading Screen
  if (isInitializing) {
    return (
      <View style={loadingStyles.container}>
        <View style={loadingStyles.gradient}>
          <View style={loadingStyles.content}>
            {/* Logo Icon */}
            <View style={loadingStyles.logoContainer}>
              <MaterialCommunityIcons name="waves" size={64} color={COLORS.accent} />
            </View>
            
            {/* Title */}
            <Text style={loadingStyles.title}>Montana Fishing</Text>
            <Text style={loadingStyles.subtitle}>Reports</Text>
            
            {/* Progress Bar */}
            <View style={loadingStyles.progressContainer}>
              <View style={loadingStyles.progressBar}>
                <View style={[loadingStyles.progressFill, { width: `${Math.max(loadingProgress * 100, 5)}%` }]} />
              </View>
              <Text style={loadingStyles.statusText}>{loadingStatus}</Text>
            </View>
            
            {/* Loading Spinner */}
            <ActivityIndicator size="small" color={COLORS.accent} style={loadingStyles.spinner} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <NavigationContainer>
        {/* Trial Banner - Shows during 10-day trial */}
        {showTrialBanner && !isPremium && (
          <TouchableOpacity 
            style={styles.trialBanner}
            onPress={() => setShowPaywall(true)}
            activeOpacity={0.9}
          >
            <MaterialIcons name="schedule" size={18} color="#fff" />
            <Text style={styles.trialBannerText}>
              {trialDaysRemaining === 14 ? '🎉 Free Trial Started!' : 
               trialDaysRemaining === 1 ? '⏰ Trial ends today' :
               `⏰ ${trialDaysRemaining} days left in trial`}
            </Text>
            <Text style={styles.trialBannerSubtext}>
              Tap to subscribe
            </Text>
            <TouchableOpacity 
              style={styles.trialBannerClose}
              onPress={(e) => {
                e.stopPropagation();
                setShowTrialBanner(false);
              }}
            >
              <Ionicons name="close" size={16} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        
        <RootNavigator />
        
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
  header: { backgroundColor: COLORS.primaryDark, paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 50 : 40, paddingBottom: 16 },
  headerContent: { gap: 4 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#f5f1e8', flex: 1 },
  premiumBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.accent, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  premiumBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.premiumDark },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, marginHorizontal: 16, marginTop: 12, marginBottom: 6, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 15, color: COLORS.text },
  listContainer: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 150 },
  loadingText: { marginTop: 12, fontSize: 15, color: COLORS.textSecondary },
  riverCard: { marginTop: 12, marginBottom: 12, borderRadius: 14, overflow: 'hidden', elevation: 3, shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },
  riverCardBackground: { height: 110 },
  riverCardImage: { borderRadius: 14 },
  riverCardOverlay: { flex: 1, backgroundColor: 'rgba(26, 47, 39, 0.55)', justifyContent: 'center' },
  riverCardContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12 },
  riverInfo: { flex: 1 },
  riverName: { fontSize: 17, fontWeight: '700', color: '#f5f1e8' },
  riverMeta: { fontSize: 12, color: 'rgba(245, 241, 232, 0.8)', marginTop: 2 },
  ynpBadge: { backgroundColor: '#f1c40f', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  ynpBadgeText: { fontSize: 10, fontWeight: '700', color: '#2c2416' },
  heroHeader: { 
    height: 260 + (Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24),
    marginTop: -(Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24),
  },
  heroOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(26, 47, 39, 0.5)', 
    justifyContent: 'space-between', 
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 85 : (StatusBar.currentHeight || 24) + 25,
  },
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
  mapHeader: { backgroundColor: COLORS.primaryDark, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 50 : 40, paddingBottom: 14 },
  mapHeaderTitle: { fontSize: 17, fontWeight: '700', color: '#f5f1e8' },
  cancelSelectionButton: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8 },
  cancelSelectionText: { color: '#f5f1e8', fontSize: 13, fontWeight: '600' },
  selectionOverlay: { position: 'absolute', bottom: 100, left: 16, right: 16, alignItems: 'center' },
  selectionCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5, width: '100%' },
  selectionText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  confirmSelectionButton: { backgroundColor: COLORS.accent, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  confirmSelectionText: { color: '#2c2416', fontSize: 15, fontWeight: '700' },
  mapBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.accent, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
  mapBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.premiumDark },
  favoritesHeader: { backgroundColor: COLORS.primaryDark, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 50 : 40, paddingBottom: 14 },
  favoritesHeaderTitle: { fontSize: 17, fontWeight: '700', color: '#f5f1e8' },
  favoritesCount: { fontSize: 12, color: 'rgba(245, 241, 232, 0.8)' },
  emptyFavorites: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  upsellContainer: { alignItems: 'center', paddingHorizontal: 32, gap: 16 },
  upsellTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  upsellButton: { backgroundColor: COLORS.premium, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 10, marginTop: 8 },
  upsellButtonText: { color: '#f5f1e8', fontSize: 15, fontWeight: '700' },
  premiumScroll: { minHeight: '100%' },
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
  tabBar: { 
    backgroundColor: COLORS.surface, 
    borderTopWidth: 2, 
    borderTopColor: COLORS.border, 
    height: 100,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  tabLabel: { fontSize: 11, fontWeight: '500', marginTop: 4 },
  premiumFeatureCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, marginHorizontal: 16, marginVertical: 8, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: COLORS.premium, gap: 12 },
  premiumFeatureText: { flex: 1, justifyContent: 'center' },
  premiumFeatureTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  premiumFeatureSubtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2, textAlign: 'center' },
  lockIconSmall: { 
    position: 'absolute', 
    bottom: -2, 
    right: -2, 
    backgroundColor: 'rgba(0,0,0,0.7)', 
    borderRadius: 6, 
    padding: 1,
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  // Drawer Styles
  drawerContainer: { 
    flex: 1, 
    backgroundColor: COLORS.surface 
  },
  drawerHeader: { 
    padding: 20, 
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background
  },
  drawerHeaderContent: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10 
  },
  drawerHeaderTitle: { 
    fontSize: 28, 
    fontWeight: '800', 
    color: COLORS.primary,
    letterSpacing: 2
  },
  drawerHeaderSubtitle: { 
    fontSize: 13, 
    color: COLORS.textLight, 
    marginTop: 4 
  },
  drawerPremiumBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    marginTop: 10,
    backgroundColor: COLORS.accent + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start'
  },
  drawerPremiumText: { 
    fontSize: 12, 
    fontWeight: '700', 
    color: COLORS.accent 
  },
  drawerScroll: { 
    flex: 1 
  },
  drawerSection: { 
    paddingVertical: 8 
  },
  drawerSectionTitle: { 
    fontSize: 11, 
    fontWeight: '700', 
    color: COLORS.textMuted, 
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  drawerItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 12,
    marginHorizontal: 8,
    borderRadius: 8
  },
  drawerItemActive: { 
    backgroundColor: COLORS.primary + '10' 
  },
  drawerIconContainer: { 
    width: 36, 
    alignItems: 'center' 
  },
  drawerLabel: { 
    flex: 1, 
    fontSize: 15, 
    fontWeight: '600', 
    color: COLORS.text,
    marginLeft: 8
  },
  drawerLabelActive: { 
    color: COLORS.primary,
    fontWeight: '700'
  },
  drawerBadge: { 
    backgroundColor: COLORS.accent, 
    borderRadius: 10, 
    minWidth: 20, 
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6
  },
  drawerBadgeText: { 
    color: '#fff', 
    fontSize: 11, 
    fontWeight: '700' 
  },
  drawerFooter: { 
    padding: 16, 
    borderTopWidth: 1, 
    borderTopColor: COLORS.border 
  },
  drawerVersion: { 
    fontSize: 12, 
    color: COLORS.textMuted,
    textAlign: 'center'
  },
  // Trial Banner
  trialBanner: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    backgroundColor: COLORS.premium,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 10,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  trialBannerText: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  trialBannerSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
  trialBannerClose: {
    padding: 4,
    marginLeft: 8,
  },
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
  freeFeatureText: {
    fontSize: 13,
    color: COLORS.textSecondary,
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
  // SmartCast Styles
  smartCastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  smartCastLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
    flex: 1,
  },
  smartCastScore: {
    fontSize: 13,
    fontWeight: '700',
  },
  // Loading Screen Styles
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    padding: 40,
  },
  loadingIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 30,
    textAlign: 'center',
  },
  loadingSpinner: {
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});

// Professional Loading Screen Styles
const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryDark,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primaryDark,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#f5f1e8',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.accent,
    marginBottom: 40,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  progressContainer: {
    width: 250,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 2,
  },
  statusText: {
    fontSize: 14,
    color: 'rgba(245, 241, 232, 0.7)',
    marginBottom: 20,
  },
  spinner: {
    marginTop: 10,
  },
  // Region Filter Tabs - Mimics Map Filter Style
  regionTabsContainer: {
    backgroundColor: COLORS.surface,
    paddingTop: 12,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 16,
  },
  regionTabsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  regionTab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    justifyContent: 'center',
  },
  regionTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  regionTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  regionTabTextActive: {
    color: '#f5f1e8',
  },
  favoritesBadge: {
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  favoritesBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  // Favorites Section
  favoritesSection: {
    backgroundColor: COLORS.surface,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  favoritesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  favoritesTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  favoritesScrollContent: {
    paddingHorizontal: 12,
  },
  favoriteChip: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 100,
    alignItems: 'center',
    marginRight: 8,
  },
  favoriteChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  favoriteChipFlow: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  

});

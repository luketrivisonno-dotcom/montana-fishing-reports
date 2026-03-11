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
import HatchChart from './components/HatchChart';
import SolunarTimes from './components/SolunarTimes';
import FlowChart from './components/FlowChart';
import FishingLogList from './components/FishingLogList';
import FishingLogModal from './components/FishingLogModal';
import RegulationsInfo from './components/RegulationsInfo';
import AdBanner from './components/AdBanner';
import AdManager from './components/AdManager';

// Try to import mobile ads SDK - will be null in Expo Go
let mobileAds = null;
try {
  mobileAds = require('react-native-google-mobile-ads').default;
} catch (e) {
  console.log('Google Mobile Ads SDK not available (Expo Go)');
}
import { 
  registerForPushNotificationsAsync, 
  subscribeToRiverNotifications,
  unsubscribeFromRiverNotifications,
  isSubscribedToRiver,
  setupNotificationListeners 
} from './utils/notifications';
import RiverMap from './components/RiverMap';
import { getRiverImage, DEFAULT_RIVER_IMAGE } from './assets/river-images/riverImages';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================
// DEVELOPMENT MODE
// ============================================
const DEV_MODE = false;

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

const formatDate = (dateString) => {
  if (!dateString) return 'Recently updated';
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

// ============================================
// RIVERS LIST SCREEN
// ============================================
function RiversScreen({ navigation }) {
  const [rivers, setRivers] = useState([]);
  const [filteredRivers, setFilteredRivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { fetchRivers(); clearOldCache(); }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = rivers.filter(r => r.toLowerCase().includes(searchQuery.toLowerCase()));
      setFilteredRivers(filtered);
    } else {
      setFilteredRivers(rivers);
    }
  }, [searchQuery, rivers]);

  const fetchRivers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/rivers`);
      if (!response.ok) throw new Error('Network failed');
      const data = await response.json();
      const sortedRivers = data.rivers.sort((a, b) => a.localeCompare(b));
      setRivers(sortedRivers);
      setFilteredRivers(sortedRivers);
      setIsOffline(false);
      await cacheRiverData('river_list', sortedRivers);
    } catch (error) {
      setIsOffline(true);
      const cachedRivers = await getCachedRiverData('river_list');
      if (cachedRivers) setRivers(cachedRivers);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRivers();
    setRefreshing(false);
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
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.riverCard} onPress={() => navigation.navigate('Rivers', { screen: 'RiverDetails', params: { river: item } })} activeOpacity={0.9}>
            <ImageBackground source={getRiverImage(item)} style={styles.riverCardBackground} imageStyle={styles.riverCardImage}>
              <View style={styles.riverCardOverlay}>
                <View style={styles.riverCardContent}>
                  <View style={styles.riverInfo}>
                    <Text style={styles.riverName}>{item}</Text>
                    <Text style={styles.riverMeta}>Tap for conditions & reports</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={22} color="#c9a227" />
                </View>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        )}
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

  useEffect(() => { 
    fetchRiverData();
    checkSubscription();
    setupNotifications();
    // Show interstitial ad every 3rd river view
    AdManager.showInterstitialWithFrequency('river_details', 3);
  }, []);

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
    // Premium check disabled for free version
    // if (!globalIsPremium) { setShowPremiumModal(true); return; }
    if (isFavorite) { globalFavorites = globalFavorites.filter(r => r !== river); }
    else { globalFavorites.push(river); }
    setIsFavorite(!isFavorite);
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

          {data?.usgs ? (
            <TouchableOpacity style={styles.conditionCard} onPress={() => openReport(data.usgs.url)}>
              <View style={[styles.conditionIconContainer, { backgroundColor: COLORS.primary + '15' }]}>
                <MaterialCommunityIcons name="waves" size={22} color={COLORS.primary} />
              </View>
              <View style={styles.conditionInfo}>
                <View style={styles.conditionHeader}>
                  <Text style={styles.conditionLabel}>Flow</Text>
                  {data.usgs.location && (
                    <Text style={styles.locationText}>{data.usgs.location}</Text>
                  )}
                </View>
                <Text style={styles.conditionValue}>{data.usgs.flow}</Text>
                <Text style={styles.conditionSubtext}>
                  Temp: {data.usgs.temp}
                  {data.usgs.tempSource && data.usgs.tempSource !== 'USGS Live' && (
                    <Text style={{ fontSize: 10, color: COLORS.textLight }}> ({data.usgs.tempSource})</Text>
                  )}
                </Text>
              </View>
              <Ionicons name="open-outline" size={16} color={COLORS.textLight} style={styles.openIcon} />
            </TouchableOpacity>
          ) : (
            <View style={[styles.conditionCard, { opacity: 0.7 }]}>
              <View style={[styles.conditionIconContainer, { backgroundColor: COLORS.textLight + '15' }]}>
                <MaterialCommunityIcons name="waves" size={22} color={COLORS.textLight} />
              </View>
              <View style={styles.conditionInfo}>
                <Text style={styles.conditionLabel}>Flow</Text>
                <Text style={[styles.conditionValue, { color: COLORS.textLight }]}>No USGS Station</Text>
                <Text style={styles.conditionSubtext}>Check local reports below</Text>
              </View>
            </View>
          )}


        </View>

        {/* DYNAMIC HATCH CHART with live conditions */}
        <HatchChart riverName={river} isPremium={true} hatchData={data?.hatchData} />

        {/* 7-DAY FLOW HISTORY - Only show for rivers with USGS data */}
        {river !== 'Spring Creeks' && river !== 'Yellowstone National Park' && (
          <FlowChart riverName={river} />
        )}

        {/* SOLUNAR FISHING TIMES */}
        <SolunarTimes riverName={river} />

        {/* REGULATIONS & SEASONS */}
        <RegulationsInfo riverName={river} />

        {/* AD BANNER */}
        <AdBanner size="banner" />

        {/* FISHING REPORTS */}
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

        {/* PERSONAL FISHING LOG - Moved below reports */}
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
              <View style={styles.featureItem}><Ionicons name="checkmark-circle" size={20} color={COLORS.success} /><Text style={styles.featureText}>Detailed hatch charts</Text></View>
              <View style={styles.featureItem}><Ionicons name="checkmark-circle" size={20} color={COLORS.success} /><Text style={styles.featureText}>Fly recommendations</Text></View>
              <View style={styles.featureItem}><Ionicons name="checkmark-circle" size={20} color={COLORS.success} /><Text style={styles.featureText}>Save favorite rivers</Text></View>
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
  useEffect(() => { setFavorites(globalFavorites); }, []);

  // Premium check disabled for free version
  // if (!globalIsPremium) {
  //   return (
  //     <SafeAreaView style={[styles.container, styles.center]} edges={['top']}>
  //       <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
  //       <DevModeBanner />
  //       <View style={styles.upsellContainer}>
  //         <MaterialIcons name="diamond" size={64} color={COLORS.premium} />
  //         <Text style={styles.upsellTitle}>Premium Feature</Text>
  //         <TouchableOpacity style={styles.upsellButton}><Text style={styles.upsellButtonText}>Upgrade to Premium</Text></TouchableOpacity>
  //       </View>
  //     </SafeAreaView>
  //   );
  // }

  if (favorites.length === 0) {
    return (
      <SafeAreaView style={[styles.container, styles.center]} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
        <DevModeBanner />
        <View style={styles.emptyFavorites}>
          <Ionicons name="heart-outline" size={64} color={COLORS.textLight} />
          <Text style={styles.emptyTitle}>No Favorites Yet</Text>
          <Text style={styles.emptyText}>Tap the heart on any river to save it here</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      <DevModeBanner />
      <View style={styles.favoritesHeader}>
        <Text style={styles.favoritesHeaderTitle}>Your Favorites</Text>
        <Text style={styles.favoritesCount}>{favorites.length} rivers</Text>
      </View>
      <FlatList
        data={favorites}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.riverCard} onPress={() => navigation.navigate('RiverDetails', { river: item })} activeOpacity={0.9}>
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
          <TouchableOpacity style={styles.monthlyButton}><Text style={styles.monthlyButtonText}>$4.99/month</Text></TouchableOpacity>
          <TouchableOpacity style={styles.yearlyCard}>
            <View style={styles.yearlyBadge}><Text style={styles.yearlyBadgeText}>BEST VALUE</Text></View>
            <Text style={styles.yearlyPrice}>$39.99/year</Text>
            <Text style={styles.yearlySave}>Save 33%</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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

export default function App() {
  useEffect(() => {
    // Initialize Google Mobile Ads SDK if available
    if (mobileAds) {
      mobileAds()
        .initialize()
        .then(() => console.log('Google Mobile Ads initialized'))
        .catch(err => console.log('Ad initialization error:', err));
    } else {
      console.log('Google Mobile Ads not available (running in Expo Go)');
    }
  }, []);

  return (
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
        {/* Premium tab hidden for now - will enable later */}
        {/* <Tab.Screen name="Premium" component={PremiumScreen} /> */}
      </Tab.Navigator>
    </NavigationContainer>
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
  featuresList: { marginBottom: 24, gap: 12 },
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
});

import React, { useState, useEffect } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, 
  RefreshControl, StyleSheet, Linking, ActivityIndicator,
  StatusBar, ImageBackground, ScrollView, Modal,
  Alert, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { cacheRiverData, getCachedRiverData, clearOldCache } from './utils/offlineStorage';
import HatchChart from './components/HatchChart';
import RiverMap from './components/RiverMap';

const API_URL = 'https://montana-fishing-reports-production.up.railway.app';

const RIVER_IMAGES = {
  'Gallatin River': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
  'Upper Madison River': 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800',
  'Lower Madison River': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
  'Yellowstone River': 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800',
  'Missouri River': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
  'Clark Fork River': 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=800',
  'Blackfoot River': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
  'Bitterroot River': 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800',
  'Rock Creek': 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800',
  'Bighorn River': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
  'Beaverhead River': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
  'Big Hole River': 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800',
  'Flathead River': 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=800',
  'Jefferson River': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
  'Madison River': 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800',
  'Ruby River': 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800',
  'Stillwater River': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
  'Swan River': 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=800',
  'Boulder River': 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800',
  'Spring Creeks': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
  'Yellowstone National Park': 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800'
};

const COLORS = {
  primary: '#1a5f7a',
  primaryDark: '#134a5e',
  secondary: '#159895',
  accent: '#57c5b6',
  background: '#f0f4f8',
  white: '#ffffff',
  dark: '#2c3e50',
  gray: '#7f8c8d',
  lightGray: '#ecf0f1',
  glass: 'rgba(255,255,255,0.95)',
  glassDark: 'rgba(0,0,0,0.4)',
  offline: '#ff9800',
  success: '#27ae60',
  premium: '#ffd700',
  error: '#e74c3c'
};

let globalIsPremium = false;
let globalUserEmail = null;
let globalFavorites = [];

const formatDate = (dateString) => {
  if (!dateString) return 'Recently updated';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return dateString.length > 20 ? dateString.substring(0, 20) + '...' : dateString;
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

const TabIcon = ({ name, focused }) => {
  const icons = {
    Rivers: '🎣',
    Map: '🗺️',
    Favorites: '⭐',
    Premium: '💎'
  };
  return (
    <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.5 }}>
      {icons[name] || '🎣'}
    </Text>
  );
};

const PremiumBadge = () => (
  <View style={styles.premiumBadge}>
    <Text style={styles.premiumBadgeText}>⭐ PREMIUM</Text>
  </View>
);

function RiversScreen({ navigation }) {
  const [rivers, setRivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => { 
    fetchRivers();
    clearOldCache();
  }, []);

  const fetchRivers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/rivers`);
      if (!response.ok) throw new Error('Network failed');
      const data = await response.json();
      const sortedRivers = data.rivers.sort((a, b) => {
        if (a.includes('Madison') && b.includes('Madison')) return a.localeCompare(b);
        return a.localeCompare(b);
      });
      setRivers(sortedRivers);
      setIsOffline(false);
      await cacheRiverData('river_list', sortedRivers);
    } catch (error) {
      console.error('Fetch error:', error);
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

  const getRiverSubtitle = (river) => {
    if (river.includes('Upper Madison')) return 'Ennis to Quake Lake';
    if (river.includes('Lower Madison')) return 'Three Forks to Ennis';
    return 'Tap for flows, weather & reports';
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
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>📴 Offline Mode - Showing Cached Data</Text>
        </View>
      )}
      
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800' }}
        style={styles.headerBackground}
      >
        <View style={styles.headerOverlay}>
          <Text style={styles.headerEmoji}>🏔️</Text>
          <Text style={styles.headerTitle}>Montana Fishing</Text>
          <Text style={styles.headerSubtitle}>{rivers.length} Rivers • Real-Time Reports</Text>
          {globalIsPremium && <PremiumBadge />}
        </View>
      </ImageBackground>

      <FlatList
        data={rivers}
        keyExtractor={(item) => item}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.riverCard}
            onPress={() => navigation.navigate('RiverDetails', { river: item })}
            activeOpacity={0.85}
          >
            <ImageBackground
              source={{ uri: RIVER_IMAGES[item] || RIVER_IMAGES['Madison River'] }}
              style={styles.riverCardBackground}
              imageStyle={styles.riverCardImage}
            >
              <View style={styles.riverCardOverlay}>
                <View style={styles.riverInfo}>
                  <Text style={styles.riverName}>{item}</Text>
                  <Text style={styles.riverSubtext}>{getRiverSubtitle(item)}</Text>
                </View>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

function RiverDetailsScreen({ route, navigation }) {
  const { river } = route.params;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [isFavorite, setIsFavorite] = useState(globalFavorites.includes(river));
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  useEffect(() => { fetchRiverData(); }, []);

  const fetchRiverData = async () => {
    try {
      const cached = await getCachedRiverData(river);
      if (cached) {
        setData(cached);
        setLoading(false);
      }

      const response = await fetch(`${API_URL}/api/river-details/${encodeURIComponent(river)}`);
      if (!response.ok) throw new Error('Network failed');
      
      const result = await response.json();
      if (result.reports) result.reports = removeDuplicateReports(result.reports);
      
      setData(result);
      setIsOffline(false);
      await cacheRiverData(river, result);
      
    } catch (error) {
      console.error('Fetch error:', error);
      if (!data) {
        setIsOffline(true);
        Alert.alert('Connection Error', 'Showing cached data. Pull down to retry.');
      }
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
    if (!globalIsPremium) {
      setShowPremiumModal(true);
      return;
    }
    
    if (isFavorite) {
      globalFavorites = globalFavorites.filter(r => r !== river);
    } else {
      globalFavorites.push(river);
    }
    setIsFavorite(!isFavorite);
  };

  const openReport = (url) => { if (url) Linking.openURL(url); };
  const openUSGS = (url) => { if (url) Linking.openURL(url); };

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
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>📴 Offline Mode</Text>
        </View>
      )}
      
      <ImageBackground
        source={{ uri: RIVER_IMAGES[river] || RIVER_IMAGES['Madison River'] }}
        style={styles.detailHeaderBackground}
      >
        <View style={styles.detailHeaderOverlay}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={toggleFavorite}
            style={styles.favoriteButton}
          >
            <Text style={{ fontSize: 28 }}>{isFavorite ? '⭐' : '☆'}</Text>
          </TouchableOpacity>
          <Text style={styles.detailHeaderTitle}>{river}</Text>
          <Text style={styles.detailHeaderSubtitle}>{data?.reports?.length || 0} Report Sources</Text>
        </View>
      </ImageBackground>

      <ScrollView 
        style={styles.detailScroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        {globalIsPremium && <HatchChart riverName={river} />}
        
        {!globalIsPremium && (
          <TouchableOpacity 
            style={styles.upgradeBanner}
            onPress={() => setShowPremiumModal(true)}
          >
            <Text style={styles.upgradeBannerText}>
              ⭐ Upgrade to Premium for hatch charts & fly recommendations!
            </Text>
          </TouchableOpacity>
        )}

        {data?.weather && (
          <View style={styles.dataCard}>
            <View style={styles.locationLabelContainer}>
              <Text style={styles.locationLabel}>📍 {data.weather.station || 'Local Weather Station'}</Text>
            </View>
            <View style={styles.cardHeader}>
              <Text style={styles.weatherIconLarge}>{data.weather.icon || '☁️'}</Text>
              <View style={styles.cardTitleContainer}>
                <Text style={styles.dataCardTitle}>Today's Weather</Text>
                <Text style={styles.cardSubtitle}>{data.weather.condition || 'Current Conditions'}</Text>
              </View>
            </View>
            <View style={styles.weatherRow}>
              <View style={styles.weatherItem}>
                <Text style={styles.weatherValueSmall}>{data.weather.high}°</Text>
                <Text style={styles.weatherLabel}>High</Text>
              </View>
              <View style={styles.weatherDivider} />
              <View style={styles.weatherItem}>
                <Text style={styles.weatherValueSmall}>{data.weather.low}°</Text>
                <Text style={styles.weatherLabel}>Low</Text>
              </View>
              <View style={styles.weatherDivider} />
              <View style={styles.weatherItem}>
                <Text style={styles.weatherValueTiny}>{data.weather.wind || '--'}</Text>
                <Text style={styles.weatherLabel}>Wind</Text>
              </View>
            </View>
          </View>
        )}

        {data?.usgs && (
          <TouchableOpacity 
            style={[styles.dataCard, styles.usgsCard]} 
            onPress={() => openUSGS(data.usgs.url)}
            activeOpacity={0.8}
          >
            <View style={styles.locationLabelContainer}>
              <Text style={styles.locationLabel}>📍 {data.usgs.location || 'USGS Gauge Location'}</Text>
            </View>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>📊</Text>
              <View style={styles.cardTitleContainer}>
                <Text style={styles.dataCardTitle}>River Conditions</Text>
                <Text style={styles.cardSubtitle}>Live USGS Data</Text>
              </View>
            </View>
            <View style={styles.usgsRow}>
              <View style={styles.usgsItem}>
                <Text style={styles.usgsValueSmall}>{data.usgs.flow}</Text>
                <Text style={styles.usgsLabel}>Flow (cfs)</Text>
              </View>
              <View style={styles.usgsDivider} />
              <View style={styles.usgsItem}>
                <Text style={styles.usgsValueSmall}>{data.usgs.temp}</Text>
                <Text style={styles.usgsLabel}>Water Temp</Text>
              </View>
            </View>
            <View style={styles.tapIndicator}>
              <Text style={styles.tapIndicatorText}>Tap to view on USGS website →</Text>
            </View>
          </TouchableOpacity>
        )}

        <Text style={styles.sectionTitle}>Latest Fishing Reports</Text>
        {data?.reports?.map((report, index) => (
          <TouchableOpacity 
            key={report.id || index}
            style={styles.reportCard}
            onPress={() => openReport(report.url)}
            activeOpacity={0.8}
          >
            <View style={styles.reportHeader}>
              <View style={styles.sourceBadge}>
                <Text style={styles.sourceText} numberOfLines={1}>{report.source}</Text>
              </View>
              <Text style={styles.dateText}>{formatDate(report.last_updated)}</Text>
            </View>
            <View style={styles.reportFooter}>
              <Text style={styles.linkButton}>Read Full Report →</Text>
            </View>
          </TouchableOpacity>
        ))}
        {(!data?.reports || data.reports.length === 0) && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🎣</Text>
            <Text style={styles.emptyTitle}>No reports available</Text>
            <Text style={styles.emptyText}>Check back later for updates</Text>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showPremiumModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPremiumModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>⭐ Go Premium</Text>
            <Text style={styles.modalSubtitle}>Unlock the full fishing experience</Text>
            
            <View style={styles.featureList}>
              <Text style={styles.featureItem}>✓ Ad-free experience</Text>
              <Text style={styles.featureItem}>✓ Detailed hatch charts</Text>
              <Text style={styles.featureItem}>✓ Exclusive access points</Text>
              <Text style={styles.featureItem}>✓ Save favorite rivers</Text>
              <Text style={styles.featureItem}>✓ Offline mode</Text>
            </View>
            
            <TouchableOpacity style={styles.premiumButton}>
              <Text style={styles.premiumButtonText}>Monthly $4.99</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.premiumButton, styles.premiumButtonYearly]}>
              <Text style={styles.premiumButtonText}>Yearly $39.99 (Save 33%)</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setShowPremiumModal(false)}>
              <Text style={styles.modalClose}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function MapScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={styles.mapHeader}>
        <Text style={styles.mapHeaderTitle}>🗺️ Access Points</Text>
        {!globalIsPremium && (
          <Text style={styles.mapHeaderSubtitle}>⭐ Premium: Detailed access points & boat launches</Text>
        )}
      </View>
      <RiverMap navigation={navigation} isPremium={globalIsPremium} />
    </SafeAreaView>
  );
}

function FavoritesScreen({ navigation }) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    if (!globalIsPremium) {
      setLoading(false);
      return;
    }
    
    setFavorites(globalFavorites);
    setLoading(false);
  };

  if (!globalIsPremium) {
    return (
      <SafeAreaView style={[styles.container, styles.center]} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <Text style={styles.emptyEmoji}>⭐</Text>
        <Text style={styles.emptyTitle}>Premium Feature</Text>
        <Text style={styles.emptyText}>Upgrade to save your favorite rivers</Text>
        <TouchableOpacity style={styles.premiumButton}>
          <Text style={styles.premiumButtonText}>Upgrade Now</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (favorites.length === 0) {
    return (
      <SafeAreaView style={[styles.container, styles.center]} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <Text style={styles.emptyEmoji}>💙</Text>
        <Text style={styles.emptyTitle}>No Favorites Yet</Text>
        <Text style={styles.emptyText}>Tap the star on any river to save it here</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={styles.favoritesHeader}>
        <Text style={styles.favoritesHeaderTitle}>⭐ Your Favorites</Text>
      </View>
      <FlatList
        data={favorites}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.riverCard}
            onPress={() => navigation.navigate('RiverDetails', { river: item })}
            activeOpacity={0.85}
          >
            <ImageBackground
              source={{ uri: RIVER_IMAGES[item] || RIVER_IMAGES['Madison River'] }}
              style={styles.riverCardBackground}
              imageStyle={styles.riverCardImage}
            >
              <View style={styles.riverCardOverlay}>
                <View style={styles.riverInfo}>
                  <Text style={styles.riverName}>{item}</Text>
                  <Text style={styles.riverSubtext}>Tap to view conditions</Text>
                </View>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

function PremiumScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <ScrollView contentContainerStyle={styles.premiumContainer}>
        <Text style={styles.premiumEmoji}>💎</Text>
        <Text style={styles.premiumTitle}>Go Premium</Text>
        <Text style={styles.premiumSubtitle}>Unlock the ultimate fishing experience</Text>
        
        <View style={styles.premiumFeatures}>
          <View style={styles.premiumFeature}>
            <Text style={styles.premiumFeatureIcon}>🎯</Text>
            <Text style={styles.premiumFeatureTitle}>Hatch Charts</Text>
            <Text style={styles.premiumFeatureDesc}>Current hatches & fly recommendations</Text>
          </View>
          
          <View style={styles.premiumFeature}>
            <Text style={styles.premiumFeatureIcon}>📍</Text>
            <Text style={styles.premiumFeatureTitle}>Access Points</Text>
            <Text style={styles.premiumFeatureDesc}>Detailed maps with boat launches & wade access</Text>
          </View>
          
          <View style={styles.premiumFeature}>
            <Text style={styles.premiumFeatureIcon}>⭐</Text>
            <Text style={styles.premiumFeatureTitle}>Favorites</Text>
            <Text style={styles.premiumFeatureDesc}>Save your go-to rivers for quick access</Text>
          </View>
          
          <View style={styles.premiumFeature}>
            <Text style={styles.premiumFeatureIcon}>📴</Text>
            <Text style={styles.premiumFeatureTitle}>Offline Mode</Text>
            <Text style={styles.premiumFeatureDesc}>Access reports without internet</Text>
          </View>
          
          <View style={styles.premiumFeature}>
            <Text style={styles.premiumFeatureIcon}>🚫</Text>
            <Text style={styles.premiumFeatureTitle}>Ad-Free</Text>
            <Text style={styles.premiumFeatureDesc}>Clean, uninterrupted experience</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.premiumCtaButton}>
          <Text style={styles.premiumCtaText}>Start Free Trial</Text>
        </TouchableOpacity>
        
        <Text style={styles.premiumPrice}>$4.99/month or $39.99/year</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function RiversStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="RiversList" component={RiversScreen} />
      <Stack.Screen name="RiverDetails" component={RiverDetailsScreen} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarStyle: styles.tabBar,
      })}
    >
      <Tab.Screen name="Rivers" component={RiversStack} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} />
      <Tab.Screen name="Premium" component={PremiumScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <MainTabs />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.gray,
    fontWeight: '600',
  },
  offlineBanner: {
    backgroundColor: COLORS.offline,
    padding: 8,
    alignItems: 'center',
  },
  offlineText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 12,
  },
  headerBackground: {
    height: 160,
    justifyContent: 'flex-end',
  },
  headerOverlay: {
    backgroundColor: 'rgba(26, 95, 122, 0.9)',
    padding: 16,
    paddingTop: 40,
    alignItems: 'center',
  },
  headerEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.accent,
    marginTop: 4,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  premiumBadge: {
    backgroundColor: COLORS.premium,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  premiumBadgeText: {
    color: COLORS.dark,
    fontWeight: 'bold',
    fontSize: 10,
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },
  riverCard: {
    marginVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  riverCardBackground: {
    height: 130,
  },
  riverCardImage: {
    borderRadius: 20,
  },
  riverCardOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 16,
  },
  riverInfo: {
    paddingLeft: 8,
  },
  riverName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.white,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    marginBottom: 4,
  },
  riverSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  detailHeaderBackground: {
    height: 180,
  },
  detailHeaderOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 95, 122, 0.85)',
    justifyContent: 'flex-end',
    padding: 20,
    paddingTop: 50,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: 40,
    zIndex: 10,
  },
  favoriteButton: {
    position: 'absolute',
    right: 16,
    top: 40,
    zIndex: 10,
  },
  backArrow: {
    fontSize: 32,
    color: COLORS.white,
    fontWeight: '300',
  },
  detailHeaderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  detailHeaderSubtitle: {
    fontSize: 13,
    color: COLORS.accent,
    marginTop: 4,
    fontWeight: '500',
  },
  detailScroll: {
    flex: 1,
    padding: 16,
  },
  dataCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  usgsCard: {
    borderWidth: 2,
    borderColor: COLORS.primary + '20',
  },
  locationLabelContainer: {
    backgroundColor: COLORS.primary + '12',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
  },
  locationLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  weatherIconLarge: {
    fontSize: 40,
    marginRight: 12,
  },
  cardIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  cardTitleContainer: {
    flex: 1,
  },
  dataCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  cardSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 2,
    fontWeight: '500',
  },
  weatherRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    paddingTop: 12,
  },
  weatherItem: {
    alignItems: 'center',
    flex: 1,
  },
  weatherDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e0e0e0',
  },
  weatherValueSmall: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  weatherValueTiny: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  weatherLabel: {
    fontSize: 10,
    color: COLORS.gray,
    marginTop: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  usgsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
  },
  usgsItem: {
    alignItems: 'center',
    flex: 1,
  },
  usgsDivider: {
    width: 1,
    height: 50,
    backgroundColor: '#e0e0e0',
  },
  usgsValueSmall: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  usgsLabel: {
    fontSize: 10,
    color: COLORS.gray,
    marginTop: 6,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tapIndicator: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.primary + '15',
    alignItems: 'center',
  },
  tapIndicatorText: {
    fontSize: 14,
    color: COLORS.secondary,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 16,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  reportCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sourceBadge: {
    backgroundColor: COLORS.primary + '12',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    flex: 1,
    marginRight: 12,
  },
  sourceText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.gray,
    fontWeight: '500',
  },
  reportFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 14,
    marginTop: 4,
  },
  linkButton: {
    fontSize: 15,
    color: COLORS.secondary,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 8,
  },
  emptyText: {
    color: COLORS.gray,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  upgradeBanner: {
    backgroundColor: COLORS.premium,
    padding: 16,
    marginBottom: 16,
    borderRadius: 16,
  },
  upgradeBannerText: {
    color: COLORS.dark,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.dark,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 20,
  },
  featureList: {
    marginBottom: 24,
  },
  featureItem: {
    fontSize: 16,
    color: COLORS.dark,
    paddingVertical: 8,
  },
  premiumButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  premiumButtonYearly: {
    backgroundColor: COLORS.success,
  },
  premiumButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalClose: {
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 8,
  },
  tabBar: {
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    height: Platform.OS === 'ios' ? 88 : 68,
  },
  mapHeader: {
    backgroundColor: COLORS.primary,
    padding: 16,
    paddingTop: 50,
  },
  mapHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  mapHeaderSubtitle: {
    fontSize: 12,
    color: COLORS.accent,
    marginTop: 4,
  },
  favoritesHeader: {
    backgroundColor: COLORS.primary,
    padding: 16,
    paddingTop: 50,
  },
  favoritesHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  premiumContainer: {
    padding: 24,
    alignItems: 'center',
  },
  premiumEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  premiumTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 8,
  },
  premiumSubtitle: {
    fontSize: 16,
    color: COLORS.gray,
    marginBottom: 32,
    textAlign: 'center',
  },
  premiumFeatures: {
    width: '100%',
    marginBottom: 32,
  },
  premiumFeature: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  premiumFeatureIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  premiumFeatureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 4,
  },
  premiumFeatureDesc: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
  },
  premiumCtaButton: {
    backgroundColor: COLORS.premium,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    marginBottom: 12,
  },
  premiumCtaText: {
    color: COLORS.dark,
    fontWeight: 'bold',
    fontSize: 18,
  },
  premiumPrice: {
    color: COLORS.gray,
    fontSize: 14,
  },
});

import React, { useState, useEffect } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, 
  RefreshControl, StyleSheet, Linking, ActivityIndicator,
  SafeAreaView, StatusBar, ImageBackground, ScrollView, Dimensions
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

const API_URL = 'https://montana-fishing-reports-production.up.railway.app';

// River background images
const RIVER_IMAGES = {
  'Gallatin River': 'https://images.unsplash.com/photo-1542662565-7e4b66b529c5?w=800&q=80',
  'Upper Madison River': 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&q=80',
  'Lower Madison River': 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80',
  'Yellowstone River': 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80',
  'Missouri River': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
  'Clark Fork River': 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=800&q=80',
  'Blackfoot River': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80',
  'Bitterroot River': 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80',
  'Rock Creek': 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80',
  'Bighorn River': 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80',
  'Beaverhead River': 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800&q=80',
  'Big Hole River': 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80',
  'Flathead River': 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800&q=80',
  'Jefferson River': 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80',
  'Madison River': 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&q=80',
  'Swan River': 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80',
  'Spring Creeks': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
  'Boulder River': 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80',
  'Ruby River': 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80',
  'Stillwater River': 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=800&q=80',
  'Yellowstone National Park': 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80'
};

const COLORS = {
  primary: '#1a5f7a',
  secondary: '#159895',
  accent: '#57c5b6',
  background: '#f0f4f8',
  white: '#ffffff',
  dark: '#2c3e50',
  gray: '#7f8c8d',
  glass: 'rgba(255,255,255,0.95)',
  glassDark: 'rgba(0,0,0,0.4)'
};

const { width } = Dimensions.get('window');

function HomeScreen({ navigation }) {
  const [rivers, setRivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchRivers();
  }, []);

  const fetchRivers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/rivers`);
      const data = await response.json();
      const sortedRivers = data.rivers.sort((a, b) => {
        if (a.includes('Madison') && b.includes('Madison')) {
          return a.localeCompare(b);
        }
        return a.localeCompare(b);
      });
      setRivers(sortedRivers);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRivers();
    setRefreshing(false);
  };

  const getRiverIcon = (river) => {
    if (river.includes('Gallatin')) return '🏔️';
    if (river.includes('Upper Madison')) return '⬆️';
    if (river.includes('Lower Madison')) return '⬇️';
    if (river.includes('Madison')) return '🎣';
    if (river.includes('Yellowstone')) return '🌲';
    if (river.includes('Missouri')) return '🚣';
    if (river.includes('Bighorn')) return '🦌';
    if (river.includes('Blackfoot')) return '🌲';
    if (river.includes('Clark')) return '⛰️';
    if (river.includes('Bitterroot')) return '🏔️';
    if (river.includes('Rock')) return '🪨';
    if (river.includes('Beaverhead')) return '🦫';
    if (river.includes('Big Hole')) return '🕳️';
    if (river.includes('Flathead')) return '🏔️';
    if (river.includes('Jefferson')) return '🇺🇸';
    if (river.includes('Swan')) return '🦢';
    if (river.includes('Spring')) return '🌸';
    if (river.includes('Boulder')) return '🪨';
    if (river.includes('Ruby')) return '💎';
    if (river.includes('Stillwater')) return '🌊';
    return '🎣';
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80' }}
        style={styles.headerBackground}
      >
        <View style={styles.headerOverlay}>
          <Text style={styles.headerEmoji}>🏔️</Text>
          <Text style={styles.headerTitle}>Montana Fishing</Text>
          <Text style={styles.headerSubtitle}>{rivers.length} Rivers • Live Reports & Conditions</Text>
        </View>
      </ImageBackground>

      <FlatList
        data={rivers}
        keyExtractor={(item) => item}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
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
                <View style={styles.riverContent}>
                  <View style={styles.riverIconContainer}>
                    <Text style={styles.riverIcon}>{getRiverIcon(item)}</Text>
                  </View>
                  <View style={styles.riverInfo}>
                    <Text style={styles.riverName}>{item}</Text>
                    <Text style={styles.riverSubtext}>{getRiverSubtitle(item)}</Text>
                  </View>
                </View>
                <View style={styles.arrowContainer}>
                  <Text style={styles.arrow}>›</Text>
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

  useEffect(() => {
    fetchRiverData();
  }, []);

  const fetchRiverData = async () => {
    try {
      const response = await fetch(`${API_URL}/api/river-details/${encodeURIComponent(river)}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRiverData();
    setRefreshing(false);
  };

  const openReport = (url) => {
    if (url) {
      Linking.openURL(url);
    }
  };

  const openUSGS = (url) => {
    if (url) {
      Linking.openURL(url);
    }
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      <ImageBackground
        source={{ uri: RIVER_IMAGES[river] || RIVER_IMAGES['Madison River'] }}
        style={styles.detailHeaderBackground}
      >
        <View style={styles.detailHeaderOverlay}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.detailHeaderTitle}>{river}</Text>
          <Text style={styles.detailHeaderSubtitle}>
            {data?.reports?.length || 0} Report Sources
          </Text>
        </View>
      </ImageBackground>

      <ScrollView 
        style={styles.detailScroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        {/* Weather Card with Location Label */}
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
                <Text style={styles.weatherValue}>{data.weather.high}°</Text>
                <Text style={styles.weatherLabel}>High</Text>
              </View>
              <View style={styles.weatherDivider} />
              <View style={styles.weatherItem}>
                <Text style={styles.weatherValue}>{data.weather.low}°</Text>
                <Text style={styles.weatherLabel}>Low</Text>
              </View>
              <View style={styles.weatherDivider} />
              <View style={styles.weatherItem}>
                <Text style={styles.weatherValue}>{data.weather.wind || '--'}</Text>
                <Text style={styles.weatherLabel}>Wind</Text>
              </View>
            </View>
          </View>
        )}

        {/* USGS Data Card with Location Label - NOW A BUTTON */}
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
                <Text style={styles.usgsValue}>{data.usgs.flow}</Text>
                <Text style={styles.usgsLabel}>Flow (cfs)</Text>
              </View>
              <View style={styles.usgsDivider} />
              <View style={styles.usgsItem}>
                <Text style={styles.usgsValue}>{data.usgs.temp}</Text>
                <Text style={styles.usgsLabel}>Water Temp</Text>
              </View>
            </View>
            <View style={styles.tapIndicator}>
              <Text style={styles.tapIndicatorText}>Tap to view on USGS website →</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Reports Section */}
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
              <Text style={styles.dateText}>{report.last_updated || 'Recently updated'}</Text>
            </View>
            
            {/* Flow Data as the clickable link */}
            {report.flow && (
              <View style={styles.flowDataContainer}>
                <View style={styles.flowDataRow}>
                  <View style={styles.flowDataItem}>
                    <Text style={styles.flowDataValue}>{report.flow}</Text>
                    <Text style={styles.flowDataLabel}>Flow</Text>
                  </View>
                  {report.temp && (
                    <>
                      <View style={styles.flowDataDivider} />
                      <View style={styles.flowDataItem}>
                        <Text style={styles.flowDataValue}>{report.temp}</Text>
                        <Text style={styles.flowDataLabel}>Temp</Text>
                      </View>
                    </>
                  )}
                </View>
                <Text style={styles.tapToView}>Tap to view full report →</Text>
              </View>
            )}
            
            {/* Fallback if no flow data */}
            {!report.flow && (
              <View style={styles.reportFooter}>
                <Text style={styles.linkButton}>Read Full Report →</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
        
        {(!data?.reports || data.reports.length === 0) && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No reports available</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="RiverDetails" component={RiverDetailsScreen} />
      </Stack.Navigator>
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
  
  // Header with background image
  headerBackground: {
    height: 200,
    justifyContent: 'flex-end',
  },
  headerOverlay: {
    backgroundColor: 'rgba(26, 95, 122, 0.9)',
    padding: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  headerEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.accent,
    marginTop: 6,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  
  // River cards with images
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  riverContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  riverIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  riverIcon: {
    fontSize: 28,
  },
  riverInfo: {
    flex: 1,
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
  arrowContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  arrow: {
    fontSize: 28,
    color: COLORS.primary,
    fontWeight: '400',
  },
  
  // Detail screen
  detailHeaderBackground: {
    height: 220,
  },
  detailHeaderOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 95, 122, 0.85)',
    justifyContent: 'flex-end',
    padding: 24,
    paddingTop: 60,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 50,
    zIndex: 10,
  },
  backArrow: {
    fontSize: 40,
    color: COLORS.white,
    fontWeight: '300',
  },
  detailHeaderTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  detailHeaderSubtitle: {
    fontSize: 14,
    color: COLORS.accent,
    marginTop: 4,
    fontWeight: '500',
  },
  detailScroll: {
    flex: 1,
    padding: 16,
  },
  
  // Data cards
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
  
  // Weather styles
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
  weatherValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  weatherLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  // USGS styles
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
  usgsValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  usgsLabel: {
    fontSize: 12,
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
  
  // Reports section
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
  emptyText: {
    color: COLORS.gray,
    fontSize: 16,
  },
  
  // Flow data styles
  flowDataContainer: {
    backgroundColor: COLORS.primary + '08',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.primary + '15',
  },
  flowDataRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 8,
  },
  flowDataItem: {
    alignItems: 'center',
    flex: 1,
  },
  flowDataDivider: {
    width: 1,
    height: 35,
    backgroundColor: COLORS.primary + '20',
  },
  flowDataValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  flowDataLabel: {
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tapToView: {
    fontSize: 13,
    color: COLORS.secondary,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
});

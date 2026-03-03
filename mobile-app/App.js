import React, { useState, useEffect } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, 
  RefreshControl, StyleSheet, Linking, ActivityIndicator,
  SafeAreaView, StatusBar, ImageBackground, ScrollView, Dimensions
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

const API_URL = 'https://montana-fishing-reports-production.up.railway.app';

// UNIQUE Montana fly fishing photos - NO DUPLICATES
const RIVER_IMAGES = {
  'Gallatin River': 'https://kimi-web-img.moonshot.cn/img/www.montanaangler.com/5da186a0cdc7ac12c6bf04dfffd28fcb75744cbd.jpg',
  'Upper Madison River': 'https://kimi-web-img.moonshot.cn/img/www.montanaangler.com/0fd71b248cbb916d94177d588802fdcb517fa84e.jpg',
  'Lower Madison River': 'https://kimi-web-img.moonshot.cn/img/www.montanaangler.com/dd52029470670cb7607430e953c30aba14cf27e6.jpg',
  'Yellowstone River': 'https://kimi-web-img.moonshot.cn/img/cloudfront-us-east-1.images.arcpublishing.com/fa4903563f6abd5b1df4ec94dd0996a1a2fc2cf4.jpg',
  'Missouri River': 'https://kimi-web-img.moonshot.cn/img/www.montanaangler.com/ea2172d02bb161878cb22b8af779bf8267a192b9.jpg',
  'Clark Fork River': 'https://kimi-web-img.moonshot.cn/img/upload.wikimedia.org/be8884492c0477bf4ad5dddf146de8ff7b750414.jpg',
  'Blackfoot River': 'https://kimi-web-img.moonshot.cn/img/www.montanaanglingco.com/ee77323b70135d99c54776d5cdcea7d3b931c4fa.jpg',
  'Bitterroot River': 'https://kimi-web-img.moonshot.cn/img/cdn.shopify.com/be1deb3dfce0c9a3f569662f8aec6ff6111b94b5.jpg',
  'Rock Creek': 'https://kimi-web-img.moonshot.cn/img/www.montanaangler.com/0c66fa71bfa689d511b0f42a439e1da349fb1203.jpg',
  'Bighorn River': 'https://kimi-web-img.moonshot.cn/img/content.osgnetworks.tv/660d78a43c6080171c74be7a9fdac42598094ea2.jpg',
  'Beaverhead River': 'https://kimi-web-img.moonshot.cn/img/www.montanaangler.com/15b194e03f6aafe436181d8b7fb4b43120ece011.jpg',
  'Big Hole River': 'https://kimi-web-img.moonshot.cn/img/crazyrainbow.net/b0fa7c7255211aeb651a91678af25e4324ec4467.jpg',
  'Flathead River': 'https://kimi-web-img.moonshot.cn/img/wyominganglers.com/bef101a62a16b2a92adda886b69479123d476729.jpg',
  'Jefferson River': 'https://kimi-web-img.moonshot.cn/img/www.montanaangler.com/864af44ff2ef74894735c7973d58d22a5e0e4cd4.jpg',
  'Madison River': 'https://kimi-web-img.moonshot.cn/img/www.nps.gov/1f2c24f834168975e68f5a15b9fe9dad52b04354.JPG',
  'Swan River': 'https://kimi-web-img.moonshot.cn/img/www.montanaangler.com/7ef8e0f8a69c7e9ea5bb575dec75708ce3eb1a71.jpg',
  'Spring Creeks': 'https://kimi-web-img.moonshot.cn/img/www.montanaangler.com/15b194e03f6aafe436181d8b7fb4b43120ece011.jpg',
  'Boulder River': 'https://kimi-web-img.moonshot.cn/img/www.montanaangler.com/8c16be25cb7dd7fb97f76b38a2ee48035cbe3805.jpg',
  'Ruby River': 'https://kimi-web-img.moonshot.cn/img/www.montanaangler.com/3a161e987f1ea924d8885b004ba386df1ab92a31.jpg',
  'Stillwater River': 'https://kimi-web-img.moonshot.cn/img/www.montanaangler.com/b5e2a94d41d8913cd0cd7eb5b11455dca84efe8d.jpg',
  'Yellowstone National Park': 'https://kimi-web-img.moonshot.cn/img/www.montanaangler.com/7ef8e0f8a69c7e9ea5bb575dec75708ce3eb1a71.jpg'
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

// Helper function to standardize dates
const formatDate = (dateString) => {
  if (!dateString) return 'Recently updated';
  
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    return dateString.length > 20 ? dateString.substring(0, 20) + '...' : dateString;
  }
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

// Helper function to remove duplicate reports
const removeDuplicateReports = (reports) => {
  if (!reports || !Array.isArray(reports)) return [];
  
  const seen = new Set();
  return reports.filter(report => {
    if (!report.url || report.url.trim() === '') {
      return false;
    }
    
    const source = (report.source || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    
    if (seen.has(source)) {
      return false;
    }
    
    seen.add(source);
    return true;
  });
};

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
        source={{ uri: 'https://kimi-web-img.moonshot.cn/img/www.montanaangler.com/5da186a0cdc7ac12c6bf04dfffd28fcb75744cbd.jpg' }}
        style={styles.headerBackground}
      >
        <View style={styles.headerOverlay}>
          <Text style={styles.headerEmoji}>🏔️</Text>
          <Text style={styles.headerTitle}>Montana Fishing</Text>
          <Text style={styles.headerSubtitle}>Most up to date fishing reports</Text>
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
                  <View style={styles.riverInfo}>
                    <Text style={styles.riverName}>{item}</Text>
                    <Text style={styles.riverSubtext}>{getRiverSubtitle(item)}</Text>
                  </View>
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
      
      if (result.reports) {
        result.reports = removeDuplicateReports(result.reports);
      }
      
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
                <Text style={styles.weatherValueSmall}>{data.weather.wind || '--'}</Text>
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
    padding: 16,
    // ARROW REMOVED - no justifyContent: 'space-between'
  },
  riverContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingLeft: 8,
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
  // NO ARROW CONTAINER STYLES - COMPLETELY REMOVED
  
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
  weatherValue: {
    fontSize: 28, // REDUCED from 36
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  weatherValueSmall: {
    fontSize: 20, // SMALLER for wind
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  weatherLabel: {
    fontSize: 11, // REDUCED from 12
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
  usgsValue: {
    fontSize: 28, // REDUCED from 32
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  usgsValueSmall: {
    fontSize: 22, // SMALLER for flow/temp
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  usgsLabel: {
    fontSize: 11, // REDUCED from 12
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
  emptyText: {
    color: COLORS.gray,
    fontSize: 16,
  },
  
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

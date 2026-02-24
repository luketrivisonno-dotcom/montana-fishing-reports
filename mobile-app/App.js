import React, { useState, useEffect } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, ActivityIndicator,
  ScrollView, Linking, ImageBackground, StyleSheet
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

const API_URL = 'https://montana-fishing-reports-production.up.railway.app';

// REAL Montana river photos
const RIVER_IMAGES = {
  'Gallatin River': 'https://kimi-web-img.moonshot.cn/img/www.montanaangler.com/5da186a0cdc7ac12c6bf04dfffd28fcb75744cbd.jpg',
  'Upper Madison River': 'https://kimi-web-img.moonshot.cn/img/outsidebozeman.com/ef44c8cafcdcb2559cc1b4a262dd8f71f15d210d.jpg',
  'Lower Madison River': 'https://kimi-web-img.moonshot.cn/img/www.montanaanglingco.com/e6c35296ed5c7ef6a0473bd95fe0875254933e3c.jpg',
  'Yellowstone River': 'https://kimi-web-img.moonshot.cn/img/cdn.britannica.com/42e97f3811817feb3583d64a23ae2e6be7a3b78d.jpg',
  'Missouri River': 'https://kimi-web-img.moonshot.cn/img/southwestmt.com/8445564a1fac26209b20106b8502fe817829e12e.jpg',
  'Bighorn River': 'https://kimi-web-img.moonshot.cn/img/bighornangler.com/a0151f1f09cfadf3ce67e482a359393178edafe7.png',
  'Clark Fork River': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
  'Blackfoot River': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
  'Bitterroot River': 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800',
  'Rock Creek': 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800',
  'Madison River': 'https://kimi-web-img.moonshot.cn/img/outsidebozeman.com/ef44c8cafcdcb2559cc1b4a262dd8f71f15d210d.jpg'
};

const COLORS = {
  primary: '#1a5f7a',
  secondary: '#159895',
  accent: '#57c5b6',
  background: '#f0f4f8',
  white: '#ffffff',
  dark: '#2c3e50',
  gray: '#7f8c8d',
};

function HomeScreen({ navigation }) {
  const [rivers, setRivers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/rivers`)
      .then(res => res.json())
      .then(data => {
        setRivers(data.rivers);
        setLoading(false);
      });
  }, []);

  const getRiverIcon = (river) => {
    if (river.includes('Gallatin')) return '🏔️';
    if (river.includes('Madison')) return '🎣';
    if (river.includes('Yellowstone')) return '🌲';
    if (river.includes('Missouri')) return '🚣';
    if (river.includes('Bighorn')) return '🦌';
    if (river.includes('Blackfoot')) return '🌲';
    if (river.includes('Clark')) return '⛰️';
    if (river.includes('Bitterroot')) return '🏔️';
    if (river.includes('Rock')) return '🪨';
    return '🎣';
  };

  if (loading) return <ActivityIndicator style={{flex: 1}} size="large" color={COLORS.primary} />;

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: RIVER_IMAGES['Gallatin River'] }}
        style={styles.headerBackground}
      >
        <View style={styles.headerOverlay}>
          <Text style={styles.headerTitle}>🏔️ Montana Fishing</Text>
          <Text style={styles.headerSubtitle}>{rivers.length} Rivers • Live Reports</Text>
        </View>
      </ImageBackground>

      <FlatList
        data={rivers}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.riverCard}
            onPress={() => navigation.navigate('Details', { river: item })}
            activeOpacity={0.8}
          >
            <ImageBackground
              source={{ uri: RIVER_IMAGES[item] || RIVER_IMAGES['Madison River'] }}
              style={styles.riverCardBackground}
            >
              <View style={styles.riverCardOverlay}>
                <View style={styles.riverIconContainer}>
                  <Text style={styles.riverIcon}>{getRiverIcon(item)}</Text>
                </View>
                <View style={styles.riverInfo}>
                  <Text style={styles.riverName}>{item}</Text>
                  <Text style={styles.riverSubtext}>Weather • Flows • Reports</Text>
                </View>
                <Text style={styles.arrow}>›</Text>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

function DetailsScreen({ route, navigation }) {
  const { river } = route.params;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/river-details/${encodeURIComponent(river)}`)
      .then(res => res.json())
      .then(result => {
        setData(result);
        setLoading(false);
      });
  }, [river]);

  if (loading) return <ActivityIndicator style={{flex: 1}} size="large" color={COLORS.primary} />;

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: RIVER_IMAGES[river] || RIVER_IMAGES['Madison River'] }}
        style={styles.detailHeader}
      >
        <View style={styles.detailHeaderOverlay}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.detailTitle}>{river}</Text>
          <Text style={styles.detailSubtitle}>{data?.reports?.length || 0} Report Sources</Text>
        </View>
      </ImageBackground>

      <ScrollView style={styles.scrollView}>
        {/* Weather */}
        {data?.weather && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🌤️ Today's Weather</Text>
            <View style={styles.weatherRow}>
              <View style={styles.weatherItem}>
                <Text style={[styles.weatherValue, {color: '#e74c3c'}]}>{data.weather.high}°</Text>
                <Text style={styles.weatherLabel}>High</Text>
              </View>
              <View style={styles.weatherItem}>
                <Text style={[styles.weatherValue, {color: '#3498db'}]}>{data.weather.low}°</Text>
                <Text style={styles.weatherLabel}>Low</Text>
              </View>
              <View style={styles.weatherCondition}>
                <Text style={styles.conditionText}>{data.weather.condition}</Text>
              </View>
            </View>
          </View>
        )}

        {/* USGS */}
        {data?.usgs && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📊 Live River Data (USGS)</Text>
            <View style={styles.usgsRow}>
              <View style={styles.usgsItem}>
                <Text style={styles.usgsValue}>{data.usgs.flow}</Text>
                <Text style={styles.usgsLabel}>Flow Rate</Text>
              </View>
              <View style={styles.usgsItem}>
                <Text style={styles.usgsValue}>{data.usgs.temp}</Text>
                <Text style={styles.usgsLabel}>Water Temp</Text>
              </View>
            </View>
          </View>
        )}

        {/* Reports */}
        <Text style={styles.sectionTitle}>📰 Latest Fishing Reports</Text>
        {data?.reports?.map((report) => (
          <TouchableOpacity 
            key={report.id}
            style={styles.reportCard}
            onPress={() => Linking.openURL(report.url)}
          >
            <View style={styles.reportHeader}>
              <Text style={styles.sourceName}>{report.source}</Text>
              <Text style={styles.reportDate}>{report.last_updated || 'No date'}</Text>
            </View>
            <Text style={styles.readMore}>Read Full Report →</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Details" component={DetailsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerBackground: {
    height: 160,
  },
  headerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 95, 122, 0.85)',
    justifyContent: 'center',
    padding: 20,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.accent,
    marginTop: 4,
  },
  riverCard: {
    margin: 10,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  riverCardBackground: {
    height: 110,
  },
  riverCardOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  riverIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  riverIcon: {
    fontSize: 24,
  },
  riverInfo: {
    flex: 1,
  },
  riverName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  riverSubtext: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  arrow: {
    fontSize: 32,
    color: COLORS.white,
    fontWeight: '300',
  },
  detailHeader: {
    height: 180,
  },
  detailHeaderOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 95, 122, 0.8)',
    justifyContent: 'flex-end',
    padding: 20,
    paddingTop: 50,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 50,
  },
  backArrow: {
    fontSize: 40,
    color: COLORS.white,
    fontWeight: '300',
  },
  detailTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  detailSubtitle: {
    fontSize: 14,
    color: COLORS.accent,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
    padding: 12,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 12,
  },
  weatherRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  weatherItem: {
    alignItems: 'center',
    flex: 1,
  },
  weatherValue: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  weatherLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  weatherCondition: {
    flex: 1.5,
    alignItems: 'center',
  },
  conditionText: {
    fontSize: 15,
    color: COLORS.secondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  usgsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  usgsItem: {
    alignItems: 'center',
    flex: 1,
  },
  usgsValue: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  usgsLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginVertical: 12,
    marginLeft: 4,
  },
  reportCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sourceName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.primary,
    flex: 1,
  },
  reportDate: {
    fontSize: 12,
    color: COLORS.gray,
  },
  readMore: {
    fontSize: 14,
    color: COLORS.secondary,
    fontWeight: '600',
  },
});

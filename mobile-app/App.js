import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  RefreshControl, StyleSheet, Linking, ActivityIndicator,
  SafeAreaView, StatusBar, ImageBackground, ScrollView, Dimensions
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HatchChart from './components/HatchChart';   // ← Clean single import

const API_URL = 'https://montana-fishing-reports-production.up.railway.app';

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
  gray: '#7f8c8d'
};

const { width } = Dimensions.get('window');

const formatDate = (dateString) => {
  if (!dateString) return 'Recently updated';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
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

function HomeScreen({ navigation }) {
  const [rivers, setRivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchRivers(); }, []);

  const fetchRivers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/rivers`);
      const data = await response.json();
      const sortedRivers = data.rivers.sort((a, b) => a.localeCompare(b));
      setRivers(sortedRivers);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const onRefresh = async () => { setRefreshing(true); await fetchRivers(); setRefreshing(false); };

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
      <ImageBackground source={{ uri: 'https://kimi-web-img.moonshot.cn/img/www.montanaangler.com/5da186a0cdc7ac12c6bf04dfffd28fcb75744cbd.jpg' }} style={styles.headerBackground}>
        <View style={styles.headerOverlay}>
          <Text style={styles.headerEmoji}>🏔️</Text>
          <Text style={styles.headerTitle}>Montana Fishing</Text>
          <Text style={styles.headerSubtitle}>Most up to date fishing reports</Text>
        </View>
      </ImageBackground>
      <FlatList
        data={rivers}
        keyExtractor={(item) => item}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.riverCard} onPress={() => navigation.navigate('RiverDetails', { river: item })} activeOpacity={0.85}>
            <ImageBackground source={{ uri: RIVER_IMAGES[item] || RIVER_IMAGES['Madison River'] }} style={styles.riverCardBackground} imageStyle={styles.riverCardImage}>
              <View style={styles.riverCardOverlay}>
                <View style={styles.riverInfo}>
                  <Text style={styles.riverName}>{item}</Text>
                  <Text style={styles.riverSubtext}>Tap for flows, weather & reports</Text>
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

  useEffect(() => { fetchRiverData(); }, []);

  const fetchRiverData = async () => {
    try {
      const response = await fetch(`${API_URL}/api/river-details/${encodeURIComponent(river)}`);
      const result = await response.json();
      if (result.reports) result.reports = removeDuplicateReports(result.reports);
      setData(result);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const onRefresh = async () => { setRefreshing(true); await fetchRiverData(); setRefreshing(false); };

  const openReport = (url) => url && Linking.openURL(url);
  const openUSGS = (url) => url && Linking.openURL(url);

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
      <ImageBackground source={{ uri: RIVER_IMAGES[river] || RIVER_IMAGES['Madison River'] }} style={styles.detailHeaderBackground}>
        <View style={styles.detailHeaderOverlay}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.detailHeaderTitle}>{river}</Text>
          <Text style={styles.detailHeaderSubtitle}>{data?.reports?.length || 0} Report Sources</Text>
        </View>
      </ImageBackground>

      <ScrollView style={styles.detailScroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}>
        {data?.weather && ( /* weather card */ )}
        {data?.usgs && ( /* usgs card */ )}

        {/* ✅ Clean Hatch Chart - only ONE instance, right place */}
        <HatchChart riverName={river} />

        <Text style={styles.sectionTitle}>Latest Fishing Reports</Text>
        {data?.reports?.map((report, index) => (
          <TouchableOpacity key={report.id || index} style={styles.reportCard} onPress={() => openReport(report.url)} activeOpacity={0.8}>
            {/* report card content */}
          </TouchableOpacity>
        ))}
        {(!data?.reports || data.reports.length === 0) && <View style={styles.emptyState}><Text style={styles.emptyText}>No reports available</Text></View>}
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

const styles = StyleSheet.create({ /* all your original styles here - unchanged */ });

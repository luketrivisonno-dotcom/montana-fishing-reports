// Root App.js - This is the web/React Native Web entry point
// For the mobile app, see mobile-app/App.js

import React, { useState, useEffect } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, 
  RefreshControl, StyleSheet, Linking, ActivityIndicator,
  SafeAreaView, StatusBar, ImageBackground, ScrollView,
  TextInput, Platform
} from 'react-native';

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
  'Jefferson River': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'
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

const formatDate = (dateString) => {
  if (!dateString || dateString === 'No date') return 'No date';
  try {
    let date;
    if (dateString.includes('/')) {
      const parts = dateString.split('/');
      date = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
    } else if (dateString.includes('-')) {
      date = new Date(dateString);
    } else {
      date = new Date(dateString);
    }
    if (isNaN(date.getTime())) return dateString;
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  } catch (e) {
    return dateString;
  }
};

export default function App() {
  const [rivers, setRivers] = useState([]);
  const [filteredRivers, setFilteredRivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRiver, setSelectedRiver] = useState(null);
  const [riverData, setRiverData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchRivers();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = rivers.filter(r => 
        r.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredRivers(filtered);
    } else {
      setFilteredRivers(rivers);
    }
  }, [searchQuery, rivers]);

  const fetchRivers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/rivers`);
      const data = await response.json();
      setRivers(data.rivers || []);
      setFilteredRivers(data.rivers || []);
    } catch (error) {
      console.error('Error fetching rivers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRiverData = async (river) => {
    try {
      const response = await fetch(`${API_URL}/api/river-details/${encodeURIComponent(river)}`);
      const result = await response.json();
      setRiverData(result);
      setSelectedRiver(river);
    } catch (error) {
      console.error('Error fetching river data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRivers();
    setRefreshing(false);
  };

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
    if (river.includes('Beaverhead')) return '🦫';
    if (river.includes('Big Hole')) return '🕳️';
    if (river.includes('Flathead')) return '🏔️';
    if (river.includes('Jefferson')) return '🇺🇸';
    return '🎣';
  };

  const openReport = (url) => {
    if (url) Linking.openURL(url);
  };

  const openUSGS = (url) => {
    if (url) Linking.openURL(url);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading Rivers...</Text>
      </View>
    );
  }

  if (selectedRiver) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        
        <ImageBackground
          source={{ uri: RIVER_IMAGES[selectedRiver] || RIVER_IMAGES['Gallatin River'] }}
          style={styles.detailHeaderBackground}
        >
          <View style={styles.detailHeaderOverlay}>
            <TouchableOpacity onPress={() => setSelectedRiver(null)} style={styles.backButton}>
              <Text style={styles.backArrow}>‹ Back</Text>
            </TouchableOpacity>
            <Text style={styles.detailHeaderTitle}>{selectedRiver}</Text>
            <Text style={styles.detailHeaderSubtitle}>
              {riverData?.reports?.length || 0} Sources • Updated Today
            </Text>
          </View>
        </ImageBackground>

        <ScrollView style={styles.detailScroll}>
          {riverData?.weather && (
            <View style={styles.dataCard}>
              <Text style={styles.dataCardTitle}>🌤️ Today's Weather</Text>
              <Text style={styles.weatherLocation}>{riverData.weather.location}</Text>
              <View style={styles.weatherRow}>
                <View style={styles.weatherItem}>
                  <Text style={styles.weatherValue}>{riverData.weather.high}°</Text>
                  <Text style={styles.weatherLabel}>High</Text>
                </View>
                <View style={styles.weatherItem}>
                  <Text style={styles.weatherValue}>{riverData.weather.low}°</Text>
                  <Text style={styles.weatherLabel}>Low</Text>
                </View>
                <View style={styles.weatherItemWide}>
                  <Text style={styles.weatherIcon}>{riverData.weather.icon || '🌤️'}</Text>
                  <Text style={styles.weatherCondition}>{riverData.weather.condition}</Text>
                </View>
              </View>
            </View>
          )}

          {riverData?.usgs && (
            <TouchableOpacity 
              style={styles.dataCard}
              onPress={() => openUSGS(riverData.usgs.url)}
              activeOpacity={0.8}
            >
              <Text style={styles.dataCardTitle}>📊 Current Conditions (USGS) →</Text>
              <View style={styles.usgsRow}>
                <View style={styles.usgsItem}>
                  <Text style={styles.usgsValue}>{riverData.usgs.flow}</Text>
                  <Text style={styles.usgsLabel}>Flow</Text>
                </View>
                <View style={styles.usgsItem}>
                  <Text style={styles.usgsValue}>{riverData.usgs.temp}</Text>
                  <Text style={styles.usgsLabel}>Water Temp</Text>
                </View>
              </View>
              <Text style={styles.tapHint}>Tap to view on USGS website</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.sectionTitle}>📰 Fishing Reports</Text>
          {riverData?.reports?.map((report) => (
            <TouchableOpacity 
              key={report.id}
              style={styles.reportCard}
              onPress={() => openReport(report.url)}
              activeOpacity={0.8}
            >
              <View style={styles.reportHeader}>
                <View style={styles.sourceBadge}>
                  <Text style={styles.sourceText}>{report.source}</Text>
                </View>
                <Text style={styles.dateText}>{formatDate(report.last_updated)}</Text>
              </View>
              <Text style={styles.linkButton}>Read Full Report →</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800' }}
        style={styles.headerBackground}
      >
        <View style={styles.headerOverlay}>
          <Text style={styles.headerTitle}>🏔️ Montana Fishing</Text>
          <Text style={styles.headerSubtitle}>{rivers.length} Rivers • Real-Time Reports</Text>
        </View>
      </ImageBackground>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search rivers..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={COLORS.gray}
        />
      </View>

      <FlatList
        data={filteredRivers}
        keyExtractor={(item) => item}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.riverCard}
            onPress={() => fetchRiverData(item)}
            activeOpacity={0.8}
          >
            <ImageBackground
              source={{ uri: RIVER_IMAGES[item] || RIVER_IMAGES['Gallatin River'] }}
              style={styles.riverCardBackground}
              imageStyle={styles.riverCardImage}
            >
              <View style={styles.riverCardOverlay}>
                <View style={styles.riverIconContainer}>
                  <Text style={styles.riverIcon}>{getRiverIcon(item)}</Text>
                </View>
                <View style={styles.riverInfo}>
                  <Text style={styles.riverName}>{item}</Text>
                  <Text style={styles.riverSubtext}>Tap for flows, weather & reports</Text>
                </View>
                <View style={styles.arrowContainer}>
                  <Text style={styles.arrow}>›</Text>
                </View>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No rivers found</Text>
          </View>
        }
      />
    </SafeAreaView>
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
    fontWeight: '500',
  },
  headerBackground: {
    height: 180,
    justifyContent: 'flex-end',
  },
  headerOverlay: {
    backgroundColor: 'rgba(26, 95, 122, 0.85)',
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
  searchContainer: {
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 10,
    fontSize: 16,
    color: COLORS.dark,
  },
  listContainer: {
    padding: 12,
  },
  riverCard: {
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  riverCardBackground: {
    height: 120,
  },
  riverCardImage: {
    borderRadius: 16,
  },
  riverCardOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  riverIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  arrowContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrow: {
    fontSize: 24,
    color: COLORS.primary,
    fontWeight: '300',
  },
  detailHeaderBackground: {
    height: 200,
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
    fontSize: 18,
    color: COLORS.white,
    fontWeight: '500',
  },
  detailHeaderTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  detailHeaderSubtitle: {
    fontSize: 14,
    color: COLORS.accent,
    marginTop: 4,
  },
  detailScroll: {
    flex: 1,
    padding: 16,
  },
  dataCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dataCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 8,
  },
  weatherLocation: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 12,
    fontStyle: 'italic',
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
  weatherItemWide: {
    alignItems: 'center',
    flex: 2,
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
  },
  weatherIcon: {
    fontSize: 48,
    marginBottom: 4,
  },
  weatherCondition: {
    fontSize: 14,
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
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  usgsLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
  },
  tapHint: {
    fontSize: 11,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 12,
    marginTop: 8,
  },
  reportCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sourceBadge: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flex: 1,
    marginRight: 8,
  },
  sourceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.gray,
  },
  linkButton: {
    fontSize: 15,
    color: COLORS.secondary,
    fontWeight: '600',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.gray,
    fontSize: 16,
  },
});

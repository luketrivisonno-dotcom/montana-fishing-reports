import React, { useState, useMemo } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  ScrollView, Linking, Dimensions
} from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getAllAccessPoints } from '../data/accessPoints';
import { getUSGSStations, getUSGSUrl } from '../data/usgsStations';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Earth-toned colors matching App.js
const COLORS = {
  primary: '#2d4a3e',
  primaryDark: '#1a2f27',
  primaryLight: '#4a6b5c',
  secondary: '#8b7355',
  secondaryDark: '#5c4a35',
  accent: '#c9a227',
  background: '#f5f1e8',
  surface: '#faf8f3',
  text: '#2c2416',
  textSecondary: '#6b5d4d',
  textLight: '#9a8b7a',
  border: '#d4cfc3',
  wade: '#5a7d5a',      // Sage green
  boat: '#8b4513',      // Saddle brown  
  both: '#cd853f',      // Peru/tan
};

// Initial region centered on Montana
const INITIAL_REGION = {
  latitude: 47.0,
  longitude: -109.5,
  latitudeDelta: 8,
  longitudeDelta: 8,
};

export default function RiverMap({ isPremium }) {
  const [selectedType, setSelectedType] = useState('all');
  const [mapType, setMapType] = useState('hybrid');
  const mapRef = React.useRef(null);

  const allPoints = useMemo(() => getAllAccessPoints(), []);
  const usgsStations = useMemo(() => getUSGSStations(), []);

  const filteredPoints = useMemo(() => {
    console.log('Filtering by type:', selectedType, 'Total points:', allPoints.length);
    if (selectedType === 'usgs') return []; // No access points when USGS selected
    if (selectedType === 'all') return allPoints;
    const filtered = allPoints.filter(point => {
      if (selectedType === 'boat') return point.type === 'boat' || point.type === 'both';
      if (selectedType === 'wade') return point.type === 'wade' || point.type === 'both';
      return true;
    });
    console.log('Filtered count:', filtered.length);
    return filtered;
  }, [allPoints, selectedType]);

  const getMarkerColor = (type) => {
    switch (type) {
      case 'boat': return COLORS.boat;
      case 'wade': return COLORS.wade;
      case 'both': return COLORS.both;
      default: return COLORS.primary;
    }
  };

  const openFWP = (url) => {
    if (url) {
      Linking.openURL(url).catch(() => {});
    }
  };

  const openUSGS = (siteId) => {
    if (siteId) {
      Linking.openURL(getUSGSUrl(siteId)).catch(() => {});
    }
  };

  const toggleMapType = () => {
    setMapType(prev => prev === 'hybrid' ? 'standard' : 'hybrid');
  };

  return (
    <View style={styles.container}>
      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          <TouchableOpacity 
            style={[styles.filterButton, selectedType === 'all' && styles.filterButtonActive]}
            onPress={() => setSelectedType('all')}
          >
            <Text style={[styles.filterText, selectedType === 'all' && styles.filterTextActive]}>
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.filterButton, selectedType === 'boat' && styles.filterButtonActive]}
            onPress={() => setSelectedType('boat')}
          >
            <MaterialCommunityIcons 
              name="sail-boat" 
              size={16} 
              color={selectedType === 'boat' ? '#f5f1e8' : COLORS.textLight} 
            />
            <Text style={[styles.filterText, selectedType === 'boat' && styles.filterTextActive]}>
              Boat
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.filterButton, selectedType === 'wade' && styles.filterButtonActive]}
            onPress={() => setSelectedType('wade')}
          >
            <Ionicons 
              name="footsteps" 
              size={16} 
              color={selectedType === 'wade' ? '#f5f1e8' : COLORS.textLight} 
            />
            <Text style={[styles.filterText, selectedType === 'wade' && styles.filterTextActive]}>
              Wade
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.filterButton, selectedType === 'usgs' && styles.filterButtonActive]}
            onPress={() => setSelectedType('usgs')}
          >
            <MaterialCommunityIcons 
              name="gauge" 
              size={16} 
              color={selectedType === 'usgs' ? '#f5f1e8' : COLORS.textLight} 
            />
            <Text style={[styles.filterText, selectedType === 'usgs' && styles.filterTextActive]}>
              USGS
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Map with Satellite/Hybrid View */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={INITIAL_REGION}
        mapType={mapType}
        showsUserLocation={true}
        showsCompass={true}
        showsScale={true}
        moveOnMarkerPress={false}
      >
        {(selectedType === 'all' || selectedType === 'usgs') && usgsStations.map((station, index) => (
          <Marker
            key={`usgs-${index}`}
            coordinate={{ 
              latitude: station.lat, 
              longitude: station.lon 
            }}
            pinColor="#0066cc"
          >
            <Callout onPress={() => openUSGS(station.siteId)}>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>{station.river}</Text>
                <Text style={styles.calloutRiver}>USGS Gauge #{station.siteId}</Text>
                <Text style={styles.calloutText}>{station.location}</Text>
                <View style={styles.calloutButton}>
                  <Text style={styles.calloutButtonText}>View on USGS</Text>
                  <Ionicons name="open-outline" size={14} color={COLORS.primary} />
                </View>
              </View>
            </Callout>
          </Marker>
        ))}

        {filteredPoints.map((point, index) => (
          <Marker
            key={`${selectedType}-${index}-${point.name}`}
            coordinate={{ 
              latitude: point.lat, 
              longitude: point.lon 
            }}
            pinColor={getMarkerColor(point.type)}
            title={point.name}
            description={point.type === 'both' ? 'Boat & Wade Access' : point.type === 'boat' ? 'Boat Ramp' : 'Wade Access'}
          >
            <Callout onPress={() => openFWP(point.fwpUrl)}>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>{point.name}</Text>

                <View style={styles.calloutDetails}>
                  <View style={styles.calloutRow}>
                    <Ionicons 
                      name={point.type === 'boat' ? "boat" : point.type === 'wade' ? "walk" : "swap-horizontal"} 
                      size={14} 
                      color={COLORS.textSecondary} 
                    />
                    <Text style={styles.calloutText}>
                      {point.type === 'both' ? 'Boat & Wade Access' : point.type === 'boat' ? 'Boat Ramp' : 'Wade Access'}
                    </Text>
                  </View>
                  {point.parking && (
                    <View style={styles.calloutRow}>
                      <MaterialCommunityIcons name="parking" size={14} color={COLORS.textSecondary} />
                      <Text style={styles.calloutText}>Parking</Text>
                    </View>
                  )}
                  {point.restrooms && (
                    <View style={styles.calloutRow}>
                      <MaterialCommunityIcons name="human-male-female" size={14} color={COLORS.textSecondary} />
                      <Text style={styles.calloutText}>Restrooms</Text>
                    </View>
                  )}
                  {point.camping && (
                    <View style={styles.calloutRow}>
                      <MaterialCommunityIcons name="tent" size={14} color={COLORS.textSecondary} />
                      <Text style={styles.calloutText}>Camping</Text>
                    </View>
                  )}
                </View>
                <View style={styles.calloutButton}>
                  <Text style={styles.calloutButtonText}>View on FWP</Text>
                  <Ionicons name="open-outline" size={14} color={COLORS.primary} />
                </View>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Map Type Toggle */}
      <TouchableOpacity 
        style={styles.mapTypeButton}
        onPress={toggleMapType}
      >
        <Ionicons 
          name={mapType === 'hybrid' ? "map" : "earth"} 
          size={22} 
          color={COLORS.primary} 
        />
      </TouchableOpacity>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Legend</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.wade }]} />
            <Text style={styles.legendText}>Wade Access</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.boat }]} />
            <Text style={styles.legendText}>Boat Launch</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.both }]} />
            <Text style={styles.legendText}>Both</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#0066cc' }]} />
            <Text style={styles.legendText}>USGS Gauge</Text>
          </View>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  filterContainer: {
    backgroundColor: COLORS.surface,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterTextActive: {
    color: '#f5f1e8',
  },
  map: {
    flex: 1,
  },
  mapTypeButton: {
    position: 'absolute',
    right: 14,
    top: 65,
    backgroundColor: COLORS.surface,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  callout: {
    width: 200,
    padding: 4,
  },
  calloutTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  calloutRiver: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: 6,
  },
  calloutDetails: {
    gap: 3,
  },
  calloutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  calloutText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  calloutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 6,
    gap: 4,
  },
  calloutButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  legend: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },

});

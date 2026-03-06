import React, { useState, useMemo, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  ScrollView, Linking, Dimensions
} from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { getAllAccessPoints } from '../data/accessPoints';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  primary: '#1a5f7a',
  primaryDark: '#134a5e',
  secondary: '#159895',
  accent: '#57c5b6',
  background: '#f5f7fa',
  surface: '#ffffff',
  text: '#1a1a2e',
  textSecondary: '#6b7280',
  border: '#e5e7eb',
  wade: '#22c55e',    // Green for wade access
  boat: '#ef4444',    // Red for boat launch
  both: '#f97316',    // Orange for both
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
  const [selectedRegion, setSelectedRegion] = useState(INITIAL_REGION);
  const [mapType, setMapType] = useState('hybrid'); // 'hybrid' for satellite

  const allPoints = useMemo(() => getAllAccessPoints(), []);

  const filteredPoints = useMemo(() => {
    if (selectedType === 'all') return allPoints;
    return allPoints.filter(point => {
      if (selectedType === 'boat') return point.type === 'boat' || point.type === 'both';
      if (selectedType === 'wade') return point.type === 'wade' || point.type === 'both';
      if (selectedType === 'restrooms') return point.restrooms;
      return true;
    });
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
      Linking.openURL(url).catch(() => {
        // Silently fail if URL doesn't open
      });
    }
  };

  // Map type toggle button
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
              color={selectedType === 'boat' ? '#fff' : COLORS.textSecondary} 
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
              color={selectedType === 'wade' ? '#fff' : COLORS.textSecondary} 
            />
            <Text style={[styles.filterText, selectedType === 'wade' && styles.filterTextActive]}>
              Wade
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.filterButton, selectedType === 'restrooms' && styles.filterButtonActive]}
            onPress={() => setSelectedType('restrooms')}
          >
            <Ionicons 
              name="business" 
              size={16} 
              color={selectedType === 'restrooms' ? '#fff' : COLORS.textSecondary} 
            />
            <Text style={[styles.filterText, selectedType === 'restrooms' && styles.filterTextActive]}>
              Restrooms
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Map with Satellite/Hybrid View */}
      <MapView
        style={styles.map}
        initialRegion={INITIAL_REGION}
        region={selectedRegion}
        onRegionChangeComplete={setSelectedRegion}
        mapType={mapType}
        showsUserLocation={true}
        showsCompass={true}
        showsScale={true}
      >
        {filteredPoints.map((point, index) => (
          <Marker
            key={index}
            coordinate={{ 
              latitude: point.lat, 
              longitude: point.lon 
            }}
            pinColor={getMarkerColor(point.type)}
            title={point.name}
            description={`${point.river} - ${point.type}`}
          >
            <Callout onPress={() => openFWP(point.fwpUrl)}>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>{point.name}</Text>
                <Text style={styles.calloutRiver}>{point.river}</Text>
                <View style={styles.calloutDetails}>
                  <View style={styles.calloutRow}>
                    <Ionicons 
                      name={point.type === 'boat' ? "boat" : point.type === 'wade' ? "walk" : "swap-horizontal"} 
                      size={14} 
                      color={COLORS.textSecondary} 
                    />
                    <Text style={styles.calloutText}>
                      {point.type === 'both' ? 'Boat & Wade' : point.type === 'boat' ? 'Boat Launch' : 'Wade Access'}
                    </Text>
                  </View>
                  {point.parking && (
                    <View style={styles.calloutRow}>
                      <Ionicons name="car" size={14} color={COLORS.textSecondary} />
                      <Text style={styles.calloutText}>Parking</Text>
                    </View>
                  )}
                  {point.restrooms && (
                    <View style={styles.calloutRow}>
                      <Ionicons name="business" size={14} color={COLORS.textSecondary} />
                      <Text style={styles.calloutText}>Restrooms</Text>
                    </View>
                  )}
                  {point.boatRamp && (
                    <View style={styles.calloutRow}>
                      <MaterialCommunityIcons name="sail-boat" size={14} color={COLORS.textSecondary} />
                      <Text style={styles.calloutText}>Boat Ramp</Text>
                    </View>
                  )}
                </View>
                {point.notes && (
                  <Text style={styles.calloutNotes}>{point.notes}</Text>
                )}
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
          size={24} 
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
        </View>
        <Text style={styles.legendCount}>
          {filteredPoints.length} access points shown
        </Text>
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
    paddingVertical: 12,
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
    borderRadius: 20,
    backgroundColor: COLORS.background,
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterTextActive: {
    color: '#fff',
  },
  map: {
    flex: 1,
  },
  mapTypeButton: {
    position: 'absolute',
    right: 16,
    top: 70,
    backgroundColor: COLORS.surface,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  callout: {
    width: 220,
    padding: 4,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  calloutRiver: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: 8,
  },
  calloutDetails: {
    gap: 4,
  },
  calloutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  calloutText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  calloutNotes: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: 8,
    marginBottom: 8,
  },
  calloutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 4,
    gap: 6,
  },
  calloutButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  legend: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 10,
  },
  legendItems: {
    flexDirection: 'row',
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  legendCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 10,
  },
});

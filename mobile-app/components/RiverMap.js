import React, { useState, useEffect } from 'react';
import { 
  View, StyleSheet, Text, TouchableOpacity, 
  ActivityIndicator, ScrollView, Linking, Alert 
} from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { 
  Ionicons, MaterialCommunityIcons, FontAwesome5,
  MaterialIcons 
} from '@expo/vector-icons';
import { ACCESS_POINTS } from '../data/accessPoints';

// River center coordinates for initial region
const RIVER_REGIONS = {
  'Madison River': { 
    latitude: 45.2847, 
    longitude: -111.4753, 
    latitudeDelta: 0.8, 
    longitudeDelta: 0.8 
  },
  'Yellowstone River': { 
    latitude: 45.6770, 
    longitude: -110.5631, 
    latitudeDelta: 1.2, 
    longitudeDelta: 1.2 
  },
  'Gallatin River': { 
    latitude: 45.2602, 
    longitude: -111.1951, 
    latitudeDelta: 0.5, 
    longitudeDelta: 0.5 
  },
  'Missouri River': { 
    latitude: 47.0527, 
    longitude: -111.8316, 
    latitudeDelta: 0.8, 
    longitudeDelta: 0.8 
  },
  'Bighorn River': { 
    latitude: 45.4605, 
    longitude: -107.8745, 
    latitudeDelta: 0.4, 
    longitudeDelta: 0.4 
  },
  'Beaverhead River': { 
    latitude: 45.2163, 
    longitude: -112.6381, 
    latitudeDelta: 0.6, 
    longitudeDelta: 0.6 
  },
  'Big Hole River': { 
    latitude: 45.1847, 
    longitude: -113.4081, 
    latitudeDelta: 0.8, 
    longitudeDelta: 0.8 
  },
  'Bitterroot River': { 
    latitude: 46.5891, 
    longitude: -114.0510, 
    latitudeDelta: 0.7, 
    longitudeDelta: 0.7 
  },
  'Blackfoot River': { 
    latitude: 46.8771, 
    longitude: -112.5560, 
    latitudeDelta: 0.5, 
    longitudeDelta: 0.5 
  },
  'Clark Fork River': { 
    latitude: 46.8721, 
    longitude: -113.9940, 
    latitudeDelta: 0.6, 
    longitudeDelta: 0.6 
  },
  'Jefferson River': { 
    latitude: 45.8933, 
    longitude: -111.5053, 
    latitudeDelta: 0.4, 
    longitudeDelta: 0.4 
  },
  'Ruby River': { 
    latitude: 45.3295, 
    longitude: -112.1076, 
    latitudeDelta: 0.3, 
    longitudeDelta: 0.3 
  },
  'Stillwater River': { 
    latitude: 45.5291, 
    longitude: -109.4229, 
    latitudeDelta: 0.3, 
    longitudeDelta: 0.3 
  },
  'Boulder River': { 
    latitude: 45.8500, 
    longitude: -110.1500, 
    latitudeDelta: 0.3, 
    longitudeDelta: 0.3 
  },
  'Rock Creek': { 
    latitude: 46.5100, 
    longitude: -113.8000, 
    latitudeDelta: 0.2, 
    longitudeDelta: 0.2 
  },
  'default': { 
    latitude: 46.8797, 
    longitude: -110.3626, 
    latitudeDelta: 4, 
    longitudeDelta: 4 
  }
};

const COLORS = {
  boat: '#dc2626',      // Red for boat launch
  wade: '#16a34a',      // Green for wade access
  both: '#d97706',      // Orange for both
  fwp: '#1a5f7a',       // Primary blue
  text: '#1a1a2e',
  textSecondary: '#6b7280',
  surface: '#ffffff',
  border: '#e5e7eb'
};

const RiverMap = ({ navigation, selectedRiver, isPremium }) => {
  const [region, setRegion] = useState(RIVER_REGIONS['default']);
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    loadMarkers();
  }, [selectedRiver, selectedFilter]);

  const loadMarkers = () => {
    setLoading(true);
    
    let allPoints = [];
    
    if (selectedRiver && ACCESS_POINTS[selectedRiver]) {
      // Show specific river
      setRegion(RIVER_REGIONS[selectedRiver] || RIVER_REGIONS['default']);
      allPoints = ACCESS_POINTS[selectedRiver].map(point => ({
        ...point,
        river: selectedRiver
      }));
    } else {
      // Show all rivers (limited for free users)
      setRegion(RIVER_REGIONS['default']);
      const riversToShow = isPremium 
        ? Object.keys(ACCESS_POINTS)
        : ['Madison River', 'Yellowstone River', 'Gallatin River', 'Missouri River'];
      
      riversToShow.forEach(river => {
        if (ACCESS_POINTS[river]) {
          const limitedPoints = isPremium 
            ? ACCESS_POINTS[river]
            : ACCESS_POINTS[river].slice(0, 5);
          
          allPoints.push(...limitedPoints.map(point => ({
            ...point,
            river
          })));
        }
      });
    }

    // Apply filter
    if (selectedFilter === 'boat') {
      allPoints = allPoints.filter(p => p.type === 'boat' || p.type === 'both');
    } else if (selectedFilter === 'wade') {
      allPoints = allPoints.filter(p => p.type === 'wade' || p.type === 'both');
    } else if (selectedFilter === 'restrooms') {
      allPoints = allPoints.filter(p => p.restrooms);
    }
    
    setMarkers(allPoints);
    setLoading(false);
  };

  const getMarkerColor = (type) => {
    switch (type) {
      case 'boat': return COLORS.boat;
      case 'wade': return COLORS.wade;
      case 'both': return COLORS.both;
      default: return COLORS.fwp;
    }
  };

  const getMarkerIcon = (type) => {
    switch (type) {
      case 'boat': return 'ship';
      case 'wade': return 'walk';
      case 'both': return 'map-marker';
      default: return 'map-marker';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'boat': return 'Boat Launch';
      case 'wade': return 'Wade Access';
      case 'both': return 'Boat & Wade';
      default: return 'Access';
    }
  };

  const openFWPLink = (url) => {
    if (url) {
      Linking.openURL(url).catch(() => {
        Alert.alert('Error', 'Could not open FWP website');
      });
    }
  };

  const navigateToRiver = (riverName) => {
    if (navigation) {
      navigation.navigate('RiverDetails', { river: riverName });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.fwp} />
        <Text style={styles.loadingText}>Loading FWP access points...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filter Bar */}
      <View style={styles.filterContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          <TouchableOpacity 
            style={[styles.filterButton, selectedFilter === 'all' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('all')}
          >
            <MaterialCommunityIcons 
              name="map-marker-multiple" 
              size={16} 
              color={selectedFilter === 'all' ? '#fff' : COLORS.textSecondary} 
            />
            <Text style={[styles.filterText, selectedFilter === 'all' && styles.filterTextActive]}>
              All ({markers.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.filterButton, selectedFilter === 'boat' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('boat')}
          >
            <MaterialCommunityIcons 
              name="ship" 
              size={16} 
              color={selectedFilter === 'boat' ? '#fff' : COLORS.boat} 
            />
            <Text style={[styles.filterText, selectedFilter === 'boat' && styles.filterTextActive]}>
              Boat
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.filterButton, selectedFilter === 'wade' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('wade')}
          >
            <MaterialCommunityIcons 
              name="walk" 
              size={16} 
              color={selectedFilter === 'wade' ? '#fff' : COLORS.wade} 
            />
            <Text style={[styles.filterText, selectedFilter === 'wade' && styles.filterTextActive]}>
              Wade
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.filterButton, selectedFilter === 'restrooms' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('restrooms')}
          >
            <MaterialCommunityIcons 
              name="toilet" 
              size={16} 
              color={selectedFilter === 'restrooms' ? '#fff' : COLORS.textSecondary} 
            />
            <Text style={[styles.filterText, selectedFilter === 'restrooms' && styles.filterTextActive]}>
              Restrooms
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <MapView
        style={styles.map}
        initialRegion={region}
        region={region}
        onRegionChangeComplete={setRegion}
      >
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={{ latitude: marker.lat, longitude: marker.lon }}
            pinColor={getMarkerColor(marker.type)}
          >
            <View style={[styles.markerContainer, { backgroundColor: getMarkerColor(marker.type) }]}>
              <MaterialCommunityIcons 
                name={getMarkerIcon(marker.type)} 
                size={18} 
                color="#fff" 
              />
            </View>
            
            <Callout 
              onPress={() => navigateToRiver(marker.river)}
              style={styles.callout}
            >
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutTitle}>{marker.name}</Text>
                <Text style={styles.calloutRiver}>{marker.river}</Text>
                
                <View style={styles.calloutTypeBadge}>
                  <MaterialCommunityIcons 
                    name={getMarkerIcon(marker.type)} 
                    size={12} 
                    color={getMarkerColor(marker.type)} 
                  />
                  <Text style={[styles.calloutType, { color: getMarkerColor(marker.type) }]}>
                    {getTypeLabel(marker.type)}
                  </Text>
                </View>

                {/* Amenities */}
                <View style={styles.amenitiesRow}>
                  {marker.parking && (
                    <View style={styles.amenityBadge}>
                      <MaterialCommunityIcons name="parking" size={12} color="#666" />
                      <Text style={styles.amenityText}>Parking</Text>
                    </View>
                  )}
                  {marker.restrooms && (
                    <View style={styles.amenityBadge}>
                      <MaterialCommunityIcons name="toilet" size={12} color="#666" />
                      <Text style={styles.amenityText}>Restroom</Text>
                    </View>
                  )}
                  {marker.boatRamp && (
                    <View style={styles.amenityBadge}>
                      <MaterialCommunityIcons name="ship" size={12} color="#666" />
                      <Text style={styles.amenityText}>Ramp</Text>
                    </View>
                  )}
                  {marker.camping && (
                    <View style={styles.amenityBadge}>
                      <MaterialCommunityIcons name="tent" size={12} color="#666" />
                      <Text style={styles.amenityText}>Camp</Text>
                    </View>
                  )}
                </View>

                {marker.fee && (
                  <Text style={styles.feeText}>💵 Fee required</Text>
                )}

                {marker.notes && (
                  <Text style={styles.notesText}>{marker.notes}</Text>
                )}

                <View style={styles.calloutActions}>
                  <TouchableOpacity 
                    style={styles.fwpButton}
                    onPress={() => openFWPLink(marker.fwpUrl)}
                  >
                    <MaterialCommunityIcons name="web" size={14} color="#fff" />
                    <Text style={styles.fwpButtonText}>FWP Website</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.riverButton}
                    onPress={() => navigateToRiver(marker.river)}
                  >
                    <Text style={styles.riverButtonText}>View River →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
      
      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>FWP Access Types</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.wade }]} />
            <MaterialCommunityIcons name="walk" size={14} color={COLORS.wade} />
            <Text style={styles.legendText}>Wade Only</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.boat }]} />
            <MaterialCommunityIcons name="ship" size={14} color={COLORS.boat} />
            <Text style={styles.legendText}>Boat Launch</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.both }]} />
            <MaterialCommunityIcons name="map-marker" size={14} color={COLORS.both} />
            <Text style={styles.legendText}>Both</Text>
          </View>
        </View>
      </View>
      
      {/* Stats / Info */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="map-marker" size={16} color={COLORS.fwp} />
          <Text style={styles.statText}>{markers.length} Access Points</Text>
        </View>
        {!isPremium && (
          <View style={styles.premiumBadge}>
            <MaterialIcons name="lock" size={12} color="#fff" />
            <Text style={styles.premiumBadgeText}>Premium for all</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
    fontSize: 14,
  },

  // Filter Bar
  filterContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 8,
  },
  filterContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: '#1a5f7a',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterTextActive: {
    color: '#fff',
  },

  // Marker
  markerContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 4,
  },

  // Callout
  callout: {
    width: 280,
  },
  calloutContainer: {
    padding: 12,
    gap: 8,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  calloutRiver: {
    fontSize: 13,
    color: '#1a5f7a',
    fontWeight: '600',
  },
  calloutTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  calloutType: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Amenities
  amenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  amenityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  amenityText: {
    fontSize: 10,
    color: '#666',
  },
  feeText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  notesText: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },

  // Callout Actions
  calloutActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  fwpButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a5f7a',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  fwpButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  riverButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  riverButtonText: {
    color: '#1a5f7a',
    fontSize: 12,
    fontWeight: '600',
  },

  // Legend
  legend: {
    position: 'absolute',
    bottom: 60,
    left: 12,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 8,
  },
  legendItems: {
    gap: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 11,
    color: '#6b7280',
  },

  // Stats Bar
  statsBar: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    left: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fbbf24',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  premiumBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400e',
  },
});

export default RiverMap;

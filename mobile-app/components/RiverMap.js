import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { ACCESS_POINTS } from '../data/accessPoints';

// River coordinates for initial region
const RIVER_REGIONS = {
  'Madison River': { latitude: 45.2847, longitude: -111.4753, latitudeDelta: 0.5, longitudeDelta: 0.5 },
  'Yellowstone River': { latitude: 45.6770, longitude: -110.5631, latitudeDelta: 0.8, longitudeDelta: 0.8 },
  'Gallatin River': { latitude: 45.2602, longitude: -111.1951, latitudeDelta: 0.4, longitudeDelta: 0.4 },
  'Missouri River': { latitude: 47.0527, longitude: -111.8316, latitudeDelta: 0.6, longitudeDelta: 0.6 },
  'Bighorn River': { latitude: 45.4605, longitude: -107.8745, latitudeDelta: 0.3, longitudeDelta: 0.3 },
  'default': { latitude: 46.8797, longitude: -110.3626, latitudeDelta: 3, longitudeDelta: 3 }
};

const RiverMap = ({ navigation, selectedRiver, isPremium }) => {
  const [region, setRegion] = useState(RIVER_REGIONS['default']);
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMarkers();
  }, [selectedRiver]);

  const loadMarkers = () => {
    setLoading(true);
    
    if (selectedRiver && ACCESS_POINTS[selectedRiver]) {
      // Show specific river
      const points = ACCESS_POINTS[selectedRiver];
      setRegion(RIVER_REGIONS[selectedRiver] || RIVER_REGIONS['default']);
      setMarkers(points.map(point => ({
        ...point,
        id: point.name,
        river: selectedRiver
      })));
    } else {
      // Show all rivers (limited set for free users)
      const allPoints = [];
      const riversToShow = isPremium 
        ? Object.keys(ACCESS_POINTS)
        : ['Madison River', 'Yellowstone River', 'Gallatin River'];
      
      riversToShow.forEach(river => {
        if (ACCESS_POINTS[river]) {
          const limitedPoints = isPremium 
            ? ACCESS_POINTS[river]
            : ACCESS_POINTS[river].slice(0, 3); // Free users see only 3 points per river
          
          allPoints.push(...limitedPoints.map(point => ({
            ...point,
            id: `${river}-${point.name}`,
            river
          })));
        }
      });
      
      setMarkers(allPoints);
    }
    
    setLoading(false);
  };

  const getMarkerColor = (type) => {
    switch (type) {
      case 'boat': return '#e74c3c'; // Red for boat launch
      case 'wade': return '#27ae60'; // Green for wade access
      case 'both': return '#f39c12'; // Orange for both
      default: return '#3498db';
    }
  };

  const getMarkerIcon = (type) => {
    switch (type) {
      case 'boat': return '🚤';
      case 'wade': return '🎣';
      case 'both': return '⚓';
      default: return '📍';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a5f7a" />
        <Text style={styles.loadingText}>Loading access points...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
              <Text style={styles.markerIcon}>{getMarkerIcon(marker.type)}</Text>
            </View>
            <Callout onPress={() => navigation?.navigate('RiverDetails', { river: marker.river })}>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutTitle}>{marker.name}</Text>
                <Text style={styles.calloutRiver}>{marker.river}</Text>
                <Text style={styles.calloutType}>
                  {marker.type === 'both' ? 'Boat & Wade' : marker.type === 'boat' ? 'Boat Launch' : 'Wade Access'}
                </Text>
                {marker.parking && <Text style={styles.calloutFeature}>🅿️ Parking</Text>}
                {marker.restrooms && <Text style={styles.calloutFeature}>🚻 Restrooms</Text>}
                <Text style={styles.calloutNote}>{marker.note}</Text>
                <TouchableOpacity style={styles.calloutButton}>
                  <Text style={styles.calloutButtonText}>View River Info →</Text>
                </TouchableOpacity>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
      
      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Access Types</Text>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#27ae60' }]} />
          <Text style={styles.legendText}>Wade Access</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#e74c3c' }]} />
          <Text style={styles.legendText}>Boat Launch</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#f39c12' }]} />
          <Text style={styles.legendText}>Both</Text>
        </View>
      </View>
      
      {/* Premium notice for free users */}
      {!isPremium && !selectedRiver && (
        <View style={styles.premiumNotice}>
          <Text style={styles.premiumNoticeText}>
            ⭐ Upgrade to see all access points
          </Text>
        </View>
      )}
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
  },
  loadingText: {
    marginTop: 12,
    color: '#7f8c8d',
    fontSize: 14,
  },
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
  markerIcon: {
    fontSize: 16,
  },
  calloutContainer: {
    width: 200,
    padding: 8,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  calloutRiver: {
    fontSize: 14,
    color: '#1a5f7a',
    marginBottom: 4,
  },
  calloutType: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  calloutFeature: {
    fontSize: 12,
    color: '#27ae60',
    marginTop: 2,
  },
  calloutNote: {
    fontSize: 11,
    color: '#95a5a6',
    marginTop: 4,
    fontStyle: 'italic',
  },
  calloutButton: {
    backgroundColor: '#1a5f7a',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
    alignItems: 'center',
  },
  calloutButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  legend: {
    position: 'absolute',
    bottom: 20,
    left: 16,
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
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  premiumNotice: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#ffd700',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  premiumNoticeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
});

export default RiverMap;

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  ScrollView, Linking, Dimensions, Alert, Modal, Platform
} from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';

// For iOS callout buttons to work, we need CalloutSubview
const CalloutSubview = Platform.OS === 'ios' ? require('react-native-maps').CalloutSubview : View;
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { getAllAccessPoints } from '../data/accessPoints';
import { getUSGSStations, getUSGSUrl } from '../data/usgsStations';
import { openDirections, openMapLocation } from '../utils/mapUtils';
import PersonalPinModal from './PersonalPinModal';

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
  wade: '#5a7d5a',
  boat: '#8b4513',
  both: '#cd853f',
  personalPin: '#9b59b6', // Purple for personal pins
  catchPin: '#e74c3c', // Red for catch locations
};

// Pin type colors for personal pins
const PERSONAL_PIN_COLORS = {
  fishing_spot: '#4a90d9',
  access_point: '#5a9e6e',
  camp_spot: '#8b4513',
  hazard: '#e74c3c',
  note: '#c9a227',
};

const INITIAL_REGION = {
  latitude: 47.0,
  longitude: -109.5,
  latitudeDelta: 8,
  longitudeDelta: 8,
};

const STORAGE_KEY = 'personal_fishing_pins';

export default function RiverMap({ isPremium }) {
  const [selectedType, setSelectedType] = useState('all');
  const [mapType, setMapType] = useState('hybrid');
  const [personalPins, setPersonalPins] = useState([]);
  const [showPinModal, setShowPinModal] = useState(false);
  const [editingPin, setEditingPin] = useState(null);
  const [tempCoordinate, setTempCoordinate] = useState(null);
  const [showCatchLocations, setShowCatchLocations] = useState(true);
  const [catchLocations, setCatchLocations] = useState([]);
  const mapRef = React.useRef(null);

  const allPoints = useMemo(() => getAllAccessPoints(), []);
  const usgsStations = useMemo(() => getUSGSStations(), []);

  // Load personal pins from storage
  // Request location permission and load data
  useEffect(() => {
    requestLocationPermission();
    loadPersonalPins();
    loadCatchLocations();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied');
      }
    } catch (e) {
      console.error('Error requesting location permission:', e);
    }
  };

  const loadPersonalPins = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        setPersonalPins(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Error loading personal pins:', e);
    }
  };

  const loadCatchLocations = async () => {
    try {
      const saved = await AsyncStorage.getItem('fishingLog');
      if (saved) {
        const logs = JSON.parse(saved);
        const locations = logs
          .filter(log => log.location && log.location.latitude && log.location.longitude)
          .map(log => ({
            id: log.id,
            coordinate: log.location,
            river: log.river,
            species: log.species,
            size: log.size,
            date: log.date,
            fly: log.fly,
          }));
        setCatchLocations(locations);
      }
    } catch (e) {
      console.error('Error loading catch locations:', e);
    }
  };

  const savePersonalPins = async (pins) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(pins));
      setPersonalPins(pins);
    } catch (e) {
      console.error('Error saving personal pins:', e);
    }
  };

  const handleMapLongPress = (e) => {
    const { coordinate } = e.nativeEvent;
    setTempCoordinate(coordinate);
    setEditingPin(null);
    setShowPinModal(true);
  };

  const handleSavePin = (pinData) => {
    let updatedPins;
    if (editingPin) {
      // Update existing pin
      updatedPins = personalPins.map(p => p.id === pinData.id ? pinData : p);
    } else {
      // Add new pin
      updatedPins = [...personalPins, pinData];
    }
    savePersonalPins(updatedPins);
  };

  const handleDeletePin = (pinId) => {
    const updatedPins = personalPins.filter(p => p.id !== pinId);
    savePersonalPins(updatedPins);
  };

  const handleMarkerPress = (pin) => {
    setEditingPin(pin);
    setTempCoordinate(pin.coordinate);
    setShowPinModal(true);
  };

  const handleGetDirections = (coordinate, name) => {
    openDirections(coordinate.latitude, coordinate.longitude, name);
  };

  const filteredPoints = useMemo(() => {
    if (selectedType === 'usgs') return [];
    if (selectedType === 'all') return allPoints;
    if (selectedType === 'personal') return []; // Personal pins handled separately
    return allPoints.filter(point => {
      if (selectedType === 'boat') return point.type === 'boat' || point.type === 'both';
      if (selectedType === 'wade') return point.type === 'wade' || point.type === 'both';
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
    if (url) Linking.openURL(url).catch(() => {});
  };

  const openUSGS = (siteId) => {
    if (siteId) Linking.openURL(getUSGSUrl(siteId)).catch(() => {});
  };

  const toggleMapType = () => {
    setMapType(prev => prev === 'hybrid' ? 'standard' : 'hybrid');
  };

  const centerOnUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to show your position on the map.');
        return;
      }
      
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });
      
      mapRef.current?.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      }, 1000);
    } catch (error) {
      Alert.alert('Error', 'Could not get your location. Please check your location settings.');
    }
  };

  const filteredPersonalPins = useMemo(() => {
    if (selectedType === 'personal' || selectedType === 'all') {
      return personalPins;
    }
    return [];
  }, [personalPins, selectedType]);

  const filteredCatchLocations = useMemo(() => {
    if (!showCatchLocations) return [];
    if (selectedType === 'all' || selectedType === 'catches') {
      return catchLocations;
    }
    return [];
  }, [catchLocations, selectedType, showCatchLocations]);

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

          <TouchableOpacity 
            style={[styles.filterButton, selectedType === 'personal' && styles.filterButtonActive]}
            onPress={() => setSelectedType('personal')}
          >
            <Ionicons 
              name="location" 
              size={16} 
              color={selectedType === 'personal' ? '#f5f1e8' : COLORS.personalPin} 
            />
            <Text style={[styles.filterText, selectedType === 'personal' && styles.filterTextActive]}>
              My Pins
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.filterButton, selectedType === 'catches' && styles.filterButtonActive]}
            onPress={() => setSelectedType('catches')}
          >
            <MaterialCommunityIcons 
              name="fish" 
              size={16} 
              color={selectedType === 'catches' ? '#f5f1e8' : COLORS.catchPin} 
            />
            <Text style={[styles.filterText, selectedType === 'catches' && styles.filterTextActive]}>
              Catches
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={INITIAL_REGION}
        mapType={mapType}
        showsUserLocation={true}
        showsCompass={true}
        showsScale={true}
        moveOnMarkerPress={false}
        onLongPress={handleMapLongPress}
      >
        {/* USGS Stations */}
        {(selectedType === 'all' || selectedType === 'usgs') && usgsStations.map((station, index) => (
          <Marker
            key={`usgs-${index}`}
            coordinate={{ latitude: station.lat, longitude: station.lon }}
            pinColor="#0066cc"
          >
            <Callout tooltip>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>{station.river}</Text>
                <Text style={styles.calloutRiver}>USGS Gauge #{station.siteId}</Text>
                <Text style={styles.calloutText}>{station.location}</Text>
                
                <CalloutSubview onPress={() => openUSGS(station.siteId)}>
                  <View style={styles.calloutButton}>
                    <Text style={styles.calloutButtonText}>View on USGS</Text>
                    <Ionicons name="open-outline" size={14} color={COLORS.primary} />
                  </View>
                </CalloutSubview>
              </View>
            </Callout>
          </Marker>
        ))}

        {/* Access Points */}
        {filteredPoints.map((point, index) => (
          <Marker
            key={`access-${index}-${point.name}`}
            coordinate={{ latitude: point.lat, longitude: point.lon }}
            pinColor={getMarkerColor(point.type)}
          >
            <Callout tooltip>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>{point.name}</Text>
                {point.source === 'BLM' && (
                  <Text style={styles.calloutSource}>BLM Access</Text>
                )}

                <View style={styles.calloutDetails}>
                  <View style={styles.calloutRow}>
                    <Ionicons 
                      name={point.type === 'boat' ? "boat" : point.type === 'wade' ? "walk" : "swap-horizontal"} 
                      size={14} 
                      color={COLORS.textSecondary} 
                    />
                    <Text style={styles.calloutText}>
                      {point.subtype || (point.type === 'both' ? 'Boat & Wade Access' : point.type === 'boat' ? 'Boat Ramp' : 'Wade Access')}
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

                {/* Directions Button */}
                <CalloutSubview onPress={() => handleGetDirections(
                  { latitude: point.lat, longitude: point.lon },
                  point.name
                )}>
                  <View style={[styles.calloutButton, { backgroundColor: COLORS.accent + '20' }]}>
                    <Ionicons name="navigate" size={14} color={COLORS.accent} />
                    <Text style={[styles.calloutButtonText, { color: COLORS.accent }]}>Get Directions</Text>
                  </View>
                </CalloutSubview>

                {point.source !== 'BLM' && point.fwpUrl && (
                  <CalloutSubview onPress={() => openFWP(point.fwpUrl)}>
                    <View style={styles.calloutButton}>
                      <Text style={styles.calloutButtonText}>View on FWP</Text>
                      <Ionicons name="open-outline" size={14} color={COLORS.primary} />
                    </View>
                  </CalloutSubview>
                )}
              </View>
            </Callout>
          </Marker>
        ))}

        {/* Personal Pins */}
        {filteredPersonalPins.map((pin) => (
          <Marker
            key={`personal-${pin.id}`}
            coordinate={pin.coordinate}
            pinColor={PERSONAL_PIN_COLORS[pin.type] || COLORS.personalPin}
          >
            <Callout tooltip>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>{pin.name}</Text>
                <Text style={[styles.calloutSource, { color: PERSONAL_PIN_COLORS[pin.type] || COLORS.personalPin }]}>
                  {pin.type === 'fishing_spot' ? 'Fishing Spot' :
                   pin.type === 'access_point' ? 'Access Point' :
                   pin.type === 'camp_spot' ? 'Camp Spot' :
                   pin.type === 'hazard' ? 'Hazard' : 'Note'}
                </Text>
                {pin.notes && (
                  <Text style={styles.calloutText} numberOfLines={3}>{pin.notes}</Text>
                )}
                
                <CalloutSubview onPress={() => handleGetDirections(pin.coordinate, pin.name)}>
                  <View style={[styles.calloutButton, { backgroundColor: COLORS.accent + '20' }]}>
                    <Ionicons name="navigate" size={14} color={COLORS.accent} />
                    <Text style={[styles.calloutButtonText, { color: COLORS.accent }]}>Get Directions</Text>
                  </View>
                </CalloutSubview>

                <CalloutSubview onPress={() => handleMarkerPress(pin)}>
                  <View style={styles.calloutButton}>
                    <Text style={styles.calloutButtonText}>Edit Pin</Text>
                    <Ionicons name="create-outline" size={14} color={COLORS.primary} />
                  </View>
                </CalloutSubview>
              </View>
            </Callout>
          </Marker>
        ))}

        {/* Catch Locations */}
        {filteredCatchLocations.map((catchItem) => (
          <Marker
            key={`catch-${catchItem.id}`}
            coordinate={catchItem.coordinate}
            pinColor={COLORS.catchPin}
          >
            <Callout tooltip>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>Fish Caught</Text>
                <Text style={[styles.calloutSource, { color: COLORS.catchPin }]}>
                  {catchItem.river}
                </Text>
                
                <View style={styles.calloutDetails}>
                  {catchItem.species && (
                    <View style={styles.calloutRow}>
                      <MaterialCommunityIcons name="fish" size={14} color={COLORS.textSecondary} />
                      <Text style={styles.calloutText}>{catchItem.species}</Text>
                    </View>
                  )}
                  {catchItem.size && (
                    <View style={styles.calloutRow}>
                      <Ionicons name="resize" size={14} color={COLORS.textSecondary} />
                      <Text style={styles.calloutText}>{catchItem.size}"</Text>
                    </View>
                  )}
                  {catchItem.fly && (
                    <View style={styles.calloutRow}>
                      <MaterialCommunityIcons name="hook" size={14} color={COLORS.textSecondary} />
                      <Text style={styles.calloutText}>{catchItem.fly}</Text>
                    </View>
                  )}
                  {catchItem.date && (
                    <View style={styles.calloutRow}>
                      <Ionicons name="calendar" size={14} color={COLORS.textSecondary} />
                      <Text style={styles.calloutText}>{new Date(catchItem.date).toLocaleDateString()}</Text>
                    </View>
                  )}
                </View>

                <CalloutSubview onPress={() => handleGetDirections(catchItem.coordinate, `Catch on ${catchItem.river}`)}>
                  <View style={[styles.calloutButton, { backgroundColor: COLORS.accent + '20' }]}>
                    <Ionicons name="navigate" size={14} color={COLORS.accent} />
                    <Text style={[styles.calloutButtonText, { color: COLORS.accent }]}>Get Directions</Text>
                  </View>
                </CalloutSubview>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* My Location Button */}
      <TouchableOpacity 
        style={[styles.mapButton, { top: selectedType === 'personal' || selectedType === 'catches' ? 110 : 65 }]}
        onPress={centerOnUserLocation}
      >
        <Ionicons name="locate" size={22} color={COLORS.primary} />
      </TouchableOpacity>

      {/* Map Type Toggle */}
      <TouchableOpacity 
        style={[styles.mapButton, { top: selectedType === 'personal' || selectedType === 'catches' ? 165 : 120 }]}
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
            <View style={[styles.legendDot, { backgroundColor: '#0066cc' }]} />
            <Text style={styles.legendText}>USGS Gauge</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.personalPin }]} />
            <Text style={styles.legendText}>My Pins</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.catchPin }]} />
            <Text style={styles.legendText}>Catches</Text>
          </View>
        </View>
      </View>

      {/* Personal Pin Modal */}
      <PersonalPinModal
        visible={showPinModal}
        onClose={() => {
          setShowPinModal(false);
          setEditingPin(null);
          setTempCoordinate(null);
        }}
        onSave={handleSavePin}
        onDelete={handleDeletePin}
        editingPin={editingPin}
        coordinate={tempCoordinate}
      />
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
  mapButton: {
    position: 'absolute',
    right: 14,
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
    width: 220,
    padding: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    elevation: 8,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
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
  calloutSource: {
    fontSize: 11,
    color: COLORS.accent,
    fontWeight: '600',
    marginBottom: 4,
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

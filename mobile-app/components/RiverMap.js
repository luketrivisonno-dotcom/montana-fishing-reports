import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Linking } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';

const { width } = Dimensions.get('window');

const RIVER_COORDINATES = {
  'Madison River': { 
    lat: 45.2847, 
    lon: -111.4753, 
    region: 'Southwest',
    usgsId: '06037500',
    location: 'Cameron Bridge'
  },
  'Upper Madison River': { 
    lat: 45.2847, 
    lon: -111.4753, 
    region: 'Southwest',
    usgsId: '06037500',
    location: 'Cameron Bridge'
  },
  'Lower Madison River': { 
    lat: 45.6000, 
    lon: -111.6500, 
    region: 'Southwest',
    usgsId: '06041000',
    location: 'Black\'s Ford'
  },
  'Yellowstone River': { 
    lat: 45.6770, 
    lon: -110.5631, 
    region: 'South',
    usgsId: '06192500',
    location: 'Corwin Springs'
  },
  'Gallatin River': { 
    lat: 45.2602, 
    lon: -111.1951, 
    region: 'Southwest',
    usgsId: '06043500',
    location: 'Gallatin Gateway'
  },
  'Missouri River': { 
    lat: 47.0527, 
    lon: -111.8316, 
    region: 'Central',
    usgsId: '06066500',
    location: 'Holter Dam'
  },
  'Bighorn River': { 
    lat: 45.4605, 
    lon: -107.8745, 
    region: 'Southeast',
    usgsId: '06294500',
    location: 'Bighorn'
  },
  'Beaverhead River': { 
    lat: 45.2163, 
    lon: -112.6381, 
    region: 'Southwest',
    usgsId: '06017000',
    location: 'Dillon'
  },
  'Big Hole River': { 
    lat: 45.1847, 
    lon: -113.4081, 
    region: 'Southwest',
    usgsId: '06025500',
    location: 'Melrose'
  },
  'Bitterroot River': { 
    lat: 46.5891, 
    lon: -114.0510, 
    region: 'West',
    usgsId: '12344000',
    location: 'Darby'
  },
  'Blackfoot River': { 
    lat: 47.0527, 
    lon: -112.5560, 
    region: 'West',
    usgsId: '12340000',
    location: 'Bonner'
  },
  'Clark Fork River': { 
    lat: 46.8721, 
    lon: -113.9940, 
    region: 'West',
    usgsId: '12331800',
    location: 'Deer Lodge'
  },
  'Flathead River': { 
    lat: 48.4733, 
    lon: -114.0834, 
    region: 'Northwest',
    usgsId: '12389000',
    location: 'Columbia Falls'
  },
  'Jefferson River': { 
    lat: 45.8933, 
    lon: -111.5053, 
    region: 'Southwest',
    usgsId: '06026500',
    location: 'Twin Bridges'
  },
  'Ruby River': { 
    lat: 45.3295, 
    lon: -112.1076, 
    region: 'Southwest',
    usgsId: '06019500',
    location: 'Alder'
  },
  'Stillwater River': { 
    lat: 45.5291, 
    lon: -109.4229, 
    region: 'South',
    usgsId: '06205000',
    location: 'Absarokee'
  },
  'Swan River': { 
    lat: 47.7458, 
    lon: -114.0856, 
    region: 'Northwest',
    usgsId: '12370000',
    location: 'Big Fork'
  },
  'Rock Creek': { 
    lat: 46.5100, 
    lon: -113.8000, 
    region: 'West',
    usgsId: '12334510',
    location: 'Clinton'
  },
  'Boulder River': { 
    lat: 45.8500, 
    lon: -110.1500, 
    region: 'South',
    usgsId: null,
    location: 'Boulder'
  },
  'Spring Creeks': { 
    lat: 45.3000, 
    lon: -110.4500, 
    region: 'South (Paradise Valley)',
    usgsId: null,
    location: 'Pine Creek, MT',
    note: 'Private spring creeks - DePuy, Armstrong, Nelson'
  },
  'Yellowstone National Park': { 
    lat: 44.6608, 
    lon: -111.1040, 
    region: 'South',
    usgsId: null,
    location: 'West Yellowstone',
    note: 'Multiple rivers - check regulations'
  }
};

const openUSGS = (usgsId) => {
  if (usgsId) {
    Linking.openURL(`https://waterdata.usgs.gov/monitoring-location/${usgsId}`);
  }
};

const RiverMap = ({ navigation }) => {
  const initialRegion = {
    latitude: 46.0,
    longitude: -111.0,
    latitudeDelta: 6,
    longitudeDelta: 6,
  };

  const handleRiverPress = (riverName) => {
    navigation.navigate('RiverDetails', { river: riverName });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🗺️ Montana Rivers</Text>
      <Text style={styles.subtitle}>Tap a marker for details and USGS data</Text>
      <MapView
        style={styles.map}
        initialRegion={initialRegion}
        mapType="terrain"
      >
        {Object.entries(RIVER_COORDINATES).map(([riverName, coords]) => (
          <Marker
            key={riverName}
            coordinate={{
              latitude: coords.lat,
              longitude: coords.lon,
            }}
            pinColor="#1a5f7a"
          >
            <Callout tooltip onPress={() => handleRiverPress(riverName)}>
              <View style={styles.callout}>
                <Text style={styles.riverName}>{riverName}</Text>
                <Text style={styles.location}>📍 {coords.location}</Text>
                <Text style={styles.region}>{coords.region}</Text>
                {coords.note && <Text style={styles.note}>{coords.note}</Text>}
                
                <View style={styles.buttonRow}>
                  <TouchableOpacity 
                    style={styles.reportButton}
                    onPress={() => handleRiverPress(riverName)}
                  >
                    <Text style={styles.buttonText}>View Report</Text>
                  </TouchableOpacity>
                  
                  {coords.usgsId && (
                    <TouchableOpacity 
                      style={styles.usgsButton}
                      onPress={() => openUSGS(coords.usgsId)}
                    >
                      <Text style={styles.buttonText}>USGS Data</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    padding: 16,
    paddingBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  map: {
    flex: 1,
  },
  callout: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    minWidth: 200,
    maxWidth: 250,
  },
  riverName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  location: {
    fontSize: 13,
    color: '#1a5f7a',
    marginBottom: 2,
  },
  region: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  note: {
    fontSize: 11,
    color: '#e67e22',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  reportButton: {
    backgroundColor: '#1a5f7a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
  },
  usgsButton: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default RiverMap;

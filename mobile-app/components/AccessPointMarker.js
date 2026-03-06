import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Marker, Callout } from 'react-native-maps';
import { isAccessPointFavorite, addFavoriteAccessPoint, removeFavoriteAccessPoint } from '../utils/storage';

const AccessPointMarker = ({ point, riverName, onFavoriteChange }) => {
  const [isFav, setIsFav] = React.useState(false);

  React.useEffect(() => {
    checkFavorite();
  }, []);

  const checkFavorite = async () => {
    const fav = await isAccessPointFavorite(riverName, point.name);
    setIsFav(fav);
  };

  const toggleFavorite = async () => {
    if (isFav) {
      await removeFavoriteAccessPoint(riverName, point.name);
    } else {
      await addFavoriteAccessPoint(riverName, point.name);
    }
    setIsFav(!isFav);
    if (onFavoriteChange) onFavoriteChange();
  };

  // Get icon based on access type
  const getIcon = () => {
    switch(point.type) {
      case 'boat': return '🚤';
      case 'both': return '🚤🚶';
      case 'wade': return '🚶';
      default: return '📍';
    }
  };

  // Get color based on type
  const getColor = () => {
    switch(point.type) {
      case 'boat': return '#27ae60'; // Green for boat
      case 'both': return '#f39c12'; // Orange for both
      case 'wade': return '#9b59b6'; // Purple for wade
      default: return '#3498db';
    }
  };

  return (
    <Marker
      coordinate={{ latitude: point.lat, longitude: point.lon }}
      pinColor={getColor()}
    >
      <Callout tooltip>
        <View style={styles.callout}>
          <View style={styles.header}>
            <Text style={styles.icon}>{getIcon()}</Text>
            <Text style={styles.title} numberOfLines={2}>{point.name}</Text>
            <TouchableOpacity onPress={toggleFavorite} style={styles.favButton}>
              <Text style={styles.favIcon}>{isFav ? '⭐' : '☆'}</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.type}>
            {point.type === 'boat' ? 'Boat Launch' : 
             point.type === 'both' ? 'Boat & Wade Access' : 
             'Wade Access Only'}
          </Text>
          
          {point.parking && <Text style={styles.amenity}>🅿️ Parking Available</Text>}
          {point.restrooms && <Text style={styles.amenity}>🚻 Restrooms</Text>}
          {point.note && <Text style={styles.note}>{point.note}</Text>}
          
          <Text style={styles.tip}>Tap for directions</Text>
        </View>
      </Callout>
    </Marker>
  );
};

const styles = StyleSheet.create({
  callout: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    minWidth: 200,
    maxWidth: 250,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  icon: {
    fontSize: 20,
    marginRight: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  favButton: {
    padding: 4,
  },
  favIcon: {
    fontSize: 20,
  },
  type: {
    fontSize: 12,
    color: '#1a5f7a',
    fontWeight: '600',
    marginBottom: 4,
  },
  amenity: {
    fontSize: 11,
    color: '#27ae60',
    marginTop: 2,
  },
  note: {
    fontSize: 11,
    color: '#e67e22',
    fontStyle: 'italic',
    marginTop: 4,
  },
  tip: {
    fontSize: 10,
    color: '#3498db',
    marginTop: 6,
    fontStyle: 'italic',
  },
});

export default AccessPointMarker;

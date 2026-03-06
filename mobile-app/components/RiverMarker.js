import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Marker, Callout } from 'react-native-maps';
import { isFavorite, addFavorite, removeFavorite } from '../utils/storage';
import { scheduleFishingReportNotification, cancelRiverNotifications } from '../utils/notifications';

const RiverMarker = ({ river, coords, onPress, onFavoriteChange }) => {
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    checkFavorite();
  }, []);

  const checkFavorite = async () => {
    const fav = await isFavorite(river);
    setIsFav(fav);
  };

  const toggleFavorite = async (e) => {
    e.stopPropagation();
    if (isFav) {
      await removeFavorite(river);
      await cancelRiverNotifications(river);
    } else {
      await addFavorite(river);
      await scheduleFishingReportNotification(river);
    }
    setIsFav(!isFav);
    if (onFavoriteChange) onFavoriteChange();
  };

  return (
    <Marker
      coordinate={{ latitude: coords.lat, longitude: coords.lon }}
      pinColor={isFav ? '#e74c3c' : '#1a5f7a'}
    >
      <Callout onPress={onPress} tooltip>
        <View style={styles.callout}>
          <View style={styles.header}>
            <Text style={styles.title}>{river}</Text>
            <TouchableOpacity onPress={toggleFavorite} style={styles.favButton}>
              <Text style={styles.favIcon}>{isFav ? '⭐' : '☆'}</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.location}>📍 {coords.location}</Text>
          <Text style={styles.region}>{coords.region}</Text>
          {coords.note && <Text style={styles.note}>{coords.note}</Text>}
          
          <Text style={styles.tip}>Tap for fishing report</Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  favButton: {
    padding: 4,
  },
  favIcon: {
    fontSize: 24,
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
    marginBottom: 6,
  },
  tip: {
    fontSize: 11,
    color: '#3498db',
    fontStyle: 'italic',
  },
});

export default RiverMarker;

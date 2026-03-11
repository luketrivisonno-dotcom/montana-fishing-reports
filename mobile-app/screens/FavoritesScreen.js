import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  Alert, RefreshControl 
} from 'react-native';
import { getFavorites, removeFavorite, getFavoriteAccessPoints, removeFavoriteAccessPoint } from '../utils/storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { cancelRiverNotifications } from '../utils/notifications';

const FavoritesScreen = ({ navigation }) => {
  const [riverFavorites, setRiverFavorites] = useState([]);
  const [accessPointFavorites, setAccessPointFavorites] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadFavorites();
    const unsubscribe = navigation.addListener('focus', loadFavorites);
    return unsubscribe;
  }, [navigation]);

  const loadFavorites = async () => {
    const rivers = await getFavorites();
    const accessPoints = await getFavoriteAccessPoints();
    setRiverFavorites(rivers);
    setAccessPointFavorites(accessPoints);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFavorites();
    setRefreshing(false);
  };

  const removeRiverFavorite = (riverName) => {
    Alert.alert(
      'Remove Favorite',
      `Remove ${riverName} from favorites?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            await removeFavorite(riverName);
            await cancelRiverNotifications(riverName);
            loadFavorites();
          }
        }
      ]
    );
  };

  const removeAccessFavorite = (key) => {
    const [riverName, accessName] = key.split('::');
    Alert.alert(
      'Remove Access Point',
      `Remove ${accessName} from favorites?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            await removeFavoriteAccessPoint(riverName, accessName);
            loadFavorites();
          }
        }
      ]
    );
  };

  const renderRiverItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.riverItem}
      onPress={() => navigation.navigate('RiverDetails', { river: item })}
    >
      <View style={styles.itemContent}>
        <Text style={styles.riverName}>{item}</Text>
        <Text style={styles.tapText}>View Report →</Text>
      </View>
      <TouchableOpacity 
        style={styles.removeBtn}
        onPress={() => removeRiverFavorite(item)}
      >
        <Text style={styles.removeText}>✕</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderAccessItem = ({ item }) => {
    const [riverName, accessName] = item.split('::');
    return (
      <View style={styles.accessItem}>
        <View style={styles.accessContent}>
          <Text style={styles.accessName}>{accessName}</Text>
          <Text style={styles.accessRiver}>on {riverName}</Text>
        </View>
        <TouchableOpacity 
          style={styles.removeBtn}
          onPress={() => removeAccessFavorite(item)}
        >
          <MaterialCommunityIcons name="close" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <MaterialCommunityIcons name="star" size={24} color="#2d4a3e" style={{ marginRight: 8 }} />
        <Text style={styles.header}>My Favorites</Text>
      </View>
      
      <Text style={styles.sectionTitle}>Rivers ({riverFavorites.length})</Text>
      <FlatList
        data={riverFavorites}
        keyExtractor={(item) => `river-${item}`}
        renderItem={renderRiverItem}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No favorite rivers yet. Tap the star on any river!</Text>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />

      <Text style={styles.sectionTitle}>Access Points ({accessPointFavorites.length})</Text>
      <FlatList
        data={accessPointFavorites}
        keyExtractor={(item) => `access-${item}`}
        renderItem={renderAccessItem}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No favorite access points yet. Tap the star on any access point!</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
    marginTop: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a5f7a',
    marginTop: 16,
    marginBottom: 8,
  },
  riverItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  itemContent: {
    flex: 1,
  },
  riverName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  tapText: {
    fontSize: 12,
    color: '#3498db',
    marginTop: 4,
  },
  accessItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#f39c12',
  },
  accessContent: {
    flex: 1,
  },
  accessName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  accessRiver: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
  },
  removeBtn: {
    backgroundColor: '#e74c3c',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#95a5a6',
    fontStyle: 'italic',
    padding: 20,
  },
});

export default FavoritesScreen;

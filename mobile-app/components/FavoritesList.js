import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { getFavorites, removeFavorite } from '../utils/storage';
import { cancelRiverNotifications } from '../utils/notifications';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const FavoritesList = ({ navigation }) => {
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    loadFavorites();
    const unsubscribe = navigation.addListener('focus', loadFavorites);
    return unsubscribe;
  }, [navigation]);

  const loadFavorites = async () => {
    const favs = await getFavorites();
    setFavorites(favs);
  };

  const removeFromFavorites = async (riverName) => {
    await removeFavorite(riverName);
    await cancelRiverNotifications(riverName);
    loadFavorites();
  };

  if (favorites.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialCommunityIcons name="star" size={18} color="#2c3e50" style={{ marginRight: 6 }} />
          <Text style={styles.title}>Your Favorites</Text>
        </View>
        <Text style={styles.subtitle}>{favorites.length} rivers</Text>
      </View>
      
      <FlatList
        data={favorites}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.favoriteCard}
            onPress={() => navigation.navigate('Rivers', { screen: 'RiverDetails', params: { river: item } })}
          >
            <Text style={styles.riverName}>{item}</Text>
            <TouchableOpacity 
              style={styles.removeButton}
              onPress={() => removeFromFavorites(item)}
            >
              <MaterialCommunityIcons name="close" size={14} color="#fff" />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 8 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50' },
  subtitle: { fontSize: 14, color: '#7f8c8d' },
  listContent: { paddingHorizontal: 16 },
  favoriteCard: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  riverName: { fontSize: 14, fontWeight: '600', color: '#2c3e50', marginRight: 8 },
  removeButton: { backgroundColor: '#e74c3c', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  removeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
});

export default FavoritesList;

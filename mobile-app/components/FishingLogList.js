import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  Alert, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const COLORS = {
  primary: '#2d4a3e',
  accent: '#c9a227',
  text: '#2c2416',
  textSecondary: '#6b5d4d',
  textLight: '#9a8b7a',
  surface: '#faf8f3',
  success: '#5a7d5a',
};

const FishingLogList = ({ riverName, onAddNew }) => {
  const [catches, setCatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCatches();
  }, [riverName]);

  const loadCatches = async () => {
    try {
      const allCatches = JSON.parse(await AsyncStorage.getItem('fishingLog') || '[]');
      const riverCatches = allCatches.filter(c => c.river === riverName);
      // Sort by date, newest first
      riverCatches.sort((a, b) => new Date(b.date) - new Date(a.date));
      setCatches(riverCatches);
    } catch (error) {
      console.error('Error loading catches:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteCatch = async (id) => {
    Alert.alert(
      'Delete Catch',
      'Are you sure you want to delete this entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            const allCatches = JSON.parse(await AsyncStorage.getItem('fishingLog') || '[]');
            const updated = allCatches.filter(c => c.id !== id);
            await AsyncStorage.setItem('fishingLog', JSON.stringify(updated));
            loadCatches();
          }
        }
      ]
    );
  };

  const renderCatch = ({ item }) => (
    <View style={styles.catchCard}>
      <View style={styles.catchHeader}>
        <View>
          <Text style={styles.species}>{item.species}</Text>
          <Text style={styles.date}>{item.date}</Text>
        </View>
        {item.length && (
          <View style={styles.lengthBadge}>
            <Text style={styles.lengthText}>{item.length}"</Text>
          </View>
        )}
      </View>
      
      {item.fly && (
        <View style={styles.detailRow}>
          <Ionicons name="sparkles" size={14} color={COLORS.accent} />
          <Text style={styles.detailText}>{item.fly}</Text>
        </View>
      )}
      
      {item.notes && (
        <Text style={styles.notes}>{item.notes}</Text>
      )}
      
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => deleteCatch(item.id)}
      >
        <Ionicons name="trash-outline" size={18} color={COLORS.textLight} />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📓 Your Fishing Log</Text>
        <Text style={styles.count}>{catches.length} catches</Text>
      </View>

      {catches.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="fish-outline" size={48} color={COLORS.textLight} />
          <Text style={styles.emptyText}>No catches logged yet</Text>
          <Text style={styles.emptySubtext}>Tap the + button to add your first catch</Text>
        </View>
      ) : (
        <FlatList
          data={catches}
          keyExtractor={(item) => item.id}
          renderItem={renderCatch}
          contentContainerStyle={styles.list}
        />
      )}

      <TouchableOpacity style={styles.addButton} onPress={onAddNew}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e8e4da',
    minHeight: 200,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  count: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  list: {
    paddingBottom: 60,
  },
  catchCard: {
    backgroundColor: '#f5f1e8',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  catchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  species: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  date: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  lengthBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  lengthText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  notes: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 6,
    fontStyle: 'italic',
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 4,
  },
  addButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});

export default FishingLogList;

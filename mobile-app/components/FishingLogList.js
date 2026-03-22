import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  Alert, ActivityIndicator, Image
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

const FishingLogList = ({ riverName, onAddNew, refreshKey, onShowLeaderboard, onShareCatch, onEditCatch }) => {
  const [catches, setCatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCatches();
  }, [riverName, refreshKey]);

  const loadCatches = async () => {
    try {
      setLoading(true);
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

  const shareCatch = (catchItem) => {
    if (onShareCatch) {
      onShareCatch(catchItem);
    }
  };

  const editCatch = (catchItem) => {
    if (onEditCatch) {
      onEditCatch(catchItem);
    }
  };

  const renderCatch = ({ item }) => (
    <View style={styles.catchCard}>
      <View style={styles.catchHeader}>
        <View>
          <Text style={styles.species}>{item.species}</Text>
          <Text style={styles.date}>{item.date}</Text>
        </View>
        <View style={styles.headerRight}>
          {item.length && (
            <View style={styles.lengthBadge}>
              <Text style={styles.lengthText}>{item.length}"</Text>
            </View>
          )}
          {item.weight && (
            <View style={styles.weightBadge}>
              <Text style={styles.weightText}>{item.weight} lbs</Text>
            </View>
          )}
        </View>
      </View>
      
      {(item.fly || item.hookSize) && (
        <View style={styles.detailRow}>
          <Ionicons name="sparkles" size={14} color={COLORS.accent} />
          <Text style={styles.detailText}>
            {item.fly}{item.hookSize ? ` (#${item.hookSize})` : ''}
          </Text>
        </View>
      )}
      
      {item.notes && (
        <Text style={styles.notes}>{item.notes}</Text>
      )}
      
      {item.photo && (
        <Image source={{ uri: item.photo }} style={styles.catchPhoto} />
      )}

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <View style={styles.leftActions}>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => editCatch(item)}
          >
            <Ionicons name="create-outline" size={16} color={COLORS.primary} />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          {item.photo && (
            <TouchableOpacity 
              style={styles.shareSmallButton}
              onPress={() => shareCatch(item)}
            >
              <Ionicons name="share-outline" size={16} color={COLORS.primary} />
              <Text style={styles.shareSmallText}>Share</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => deleteCatch(item.id)}
        >
          <Ionicons name="trash-outline" size={18} color={COLORS.textLight} />
        </TouchableOpacity>
      </View>
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
        <View>
          <Text style={styles.title}>📓 Your Fishing Log</Text>
          <Text style={styles.count}>{catches.length} catches</Text>
        </View>
        <TouchableOpacity 
          style={styles.leaderboardButton}
          onPress={onShowLeaderboard}
        >
          <Ionicons name="trophy" size={16} color={COLORS.accent} />
          <Text style={styles.leaderboardText}>Leaderboard</Text>
        </TouchableOpacity>
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
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  count: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  leaderboardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f1e8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  leaderboardText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  list: {
    paddingBottom: 60,
  },
  catchCard: {
    backgroundColor: '#f5f1e8',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e8e4da',
  },
  catchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  species: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  date: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  lengthBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  lengthText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  weightBadge: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  weightText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2c2416',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  detailText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  notes: {
    fontSize: 13,
    color: COLORS.text,
    marginTop: 8,
    fontStyle: 'italic',
  },
  catchPhoto: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginTop: 10,
    resizeMode: 'cover',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e8e4da',
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  shareSmallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shareSmallText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  deleteButton: {
    padding: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '600',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  addButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});

export default FishingLogList;

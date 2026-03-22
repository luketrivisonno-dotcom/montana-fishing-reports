import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  Image, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const COLORS = {
  primary: '#2d4a3e',
  primaryDark: '#1a2f27',
  accent: '#c9a227',
  text: '#2c2416',
  textSecondary: '#6b5d4d',
  textLight: '#9a8b7a',
  surface: '#faf8f3',
  success: '#5a7d5a',
  error: '#a65d57',
};

const TROPHY_EMOJIS = {
  1: '🥇',
  2: '🥈', 
  3: '🥉',
};

const SimpleLeaderboard = ({ currentRiver, onClose }) => {
  const [catches, setCatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'river', 'month'
  const [category, setCategory] = useState('size'); // 'size', 'recent'

  useEffect(() => {
    loadLeaderboard();
  }, [filter, category]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const allCatches = JSON.parse(await AsyncStorage.getItem('fishingLog') || '[]');
      
      // Filter to public catches only
      let publicCatches = allCatches.filter(c => c.isPublic === true);
      
      // Apply river filter
      if (filter === 'river' && currentRiver) {
        publicCatches = publicCatches.filter(c => c.river === currentRiver);
      }
      
      // Apply time filter (last 30 days for 'month')
      if (filter === 'month') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        publicCatches = publicCatches.filter(c => new Date(c.date) >= thirtyDaysAgo);
      }
      
      // Sort by category
      if (category === 'size') {
        publicCatches.sort((a, b) => (parseFloat(b.length) || 0) - (parseFloat(a.length) || 0));
      } else {
        publicCatches.sort((a, b) => new Date(b.date) - new Date(a.date));
      }
      
      setCatches(publicCatches.slice(0, 20)); // Top 20
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderCatch = ({ item, index }) => (
    <View style={styles.catchRow}>
      <View style={styles.rankColumn}>
        <Text style={styles.rankText}>
          {TROPHY_EMOJIS[index + 1] || `#${index + 1}`}
        </Text>
      </View>
      
      {item.photo ? (
        <Image source={{ uri: item.photo }} style={styles.thumbnail} />
      ) : (
        <View style={styles.thumbnailPlaceholder}>
          <Ionicons name="fish" size={20} color={COLORS.primary} />
        </View>
      )}
      
      <View style={styles.details}>
        <Text style={styles.species}>{item.species}</Text>
        <Text style={styles.river}>{item.river}</Text>
        <Text style={styles.date}>{formatDate(item.date)}</Text>
      </View>
      
      <View style={styles.stats}>
        {item.length && (
          <Text style={styles.size}>{item.length}"</Text>
        )}
        {item.weight && (
          <Text style={styles.weight}>{item.weight} lbs</Text>
        )}
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
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>🏆 Leaderboard</Text>
          <Text style={styles.subtitle}>
            {filter === 'river' ? currentRiver : filter === 'month' ? 'This Month' : 'All Rivers'}
          </Text>
        </View>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Category Tabs */}
      <View style={styles.categoryTabs}>
        <TouchableOpacity 
          style={[styles.categoryTab, category === 'size' && styles.categoryTabActive]}
          onPress={() => setCategory('size')}
        >
          <Text style={[styles.categoryTabText, category === 'size' && styles.categoryTabTextActive]}>
            Biggest Fish
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.categoryTab, category === 'recent' && styles.categoryTabActive]}
          onPress={() => setCategory('recent')}
        >
          <Text style={[styles.categoryTabText, category === 'recent' && styles.categoryTabTextActive]}>
            Most Recent
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity 
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>
            All Rivers
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterTab, filter === 'river' && styles.filterTabActive]}
          onPress={() => setFilter('river')}
        >
          <Text style={[styles.filterTabText, filter === 'river' && styles.filterTabTextActive]}>
            This River
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterTab, filter === 'month' && styles.filterTabActive]}
          onPress={() => setFilter('month')}
        >
          <Text style={[styles.filterTabText, filter === 'month' && styles.filterTabTextActive]}>
            This Month
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {catches.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="trophy-outline" size={48} color={COLORS.textLight} />
          <Text style={styles.emptyText}>No public catches yet</Text>
          <Text style={styles.emptySubtext}>
            Log a catch and set it to public to appear here!
          </Text>
        </View>
      ) : (
        <FlatList
          data={catches}
          keyExtractor={(item) => item.id}
          renderItem={renderCatch}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
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
    maxHeight: 500,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  categoryTabs: {
    flexDirection: 'row',
    backgroundColor: '#e8e4da',
    borderRadius: 8,
    padding: 2,
    marginBottom: 8,
  },
  categoryTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  categoryTabActive: {
    backgroundColor: COLORS.primary,
  },
  categoryTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  categoryTabTextActive: {
    color: '#f5f1e8',
  },
  filterTabs: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 12,
    backgroundColor: '#f5f1e8',
    borderWidth: 1,
    borderColor: '#e8e4da',
  },
  filterTabActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterTabTextActive: {
    color: '#2c2416',
  },
  list: {
    paddingBottom: 8,
  },
  catchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e4da',
  },
  rankColumn: {
    width: 40,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 16,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
  },
  thumbnailPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#e8e4da',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  details: {
    flex: 1,
  },
  species: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  river: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  date: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 1,
  },
  stats: {
    alignItems: 'flex-end',
  },
  size: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  weight: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default SimpleLeaderboard;

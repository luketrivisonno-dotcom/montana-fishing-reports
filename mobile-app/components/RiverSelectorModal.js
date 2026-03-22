import React, { useState, useMemo } from 'react';
import { 
  View, Text, StyleSheet, Modal, TouchableOpacity, 
  TextInput, FlatList, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  primary: '#2d4a3e',
  primaryDark: '#1a2f27',
  accent: '#c9a227',
  text: '#2c2416',
  textSecondary: '#6b5d4d',
  textLight: '#9a8b7a',
  surface: '#faf8f3',
  background: '#f5f1e8',
};

// All rivers available in the app
const ALL_RIVERS = [
  'Upper Madison River',
  'Lower Madison River',
  'Yellowstone River',
  'Missouri River',
  'Bighorn River',
  'Gallatin River',
  'Jefferson River',
  'Beaverhead River',
  'Big Hole River',
  'Bitterroot River',
  'Blackfoot River',
  'Boulder River',
  'Clark Fork River',
  'Ruby River',
  'Stillwater River',
  'Swan River',
  'Rock Creek',
  'Spring Creeks',
  'North Fork Flathead River',
  'Middle Fork Flathead River',
  'South Fork Flathead River',
  'Smith River',
  'Dearborn River',
  'Slough Creek',
  'Soda Butte Creek',
  'Lamar River',
  'Gardner River',
  'Firehole River',
];

const RiverSelectorModal = ({ visible, onClose, onSelectRiver }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRivers = useMemo(() => {
    if (!searchQuery) return ALL_RIVERS;
    return ALL_RIVERS.filter(river => 
      river.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleSelect = (river) => {
    onSelectRiver(river);
    setSearchQuery('');
    onClose();
  };

  const renderRiverItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.riverItem}
      onPress={() => handleSelect(item)}
    >
      <Ionicons name="water" size={18} color={COLORS.primary} style={{ marginRight: 10 }} />
      <Text style={styles.riverName}>{item}</Text>
      <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} style={{ marginLeft: 'auto' }} />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Log Your Catch</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Select the river where you caught your fish
          </Text>

          {/* Search */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color={COLORS.textLight} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search rivers..."
              placeholderTextColor={COLORS.textLight}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={COLORS.textLight} />
              </TouchableOpacity>
            )}
          </View>

          {/* River List */}
          <FlatList
            data={filteredRivers}
            keyExtractor={(item) => item}
            renderItem={renderRiverItem}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={32} color={COLORS.textLight} />
                <Text style={styles.emptyText}>No rivers found</Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e4da',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e8e4da',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    padding: 0,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  riverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e8e4da',
  },
  riverName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
});

export default RiverSelectorModal;

import React from 'react';
import { 
  View, Text, StyleSheet, Modal, TouchableOpacity, 
  Dimensions, Platform
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

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
  catchPin: '#e74c3c',
  personalPin: '#9b59b6',
};

const MapLongPressModal = ({ visible, coordinate, onClose, onAddPin, onLogCatch }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>What would you like to do?</Text>
            <Text style={styles.subtitle}>
              {coordinate ? `${coordinate.latitude.toFixed(5)}, ${coordinate.longitude.toFixed(5)}` : ''}
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.option}
            onPress={onLogCatch}
          >
            <View style={[styles.iconContainer, { backgroundColor: COLORS.catchPin + '20' }]}>
              <MaterialCommunityIcons name="fish" size={28} color={COLORS.catchPin} />
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>Log a Catch</Text>
              <Text style={styles.optionDescription}>
                Record a fish you caught at this location
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.option}
            onPress={onAddPin}
          >
            <View style={[styles.iconContainer, { backgroundColor: COLORS.personalPin + '20' }]}>
              <Ionicons name="location" size={28} color={COLORS.personalPin} />
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>Add Personal Pin</Text>
              <Text style={styles.optionDescription}>
                Mark a fishing spot, camp, hazard, or note
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 47, 39, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    width: SCREEN_WIDTH - 40,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e8e4da',
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  cancelButton: {
    marginTop: 8,
    padding: 14,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
});

export default MapLongPressModal;

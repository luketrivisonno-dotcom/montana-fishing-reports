// Modal for adding/editing personal fishing pins
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const COLORS = {
  primary: '#2d4a3e',
  primaryDark: '#1a2f27',
  accent: '#c9a227',
  background: '#f5f1e8',
  surface: '#faf8f3',
  text: '#2c2416',
  textSecondary: '#6b5d4d',
  textLight: '#9a8b7a',
  border: '#d4cfc3',
  error: '#a65d57',
  success: '#5a7d5a',
};

const PIN_TYPES = [
  { id: 'fishing_spot', label: 'Fishing Spot', icon: 'fish', color: '#4a90d9' },
  { id: 'access_point', label: 'Access Point', icon: 'walk', color: '#5a9e6e' },
  { id: 'camp_spot', label: 'Camp Spot', icon: 'tent', color: '#8b4513' },
  { id: 'hazard', label: 'Hazard', icon: 'alert-circle', color: '#e74c3c' },
  { id: 'note', label: 'Note', icon: 'note-text', color: '#c9a227' },
];

export default function PersonalPinModal({ 
  visible, 
  onClose, 
  onSave, 
  onDelete,
  editingPin = null,
  coordinate = null 
}) {
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedType, setSelectedType] = useState('fishing_spot');
  const [isPublic, setIsPublic] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (editingPin) {
      setName(editingPin.name || '');
      setNotes(editingPin.notes || '');
      setSelectedType(editingPin.type || 'fishing_spot');
      setIsPublic(editingPin.isPublic || false);
    } else {
      // Reset form for new pin
      setName('');
      setNotes('');
      setSelectedType('fishing_spot');
      setIsPublic(false);
    }
  }, [editingPin, visible]);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name for this location');
      return;
    }

    const pinData = {
      id: editingPin?.id || Date.now().toString(),
      name: name.trim(),
      notes: notes.trim(),
      type: selectedType,
      isPublic: isPublic,
      coordinate: editingPin?.coordinate || coordinate,
      createdAt: editingPin?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(pinData);
    onClose();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Pin',
      `Are you sure you want to delete "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            if (editingPin?.id) {
              onDelete(editingPin.id);
            }
            onClose();
          }
        }
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <View style={styles.container}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>
                  {editingPin ? 'Edit Pin' : 'Add Personal Pin'}
                </Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={COLORS.text} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={true}
              >
                {/* Coordinate Display */}
                {coordinate && (
                  <View style={styles.coordinateBox}>
                    <Ionicons name="location" size={16} color={COLORS.accent} />
                    <Text style={styles.coordinateText}>
                      {coordinate.latitude.toFixed(6)}, {coordinate.longitude.toFixed(6)}
                    </Text>
                  </View>
                )}

                {/* Pin Type Selection */}
                <Text style={styles.sectionLabel}>Pin Type</Text>
                <View style={styles.typeGrid}>
                  {PIN_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type.id}
                      style={[
                        styles.typeButton,
                        selectedType === type.id && { 
                          backgroundColor: type.color + '20',
                          borderColor: type.color 
                        }
                      ]}
                      onPress={() => setSelectedType(type.id)}
                    >
                      <MaterialCommunityIcons 
                        name={type.icon} 
                        size={20} 
                        color={selectedType === type.id ? type.color : COLORS.textSecondary} 
                      />
                      <Text style={[
                        styles.typeLabel,
                        selectedType === type.id && { color: type.color }
                      ]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Name Input */}
                <Text style={styles.sectionLabel}>Name</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g., Secret Hole, Good Wade Spot..."
                  placeholderTextColor={COLORS.textLight}
                  maxLength={50}
                  returnKeyType="next"
                />

                {/* Notes Input */}
                <Text style={styles.sectionLabel}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.notesInput]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Add details about this spot..."
                  placeholderTextColor={COLORS.textLight}
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                  textAlignVertical="top"
                />

                {/* Spacer for keyboard */}
                <View style={styles.spacer} />
              </ScrollView>

              {/* Action Buttons - Fixed at bottom */}
              <View style={styles.buttonRow}>
                {editingPin && (
                  <TouchableOpacity 
                    style={[styles.button, styles.deleteButton]}
                    onPress={handleDelete}
                  >
                    <Ionicons name="trash-outline" size={18} color="#fff" />
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity 
                  style={[styles.button, styles.cancelButton]}
                  onPress={onClose}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.button, styles.saveButton]}
                  onPress={handleSave}
                >
                  <Ionicons name="checkmark" size={18} color="#fff" />
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 10,
  },
  coordinateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  coordinateText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 16,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  spacer: {
    height: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 6,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    flex: 1,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelButtonText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: COLORS.error,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});

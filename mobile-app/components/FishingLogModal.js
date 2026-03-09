import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Modal, TouchableOpacity, 
  TextInput, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  primary: '#2d4a3e',
  accent: '#c9a227',
  text: '#2c2416',
  textSecondary: '#6b5d4d',
  textLight: '#9a8b7a',
  surface: '#faf8f3',
  success: '#5a7d5a',
  error: '#a65d57',
};

const FishingLogModal = ({ visible, onClose, riverName, onSave }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [species, setSpecies] = useState('');
  const [length, setLength] = useState('');
  const [fly, setFly] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setSpecies('');
    setLength('');
    setFly('');
    setNotes('');
  };

  const handleSave = async () => {
    if (!species) {
      Alert.alert('Required', 'Please enter the species');
      return;
    }

    setLoading(true);
    await onSave({
      date,
      river: riverName,
      species,
      length: length ? parseFloat(length) : null,
      fly: fly || null,
      notes: notes || null,
    });
    setLoading(false);
    resetForm();
    onClose();
  };

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
            <Text style={styles.title}>🎣 Log Your Catch</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form}>
            <Text style={styles.label}>River</Text>
            <Text style={styles.riverName}>{riverName}</Text>

            <Text style={styles.label}>Date *</Text>
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
            />

            <Text style={styles.label}>Species *</Text>
            <TextInput
              style={styles.input}
              value={species}
              onChangeText={setSpecies}
              placeholder="e.g., Rainbow Trout, Brown Trout"
            />

            <Text style={styles.label}>Length (inches)</Text>
            <TextInput
              style={styles.input}
              value={length}
              onChangeText={setLength}
              placeholder="e.g., 18"
              keyboardType="numeric"
            />

            <Text style={styles.label}>Fly Used</Text>
            <TextInput
              style={styles.input}
              value={fly}
              onChangeText={setFly}
              placeholder="e.g., Elk Hair Caddis #14"
            />

            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Water conditions, weather, etc."
              multiline
              numberOfLines={4}
            />
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveText}>Save Catch</Text>
              )}
            </TouchableOpacity>
          </View>
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
    maxHeight: '90%',
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
  form: {
    padding: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  riverName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f1e8',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: '#e8e4da',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e8e4da',
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#f5f1e8',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  saveButton: {
    flex: 2,
    padding: 14,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});

export default FishingLogModal;

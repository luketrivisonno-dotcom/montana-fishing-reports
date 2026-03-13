import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { RIVER_MILES } from '../data/riverMiles';

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

const RiverMileCalculator = ({ riverName }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);

  const mileData = RIVER_MILES[riverName];
  
  // Show "Coming Soon" for rivers without mile data
  if (!mileData || mileData.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <MaterialCommunityIcons name="map-marker-distance" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
          <Text style={styles.title}>River Mile Calculator</Text>
        </View>
        <View style={styles.comingSoonBox}>
          <MaterialCommunityIcons name="clock-outline" size={32} color={COLORS.textLight} />
          <Text style={styles.comingSoonTitle}>Coming Soon</Text>
          <Text style={styles.comingSoonText}>
            River mile data for {riverName} is currently being mapped. Check back soon!
          </Text>
        </View>
      </View>
    );
  }

  const calculateDistance = () => {
    if (!startPoint || !endPoint) return null;
    return Math.abs(endPoint.mile - startPoint.mile);
  };

  const getAccessTypeColor = (type) => {
    switch(type) {
      case 'GREEN': return '#27ae60';
      case 'BROWN': return '#8b7355';
      case 'RED': return '#e74c3c';
      default: return '#7f8c8d';
    }
  };

  const distance = calculateDistance();

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <MaterialCommunityIcons name="map-marker-distance" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
        <Text style={styles.title}>River Mile Calculator</Text>
      </View>

      {distance !== null && (
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>{distance.toFixed(1)} miles</Text>
          <Text style={styles.resultSubtext}>
            {startPoint.name} → {endPoint.name}
          </Text>
        </View>
      )}

      <View style={styles.selectionRow}>
        <TouchableOpacity 
          style={[styles.pointButton, startPoint && styles.pointButtonActive]}
          onPress={() => { setStartPoint(null); setEndPoint(null); setModalVisible(true); }}
        >
          <Text style={styles.pointButtonText}>
            {startPoint ? `Start: ${startPoint.name}` : 'Select Start Point'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.pointButton, endPoint && styles.pointButtonActive, !startPoint && styles.pointButtonDisabled]}
          onPress={() => setModalVisible(true)}
          disabled={!startPoint}
        >
          <Text style={[styles.pointButtonText, !startPoint && styles.pointButtonTextDisabled]}>
            {endPoint ? `End: ${endPoint.name}` : 'Select End Point'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.resetButton}
        onPress={() => { setStartPoint(null); setEndPoint(null); }}
      >
        <Text style={styles.resetText}>Reset</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {!startPoint ? 'Select Start Point' : 'Select End Point'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.markerList}>
              {mileData
                .filter(marker => !startPoint || marker.name !== startPoint.name)
                .map((marker, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.markerItem}
                  onPress={() => {
                    if (!startPoint) {
                      setStartPoint(marker);
                    } else {
                      setEndPoint(marker);
                    }
                    setModalVisible(false);
                  }}
                >
                  <View style={styles.markerInfo}>
                    <Text style={styles.markerName}>{marker.name}</Text>
                    <Text style={styles.markerMile}>Mile {marker.mile}</Text>
                  </View>
                  <View style={[styles.typeDot, { backgroundColor: getAccessTypeColor(marker.type) }]} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  resultBox: {
    backgroundColor: COLORS.primary + '15',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  resultText: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.primary,
  },
  resultSubtext: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  selectionRow: {
    gap: 8,
  },
  pointButton: {
    backgroundColor: '#f5f1e8',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e8e4da',
  },
  pointButtonActive: {
    backgroundColor: COLORS.primary + '15',
    borderColor: COLORS.primary,
  },
  pointButtonDisabled: {
    opacity: 0.5,
  },
  pointButtonText: {
    fontSize: 14,
    color: COLORS.text,
  },
  pointButtonTextDisabled: {
    color: COLORS.textLight,
  },
  resetButton: {
    alignSelf: 'center',
    marginTop: 12,
    padding: 8,
  },
  resetText: {
    fontSize: 14,
    color: COLORS.error,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e4da',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  markerList: {
    padding: 16,
  },
  markerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e4da',
  },
  markerInfo: {
    flex: 1,
  },
  markerName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  markerMile: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  typeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  comingSoonBox: {
    backgroundColor: '#f5f1e8',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e8e4da',
    borderStyle: 'dashed',
  },
  comingSoonTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 12,
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default RiverMileCalculator;

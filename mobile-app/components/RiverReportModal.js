import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://montana-fishing-reports-production.up.railway.app';

const COLORS = {
  primary: '#2d4a3e',
  accent: '#c9a227',
  surface: '#faf8f3',
  background: '#f5f1e8',
  border: '#e8e4da',
  text: '#2c2416',
  textLight: '#6b5d4d',
  textMuted: '#9a8b7a',
  success: '#5a7d5a',
  error: '#a65d57',
};

// Compact single-line options
const WATER_COLORS = [
  { value: 'clear', label: 'Clear', color: '#4a90d9' },
  { value: 'stained', label: 'Stained', color: '#8b7355' },
  { value: 'muddy', label: 'Muddy', color: '#6b4423' },
];

const CROWD_LEVELS = [
  { value: 'empty', label: 'Empty' },
  { value: 'light', label: 'Light' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'busy', label: 'Busy' },
  { value: 'packed', label: 'Packed' },
];

const BOAT_ACTIVITY = [
  { value: 'none', label: 'None' },
  { value: 'few', label: 'Few' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'heavy', label: 'Heavy' },
];

const FISH_ACTIVITIES = [
  { value: 'hot', label: 'Hot!', color: '#e74c3c' },
  { value: 'active', label: 'Active', color: '#27ae60' },
  { value: 'picky', label: 'Picky', color: '#f39c12' },
  { value: 'slow', label: 'Slow', color: '#7f8c8d' },
  { value: 'not_seen', label: 'Not Seen', color: '#95a5a6' },
];

const FISH_BEHAVIOR = [
  { value: 'rising', label: 'Rising to dries' },
  { value: 'nymphing', label: 'Taking nymphs' },
  { value: 'streamers', label: 'Chasing streamers' },
  { value: 'cruising', label: 'Cruising/suspended' },
  { value: 'hunkered', label: 'Hunkered down' },
];

const PRESSURE_SIGNS = [
  { value: 'fresh', label: 'Fresh fish', desc: 'Active, unpressured' },
  { value: 'educated', label: 'Educated', desc: 'Selective, spooky' },
  { value: 'stressed', label: 'Stressed', desc: 'Tough fishing' },
];

// Comprehensive insect list organized by category
const INSECT_CATEGORIES = {
  'Mayflies': ['BWO', 'PMD', 'Pale Morning Dun', 'Drake', 'Green Drake', 'Brown Drake', 'Hex', 'Callibaetis', 'Trico', 'Mahogany Dun', 'Blue Quill', 'March Brown', 'Gray Drake', 'Pink Alberts'],
  'Caddis': ['Tan Caddis', 'Black Caddis', 'Green Caddis', 'October Caddis', 'Spotted Sedge', 'Traveling Sedge'],
  'Stoneflies': ['Salmonfly', 'Golden Stone', 'Yellow Sally', 'Skwala', 'Little Black Stone'],
  'Terrestrials': ['Grasshopper', 'Ant', 'Beetle', 'Cricket', 'Moth'],
  'Midges': ['Chironomid', 'Buzzers', 'Bloodworm'],
  'Other': ['Moths', 'Craneflies', 'Damselflies', 'Dragonflies', 'Scuds', 'Sowbugs'],
};

// Hook sizes
const HOOK_SIZES = ['2', '4', '6', '8', '10', '12', '14', '16', '18', '20', '22', '24'];

const RiverReportModal = ({ visible, onClose, riverName }) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [showInsectDropdown, setShowInsectDropdown] = useState(false);
  
  // Core conditions
  const [waterColor, setWaterColor] = useState('');
  const [fishActivity, setFishActivity] = useState('');
  const [fishBehavior, setFishBehavior] = useState('');
  const [fishCaught, setFishCaught] = useState('');
  const [fishRising, setFishRising] = useState(false);
  
  // Crowd & Pressure
  const [crowdLevel, setCrowdLevel] = useState('');
  const [boatActivity, setBoatActivity] = useState('');
  const [pressureSigns, setPressureSigns] = useState('');
  
  // Environment
  const [activeInsects, setActiveInsects] = useState([]);
  const [waterTemp, setWaterTemp] = useState('');
  
  // Location & details
  const [accessPoint, setAccessPoint] = useState('');
  const [hoursFished, setHoursFished] = useState('');
  const [fliesUsed, setFliesUsed] = useState('');
  const [flyHookSize, setFlyHookSize] = useState('');
  const [notes, setNotes] = useState('');

  const toggleInsect = (insect) => {
    if (activeInsects.includes(insect)) {
      setActiveInsects(activeInsects.filter(i => i !== insect));
    } else {
      setActiveInsects([...activeInsects, insect]);
    }
  };

  const submitReport = async () => {
    if (!fishActivity) {
      Alert.alert('Missing Info', 'Please select fish activity level');
      return;
    }

    setLoading(true);
    try {
      const userEmail = await AsyncStorage.getItem('userEmail');
      
      const reportData = {
        river: riverName,
        user_email: userEmail,
        water_color: waterColor,
        fish_activity: fishActivity,
        fish_behavior: fishBehavior,
        fish_caught: parseInt(fishCaught) || 0,
        fish_rising: fishRising,
        
        // Crowd & pressure data for algorithm
        crowd_level: crowdLevel,
        boat_activity: boatActivity,
        pressure_signs: pressureSigns,
        
        insects_active: activeInsects.join(', '),
        water_temp: waterTemp ? parseInt(waterTemp) : null,
        access_point: accessPoint,
        hours_fished: hoursFished ? parseFloat(hoursFished) : null,
        flies_used: fliesUsed,
        fly_hook_size: flyHookSize || null,
        notes,
      };
      
      console.log('Submitting report:', reportData);

      const response = await fetch(`${API_URL}/api/river-reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData),
      });

      if (response.ok) {
        Alert.alert('Success', 'Thank you! Your report helps train the HatchCast algorithm.');
        resetForm();
        onClose();
      } else {
        const errorText = await response.text();
        console.log('Submit error response:', errorText);
        let errorMessage = 'Failed to submit. Please try again.';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.details || errorData.error || errorMessage;
        } catch (e) {}
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      console.error('Submit report error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setWaterColor('');
    setFishActivity('');
    setFishBehavior('');
    setFishCaught('');
    setFishRising(false);
    setCrowdLevel('');
    setBoatActivity('');
    setPressureSigns('');
    setActiveInsects([]);
    setWaterTemp('');
    setAccessPoint('');
    setHoursFished('');
    setFliesUsed('');
    setFlyHookSize('');
    setNotes('');
    setStep(1);
    setShowInsectDropdown(false);
  };

  // Compact horizontal buttons for single-line display
  const renderCompactButtons = (options, selected, onSelect) => (
    <View style={styles.compactRow}>
      {options.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.compactButton,
            selected === option.value && styles.compactButtonSelected,
            option.color && selected === option.value && { backgroundColor: option.color, borderColor: option.color },
          ]}
          onPress={() => onSelect(option.value)}
        >
          <Text
            style={[
              styles.compactButtonText,
              selected === option.value && styles.compactButtonTextSelected,
            ]}
            numberOfLines={1}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderSection = (title, icon, children) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name={icon} size={22} color={COLORS.accent} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );

  const renderOptionButtons = (options, selected, onSelect) => (
    <View style={styles.optionsGrid}>
      {options.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.optionButton,
            selected === option.value && styles.optionButtonSelected,
          ]}
          onPress={() => onSelect(option.value)}
        >
          {option.icon && (
            <MaterialCommunityIcons
              name={option.icon}
              size={20}
              color={selected === option.value ? '#fff' : option.color || COLORS.text}
              style={{ marginBottom: 4 }}
            />
          )}
          <Text
            style={[
              styles.optionText,
              selected === option.value && styles.optionTextSelected,
            ]}
          >
            {option.label}
          </Text>
          {option.desc && (
            <Text style={[styles.optionDesc, selected === option.value && styles.optionDescSelected]}>
              {option.desc}
            </Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  // Insect dropdown with categories
  const renderInsectDropdown = () => (
    <View style={styles.insectDropdown}>
      <ScrollView style={styles.insectDropdownScroll} nestedScrollEnabled>
        {Object.entries(INSECT_CATEGORIES).map(([category, insects]) => (
          <View key={category} style={styles.insectCategory}>
            <Text style={styles.insectCategoryTitle}>{category}</Text>
            <View style={styles.insectCategoryItems}>
              {insects.map((insect) => (
                <TouchableOpacity
                  key={insect}
                  style={[
                    styles.insectDropdownItem,
                    activeInsects.includes(insect) && styles.insectDropdownItemSelected,
                  ]}
                  onPress={() => toggleInsect(insect)}
                >
                  <Ionicons 
                    name={activeInsects.includes(insect) ? "checkbox" : "square-outline"} 
                    size={18} 
                    color={activeInsects.includes(insect) ? COLORS.accent : COLORS.textMuted} 
                  />
                  <Text 
                    style={[
                      styles.insectDropdownText,
                      activeInsects.includes(insect) && styles.insectDropdownTextSelected,
                    ]}
                  >
                    {insect}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
      <TouchableOpacity 
        style={styles.insectDropdownClose}
        onPress={() => setShowInsectDropdown(false)}
      >
        <Text style={styles.insectDropdownCloseText}>Done ({activeInsects.length} selected)</Text>
      </TouchableOpacity>
    </View>
  );

  // Step 1: Essential Info
  const renderStep1 = () => (
    <>
      {renderSection('Fish Activity', 'fish', (
        <>
          <Text style={styles.label}>How was the fishing?</Text>
          {renderCompactButtons(FISH_ACTIVITIES, fishActivity, setFishActivity)}
          
          <Text style={styles.label}>What were they doing?</Text>
          {renderOptionButtons(FISH_BEHAVIOR, fishBehavior, setFishBehavior)}
          
          <View style={styles.rowInputs}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Fish Caught</Text>
              <TextInput
                style={styles.input}
                value={fishCaught}
                onChangeText={setFishCaught}
                keyboardType="number-pad"
                placeholder="0"
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Rising?</Text>
              <TouchableOpacity
                style={[styles.toggleButton, fishRising && styles.toggleButtonActive]}
                onPress={() => setFishRising(!fishRising)}
              >
                <Text style={[styles.toggleText, fishRising && styles.toggleTextActive]}>
                  {fishRising ? 'Yes ✓' : 'No'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      ))}

      {renderSection('Water Conditions', 'water', (
        <>
          <Text style={styles.label}>Water Color</Text>
          {renderCompactButtons(WATER_COLORS, waterColor, setWaterColor)}
          
          <Text style={styles.label}>Water Temp (°F) - optional</Text>
          <TextInput
            style={styles.input}
            value={waterTemp}
            onChangeText={setWaterTemp}
            keyboardType="number-pad"
            placeholder="e.g., 58"
          />
        </>
      ))}
    </>
  );

  // Step 2: Crowd & Pressure
  const renderStep2 = () => (
    <>
      {renderSection('River Busyness', 'account-group', (
        <>
          <Text style={styles.label}>How crowded was it?</Text>
          {renderCompactButtons(CROWD_LEVELS, crowdLevel, setCrowdLevel)}
          
          <Text style={styles.label}>Drift boat activity</Text>
          {renderCompactButtons(BOAT_ACTIVITY, boatActivity, setBoatActivity)}
        </>
      ))}

      {renderSection('Fishing Pressure', 'gauge', (
        <>
          <Text style={styles.label}>How did the fish seem?</Text>
          {renderOptionButtons(PRESSURE_SIGNS, pressureSigns, setPressureSigns)}
        </>
      ))}

      {renderSection('Bugs & Flies', 'bug', (
        <>
          <Text style={styles.label}>Insects you saw ({activeInsects.length} selected)</Text>
          
          {/* Selected insects display */}
          {activeInsects.length > 0 && (
            <View style={styles.selectedInsectsRow}>
              {activeInsects.slice(0, 4).map((insect, index) => (
                <View key={index} style={styles.selectedInsectChip}>
                  <Text style={styles.selectedInsectText}>{insect}</Text>
                  <TouchableOpacity onPress={() => toggleInsect(insect)}>
                    <Ionicons name="close-circle" size={14} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>
              ))}
              {activeInsects.length > 4 && (
                <Text style={styles.moreInsectsText}>+{activeInsects.length - 4} more</Text>
              )}
            </View>
          )}
          
          {/* Dropdown toggle button */}
          <TouchableOpacity 
            style={styles.insectDropdownButton}
            onPress={() => setShowInsectDropdown(!showInsectDropdown)}
          >
            <Ionicons name={showInsectDropdown ? "chevron-up" : "chevron-down"} size={20} color={COLORS.primary} />
            <Text style={styles.insectDropdownButtonText}>
              {showInsectDropdown ? 'Hide insect list' : 'Select insects...'}
            </Text>
          </TouchableOpacity>
          
          {/* Insect dropdown */}
          {showInsectDropdown && renderInsectDropdown()}
          
          <Text style={styles.label}>Flies that worked</Text>
          <View style={styles.fliesRow}>
            <TextInput
              style={[styles.input, styles.fliesInput]}
              value={fliesUsed}
              onChangeText={setFliesUsed}
              placeholder="e.g., PMD Sparkle Dun"
            />
            <View style={styles.hookSizeContainer}>
              <Text style={styles.hookSizeLabel}>Size</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hookSizeScroll}>
                {HOOK_SIZES.map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.hookSizeButton,
                      flyHookSize === size && styles.hookSizeButtonSelected,
                    ]}
                    onPress={() => setFlyHookSize(size)}
                  >
                    <Text style={[
                      styles.hookSizeText,
                      flyHookSize === size && styles.hookSizeTextSelected,
                    ]}>
                      #{size}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </>
      ))}
    </>
  );

  // Step 3: Details
  const renderStep3 = () => (
    <>
      {renderSection('Location Details', 'map-marker', (
        <>
          <Text style={styles.label}>Where did you fish?</Text>
          <TextInput
            style={styles.input}
            value={accessPoint}
            onChangeText={setAccessPoint}
            placeholder="e.g., Between $3 Bridge and Lyons"
          />

          <Text style={styles.label}>Hours fished</Text>
          <TextInput
            style={styles.input}
            value={hoursFished}
            onChangeText={setHoursFished}
            keyboardType="decimal-pad"
            placeholder="e.g., 4"
          />
        </>
      ))}

      {renderSection('Additional Notes', 'note-text', (
        <>
          <Text style={styles.label}>Anything else?</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Access issues, hot spots, techniques that worked..."
            multiline
            numberOfLines={4}
          />
        </>
      ))}
    </>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>River Report</Text>
              <Text style={styles.headerSubtitle}>{riverName}</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          {/* Step Indicator */}
          <View style={styles.stepIndicator}>
            {[1, 2, 3].map((s) => (
              <View key={s} style={styles.stepDotContainer}>
                <View style={[styles.stepDot, step === s && styles.stepDotActive, step > s && styles.stepDotComplete]}>
                  {step > s ? (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  ) : (
                    <Text style={[styles.stepText, step === s && styles.stepTextActive]}>{s}</Text>
                  )}
                </View>
                <Text style={[styles.stepLabel, step === s && styles.stepLabelActive]}>
                  {s === 1 ? 'Activity' : s === 2 ? 'Crowd' : 'Details'}
                </Text>
              </View>
            ))}
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}

            {/* Navigation Buttons */}
            <View style={styles.navButtons}>
              {step > 1 && (
                <TouchableOpacity style={styles.backButton} onPress={() => setStep(step - 1)}>
                  <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
              )}
              
              {step < 3 ? (
                <TouchableOpacity style={styles.nextButton} onPress={() => setStep(step + 1)}>
                  <Text style={styles.nextButtonText}>Next →</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                  onPress={submitReport}
                  disabled={loading}
                >
                  <Text style={styles.submitButtonText}>
                    {loading ? 'Submitting...' : 'Submit Report'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 2,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  stepDotContainer: {
    alignItems: 'center',
    marginHorizontal: 20,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  stepDotComplete: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  stepText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textLight,
  },
  stepTextActive: {
    color: '#fff',
  },
  stepLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  stepLabelActive: {
    color: COLORS.accent,
    fontWeight: '600',
  },
  scrollView: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 12,
  },
  // Compact single-line buttons
  compactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 8,
  },
  compactButton: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 0,
  },
  compactButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  compactButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  compactButtonTextSelected: {
    color: '#fff',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: '23%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  optionButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  optionTextSelected: {
    color: '#fff',
  },
  optionDesc: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  optionDescSelected: {
    color: 'rgba(255,255,255,0.8)',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  halfInput: {
    flex: 1,
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  toggleButton: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  toggleButtonActive: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  toggleTextActive: {
    color: '#fff',
  },
  // Insect dropdown styles
  selectedInsectsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  selectedInsectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  selectedInsectText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  moreInsectsText: {
    fontSize: 12,
    color: COLORS.textMuted,
    alignSelf: 'center',
  },
  insectDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  insectDropdownButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  insectDropdown: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 8,
    marginBottom: 12,
    maxHeight: 300,
  },
  insectDropdownScroll: {
    padding: 12,
  },
  insectCategory: {
    marginBottom: 16,
  },
  insectCategoryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  insectCategoryItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  insectDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  insectDropdownItemSelected: {
    backgroundColor: COLORS.accent + '20',
    borderColor: COLORS.accent,
  },
  insectDropdownText: {
    fontSize: 13,
    color: COLORS.text,
  },
  insectDropdownTextSelected: {
    fontWeight: '600',
  },
  insectDropdownClose: {
    backgroundColor: COLORS.primary,
    padding: 12,
    alignItems: 'center',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  insectDropdownCloseText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  // Flies and hook size
  fliesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  fliesInput: {
    flex: 1,
  },
  hookSizeContainer: {
    width: 120,
  },
  hookSizeLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  hookSizeScroll: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 8,
  },
  hookSizeButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginRight: 4,
  },
  hookSizeButtonSelected: {
    backgroundColor: COLORS.accent,
    borderRadius: 6,
  },
  hookSizeText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '600',
  },
  hookSizeTextSelected: {
    color: '#2c2416',
  },
  navButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  backButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    flex: 1,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  submitButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    flex: 1,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#2c2416',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default RiverReportModal;

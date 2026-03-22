import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Modal, TouchableOpacity, 
  TextInput, ScrollView, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, Image, Switch
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import BragCard from './BragCard';

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

const FishingLogModal = ({ visible, onClose, riverName, onSave, onShare, initialLocation, existingCatch, onRequestMapLocation }) => {
  const isEditMode = !!existingCatch;
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [species, setSpecies] = useState('');
  const [length, setLength] = useState('');
  const [weight, setWeight] = useState('');
  const [fly, setFly] = useState('');
  const [hookSize, setHookSize] = useState('');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState(null);
  const [location, setLocation] = useState(initialLocation || null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [userName, setUserName] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  // Load existing catch data when in edit mode
  useEffect(() => {
    if (existingCatch) {
      setDate(existingCatch.date || new Date().toISOString().split('T')[0]);
      setSpecies(existingCatch.species || '');
      setLength(existingCatch.length ? String(existingCatch.length) : '');
      setWeight(existingCatch.weight ? String(existingCatch.weight) : '');
      setFly(existingCatch.fly || '');
      setHookSize(existingCatch.hookSize ? String(existingCatch.hookSize) : '');
      setNotes(existingCatch.notes || '');
      setPhoto(existingCatch.photo || null);
      setLocation(existingCatch.location || initialLocation || null);
      setIsPublic(existingCatch.isPublic || false);
      setUserName(existingCatch.userName || '');
      setInstagram(existingCatch.instagram || '');
      setFacebook(existingCatch.facebook || '');
    }
  }, [existingCatch]);

  // Update location when initialLocation prop changes (only for new catches)
  useEffect(() => {
    if (initialLocation && !isEditMode) {
      setLocation(initialLocation);
    }
  }, [initialLocation, isEditMode]);

  const resetForm = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setSpecies('');
    setLength('');
    setWeight('');
    setFly('');
    setHookSize('');
    setNotes('');
    setPhoto(null);
    setLocation(initialLocation || null);
    setIsPublic(false);
    setUserName('');
    setInstagram('');
    setFacebook('');
  };

  const getCurrentLocation = async () => {
    setGettingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow location access to tag your catch location');
        setGettingLocation(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation
      });
      
      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        accuracy: currentLocation.coords.accuracy,
        type: 'current'
      });
    } catch (error) {
      Alert.alert('Error', 'Could not get your location. Please try again.');
    } finally {
      setGettingLocation(false);
    }
  };

  const clearLocation = () => {
    setLocation(null);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPhoto(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your camera');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPhoto(result.assets[0].uri);
    }
  };

  const handleSave = async (shouldShare = false) => {
    if (!species) {
      Alert.alert('Required', 'Please enter the species');
      return;
    }

    const catchData = {
      id: isEditMode ? existingCatch.id : undefined,
      date,
      river: riverName,
      species,
      length: length ? parseFloat(length) : null,
      weight: weight ? parseFloat(weight) : null,
      fly: fly || null,
      hookSize: hookSize || null,
      notes: notes || null,
      photo: photo || null,
      location: location || null,
      isPublic,
      userName: userName || null,
      instagram: instagram || null,
      facebook: facebook || null,
      createdAt: isEditMode ? existingCatch.createdAt : new Date().toISOString(),
    };

    if (shouldShare) {
      // Show preview first
      setPreviewData(catchData);
      setShowPreview(true);
    } else {
      // Just save
      setLoading(true);
      try {
        const success = await onSave(catchData, isEditMode);
        if (success) {
          resetForm();
          onClose();
        }
      } catch (error) {
        console.error('Save error:', error);
        Alert.alert('Error', `Failed to ${isEditMode ? 'update' : 'save'} catch. Please try again.`);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleShareComplete = async () => {
    // Save after sharing
    setLoading(true);
    try {
      const success = await onSave(previewData, isEditMode);
      if (success) {
        resetForm();
        setShowPreview(false);
        setPreviewData(null);
        onClose();
      }
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save catch. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.container}>
            <View style={styles.header}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="hook" size={22} color={COLORS.primary} style={{ marginRight: 8 }} />
                <Text style={styles.title}>{isEditMode ? 'Edit Catch' : 'Log Your Catch'}</Text>
              </View>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.form}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
            >
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

              <Text style={styles.label}>Your Name (for Leaderboard)</Text>
              <TextInput
                style={styles.input}
                value={userName}
                onChangeText={setUserName}
                placeholder="e.g., John D. (optional)"
              />

              <View style={styles.rowInputs}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Length (inches)</Text>
                  <TextInput
                    style={styles.input}
                    value={length}
                    onChangeText={setLength}
                    placeholder="18"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Weight (lbs)</Text>
                  <TextInput
                    style={styles.input}
                    value={weight}
                    onChangeText={setWeight}
                    placeholder="2.5"
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <Text style={styles.label}>Fly Used</Text>
              <View style={styles.flyRow}>
                <TextInput
                  style={[styles.input, styles.flyInput]}
                  value={fly}
                  onChangeText={setFly}
                  placeholder="e.g., Elk Hair Caddis"
                />
                <View style={styles.hookSizeContainer}>
                  <Text style={styles.hookSizeLabel}>Size</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hookSizeScroll}>
                    {['10', '12', '14', '16', '18', '20', '22'].map((size) => (
                      <TouchableOpacity
                        key={size}
                        style={[
                          styles.hookSizeButton,
                          hookSize === size && styles.hookSizeButtonSelected,
                        ]}
                        onPress={() => setHookSize(size)}
                      >
                        <Text style={[
                          styles.hookSizeText,
                          hookSize === size && styles.hookSizeTextSelected,
                        ]}>
                          #{size}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
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

              <Text style={styles.label}>Photo</Text>
              {photo ? (
                <View style={styles.photoContainer}>
                  <Image source={{ uri: photo }} style={styles.photoPreview} />
                  <TouchableOpacity 
                    style={styles.removePhotoButton}
                    onPress={() => setPhoto(null)}
                  >
                    <Ionicons name="close-circle" size={24} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.photoButtons}>
                  <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
                    <Ionicons name="camera" size={20} color={COLORS.primary} />
                    <Text style={styles.photoButtonText}>Take Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
                    <Ionicons name="images" size={20} color={COLORS.primary} />
                    <Text style={styles.photoButtonText}>Choose Photo</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              {/* Location Section */}
              <Text style={styles.label}>Location</Text>
              
              {/* Location Options */}
              <View style={styles.locationOptions}>
                {/* No Location */}
                <TouchableOpacity 
                  style={[styles.locationOption, !location && styles.locationOptionSelected]}
                  onPress={clearLocation}
                >
                  <Ionicons 
                    name={!location ? "radio-button-on" : "radio-button-off"} 
                    size={20} 
                    color={!location ? COLORS.accent : COLORS.textLight} 
                  />
                  <View style={styles.locationOptionText}>
                    <Text style={[styles.locationOptionTitle, !location && styles.locationOptionTitleSelected]}>
                      No Location
                    </Text>
                    <Text style={styles.locationOptionSubtitle}>
                      Don't show on map
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Current Location */}
                <TouchableOpacity 
                  style={[styles.locationOption, location?.type === 'current' && styles.locationOptionSelected]}
                  onPress={getCurrentLocation}
                  disabled={gettingLocation}
                >
                  {gettingLocation ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : (
                    <Ionicons 
                      name={location?.type === 'current' ? "radio-button-on" : "radio-button-off"} 
                      size={20} 
                      color={location?.type === 'current' ? COLORS.accent : COLORS.textLight} 
                    />
                  )}
                  <View style={styles.locationOptionText}>
                    <Text style={[styles.locationOptionTitle, location?.type === 'current' && styles.locationOptionTitleSelected]}>
                      Current
                    </Text>
                    <Text style={styles.locationOptionSubtitle}>
                      Use phone's GPS
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Mark on Map */}
                <TouchableOpacity 
                  style={[styles.locationOption, location?.type === 'map' && styles.locationOptionSelected]}
                  onPress={() => {
                    if (onRequestMapLocation) {
                      // Close modal and request map location selection
                      onClose();
                      onRequestMapLocation();
                    } else {
                      Alert.alert('Coming Soon', 'Map selection will be available in a future update.');
                    }
                  }}
                >
                  <Ionicons 
                    name={location?.type === 'map' ? "radio-button-on" : "radio-button-off"} 
                    size={20} 
                    color={location?.type === 'map' ? COLORS.accent : COLORS.textLight} 
                  />
                  <View style={styles.locationOptionText}>
                    <Text style={[styles.locationOptionTitle, location?.type === 'map' && styles.locationOptionTitleSelected]}>
                      Mark on Map
                    </Text>
                    <Text style={styles.locationOptionSubtitle}>
                      Choose precise spot
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Show current coordinates if location set */}
              {location && (
                <View style={styles.locationCoords}>
                  <Ionicons name="location" size={14} color={COLORS.accent} />
                  <Text style={styles.locationCoordsText}>
                    {location.latitude?.toFixed(6)}, {location.longitude?.toFixed(6)}
                  </Text>
                </View>
              )}

              {/* Privacy Toggle */}
              <View style={styles.privacyContainer}>
                <View style={styles.privacyRow}>
                  <View style={styles.privacyTextContainer}>
                    <Text style={styles.privacyLabel}>Share to Leaderboard</Text>
                    <Text style={styles.privacyHint}>
                      Make this catch public on the leaderboard
                    </Text>
                  </View>
                  <Switch
                    value={isPublic}
                    onValueChange={setIsPublic}
                    trackColor={{ false: '#d4cfc3', true: COLORS.accent }}
                    thumbColor={isPublic ? COLORS.primary : '#f5f1e8'}
                  />
                </View>
                {isPublic && (
                  <>
                    <View style={styles.publicBadge}>
                      <Ionicons name="trophy" size={14} color={COLORS.accent} />
                      <Text style={styles.publicBadgeText}>
                        Will appear on public leaderboard
                      </Text>
                    </View>
                    
                    {/* Social Media Handles (optional) */}
                    <View style={styles.socialSection}>
                      <Text style={styles.socialLabel}>Social Media (optional)</Text>
                      <View style={styles.socialInputRow}>
                        <Ionicons name="logo-instagram" size={18} color="#E1306C" style={styles.socialIcon} />
                        <TextInput
                          style={styles.socialInput}
                          value={instagram}
                          onChangeText={setInstagram}
                          placeholder="@username"
                          autoCapitalize="none"
                          autoCorrect={false}
                        />
                      </View>
                      <View style={styles.socialInputRow}>
                        <Ionicons name="logo-facebook" size={18} color="#1877F2" style={styles.socialIcon} />
                        <TextInput
                          style={styles.socialInput}
                          value={facebook}
                          onChangeText={setFacebook}
                          placeholder="facebook.com/username"
                          autoCapitalize="none"
                          autoCorrect={false}
                        />
                      </View>
                    </View>
                  </>
                )}
              </View>

              {/* Spacer for keyboard */}
              <View style={{ height: 100 }} />
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                onPress={() => handleSave(false)}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveText}>{isEditMode ? 'Update Catch' : 'Save Catch'}</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Share Button */}
            {photo && species && (
              <TouchableOpacity 
                style={styles.shareButton}
                onPress={() => handleSave(true)}
                disabled={loading}
              >
                <Ionicons name="share-outline" size={18} color="#fff" />
                <Text style={styles.shareButtonText}>Save & Share to Social</Text>
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>

        {/* Brag Card Preview Modal */}
        {showPreview && previewData && (
          <BragCard
            catchData={previewData}
            onClose={() => {
              setShowPreview(false);
              setPreviewData(null);
            }}
            onShareComplete={handleShareComplete}
          />
        )}
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
  keyboardView: {
    flex: 1,
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
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  photoContainer: {
    position: 'relative',
    marginTop: 8,
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f1e8',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e8e4da',
    gap: 6,
  },
  photoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  locationOptions: {
    gap: 8,
  },
  locationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f1e8',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e8e4da',
    gap: 12,
  },
  locationOptionSelected: {
    borderColor: COLORS.accent,
    backgroundColor: '#faf8f3',
  },
  locationOptionText: {
    flex: 1,
  },
  locationOptionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  locationOptionTitleSelected: {
    color: COLORS.primary,
  },
  locationOptionSubtitle: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  locationCoords: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f5f1e8',
    borderRadius: 6,
    gap: 6,
  },
  locationCoordsText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  privacyContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f5f1e8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e8e4da',
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  privacyTextContainer: {
    flex: 1,
  },
  privacyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  privacyHint: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  publicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e8e4da',
    gap: 6,
  },
  publicBadgeText: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: '600',
  },
  socialSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e8e4da',
  },
  socialLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  socialInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f1e8',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e8e4da',
  },
  socialIcon: {
    marginRight: 8,
  },
  socialInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 8,
    gap: 12,
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
    fontWeight: '700',
    color: '#fff',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    borderRadius: 10,
    gap: 8,
  },
  shareButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2c2416',
  },
  flyRow: {
    flexDirection: 'row',
    gap: 10,
  },
  flyInput: {
    flex: 1,
  },
  hookSizeContainer: {
    width: 140,
  },
  hookSizeLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  hookSizeScroll: {
    backgroundColor: '#f5f1e8',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e8e4da',
    paddingHorizontal: 8,
  },
  hookSizeButton: {
    paddingHorizontal: 10,
    paddingVertical: 10,
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
});

export default FishingLogModal;

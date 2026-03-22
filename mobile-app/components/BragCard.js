import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Image, TouchableOpacity, 
  Share, Alert, Platform, TextInput, Modal,
  Dimensions
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import ViewShot from 'react-native-view-shot';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  primary: '#2d4a3e',
  primaryDark: '#1a2f27',
  accent: '#c9a227',
  text: '#2c2416',
  textLight: '#f5f1e8',
  surface: '#faf8f3',
  background: '#f5f1e8',
  tan: '#f5f1e8',
  beige: '#faf8f3',
};

// Default hashtags - app focused, editable
const DEFAULT_HASHTAGS = ['#MFR', '#MontanaFishing'];

// Generate additional hashtags based on catch
const generateHashtags = (catchData) => {
  const tags = [...DEFAULT_HASHTAGS];
  
  // Add river hashtag (replacing the old #FlyFishing)
  if (catchData.river) {
    const riverTag = catchData.river.replace(/\s+/g, '').replace('River', '');
    tags.push(`#${riverTag}`);
  }
  
  // Add species hashtag if available
  if (catchData.species) {
    const speciesTag = catchData.species.replace(/\s+/g, '');
    tags.push(`#${speciesTag}`);
  }
  
  return tags;
};

const BragCard = ({ catchData, onClose, onShareComplete }) => {
  const cardRef = useRef(null);
  const [hashtags, setHashtags] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);

  // Set initial hashtags with river and species
  useEffect(() => {
    if (catchData) {
      setHashtags(generateHashtags(catchData).join(' '));
    }
  }, [catchData]);

  const shareCatch = async () => {
    try {
      if (!cardRef.current) return;
      
      setIsCapturing(true);
      
      // Capture the card as image
      const uri = await cardRef.current.capture();
      
      const message = `Just landed this beautiful ${catchData.species}${catchData.length ? ` (${catchData.length}\")` : ''} on the ${catchData.river}! 🎣\n\n${hashtags}\n\n📲 Logged with MFR - Montana Fishing Reports`;
      
      await Share.share({
        message: Platform.OS === 'ios' ? undefined : message,
        title: 'My Catch',
        url: uri,
      });
      
      setIsCapturing(false);
      if (onShareComplete) onShareComplete();
      onClose();
    } catch (error) {
      setIsCapturing(false);
      console.error('Share error:', error);
      Alert.alert('Error', 'Could not share your catch. Please try again.');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Share Your Catch</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {/* The Brag Card Preview - Photo Centerpiece */}
          <ViewShot ref={cardRef} options={{ format: 'png', quality: 0.95 }} style={styles.cardWrapper}>
            <View style={styles.card}>
              {/* Main Photo with Watermark */}
              <View style={styles.photoContainer}>
                {catchData.photo ? (
                  <Image source={{ uri: catchData.photo }} style={styles.photo} />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <MaterialCommunityIcons name="fish" size={64} color={COLORS.primary} />
                  </View>
                )}
                {/* MFR Watermark */}
                <View style={styles.watermark}>
                  <Text style={styles.watermarkText}>MFR</Text>
                </View>
              </View>

              {/* Details - Compact */}
              <View style={styles.details}>
                <Text style={styles.species}>{catchData.species}</Text>
                
                <View style={styles.infoRow}>
                  {catchData.length && (
                    <Text style={styles.statPill}>{catchData.length}"</Text>
                  )}
                  {catchData.weight && (
                    <Text style={styles.statPill}>{catchData.weight} lbs</Text>
                  )}
                  <Text style={styles.riverText}>{catchData.river}</Text>
                </View>

                {catchData.fly && (
                  <Text style={styles.flyText}>on {catchData.fly}</Text>
                )}
              </View>

              {/* App Branding Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>Montana Fishing Reports</Text>
                <Text style={styles.footerTag}>#MFR</Text>
              </View>
            </View>
          </ViewShot>

          {/* Editable Hashtags Section */}
          <View style={styles.hashtagSection}>
            <Text style={styles.hashtagLabel}>Hashtags (editable)</Text>
            <TextInput
              style={styles.hashtagInput}
              value={hashtags}
              onChangeText={setHashtags}
              multiline={false}
              placeholder="Add hashtags..."
              placeholderTextColor="rgba(245, 241, 232, 0.5)"
            />
            <TouchableOpacity 
              style={styles.resetButton}
              onPress={() => setHashtags(generateHashtags(catchData).join(' '))}
            >
              <Text style={styles.resetButtonText}>Reset to defaults</Text>
            </TouchableOpacity>
          </View>

          {/* Share Button */}
          <TouchableOpacity 
            style={[styles.shareButton, isCapturing && styles.shareButtonDisabled]} 
            onPress={shareCatch}
            disabled={isCapturing}
          >
            {isCapturing ? (
              <Text style={styles.shareButtonText}>Preparing...</Text>
            ) : (
              <>
                <Ionicons name="share-outline" size={20} color="#fff" />
                <Text style={styles.shareButtonText}>Share to Social Media</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.hint}>Hashtags will be included in your share message</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(245, 241, 232, 0.98)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    width: '100%',
    maxWidth: 360,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  closeButton: {
    padding: 4,
  },
  cardWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  photoContainer: {
    position: 'relative',
    width: '100%',
    height: 380,
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e8e4da',
    justifyContent: 'center',
    alignItems: 'center',
  },
  watermark: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(26, 47, 39, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  watermarkText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.accent,
    letterSpacing: 1,
  },
  details: {
    padding: 8,
    alignItems: 'center',
    backgroundColor: COLORS.beige,
  },
  species: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  statPill: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    backgroundColor: '#e8e4da',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  riverText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.text,
  },
  flyText: {
    fontSize: 11,
    color: COLORS.textLight,
    fontStyle: 'italic',
    marginTop: 2,
  },
  footer: {
    backgroundColor: '#e8e4da',
    paddingVertical: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text,
  },
  footerTag: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accent,
  },
  hashtagSection: {
    marginBottom: 16,
    backgroundColor: COLORS.beige,
    padding: 12,
    borderRadius: 10,
  },
  hashtagLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  hashtagInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#e8e4da',
  },
  resetButton: {
    alignSelf: 'flex-end',
    marginTop: 6,
    paddingVertical: 4,
  },
  resetButtonText: {
    fontSize: 12,
    color: COLORS.accent,
    textDecorationLine: 'underline',
  },
  shareButton: {
    backgroundColor: COLORS.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  shareButtonDisabled: {
    opacity: 0.7,
  },
  shareButtonText: {
    color: '#2c2416',
    fontSize: 16,
    fontWeight: '700',
  },
  hint: {
    fontSize: 11,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 10,
  },
});

export default BragCard;

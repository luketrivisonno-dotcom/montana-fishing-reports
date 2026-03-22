import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  Image, ActivityIndicator, Modal, Dimensions, SafeAreaView
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { checkCachedPremiumStatus } from '../hooks/useRevenueCat';
import { isTrialActive } from '../hooks/trialManager';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const COLORS = {
  primary: '#2d4a3e',
  primaryDark: '#1a2f27',
  primaryLight: '#4a6b5c',
  accent: '#c9a227',
  accentDark: '#9a7b1a',
  text: '#2c2416',
  textSecondary: '#6b5d4d',
  textLight: '#9a8b7a',
  surface: '#faf8f3',
  background: '#f5f1e8',
  border: '#e8e4da',
  success: '#5a7d5a',
  bronze: '#8B7355',
  copper: '#b87333',
  cream: '#fdfbf7',
};

const LeaderboardScreen = ({ navigation }) => {
  const [catches, setCatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [selectedCatch, setSelectedCatch] = useState(null);

  useEffect(() => {
    checkPremiumStatus();
  }, []);

  const checkPremiumStatus = async () => {
    const { isPremium: rcPremium } = await checkCachedPremiumStatus();
    const trialActive = await isTrialActive();
    const apiKey = await AsyncStorage.getItem('apiKey');
    const hasPremium = rcPremium || trialActive || !!apiKey;
    setIsPremium(hasPremium);
    if (hasPremium) {
      loadLeaderboard();
    } else {
      setLoading(false);
    }
  };

  const openPaywall = () => {
    // Trigger global paywall
    if (global.showPaywall) {
      global.showPaywall();
    }
  };

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const allCatches = JSON.parse(await AsyncStorage.getItem('fishingLog') || '[]');
      let publicCatches = allCatches.filter(c => c.isPublic === true);
      
      // Sort by size (length) as default
      publicCatches.sort((a, b) => (parseFloat(b.length) || 0) - (parseFloat(a.length) || 0));
      
      setCatches(publicCatches.slice(0, 50));
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getRankDisplay = (index) => {
    if (index === 0) return { text: '1', color: COLORS.accent, size: 24 };
    if (index === 1) return { text: '2', color: COLORS.textSecondary, size: 20 };
    if (index === 2) return { text: '3', color: COLORS.bronze, size: 18 };
    return { text: String(index + 1), color: COLORS.textLight, size: 16 };
  };

  const renderCatch = ({ item, index }) => {
    const rank = getRankDisplay(index);
    const isTop3 = index < 3;
    
    return (
      <TouchableOpacity 
        style={[styles.catchCard, isTop3 && styles.topCatchCard]}
        onPress={() => setSelectedCatch(item)}
        activeOpacity={0.9}
      >
        {/* Rank - Top Right */}
        <Text style={[styles.rankNumber, { 
          color: rank.color,
          fontSize: isTop3 ? 18 : 14,
        }]}>
          #{rank.text}
        </Text>
        
        {/* Photo - Larger */}
        <View style={styles.photoSection}>
          {item.photo ? (
            <TouchableOpacity 
              onPress={() => setSelectedPhoto(item.photo)}
              activeOpacity={0.8}
            >
              <Image source={{ uri: item.photo }} style={styles.catchPhoto} />
            </TouchableOpacity>
          ) : (
            <View style={styles.photoPlaceholder}>
              <MaterialCommunityIcons name="fish" size={32} color={COLORS.primaryLight} />
            </View>
          )}
        </View>
        
        {/* Info */}
        <View style={styles.infoSection}>
          <Text style={styles.speciesName}>{item.species}</Text>
          
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={13} color={COLORS.textLight} />
            <Text style={styles.metaText} numberOfLines={1}>{item.river}</Text>
          </View>
          
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={13} color={COLORS.textLight} />
            <Text style={styles.metaText}>{formatDate(item.date)}</Text>
          </View>
          
          {item.userName && (
            <View style={styles.anglerRow}>
              <Ionicons name="person-circle-outline" size={13} color={COLORS.accent} />
              <Text style={styles.anglerName}>{item.userName}</Text>
            </View>
          )}
          
          {/* Social Media Handles */}
          {(item.instagram || item.facebook) && (
            <View style={styles.socialRow}>
              {item.instagram && (
                <TouchableOpacity style={styles.socialBadge}>
                  <Ionicons name="logo-instagram" size={11} color="#E1306C" />
                  <Text style={styles.socialText}>{item.instagram}</Text>
                </TouchableOpacity>
              )}
              {item.facebook && (
                <TouchableOpacity style={styles.socialBadge}>
                  <Ionicons name="logo-facebook" size={11} color="#1877F2" />
                  <Text style={styles.socialText}>{item.facebook}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
        
        {/* Stats */}
        <View style={styles.statsSection}>
          {item.length && (
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{item.length}"</Text>
              <Text style={styles.statLabel}>Length</Text>
            </View>
          )}
          {item.weight && (
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{item.weight}</Text>
              <Text style={styles.statLabel}>Lbs</Text>
            </View>
          )}
          {!item.length && !item.weight && (
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="check-circle" size={20} color={COLORS.success} />
              <Text style={styles.statLabel}>Logged</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header - Clean style without green background */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, backgroundColor: COLORS.background }}>
        {/* Top row: MFR left, Trophy right */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialCommunityIcons name="fish" size={26} color={COLORS.primary} />
            <Text style={{ fontSize: 18, fontWeight: '800', color: COLORS.primary, marginLeft: 8, letterSpacing: 1 }}>MFR</Text>
          </View>
          <MaterialCommunityIcons name="trophy" size={32} color={COLORS.accent} />
        </View>
        
        {/* Title below */}
        <Text style={{ fontSize: 28, fontWeight: '800', color: COLORS.text }}>Bragging Rights</Text>
        <Text style={{ fontSize: 14, color: COLORS.textSecondary, marginTop: 4 }}>Show off your best catches</Text>
      </View>

      {/* Premium Check */}
      {!isPremium ? (
        <View style={styles.premiumPrompt}>
          <MaterialIcons name="emoji-events" size={64} color={COLORS.accent} />
          <Text style={styles.premiumTitle}>Bragging Rights</Text>
          <Text style={styles.premiumText}>
            See the biggest catches from anglers across Montana and share your own trophy fish.
          </Text>
          <TouchableOpacity style={styles.upgradeButton} onPress={openPaywall}>
            <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
          </TouchableOpacity>
        </View>
      ) : loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.loadingText}>Loading catches...</Text>
        </View>
      ) : catches.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <MaterialCommunityIcons name="fish-off" size={48} color={COLORS.textLight} />
          </View>
          <Text style={styles.emptyTitle}>No catches shared yet</Text>
          <Text style={styles.emptyText}>
            Log a catch and make it public to share with the community
          </Text>
          <TouchableOpacity style={styles.emptyButton} onPress={() => navigation.navigate('Rivers')}>
            <Text style={styles.emptyButtonText}>Log a Catch</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={catches}
          keyExtractor={(item) => item.id}
          renderItem={renderCatch}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            <View style={{ alignItems: 'center', paddingVertical: 32 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="fish" size={22} color={COLORS.primary} />
                <Text style={{ fontSize: 16, fontWeight: '800', color: COLORS.primary, marginLeft: 8, letterSpacing: 1 }}>MFR</Text>
              </View>
              <Text style={{ fontSize: 12, color: COLORS.textLight, marginTop: 6 }}>Montana Fishing Reports</Text>
            </View>
          }
        />
      )}

      {/* Photo Viewer Modal */}
      <Modal
        visible={selectedPhoto !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <View style={styles.photoModalOverlay}>
          <TouchableOpacity 
            style={styles.photoModalClose}
            onPress={() => setSelectedPhoto(null)}
          >
            <Ionicons name="close" size={32} color="#fff" />
          </TouchableOpacity>
          
          {selectedPhoto && (
            <Image 
              source={{ uri: selectedPhoto }} 
              style={styles.expandedPhoto}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

      {/* Catch Detail Modal */}
      <Modal
        visible={selectedCatch !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedCatch(null)}
      >
        <View style={styles.detailModalOverlay}>
          <TouchableOpacity 
            style={styles.detailModalBackdrop}
            onPress={() => setSelectedCatch(null)}
          />
          <View style={styles.detailModalContent}>
            {selectedCatch && (
              <>
                <View style={styles.detailHeader}>
                  <Text style={styles.detailSpecies}>{selectedCatch.species}</Text>
                  <TouchableOpacity onPress={() => setSelectedCatch(null)}>
                    <Ionicons name="close" size={24} color={COLORS.text} />
                  </TouchableOpacity>
                </View>
                
                {selectedCatch.photo && (
                  <TouchableOpacity onPress={() => setSelectedPhoto(selectedCatch.photo)}>
                    <Image 
                      source={{ uri: selectedCatch.photo }} 
                      style={styles.detailPhoto}
                    />
                  </TouchableOpacity>
                )}
                
                <View style={styles.detailInfo}>
                  <View style={styles.detailRow}>
                    <Ionicons name="location-outline" size={16} color={COLORS.textSecondary} />
                    <Text style={styles.detailText}>{selectedCatch.river}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={16} color={COLORS.textSecondary} />
                    <Text style={styles.detailText}>{formatDate(selectedCatch.date)}</Text>
                  </View>
                  {selectedCatch.userName && (
                    <View style={styles.detailRow}>
                      <Ionicons name="person-outline" size={16} color={COLORS.accent} />
                      <Text style={[styles.detailText, { color: COLORS.accent }]}>
                        Caught by {selectedCatch.userName}
                      </Text>
                    </View>
                  )}
                  
                  {/* Social Media in Detail Modal */}
                  {(selectedCatch.instagram || selectedCatch.facebook) && (
                    <View style={styles.detailSocialRow}>
                      {selectedCatch.instagram && (
                        <View style={styles.detailSocialBadge}>
                          <Ionicons name="logo-instagram" size={14} color="#E1306C" />
                          <Text style={styles.detailSocialText}>{selectedCatch.instagram}</Text>
                        </View>
                      )}
                      {selectedCatch.facebook && (
                        <View style={styles.detailSocialBadge}>
                          <Ionicons name="logo-facebook" size={14} color="#1877F2" />
                          <Text style={styles.detailSocialText}>{selectedCatch.facebook}</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
                
                <View style={styles.detailStats}>
                  {selectedCatch.length && (
                    <View style={styles.detailStatBox}>
                      <Text style={styles.detailStatValue}>{selectedCatch.length}"</Text>
                      <Text style={styles.detailStatLabel}>Length</Text>
                    </View>
                  )}
                  {selectedCatch.weight && (
                    <View style={styles.detailStatBox}>
                      <Text style={styles.detailStatValue}>{selectedCatch.weight}</Text>
                      <Text style={styles.detailStatLabel}>Weight (lbs)</Text>
                    </View>
                  )}
                </View>
                
                {selectedCatch.fly && (
                  <View style={styles.detailFly}>
                    <MaterialCommunityIcons name="hook" size={16} color={COLORS.primary} />
                    <Text style={styles.detailFlyText}>Caught on {selectedCatch.fly}</Text>
                  </View>
                )}
                
                {selectedCatch.notes && (
                  <View style={styles.detailNotes}>
                    <Text style={styles.detailNotesLabel}>Notes</Text>
                    <Text style={styles.detailNotesText}>{selectedCatch.notes}</Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  
  // Clean Header - No green background
  
  // List
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  list: {
    paddingTop: 16,
    paddingBottom: 100,
  },
  
  // Premium Catch Card
  catchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    marginBottom: 12,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    position: 'relative',
  },
  topCatchCard: {
    backgroundColor: COLORS.cream,
    borderColor: COLORS.accent,
    borderWidth: 1.5,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  
  // Rank - Top Right (just the number)
  rankNumber: {
    position: 'absolute',
    top: 8,
    right: 12,
    fontWeight: '800',
    zIndex: 10,
  },
  
  // Photo - Larger and more prominent
  photoSection: {
    marginRight: 14,
  },
  catchPhoto: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  
  // Info
  infoSection: {
    flex: 1,
    justifyContent: 'center',
  },
  speciesName: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 5,
    letterSpacing: 0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textLight,
    flexShrink: 1,
  },
  anglerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
  },
  anglerName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.accentDark,
  },
  socialRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  socialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  socialText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  
  // Stats
  statsSection: {
    alignItems: 'flex-end',
    minWidth: 55,
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 9,
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  
  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyButton: {
    marginTop: 24,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primaryDark,
  },
  emptyButtonText: {
    color: '#f5f1e8',
    fontSize: 15,
    fontWeight: '700',
  },
  
  // Photo Modal
  photoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoModalClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    padding: 10,
    zIndex: 10,
  },
  expandedPhoto: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
  
  // Detail Modal
  detailModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  detailModalBackdrop: {
    flex: 1,
  },
  detailModalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailSpecies: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  detailPhoto: {
    width: '100%',
    height: 280,
    borderRadius: 16,
    marginBottom: 16,
  },
  detailInfo: {
    gap: 10,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  detailSocialRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  detailSocialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  detailSocialText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  detailStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  detailStatBox: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 80,
  },
  detailStatValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
  },
  detailStatLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  detailFly: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  detailFlyText: {
    fontSize: 14,
    color: COLORS.text,
  },
  detailNotes: {
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 8,
  },
  detailNotesLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  detailNotesText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  
  // Premium Prompt
  premiumPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    backgroundColor: COLORS.background,
  },
  premiumTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 20,
    marginBottom: 12,
  },
  premiumText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  upgradeButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  upgradeButtonText: {
    color: '#f5f1e8',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default LeaderboardScreen;

// RevenueCat Paywall Component
// Modern implementation using useRevenueCat hook

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRevenueCat, isRunningInExpoGo } from '../hooks/useRevenueCat';

const COLORS = {
  primary: '#2d4a3e',
  primaryDark: '#1a2f27',
  accent: '#c9a227',
  premium: '#b87333',
  premiumDark: '#8b5520',
  background: '#f5f1e8',
  surface: '#faf8f3',
  text: '#2c2416',
  textSecondary: '#6b5d4d',
  success: '#5a7d5a',
};

const FEATURES = [
  { icon: 'bug', iconType: 'material-community', text: 'Detailed hatch charts & timing' },
  { icon: 'hook', iconType: 'material-community', text: 'Exact fly recommendations & sizes' },
  { icon: 'chart-line', iconType: 'material-community', text: '7-Day flow history & trends' },
  { icon: 'straighten', iconType: 'material', text: 'River mile calculator' },
  { icon: 'format-list-bulleted', iconType: 'material', text: 'Personal fishing log' },
  { icon: 'gavel', iconType: 'material', text: 'Detailed regulations & seasons' },
  { icon: 'favorite', iconType: 'material', text: 'Unlimited favorite rivers (free: 2)' },
  { icon: 'notifications', iconType: 'ionicons', text: 'Push notifications for new reports' },
  { icon: 'block', iconType: 'material', text: 'Ad-free experience' },
  { icon: 'cloud-offline', iconType: 'ionicons', text: 'Offline mode' },
];

export default function Paywall({ visible, onClose, onPurchaseSuccess }) {
  const {
    isLoading,
    isPurchasing,
    isPremium,
    monthlyPackage,
    yearlyPackage,
    purchasePackage,
    restorePurchases,
    refresh,
  } = useRevenueCat();
  
  // Refresh offerings when paywall becomes visible
  useEffect(() => {
    if (visible) {
      console.log('[PAYWALL] Opening paywall, refreshing...');
      console.log('[PAYWALL] inExpoGo:', inExpoGo);
      refresh().then(() => {
        console.log('[PAYWALL] Refresh complete');
        console.log('[PAYWALL] monthlyPackage:', monthlyPackage ? 'YES' : 'NO');
        console.log('[PAYWALL] yearlyPackage:', yearlyPackage ? 'YES' : 'NO');
      });
    }
  }, [visible, inExpoGo]);
  
  // Check if running in Expo Go (purchases not available)
  const inExpoGo = isRunningInExpoGo();
  
  // Secret code for friends/family
  const [secretCode, setSecretCode] = useState('');
  const [showSecretInput, setShowSecretInput] = useState(false);
  const SECRET_CODES = ['BABYTRIV26']; // Promo code for free premium access
  
  const checkSecretCode = async () => {
    if (SECRET_CODES.includes(secretCode.toUpperCase())) {
      // Unlock premium locally
      await AsyncStorage.setItem('isPremium', 'true');
      await AsyncStorage.setItem('premiumSource', 'friend');
      Alert.alert('Premium Unlocked!', 'Enjoy your free premium access!');
      onPurchaseSuccess?.();
    } else {
      Alert.alert('Invalid Code', 'That code is not recognized.');
    }
  };

  // If already premium, show different UI
  if (isPremium && visible) {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.container}>
            <View style={styles.premiumHeader}>
              <MaterialIcons name="diamond" size={48} color={COLORS.premium} />
              <Text style={styles.title}>You're Premium!</Text>
              <Text style={styles.subtitle}>Thank you for supporting Montana Fishing Reports</Text>
            </View>
            <View style={styles.premiumContent}>
              <Text style={styles.premiumText}>
                You have access to all premium features including unlimited favorites, push notifications, hatch alerts, and more.
              </Text>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Text style={styles.closeBtnText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  const handlePurchase = async (pkg) => {
    const result = await purchasePackage(pkg);

    if (result.success) {
      Alert.alert(
        '🎉 Welcome to Premium!',
        'You now have access to all premium features.',
        [{ text: 'Awesome!', onPress: () => onPurchaseSuccess?.() }]
      );
    } else if (result.cancelled) {
      // User cancelled, do nothing
    } else {
      Alert.alert('Purchase Failed', result.error || 'Something went wrong. Please try again.');
    }
  };

  const handleRestore = async () => {
    console.log('[PAYWALL] Starting restore purchases...');
    setIsPurchasing(true);
    
    try {
      const result = await restorePurchases();
      console.log('[PAYWALL] Restore result:', result);

      if (result.success && result.isPremium) {
        console.log('[PAYWALL] Restore successful - user is premium');
        Alert.alert(
          '✅ Restored!',
          'Your premium subscription has been restored.',
          [{ text: 'Great!', onPress: () => onPurchaseSuccess?.() }]
        );
      } else if (result.success && !result.isPremium) {
        console.log('[PAYWALL] Restore successful but no premium found');
        Alert.alert(
          'No Purchases Found', 
          'No previous purchases were found for this account.\n\nMake sure you\'re using the same Apple ID that made the original purchase.',
          [{ text: 'OK' }]
        );
      } else {
        console.error('[PAYWALL] Restore failed:', result.error);
        Alert.alert(
          'Restore Failed', 
          result.error || 'Could not restore purchases. Please try again later.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('[PAYWALL] Restore error:', error);
      Alert.alert(
        'Restore Error',
        'An unexpected error occurred. Please try again later.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsPurchasing(false);
    }
  };

  const getAnnualSavings = () => {
    if (!monthlyPackage || !yearlyPackage) return null;
    
    const monthlyPrice = monthlyPackage.product.price;
    const annualPrice = yearlyPackage.product.price;
    const monthlyCost = monthlyPrice * 12;
    const savings = monthlyCost - annualPrice;
    const percentSaved = Math.round((savings / monthlyCost) * 100);
    
    return { savings, percentSaved };
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <MaterialIcons name="diamond" size={48} color={COLORS.premium} />
            <Text style={styles.title}>Go Premium</Text>
            <Text style={styles.subtitle}>Unlock the ultimate Montana fishing experience</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {inExpoGo ? (
            <View style={styles.loadingContainer}>
              <Ionicons name="phone-portrait-outline" size={48} color={COLORS.premium} />
              <Text style={styles.loadingText}>Purchases not available in Expo Go</Text>
              <Text style={[styles.loadingText, { fontSize: 12, marginTop: 8 }]}>
                Please use a development build to test purchases
              </Text>
              <TouchableOpacity style={[styles.restoreButton, { marginTop: 16 }]} onPress={onClose}>
                <Text style={styles.restoreText}>Got it</Text>
              </TouchableOpacity>
            </View>
          ) : isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.premium} />
              <Text style={styles.loadingText}>Loading subscription options...</Text>
            </View>
          ) : (
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Features */}
              <View style={styles.featuresSection}>
                <Text style={styles.featuresTitle}>Premium Features</Text>
                {FEATURES.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <View style={styles.featureIconBox}>
                      {feature.iconType === 'material-community' && (
                        <MaterialCommunityIcons name={feature.icon} size={18} color={COLORS.primary} />
                      )}
                      {feature.iconType === 'material' && (
                        <MaterialIcons name={feature.icon} size={18} color={COLORS.primary} />
                      )}
                      {feature.iconType === 'ionicons' && (
                        <Ionicons name={feature.icon} size={18} color={COLORS.primary} />
                      )}
                    </View>
                    <Text style={styles.featureText}>{feature.text}</Text>
                  </View>
                ))}
              </View>

              {/* Pricing Options */}
              <View style={styles.pricingSection}>
                {/* Annual Option (Best Value) */}
                {yearlyPackage && (
                  <TouchableOpacity
                    style={[styles.priceCard, styles.annualCard]}
                    onPress={() => handlePurchase(yearlyPackage)}
                    disabled={isPurchasing}
                  >
                    <View style={styles.bestValueBadge}>
                      <Text style={styles.bestValueText}>BEST VALUE</Text>
                    </View>
                    <Text style={styles.annualPrice}>
                      {yearlyPackage.product.priceString}
                    </Text>
                    <Text style={styles.annualPeriod}>per year</Text>
                    {getAnnualSavings() && (
                      <Text style={styles.savingsText}>
                        Save {getAnnualSavings().percentSaved}%
                      </Text>
                    )}
                    {isPurchasing && <ActivityIndicator color={COLORS.premium} style={styles.purchaseSpinner} />}
                  </TouchableOpacity>
                )}

                {/* Monthly Option */}
                {monthlyPackage && (
                  <TouchableOpacity
                    style={styles.priceCard}
                    onPress={() => handlePurchase(monthlyPackage)}
                    disabled={isPurchasing}
                  >
                    <Text style={styles.monthlyPrice}>
                      {monthlyPackage.product.priceString}
                    </Text>
                    <Text style={styles.monthlyPeriod}>per month</Text>
                    {isPurchasing && <ActivityIndicator color={COLORS.premium} style={styles.purchaseSpinner} />}
                  </TouchableOpacity>
                )}

                {!monthlyPackage && !yearlyPackage && (
                  <View style={styles.noOfferings}>
                    <Ionicons name="construct-outline" size={48} color={COLORS.textLight} />
                    <Text style={[styles.noOfferingsText, {marginTop: 16, fontWeight: '600'}]}>
                      Setting Up Subscriptions
                    </Text>
                    <Text style={[styles.noOfferingsText, {marginTop: 8, fontSize: 13, paddingHorizontal: 20}]}>
                      We're configuring our subscription plans.{'\n'}
                      Please check back soon!
                    </Text>
                    {__DEV__ && (
                      <>
                        <TouchableOpacity 
                          style={{marginTop: 20, padding: 12, backgroundColor: COLORS.primary, borderRadius: 8}}
                          onPress={() => {
                            Alert.alert('Debug Info', 
                              `inExpoGo: ${inExpoGo}\n` +
                              `isLoading: ${isLoading}\n` +
                              `monthlyPackage: ${monthlyPackage ? 'YES' : 'NO'}\n` +
                              `yearlyPackage: ${yearlyPackage ? 'YES' : 'NO'}`
                            );
                          }}
                        >
                          <Text style={{color: '#fff', fontWeight: '600'}}>Show Debug Info</Text>
                        </TouchableOpacity>
                        <Text style={[styles.noOfferingsText, {marginTop: 8, fontSize: 10, color: '#999'}]}>
                          Tap above for debugging
                        </Text>
                      </>
                    )}
                  </View>
                )}
              </View>

              {/* Restore Purchases */}
              <View style={styles.restoreSection}>
                <Text style={styles.restoreTitle}>Already purchased?</Text>
                <TouchableOpacity
                  style={styles.restoreButton}
                  onPress={handleRestore}
                  disabled={isPurchasing}
                >
                  {isPurchasing ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : (
                    <>
                      <Ionicons name="refresh" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
                      <Text style={styles.restoreText}>Restore Purchases</Text>
                    </>
                  )}
                </TouchableOpacity>
                <Text style={styles.restoreHint}>
                  Use the same Apple ID from your original purchase
                </Text>
              </View>

              {/* Secret Code for Friends/Family */}
              <View style={styles.codeSection}>
                <View style={styles.codeDivider} />
                <Text style={styles.codeTitle}>Have a Promo Code?</Text>
                
                {showSecretInput ? (
                  <View style={styles.secretContainer}>
                    <TextInput
                      style={styles.secretInput}
                      placeholder="ENTER CODE"
                      placeholderTextColor={COLORS.textLight}
                      value={secretCode}
                      onChangeText={setSecretCode}
                      autoCapitalize="characters"
                      maxLength={10}
                    />
                    <TouchableOpacity style={styles.secretButton} onPress={checkSecretCode}>
                      <Text style={styles.secretButtonText}>Unlock</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.codeButton} onPress={() => setShowSecretInput(true)}>
                    <MaterialIcons name="vpn-key" size={16} color={COLORS.primary} />
                    <Text style={styles.codeButtonText}>Enter Code</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Terms */}
              <Text style={styles.termsText}>
                Subscriptions auto-renew unless cancelled.{'\n'}
                Manage in App Store settings.
              </Text>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    backgroundColor: COLORS.primaryDark,
    paddingVertical: 28,
    alignItems: 'center',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#f5f1e8',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(245, 241, 232, 0.8)',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    padding: 48,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  featuresSection: {
    marginBottom: 24,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e8e4da',
  },
  featureIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    flex: 1,
  },
  pricingSection: {
    gap: 12,
    marginBottom: 16,
  },
  priceCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  annualCard: {
    borderColor: COLORS.premium,
    backgroundColor: 'rgba(184, 115, 51, 0.05)',
    position: 'relative',
  },
  bestValueBadge: {
    position: 'absolute',
    top: -10,
    backgroundColor: COLORS.premium,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bestValueText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  annualPrice: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.text,
  },
  annualPeriod: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  savingsText: {
    fontSize: 14,
    color: COLORS.success,
    fontWeight: '700',
    marginTop: 6,
  },
  monthlyPrice: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
  },
  monthlyPeriod: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  purchaseSpinner: {
    marginTop: 8,
  },
  noOfferings: {
    padding: 24,
    alignItems: 'center',
  },
  noOfferingsText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  restoreSection: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  restoreTitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    alignSelf: 'center',
  },
  restoreText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  restoreHint: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 8,
    textAlign: 'center',
  },
  termsText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  // Secret Code Styles
  codeSection: {
    marginTop: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  codeDivider: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    marginBottom: 16,
  },
  codeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  codeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    gap: 8,
  },
  codeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  secretContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secretInput: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    backgroundColor: COLORS.surface,
    width: 140,
    textAlign: 'center',
  },
  secretButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  secretButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  // Premium User Styles
  premiumHeader: {
    backgroundColor: COLORS.success,
    paddingVertical: 40,
    alignItems: 'center',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  premiumContent: {
    padding: 24,
    alignItems: 'center',
  },
  premiumText: {
    fontSize: 15,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  closeBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 10,
  },
  closeBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

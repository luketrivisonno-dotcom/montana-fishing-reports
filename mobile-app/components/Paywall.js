// RevenueCat Paywall Component
// Modern implementation using useRevenueCat hook

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRevenueCat } from '../hooks/useRevenueCat';

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
  { icon: '✨', text: 'Ad-free experience' },
  { icon: '🔔', text: 'Push notifications for new reports' },
  { icon: '🦋', text: 'Hatch alerts (Salmonflies, PMDs, etc.)' },
  { icon: '📊', text: 'Detailed hatch charts & flies' },
  { icon: '⭐', text: 'Unlimited favorite rivers' },
  { icon: '📏', text: 'River mile calculator' },
  { icon: '📜', text: 'Detailed regulations & seasons' },
  { icon: '📶', text: 'Offline mode' },
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
  } = useRevenueCat();

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
    const result = await restorePurchases();

    if (result.success && result.isPremium) {
      Alert.alert(
        '✅ Restored!',
        'Your premium subscription has been restored.',
        [{ text: 'Great!', onPress: () => onPurchaseSuccess?.() }]
      );
    } else if (result.success && !result.isPremium) {
      Alert.alert('No Purchases Found', 'No previous purchases were found for this account.');
    } else {
      Alert.alert('Restore Failed', result.error || 'Could not restore purchases.');
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

          {isLoading ? (
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
                    <Text style={styles.featureIcon}>{feature.icon}</Text>
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
                    <Text style={styles.noOfferingsText}>
                      Subscription options not available.{'\n'}Please try again later.
                    </Text>
                  </View>
                )}
              </View>

              {/* Restore Purchases */}
              <TouchableOpacity
                style={styles.restoreButton}
                onPress={handleRestore}
                disabled={isPurchasing}
              >
                {isPurchasing ? (
                  <ActivityIndicator size="small" color={COLORS.textSecondary} />
                ) : (
                  <Text style={styles.restoreText}>Restore Purchases</Text>
                )}
              </TouchableOpacity>

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
    paddingVertical: 6,
  },
  featureIcon: {
    fontSize: 18,
    marginRight: 10,
    width: 24,
  },
  featureText: {
    fontSize: 14,
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
  restoreButton: {
    alignSelf: 'center',
    paddingVertical: 12,
  },
  restoreText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  termsText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
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

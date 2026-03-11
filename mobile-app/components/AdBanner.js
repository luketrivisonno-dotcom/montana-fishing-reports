import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Check if we're in Expo Go (development without native modules)
const isExpoGo = !Platform.select({
  ios: () => {
    try {
      const NativeModules = require('react-native').NativeModules;
      return !!NativeModules.RNGoogleMobileAdsModule;
    } catch (e) {
      return false;
    }
  },
  android: () => {
    try {
      const NativeModules = require('react-native').NativeModules;
      return !!NativeModules.RNGoogleMobileAdsModule;
    } catch (e) {
      return false;
    }
  },
})?.();

// Lazy load the ads module only when needed
let BannerAd = null;
let BannerAdSize = null;
let TestIds = null;

if (!isExpoGo) {
  try {
    const ads = require('react-native-google-mobile-ads');
    BannerAd = ads.BannerAd;
    BannerAdSize = ads.BannerAdSize;
    TestIds = ads.TestIds;
  } catch (e) {
    console.log('Google Mobile Ads not available');
  }
}

// Production Ad Unit ID
const PRODUCTION_BANNER_ID = Platform.select({
  ios: 'ca-app-pub-9219871596282320/1069397131',
  android: 'ca-app-pub-9219871596282320/1069397131',
});

// Use test ID for development
const USE_TEST_ADS = true;

const AdBanner = ({ 
  size = 'BANNER',
  style 
}) => {
  const [isPremium, setIsPremium] = useState(false);
  const [adLoaded, setAdLoaded] = useState(false);

  // Check premium status
  useEffect(() => {
    const checkPremium = async () => {
      try {
        const premiumStatus = await AsyncStorage.getItem('premiumStatus');
        setIsPremium(premiumStatus === 'true');
      } catch (error) {
        console.log('Error checking premium:', error);
      }
    };
    checkPremium();
  }, []);

  // Don't show ads for premium users or in Expo Go
  if (isPremium || isExpoGo || !BannerAd) {
    if (isExpoGo) {
      // Show placeholder in Expo Go
      return (
        <View style={[styles.container, styles.placeholder, style]}>
          <View style={styles.adPlaceholder}>
            <View style={styles.adLabel}>
              <View style={styles.adDot} />
              <View style={styles.adText} />
            </View>
            <View style={styles.adTitle} />
            <View style={styles.adDescription} />
            <View style={styles.adButton}>
              <View style={styles.adButtonText} />
            </View>
          </View>
        </View>
      );
    }
    return null;
  }

  const adUnitId = USE_TEST_ADS ? TestIds.BANNER : PRODUCTION_BANNER_ID;
  const bannerSize = BannerAdSize[size] || BannerAdSize.BANNER;

  return (
    <View style={[styles.container, style]}>
      <BannerAd
        unitId={adUnitId}
        size={bannerSize}
        onAdLoaded={() => setAdLoaded(true)}
        onAdFailedToLoad={(error) => {
          console.log('Banner ad failed to load:', error);
          setAdLoaded(false);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    minHeight: 50,
  },
  placeholder: {
    padding: 10,
    backgroundColor: '#f5f1e8',
  },
  adPlaceholder: {
    width: '100%',
    backgroundColor: '#faf8f3',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e8e4da',
  },
  adLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  adDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2d4a3e',
    marginRight: 6,
  },
  adText: {
    width: 60,
    height: 10,
    backgroundColor: '#c9a227',
    borderRadius: 2,
  },
  adTitle: {
    width: '80%',
    height: 14,
    backgroundColor: '#2c2416',
    borderRadius: 2,
    marginBottom: 6,
  },
  adDescription: {
    width: '100%',
    height: 10,
    backgroundColor: '#9a8b7a',
    borderRadius: 2,
    marginBottom: 10,
  },
  adButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#2d4a3e',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 4,
  },
  adButtonText: {
    width: 80,
    height: 12,
    backgroundColor: '#c9a227',
    borderRadius: 2,
  },
});

export default AdBanner;

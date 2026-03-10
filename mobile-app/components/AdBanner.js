import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { AdMobBanner, setTestDeviceIDAsync } from 'expo-ads-admob';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Ad unit IDs - Replace with your actual AdMob IDs
// Use these test IDs during development
const TEST_BANNER_ID = Platform.select({
  ios: 'ca-app-pub-3940256099942544/2934735716',  // Google test ID
  android: 'ca-app-pub-3940256099942544/6300978111',  // Google test ID
});

// Production IDs - Replace these with your real AdMob IDs when ready
const PRODUCTION_BANNER_ID = Platform.select({
  ios: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',  // Your iOS banner ID
  android: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',  // Your Android banner ID
});

// Set to false when using production IDs
const USE_TEST_ADS = true;

const AdBanner = ({ 
  size = 'banner',  // 'banner', 'largeBanner', 'mediumRectangle', 'fullBanner', 'leaderboard'
  style 
}) => {
  const [isPremium, setIsPremium] = useState(false);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(null);

  useEffect(() => {
    checkPremiumStatus();
    // Set test device ID for development
    if (USE_TEST_ADS) {
      setTestDeviceIDAsync('EMULATOR');
    }
  }, []);

  const checkPremiumStatus = async () => {
    try {
      const premiumStatus = await AsyncStorage.getItem('premiumStatus');
      setIsPremium(premiumStatus === 'true');
    } catch (error) {
      console.log('Error checking premium:', error);
    }
  };

  // Don't show ads for premium users
  if (isPremium) {
    return null;
  }

  const adUnitID = USE_TEST_ADS ? TEST_BANNER_ID : PRODUCTION_BANNER_ID;

  const handleAdLoaded = () => {
    setAdLoaded(true);
    setAdError(null);
  };

  const handleAdError = (error) => {
    console.log('Ad error:', error);
    setAdError(error);
    setAdLoaded(false);
  };

  // Don't render if there was an error loading the ad
  if (adError) {
    return null;
  }

  return (
    <View style={[styles.container, style, !adLoaded && styles.hidden]}>
      <AdMobBanner
        bannerSize={size}
        adUnitID={adUnitID}
        servePersonalizedAds={true}
        onDidFailToReceiveAdWithError={handleAdError}
        onAdViewDidReceiveAd={handleAdLoaded}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  hidden: {
    height: 0,
    overflow: 'hidden',
  },
});

export default AdBanner;

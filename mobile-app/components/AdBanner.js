import React, { useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Production Ad Unit ID
const PRODUCTION_BANNER_ID = Platform.select({
  ios: 'ca-app-pub-9219871596282320/1069397131',
  android: 'ca-app-pub-9219871596282320/1069397131',
});

// Use test ID for development
const USE_TEST_ADS = true;

const AdBanner = ({ 
  size = BannerAdSize.BANNER,
  style 
}) => {
  const [isPremium, setIsPremium] = useState(false);
  const [adLoaded, setAdLoaded] = useState(false);

  // Check premium status
  React.useEffect(() => {
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

  // Don't show ads for premium users
  if (isPremium) {
    return null;
  }

  const adUnitId = USE_TEST_ADS ? TestIds.BANNER : PRODUCTION_BANNER_ID;

  return (
    <View style={[styles.container, style]}>
      <BannerAd
        unitId={adUnitId}
        size={size}
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
});

export default AdBanner;

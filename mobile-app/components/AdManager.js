import { InterstitialAd, AdEventType, TestIds } from 'react-native-google-mobile-ads';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Production IDs
const PRODUCTION_INTERSTITIAL_ID = Platform.select({
  ios: 'ca-app-pub-9219871596282320/7938533170',
  android: 'ca-app-pub-9219871596282320/7938533170',
});

const USE_TEST_ADS = true;

class AdManager {
  constructor() {
    this.interstitialAdId = USE_TEST_ADS ? TestIds.INTERSTITIAL : PRODUCTION_INTERSTITIAL_ID;
    this.interstitialAd = null;
    this.isPremium = false;
  }

  async checkPremiumStatus() {
    try {
      const premiumStatus = await AsyncStorage.getItem('premiumStatus');
      this.isPremium = premiumStatus === 'true';
      return this.isPremium;
    } catch (error) {
      return false;
    }
  }

  // Initialize and load interstitial ad
  async loadInterstitial() {
    if (await this.checkPremiumStatus()) return;

    try {
      this.interstitialAd = InterstitialAd.createForAdRequest(this.interstitialAdId);
      
      this.interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
        console.log('Interstitial ad loaded');
      });

      this.interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
        console.log('Interstitial ad closed');
        // Load next ad
        this.loadInterstitial();
      });

      this.interstitialAd.addAdEventListener(AdEventType.ERROR, (error) => {
        console.log('Interstitial ad error:', error);
      });

      await this.interstitialAd.load();
    } catch (error) {
      console.log('Interstitial load error:', error);
    }
  }

  // Show interstitial ad
  async showInterstitial() {
    if (await this.checkPremiumStatus()) return;

    try {
      if (this.interstitialAd && await this.interstitialAd.show()) {
        console.log('Interstitial ad shown');
      } else {
        // Try loading again if not ready
        await this.loadInterstitial();
      }
    } catch (error) {
      console.log('Interstitial show error:', error);
    }
  }

  // Show interstitial with frequency cap (e.g., every 3rd time)
  async showInterstitialWithFrequency(key, frequency = 3) {
    if (await this.checkPremiumStatus()) return;

    try {
      const countKey = `ad_count_${key}`;
      const count = parseInt(await AsyncStorage.getItem(countKey) || '0');
      
      if (count % frequency === 0) {
        // Load and show ad
        await this.loadInterstitial();
        // Small delay to allow ad to load
        setTimeout(() => this.showInterstitial(), 1000);
      }
      
      await AsyncStorage.setItem(countKey, String(count + 1));
    } catch (error) {
      console.log('Frequency ad error:', error);
    }
  }
}

export default new AdManager();

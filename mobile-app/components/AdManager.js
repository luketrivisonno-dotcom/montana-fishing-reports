import { AdMobInterstitial, AdMobRewarded, setTestDeviceIDAsync } from 'expo-ads-admob';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Test IDs
const TEST_INTERSTITIAL_ID = Platform.select({
  ios: 'ca-app-pub-3940256099942544/4411468910',
  android: 'ca-app-pub-3940256099942544/1033173712',
});

const TEST_REWARDED_ID = Platform.select({
  ios: 'ca-app-pub-3940256099942544/1712485313',
  android: 'ca-app-pub-3940256099942544/5224354917',
});

// Production IDs - Replace with your real IDs
const PRODUCTION_INTERSTITIAL_ID = Platform.select({
  ios: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
  android: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
});

const PRODUCTION_REWARDED_ID = Platform.select({
  ios: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
  android: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
});

const USE_TEST_ADS = true;

class AdManager {
  constructor() {
    this.interstitialAdId = USE_TEST_ADS ? TEST_INTERSTITIAL_ID : PRODUCTION_INTERSTITIAL_ID;
    this.rewardedAdId = USE_TEST_ADS ? TEST_REWARDED_ID : PRODUCTION_REWARDED_ID;
    this.isPremium = false;
    
    if (USE_TEST_ADS) {
      setTestDeviceIDAsync('EMULATOR');
    }
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

  // Interstitial Ads (full screen, shown between screens)
  async loadInterstitial() {
    if (await this.checkPremiumStatus()) return;
    
    try {
      await AdMobInterstitial.setAdUnitID(this.interstitialAdId);
      await AdMobInterstitial.requestAdAsync({ servePersonalizedAds: true });
    } catch (error) {
      console.log('Interstitial load error:', error);
    }
  }

  async showInterstitial() {
    if (await this.checkPremiumStatus()) return;
    
    try {
      await AdMobInterstitial.showAdAsync();
    } catch (error) {
      console.log('Interstitial show error:', error);
    }
  }

  // Show interstitial with a frequency cap (e.g., every 5th time)
  async showInterstitialWithFrequency(key, frequency = 5) {
    if (await this.checkPremiumStatus()) return;
    
    try {
      const countKey = `ad_count_${key}`;
      const count = parseInt(await AsyncStorage.getItem(countKey) || '0');
      
      if (count % frequency === 0) {
        await this.loadInterstitial();
        // Small delay to ensure ad is loaded
        setTimeout(() => this.showInterstitial(), 500);
      }
      
      await AsyncStorage.setItem(countKey, String(count + 1));
    } catch (error) {
      console.log('Frequency ad error:', error);
    }
  }

  // Rewarded Ads (user watches for a reward - e.g., premium feature for a day)
  async loadRewarded() {
    if (await this.checkPremiumStatus()) return;
    
    try {
      await AdMobRewarded.setAdUnitID(this.rewardedAdId);
      await AdMobRewarded.requestAdAsync();
    } catch (error) {
      console.log('Rewarded load error:', error);
    }
  }

  async showRewarded(onReward) {
    if (await this.checkPremiumStatus()) return;
    
    try {
      // Set up reward handler
      AdMobRewarded.addEventListener('rewardedVideoDidRewardUser', (reward) => {
        console.log('User rewarded:', reward);
        if (onReward) onReward(reward);
      });

      await AdMobRewarded.showAdAsync();
    } catch (error) {
      console.log('Rewarded show error:', error);
    }
  }
}

export default new AdManager();

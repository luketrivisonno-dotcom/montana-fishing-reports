// React Hook for RevenueCat
// Provides easy access to purchases, customer info, and premium status

import { useState, useEffect, useCallback } from 'react';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// RevenueCat Configuration
const API_KEYS = {
  ios: 'appl_walHurkTWBJnXkKnGsJUAsTilHm',
  android: 'goog_YOUR_ANDROID_API_KEY',
};

const ENTITLEMENT_ID = 'Montana Fishing Reports Pro';

/**
 * Initialize RevenueCat SDK
 * Call this once when your app starts
 */
export const initializePurchases = async () => {
  try {
    // Enable debug logs in development
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    } else {
      Purchases.setLogLevel(LOG_LEVEL.INFO);
    }

    const apiKey = Platform.OS === 'ios' ? API_KEYS.ios : API_KEYS.android;
    
    // Configure with anonymous user ID (RevenueCat generates one)
    Purchases.configure({ apiKey });
    
    console.log('✅ RevenueCat initialized');
    return true;
  } catch (error) {
    console.error('❌ RevenueCat init error:', error);
    return false;
  }
};

/**
 * Main hook for RevenueCat functionality
 */
export function useRevenueCat() {
  const [customerInfo, setCustomerInfo] = useState(null);
  const [offerings, setOfferings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Check if user has premium entitlement
  const isPremium = customerInfo?.entitlements?.active?.[ENTITLEMENT_ID] !== undefined;

  // Get expiration date if available
  const expirationDate = customerInfo?.entitlements?.active?.[ENTITLEMENT_ID]?.expirationDate;

  // Load customer info and offerings on mount
  useEffect(() => {
    loadCustomerInfo();
    loadOfferings();

    // Set up listener for customer info updates
    const unsubscribe = Purchases.addCustomerInfoUpdateListener((info) => {
      setCustomerInfo(info);
      // Cache premium status
      const hasPremium = info.entitlements?.active?.[ENTITLEMENT_ID] !== undefined;
      AsyncStorage.setItem('isPremium', hasPremium ? 'true' : 'false');
    });

    return () => {
      unsubscribe?.();
    };
  }, []);

  const loadCustomerInfo = useCallback(async () => {
    try {
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
      
      // Cache status
      const hasPremium = info.entitlements?.active?.[ENTITLEMENT_ID] !== undefined;
      await AsyncStorage.setItem('isPremium', hasPremium ? 'true' : 'false');
      if (hasPremium) {
        await AsyncStorage.setItem('premiumExpiry', 
          info.entitlements.active[ENTITLEMENT_ID].expirationDate || ''
        );
      }
    } catch (error) {
      console.error('Error loading customer info:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadOfferings = useCallback(async () => {
    try {
      const offerings = await Purchases.getOfferings();
      setOfferings(offerings);
    } catch (error) {
      console.error('Error loading offerings:', error);
    }
  }, []);

  const purchasePackage = useCallback(async (pkg) => {
    if (!pkg) return { success: false, error: 'No package selected' };
    
    setIsPurchasing(true);
    try {
      const { customerInfo: newInfo, productIdentifier } = await Purchases.purchasePackage(pkg);
      setCustomerInfo(newInfo);
      
      const success = newInfo.entitlements?.active?.[ENTITLEMENT_ID] !== undefined;
      
      if (success) {
        // Sync with backend
        await syncWithBackend(newInfo);
      }
      
      return { 
        success, 
        cancelled: false,
        customerInfo: newInfo,
        productIdentifier 
      };
    } catch (error) {
      if (error.userCancelled) {
        return { success: false, cancelled: true };
      }
      console.error('Purchase error:', error);
      return { success: false, error: error.message };
    } finally {
      setIsPurchasing(false);
    }
  }, []);

  const restorePurchases = useCallback(async () => {
    setIsPurchasing(true);
    try {
      const { customerInfo: newInfo } = await Purchases.restorePurchases();
      setCustomerInfo(newInfo);
      
      const success = newInfo.entitlements?.active?.[ENTITLEMENT_ID] !== undefined;
      
      if (success) {
        await syncWithBackend(newInfo);
      }
      
      return { success, isPremium: success, customerInfo: newInfo };
    } catch (error) {
      console.error('Restore error:', error);
      return { success: false, error: error.message };
    } finally {
      setIsPurchasing(false);
    }
  }, []);

  const syncWithBackend = async (info) => {
    try {
      const API_URL = 'https://montana-fishing-reports-production.up.railway.app';
      const entitlement = info.entitlements?.active?.[ENTITLEMENT_ID];
      
      if (!entitlement) return;

      const response = await fetch(`${API_URL}/api/premium/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          revenuecatId: info.originalAppUserId,
          isPremium: true,
          expiryDate: entitlement.expirationDate,
          productIdentifier: entitlement.productIdentifier,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.apiKey) {
          await AsyncStorage.setItem('apiKey', data.apiKey);
          await AsyncStorage.setItem('userEmail', data.email);
        }
      }
    } catch (error) {
      console.error('Backend sync error:', error);
    }
  };

  const logout = useCallback(async () => {
    try {
      await Purchases.logOut();
      await AsyncStorage.removeItem('isPremium');
      await AsyncStorage.removeItem('premiumExpiry');
      await AsyncStorage.removeItem('apiKey');
      setCustomerInfo(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  // Get current offering (monthly/yearly packages)
  const currentOffering = offerings?.current;
  const monthlyPackage = currentOffering?.monthly;
  const yearlyPackage = currentOffering?.yearly;

  return {
    // State
    isLoading,
    isPurchasing,
    isPremium,
    expirationDate,
    customerInfo,
    offerings,
    currentOffering,
    monthlyPackage,
    yearlyPackage,
    
    // Actions
    purchasePackage,
    restorePurchases,
    refresh: loadCustomerInfo,
    logout,
    
    // Helper
    ENTITLEMENT_ID,
  };
}

/**
 * Check cached premium status (fast, no network call)
 */
export const checkCachedPremiumStatus = async () => {
  try {
    const isPremium = await AsyncStorage.getItem('isPremium');
    const expiry = await AsyncStorage.getItem('premiumExpiry');
    
    // Check if expired
    if (expiry && new Date(expiry) < new Date()) {
      return { isPremium: false, expired: true };
    }
    
    return { isPremium: isPremium === 'true', expired: false };
  } catch {
    return { isPremium: false, expired: false };
  }
};

export default useRevenueCat;

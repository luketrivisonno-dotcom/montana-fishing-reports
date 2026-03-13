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

// Track SDK state
let isConfigured = false;
let isExpoGo = false;  // True if running in Expo Go (no native purchases)

/**
 * Check if running in Expo Go
 * RevenueCat native modules don't work in Expo Go
 */
const checkIsExpoGo = () => {
  try {
    // Check if the native module exists - if it does, we're in a native build
    const NativeModules = require('react-native').NativeModules;
    const hasRevenueCat = !!NativeModules.RNPurchases;
    
    // If we have the native module, we're NOT in Expo Go
    if (hasRevenueCat) {
      return false;
    }
    
    // Check for Expo Go specific globals as fallback
    // @ts-ignore
    return !!global.Expo || !!global.__expo;
  } catch (e) {
    // If we can't check, assume Expo Go to be safe
    return true;
  }
};

/**
 * Initialize RevenueCat SDK
 * Call this once when your app starts
 */
export const initializePurchases = async () => {
  try {
    // Check if already configured
    if (isConfigured) {
      console.log('✅ RevenueCat already initialized');
      return true;
    }
    
    // Check if running in Expo Go
    if (checkIsExpoGo()) {
      console.log('📱 Running in Expo Go - RevenueCat native purchases not available');
      isExpoGo = true;
      isConfigured = true;  // Mark as "configured" to prevent further errors
      return true;
    }
    
    // Enable debug logs in development
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    } else {
      Purchases.setLogLevel(LOG_LEVEL.INFO);
    }

    const apiKey = Platform.OS === 'ios' ? API_KEYS.ios : API_KEYS.android;
    
    // Configure with anonymous user ID (RevenueCat generates one)
    Purchases.configure({ apiKey });
    
    isConfigured = true;
    console.log('✅ RevenueCat initialized');
    return true;
  } catch (error) {
    // Check if this is the Expo Go error
    if (error.message && error.message.includes('Expo Go')) {
      console.log('📱 Running in Expo Go - RevenueCat native purchases not available');
      isExpoGo = true;
      isConfigured = true;  // Mark as "configured" to prevent further errors
      return true;
    }
    console.error('❌ RevenueCat init error:', error);
    return false;
  }
};

/**
 * Check if RevenueCat is configured
 */
export const isRevenueCatConfigured = () => isConfigured;

/**
 * Check if running in Expo Go (no native purchases)
 */
export const isRunningInExpoGo = () => isExpoGo;

/**
 * Main hook for RevenueCat functionality
 */
export function useRevenueCat() {
  const [customerInfo, setCustomerInfo] = useState(null);
  const [offerings, setOfferings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Check if user has premium entitlement
  const isPremium = customerInfo?.entitlements?.active?.[ENTITLEMENT_ID] !== undefined;

  // Get expiration date if available
  const expirationDate = customerInfo?.entitlements?.active?.[ENTITLEMENT_ID]?.expirationDate;

  // Wait for SDK to be configured, then load data
  useEffect(() => {
    let unsubscribe;
    
    const init = async () => {
      // Wait for SDK to be configured
      let attempts = 0;
      while (!isConfigured && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      if (!isConfigured) {
        console.warn('RevenueCat not configured after 5 seconds');
        setIsLoading(false);
        return;
      }
      
      setIsReady(true);
      
      // Skip if running in Expo Go (native modules not available)
      if (isExpoGo) {
        console.log('📱 Expo Go mode - skipping RevenueCat data loading');
        // Load cached premium status from AsyncStorage if available
        try {
          const cached = await AsyncStorage.getItem('isPremium');
          if (cached === 'true') {
            // Mock customer info for development
            setCustomerInfo({
              entitlements: {
                active: {
                  [ENTITLEMENT_ID]: {
                    identifier: ENTITLEMENT_ID,
                    expirationDate: null,
                  }
                }
              }
            });
          }
        } catch (e) {
          // Ignore cache errors
        }
        setIsLoading(false);
        return;
      }
      
      try {
        // Set up listener for customer info updates
        unsubscribe = Purchases.addCustomerInfoUpdateListener((info) => {
          setCustomerInfo(info);
          // Cache premium status
          const hasPremium = info.entitlements?.active?.[ENTITLEMENT_ID] !== undefined;
          AsyncStorage.setItem('isPremium', hasPremium ? 'true' : 'false');
        });
        
        // Load initial data
        await loadCustomerInfo();
        await loadOfferings();
      } catch (error) {
        console.error('Error initializing RevenueCat hook:', error);
      }
    };
    
    init();

    return () => {
      unsubscribe?.();
    };
  }, []);

  const loadCustomerInfo = useCallback(async () => {
    if (!isConfigured) return;
    
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
    if (!isConfigured) return;
    
    try {
      const offerings = await Purchases.getOfferings();
      setOfferings(offerings);
    } catch (error) {
      console.error('Error loading offerings:', error);
    }
  }, []);

  const purchasePackage = useCallback(async (pkg) => {
    if (isExpoGo) {
      return { success: false, error: 'Purchases not available in Expo Go. Please use a development build.' };
    }
    if (!isConfigured) return { success: false, error: 'Purchase system not ready' };
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
    if (isExpoGo) {
      return { success: false, error: 'Purchases not available in Expo Go. Please use a development build.' };
    }
    if (!isConfigured) return { success: false, error: 'Purchase system not ready' };
    
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
    if (!isConfigured) return;
    
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
    isReady,
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

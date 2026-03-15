// React Hook for RevenueCat
// Provides easy access to purchases, customer info, and premium status

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, NativeModules } from 'react-native';

// Try to import Purchases - it may not be available in development builds
let Purchases = null;
let LOG_LEVEL = null;

try {
  const rcModule = require('react-native-purchases');
  Purchases = rcModule.default || rcModule;
  LOG_LEVEL = rcModule.LOG_LEVEL;
  console.log('✅ RevenueCat Purchases module loaded');
} catch (e) {
  console.log('⚠️ RevenueCat Purchases not available:', e.message);
}

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
    // Check for Expo Go specific globals first (most reliable)
    // @ts-ignore
    if (!!global.Expo || !!global.__expo) {
      console.log('[REVENUECAT] Detected Expo Go via global flags');
      return true;
    }
    
    // Check if the native module exists - if it does, we're in a native build
    const NativeModules = require('react-native').NativeModules;
    const hasRevenueCat = !!NativeModules.RNPurchases;
    
    // If we don't have the native module, we're in Expo Go
    if (!hasRevenueCat) {
      console.log('[REVENUECAT] No native RevenueCat module - assuming Expo Go');
      return true;
    }
    
    // We have the module, not in Expo Go
    return false;
  } catch (e) {
    // If we can't check, assume Expo Go to be safe
    console.log('[REVENUECAT] Error checking Expo Go status, assuming Expo Go');
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
      console.log('[REVENUECAT] Already initialized');
      return true;
    }
    
    console.log('[REVENUECAT] Starting initialization...');
    console.log('[REVENUECAT] Purchases module:', Purchases ? 'FOUND' : 'NOT FOUND');
    
    // Check if Purchases module is available
    if (!Purchases) {
      console.log('[REVENUECAT] Module not available - purchases disabled');
      isExpoGo = true;
      isConfigured = true;
      return true;
    }
    
    // Check if running in Expo Go
    const inExpoGo = checkIsExpoGo();
    console.log('[REVENUECAT] Expo Go check:', inExpoGo);
    if (inExpoGo) {
      console.log('[REVENUECAT] Running in Expo Go - native purchases not available');
      isExpoGo = true;
      isConfigured = true;
      return true;
    }
    
    // Enable debug logs - ALWAYS use DEBUG for troubleshooting
    if (LOG_LEVEL) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      console.log('[REVENUECAT] Log level set to DEBUG');
    }

    const apiKey = Platform.OS === 'ios' ? API_KEYS.ios : API_KEYS.android;
    console.log('[REVENUECAT] Using API key:', apiKey.substring(0, 10) + '...');
    
    // Configure with anonymous user ID (RevenueCat generates one)
    console.log('[REVENUECAT] Calling configure with API key:', apiKey.substring(0, 15) + '...');
    
    try {
      Purchases.configure({ apiKey });
    } catch (configureError) {
      // Check if this is an Expo Go error
      if (configureError.message && (
        configureError.message.includes('Expo Go') ||
        configureError.message.includes('Test Store') ||
        configureError.message.includes('native store is not available')
      )) {
        console.log('[REVENUECAT] Detected Expo Go from configure error - native purchases not available');
        isExpoGo = true;
        isConfigured = true;
        return true;
      }
      throw configureError;
    }
    
    isConfigured = true;
    
    // Get and log the configured app user ID
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      console.log('[REVENUECAT] ✅ SUCCESS - RevenueCat initialized');
      console.log('[REVENUECAT] App User ID:', customerInfo.originalAppUserId);
    } catch (e) {
      console.log('[REVENUECAT] ✅ SUCCESS - RevenueCat initialized (could not get initial customer info)');
    }
    
    return true;
  } catch (error) {
    console.error('[REVENUECAT] ❌ FAILED:', error.message);
    console.error('[REVENUECAT] Stack:', error.stack);
    
    // Check if this is the Expo Go error
    if (error.message && (
      error.message.includes('Expo Go') ||
      error.message.includes('Test Store') ||
      error.message.includes('native store is not available')
    )) {
      console.log('[REVENUECAT] Treating as Expo Go mode due to error');
      isExpoGo = true;
      isConfigured = true;
      return true;
    }
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
        if (!Purchases) {
          console.log('Purchases module not available');
          setIsLoading(false);
          return;
        }
        
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
    if (!isConfigured || !Purchases) return;
    
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
    if (!isConfigured || !Purchases) return;
    
    try {
      console.log('[REVENUECAT] Fetching offerings...');
      const offerings = await Purchases.getOfferings();
      
      // Detailed logging for debugging
      console.log('[REVENUECAT] Raw offerings response:', JSON.stringify({
        current: offerings.current?.identifier || null,
        allKeys: Object.keys(offerings.all || {}),
        allOfferings: Object.entries(offerings.all || {}).map(([key, val]) => ({
          key,
          identifier: val.identifier,
          serverDescription: val.serverDescription,
          availablePackagesCount: val.availablePackages?.length || 0,
          packages: val.availablePackages?.map(p => ({
            identifier: p.identifier,
            packageType: p.packageType,
            productIdentifier: p.product?.identifier,
            productTitle: p.product?.title,
            productPrice: p.product?.price,
            productPriceString: p.product?.priceString,
          })) || []
        }))
      }, null, 2));
      
      const useOffering = offerings.current || offerings.all?.['default'];
      
      if (!useOffering) {
        console.error('[REVENUECAT] ❌ No offering found! Check that "default" offering exists in RevenueCat dashboard.');
      } else if (!useOffering.monthly && !useOffering.yearly) {
        console.error('[REVENUECAT] ❌ Offering found but no monthly/yearly packages. Products may not be configured correctly in App Store Connect.');
      } else {
        console.log('[REVENUECAT] ✅ Using offering:', useOffering.identifier);
        console.log('[REVENUECAT] Monthly:', useOffering.monthly?.product?.identifier || 'NOT FOUND');
        console.log('[REVENUECAT] Yearly:', useOffering.yearly?.product?.identifier || 'NOT FOUND');
      }
      
      setOfferings(offerings);
    } catch (error) {
      console.error('[REVENUECAT] ❌ Error loading offerings:', error.message);
      console.error('[REVENUECAT] Stack:', error.stack);
    }
  }, []);

  const purchasePackage = useCallback(async (pkg) => {
    if (isExpoGo) {
      return { success: false, error: 'Purchases not available in Expo Go. Please use a development build.' };
    }
    if (!isConfigured) return { success: false, error: 'Purchase system not ready' };
    if (!Purchases) return { success: false, error: 'Purchase system not available' };
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
    if (!Purchases) return { success: false, error: 'Purchase system not available' };
    
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
    if (!isConfigured || !Purchases) return;
    
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
  // Try 'current' first, then fall back to 'default' offering by ID
  const currentOffering = offerings?.current || offerings?.all?.['default'];
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

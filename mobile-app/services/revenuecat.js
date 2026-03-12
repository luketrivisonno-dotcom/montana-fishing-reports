// RevenueCat Purchase Service
// Handles all in-app purchase functionality

import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// RevenueCat API Keys
// Get these from your RevenueCat Dashboard: https://app.revenuecat.com
const REVENUECAT_API_KEYS = {
  ios: 'appl_walHurkTWBJnXkKnGsJUAsTilHm',     // Your iOS API key
  android: 'goog_YOUR_ANDROID_API_KEY',        // Replace with Android key when ready
};

// Entitlement ID - Must match what you set up in RevenueCat dashboard
const PREMIUM_ENTITLEMENT_ID = 'Montana Fishing Reports Pro';

// Offering identifiers - Must match your RevenueCat products
const OFFERING_IDENTIFIER = 'default';

// API URL for backend sync
const API_URL = 'https://montana-fishing-reports-production.up.railway.app';

/**
 * Initialize RevenueCat SDK
 * Call this when app starts
 */
export async function initializeRevenueCat() {
  try {
    // Set log level (use DEBUG for development, INFO for production)
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    
    // Configure with platform-specific API key
    const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEYS.ios : REVENUECAT_API_KEYS.android;
    
    // Optional: Set user ID if you have one (e.g., from your backend)
    const userId = await AsyncStorage.getItem('userId');
    
    if (userId) {
      Purchases.configure({ apiKey, appUserID: userId });
    } else {
      Purchases.configure({ apiKey });
    }
    
    console.log('✅ RevenueCat initialized');
    return true;
  } catch (error) {
    console.error('❌ RevenueCat initialization error:', error);
    return false;
  }
}

/**
 * Get available subscription offerings
 */
export async function getOfferings() {
  try {
    const offerings = await Purchases.getOfferings();
    
    if (offerings.current) {
      return {
        monthly: offerings.current.monthly,
        annual: offerings.current.annual,
        availablePackages: offerings.current.availablePackages,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching offerings:', error);
    return null;
  }
}

/**
 * Purchase a package (monthly or annual)
 */
export async function purchasePackage(packageToPurchase) {
  try {
    const { customerInfo, productIdentifier } = await Purchases.purchasePackage(packageToPurchase);
    
    // Check if purchase unlocked premium
    const isPremium = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID] !== undefined;
    
    if (isPremium) {
      // Save to local storage
      await AsyncStorage.setItem('isPremium', 'true');
      await AsyncStorage.setItem('premiumExpiry', customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID].expirationDate || '');
      
      // Sync with your backend
      await syncPurchaseWithBackend(customerInfo);
      
      return { success: true, isPremium, customerInfo };
    }
    
    return { success: false, error: 'Purchase did not unlock premium' };
  } catch (error) {
    if (error.userCancelled) {
      return { success: false, cancelled: true };
    }
    console.error('Purchase error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Restore previous purchases
 */
export async function restorePurchases() {
  try {
    const { customerInfo } = await Purchases.restorePurchases();
    
    const isPremium = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID] !== undefined;
    
    if (isPremium) {
      await AsyncStorage.setItem('isPremium', 'true');
      await AsyncStorage.setItem('premiumExpiry', customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID].expirationDate || '');
      await syncPurchaseWithBackend(customerInfo);
    } else {
      await AsyncStorage.setItem('isPremium', 'false');
    }
    
    return { success: true, isPremium, customerInfo };
  } catch (error) {
    console.error('Restore error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check if user has active premium subscription
 */
export async function checkPremiumStatus() {
  try {
    const { customerInfo } = await Purchases.getCustomerInfo();
    
    const isPremium = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID] !== undefined;
    
    // Sync with local storage
    await AsyncStorage.setItem('isPremium', isPremium ? 'true' : 'false');
    
    if (isPremium) {
      const entitlement = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID];
      await AsyncStorage.setItem('premiumExpiry', entitlement.expirationDate || '');
      
      return {
        isPremium: true,
        expiryDate: entitlement.expirationDate,
        purchaseDate: entitlement.purchaseDate,
        productIdentifier: entitlement.productIdentifier,
      };
    }
    
    return { isPremium: false };
  } catch (error) {
    console.error('Check premium status error:', error);
    
    // Fallback to local storage
    const cachedPremium = await AsyncStorage.getItem('isPremium');
    return { isPremium: cachedPremium === 'true' };
  }
}

/**
 * Get customer info
 */
export async function getCustomerInfo() {
  try {
    const { customerInfo } = await Purchases.getCustomerInfo();
    return customerInfo;
  } catch (error) {
    console.error('Get customer info error:', error);
    return null;
  }
}

/**
 * Sync purchase with your backend
 * This allows your API to validate premium status
 */
async function syncPurchaseWithBackend(customerInfo) {
  try {
    const isPremium = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID] !== undefined;
    
    if (!isPremium) return;
    
    const entitlement = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID];
    
    // Get RevenueCat user ID
    const customerInfo_rc = await Purchases.getCustomerInfo();
    const revenuecatId = customerInfo_rc.originalAppUserId;
    
    // Call your backend to sync
    const response = await fetch(`${API_URL}/api/premium/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        revenuecatId,
        isPremium: true,
        expiryDate: entitlement.expirationDate,
        productIdentifier: entitlement.productIdentifier,
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      // Save backend API key for subsequent requests
      if (data.apiKey) {
        await AsyncStorage.setItem('apiKey', data.apiKey);
        await AsyncStorage.setItem('userEmail', data.email);
      }
    }
  } catch (error) {
    console.error('Sync with backend error:', error);
  }
}

/**
 * Log out user (for account switching)
 */
export async function logout() {
  try {
    await Purchases.logOut();
    await AsyncStorage.removeItem('isPremium');
    await AsyncStorage.removeItem('premiumExpiry');
    await AsyncStorage.removeItem('apiKey');
  } catch (error) {
    console.error('Logout error:', error);
  }
}

# RevenueCat Setup Guide

This guide walks you through setting up RevenueCat for in-app purchases.

## 1. Create RevenueCat Account

1. Go to [RevenueCat](https://www.revenuecat.com/) and sign up
2. Create a new app for "Montana Fishing Reports"
3. Get your API keys:
   - iOS: `appl_XXXXXXXXXXXXX` 
   - Android: `goog_XXXXXXXXXXXXX`

## 2. Configure API Keys

Edit `mobile-app/services/revenuecat.js`:

```javascript
const REVENUECAT_API_KEYS = {
  ios: 'appl_YOUR_ACTUAL_IOS_KEY',
  android: 'goog_YOUR_ACTUAL_ANDROID_KEY',
};
```

## 3. Set Up App Store Products

### iOS (App Store Connect)

1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. Select your app → "Subscriptions"
3. Create a Subscription Group (e.g., "Premium")
4. Add subscription products:

**Monthly Subscription:**
- Reference Name: Premium Monthly
- Product ID: `com.montanafishing.monthly`
- Price: $4.99
- Subscription Duration: 1 Month

**Annual Subscription:**
- Reference Name: Premium Yearly
- Product ID: `com.montanafishing.yearly`
- Price: $39.99
- Subscription Duration: 1 Year

### Android (Google Play Console)

1. Go to [Google Play Console](https://play.google.com/console)
2. Select your app → "Monetization" → "Subscriptions"
3. Add subscription products:

**Monthly Subscription:**
- Product ID: `com.montanafishing.monthly`
- Price: $4.99
- Billing Period: Monthly

**Annual Subscription:**
- Product ID: `com.montanafishing.yearly`
- Price: $39.99
- Billing Period: Yearly

## 4. Configure RevenueCat Products

In RevenueCat Dashboard:

1. Go to your app → "Products"
2. Add iOS products:
   - Product ID: `com.montanafishing.monthly` → Type: Monthly
   - Product ID: `com.montanafishing.yearly` → Type: Yearly
3. Add Android products (same IDs)
4. Go to "Entitlements"
   - Create entitlement: `premium`
   - Add both products to this entitlement
5. Go to "Offerings"
   - Create offering: `default`
   - Add monthly package
   - Add annual package

## 5. Set Up Webhooks (Optional but Recommended)

1. In RevenueCat Dashboard → "Webhooks"
2. Add webhook URL: `https://montana-fishing-reports-production.up.railway.app/api/webhooks/revenuecat`
3. Set secret key in environment variable: `REVENUECAT_WEBHOOK_SECRET`
4. Select events:
   - INITIAL_PURCHASE
   - RENEWAL
   - CANCELLATION
   - EXPIRATION
   - UNCANCELLATION

## 6. Install SDK

```bash
cd mobile-app
npm install react-native-purchases
cd ios && pod install
```

## 7. Test Purchases

### iOS Sandbox Testing:
1. Create sandbox tester in App Store Connect
2. Sign in with sandbox account on device
3. Make test purchase (no real money charged)

### Android Test Purchases:
1. Add test users in Google Play Console
2. Use license testing
3. Make test purchase (shows "Test Card" label)

## 8. Environment Variables

Add to your Railway environment:

```
REVENUECAT_WEBHOOK_SECRET=your_webhook_secret_here
```

## 9. Deploy

```bash
cd mobile-app
eas build --platform ios --profile production
eas build --platform android --profile production
```

## RevenueCat Dashboard

Once live, monitor:
- MRR (Monthly Recurring Revenue)
- Churn rate
- Conversion rate
- Lifetime value (LTV)

## Pricing Strategy

Current setup:
- **Monthly**: $4.99/month
- **Annual**: $39.99/year (~33% savings)

This pricing is competitive for fishing apps and provides good value for serious anglers.

## Support

- RevenueCat Docs: https://docs.revenuecat.com/
- React Native SDK: https://docs.revenuecat.com/docs/reactnative
- Support: support@revenuecat.com

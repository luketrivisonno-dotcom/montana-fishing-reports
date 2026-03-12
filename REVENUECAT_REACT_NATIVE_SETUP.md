# RevenueCat React Native Setup Guide

Complete setup guide for integrating RevenueCat into your Montana Fishing Reports app.

## ✅ Already Done

The following is already implemented in your codebase:

1. ✅ SDK installed (`react-native-purchases`)
2. ✅ API key configured (`appl_walHurkTWBJnXkKnGsJUAsTilHm`)
3. ✅ Entitlement ID set (`Montana Fishing Reports Pro`)
4. ✅ React hook created (`useRevenueCat`)
5. ✅ Paywall component built
6. ✅ Backend endpoints ready

## Step 1: Configure iOS Products in App Store Connect

### 1.1 Create Subscription Group
1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. Select your app → "Subscriptions" (under Features)
3. Click "Create Subscription Group"
4. Name: "Montana Fishing Reports Pro"
5. Reference Name: "Premium Access"

### 1.2 Create Monthly Subscription
- **Reference Name**: Premium Monthly
- **Product ID**: `com.montanafishing.monthly`
- **Subscription Group**: Montana Fishing Reports Pro
- **Subscription Duration**: 1 Month
- **Price**: $4.99
- **Subscription Level**: Level 1

### 1.3 Create Annual Subscription
- **Reference Name**: Premium Yearly  
- **Product ID**: `com.montanafishing.yearly`
- **Subscription Group**: Montana Fishing Reports Pro
- **Subscription Duration**: 1 Year
- **Price**: $39.99
- **Subscription Level**: Level 1

### 1.4 Add Localization
For both subscriptions, add:
- **Display Name**: "Premium Access"
- **Description**: "Unlock unlimited favorites, push notifications, hatch alerts, and more"

## Step 2: Configure RevenueCat Dashboard

### 2.1 Add App
1. Go to [RevenueCat Dashboard](https://app.revenuecat.com/)
2. Create new app: "Montana Fishing Reports"
3. Copy your iOS API key (already in your code): `appl_walHurkTWBJnXkKnGsJUAsTilHm`

### 2.2 Add Products
Go to **Products** and add:

**Product 1:**
- Identifier: `com.montanafishing.monthly`
- App Store Connect ID: `com.montanafishing.monthly`
- Type: Subscription

**Product 2:**
- Identifier: `com.montanafishing.yearly`  
- App Store Connect ID: `com.montanafishing.yearly`
- Type: Subscription

### 2.3 Create Entitlement
Go to **Entitlements**:
- Identifier: `Montana Fishing Reports Pro`
- Products: Add both monthly and yearly

### 2.4 Create Offering
Go to **Offerings**:
- Identifier: `default`
- Available Packages:
  - Monthly: Select monthly product
  - Annual: Select yearly product

## Step 3: Configure Webhooks (Optional)

1. RevenueCat Dashboard → **Webhooks**
2. Add webhook URL:
   ```
   https://montana-fishing-reports-production.up.railway.app/api/webhooks/revenuecat
   ```
3. Set secret in Railway environment variables:
   ```
   REVENUECAT_WEBHOOK_SECRET=your_random_secret_here
   ```
4. Enable events:
   - ✅ INITIAL_PURCHASE
   - ✅ RENEWAL
   - ✅ CANCELLATION
   - ✅ EXPIRATION

## Step 4: Test Purchases

### 4.1 Create Sandbox Tester
1. App Store Connect → Users and Access → Sandbox Testers
2. Create new tester:
   - Email: `test@example.com`
   - Password: Choose a strong password
   - Country: United States

### 4.2 Test on Device
1. Sign out of your regular Apple ID on test device
2. Sign in with sandbox tester account
3. Run app in development mode
4. Try to purchase - you'll see "[Sandbox]" in the purchase dialog
5. **No real money is charged**

## Step 5: Usage in Your Code

### Check Premium Status
```javascript
import { useRevenueCat } from './hooks/useRevenueCat';

function MyComponent() {
  const { isPremium, isLoading } = useRevenueCat();
  
  if (isLoading) return <Loading />;
  
  return (
    <View>
      {isPremium ? (
        <Text>Welcome Premium User!</Text>
      ) : (
        <Text>Upgrade to Premium</Text>
      )}
    </View>
  );
}
```

### Show Paywall
```javascript
import Paywall from './components/Paywall';

function App() {
  const [showPaywall, setShowPaywall] = useState(false);
  
  return (
    <>
      <Button title="Go Premium" onPress={() => setShowPaywall(true)} />
      
      <Paywall 
        visible={showPaywall} 
        onClose={() => setShowPaywall(false)}
        onPurchaseSuccess={() => {
          setShowPaywall(false);
          // Handle success
        }}
      />
    </>
  );
}
```

### Manual Purchase
```javascript
const { monthlyPackage, yearlyPackage, purchasePackage } = useRevenueCat();

// Purchase monthly
const result = await purchasePackage(monthlyPackage);
if (result.success) {
  console.log('Purchase successful!');
}
```

### Restore Purchases
```javascript
const { restorePurchases } = useRevenueCat();

const handleRestore = async () => {
  const result = await restorePurchases();
  if (result.success && result.isPremium) {
    Alert.alert('Restored!', 'Your purchases have been restored.');
  }
};
```

## Step 6: Deploy to Production

### 6.1 Build for iOS
```bash
cd mobile-app
eas build --platform ios --profile production
```

### 6.2 Submit to App Store
1. Upload build to App Store Connect
2. Complete app review information
3. Submit for review
4. Once approved, subscriptions become live

## RevenueCat Dashboard Metrics

Once live, monitor:

| Metric | Description |
|--------|-------------|
| **MRR** | Monthly Recurring Revenue |
| **Revenue** | Total revenue to date |
| **Active Subscriptions** | Current paying users |
| **Churn Rate** | % of users cancelling |
| **Conversion Rate** | Free → Paid conversion |
| **LTV** | Lifetime Value per customer |

## Troubleshooting

### "Product not found"
- Wait 24-48 hours after creating App Store products
- Check product IDs match exactly
- Ensure products are cleared for sale in App Store Connect

### "Cannot connect to iTunes Store"
- Test on real device (not simulator)
- Use sandbox tester account
- Check device internet connection

### Purchase not unlocking features
- Check entitlement ID matches: `Montana Fishing Reports Pro`
- Verify offering is named `default`
- Check RevenueCat debug logs

## Pricing Strategy

Current setup:
- **Monthly**: $4.99/month
- **Annual**: $39.99/year (33% savings)

This is competitive with other fishing apps and provides good value for serious anglers.

## Support

- RevenueCat Docs: https://docs.revenuecat.com/docs/reactnative
- Status Page: https://status.revenuecat.com/
- Support: support@revenuecat.com

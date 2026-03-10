# Google AdMob Setup Guide

## 1. Create AdMob Account

1. Go to [admob.google.com](https://admob.google.com)
2. Sign in with your Google account
3. Complete the account setup
4. **Important:** You need to verify your identity and address (Google sends a PIN)

## 2. Add Your App to AdMob

1. In AdMob dashboard, click "Apps" → "Add App"
2. Select "No" for "Is your app published?"
3. Enter app name: "Montana Fishing Reports"
4. Select platform: iOS (and Android if you want)
5. Click "Add"

## 3. Create Ad Units

### Banner Ad (Bottom of screens)
1. Click "Ad units" → "Add Ad Unit" → "Banner"
2. Name it: "Main Banner"
3. Choose refresh rate: 30-60 seconds
4. Click "Create"
5. **Copy the Ad Unit ID** (looks like: `ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX`)

### Interstitial Ad (Full screen between screens)
1. Click "Ad units" → "Add Ad Unit" → "Interstitial"
2. Name it: "Main Interstitial"
3. Click "Create"
4. **Copy the Ad Unit ID**

### Rewarded Ad (Optional - for premium features)
1. Click "Ad units" → "Add Ad Unit" → "Rewarded"
2. Name it: "Premium Reward"
3. Set reward amount: 1
4. Set reward item: "Premium Day"
5. Click "Create"
6. **Copy the Ad Unit ID**

## 4. Update app.json with Real IDs

Replace the placeholder IDs in `mobile-app/app.json`:

```json
[
  "expo-ads-admob",
  {
    "androidAppId": "ca-app-pub-YOUR_APP_ID",
    "iosAppId": "ca-app-pub-YOUR_APP_ID"
  }
]
```

## 5. Update Ad Components with Real IDs

Edit `mobile-app/components/AdBanner.js`:
- Change `USE_TEST_ADS = false`
- Replace `PRODUCTION_BANNER_ID` with your real banner ID

Edit `mobile-app/components/AdManager.js`:
- Change `USE_TEST_ADS = false`
- Replace `PRODUCTION_INTERSTITIAL_ID` with your real ID
- Replace `PRODUCTION_REWARDED_ID` with your real ID

## 6. Add Ads to Your Screens

### Banner Ads

Import in your screen:
```javascript
import AdBanner from './components/AdBanner';
```

Add at the bottom of screens:
```javascript
<AdBanner size="banner" />
```

Available sizes:
- `banner` - Standard banner (320x50)
- `largeBanner` - Large banner (320x100)
- `mediumRectangle` - Medium rectangle (300x250)
- `fullBanner` - Full banner (468x60)
- `leaderboard` - Leaderboard (728x90)

### Interstitial Ads (Full Screen)

```javascript
import AdManager from './components/AdManager';

// Show ad when navigating between screens
useEffect(() => {
  AdManager.showInterstitialWithFrequency('river_view', 5); // Every 5th view
}, []);
```

### Example: Add banner to RiverDetailsScreen

In `App.js`, find the RiverDetailsScreen and add:

```javascript
<AdBanner size="banner" style={{ marginTop: 16 }} />
```

Before the closing `</ScrollView>` tag.

## 7. App Store Requirements

### App Tracking Transparency (iOS 14.5+)
Apple requires user permission to track for personalized ads. This is already configured in app.json.

### App Store Privacy Labels
When submitting, select:
- **Data Used to Track You:** Yes
- **Identifiers:** Device ID
- **Third-Party Advertising:** Yes

### Content Rating
Your app should be rated for:
- Gambling: No
- Ads: Yes (for ad-supported version)

## 8. Test Ads

**Always use test ads during development!** Test IDs are already configured.

To see test ads:
1. Build the app: `eas build --platform ios`
2. Install via TestFlight
3. You should see test ads labeled "Test Ad"

## 9. Go Live

1. Switch `USE_TEST_ADS` to `false` in both ad components
2. Update with real Ad Unit IDs
3. Rebuild and submit to App Store
4. In AdMob, link your app to the App Store listing once live

## 10. Revenue Optimization Tips

1. **Banner placement:** Bottom of scrollable content
2. **Interstitial frequency:** Every 3-5 screen views (not too annoying)
3. **Premium upgrade:** Offer ad-free version for $2.99-$4.99/month
4. **Seasonal:** Fishing apps see higher usage in spring/summer

## Expected Revenue

For a fishing app with 1,000 daily active users:
- Banner ads: ~$2-5/day
- Interstitials: ~$5-10/day
- Total: ~$200-400/month

## Important Notes

- AdMob pays monthly when you reach $100 threshold
- Payments via bank transfer or wire
- You must comply with AdMob policies (no fake clicks)
- Apple takes 15-30% of in-app purchases (premium)

## Questions?

Contact AdMob support or check their documentation at:
https://support.google.com/admob

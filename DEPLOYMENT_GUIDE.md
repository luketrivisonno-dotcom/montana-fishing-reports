# Deployment Guide - Montana Fishing Reports

## Overview
This app uses **Expo** with **EAS (Expo Application Services)** for building and deployment.

## Prerequisites

1. **Expo Account**
   ```bash
   npx expo login
   # Or create account at https://expo.dev/signup
   ```

2. **EAS CLI**
   ```bash
   npm install -g eas-cli
   ```

3. **App Store Accounts**
   - Apple Developer Account ($99/year) - for iOS
   - Google Play Developer Account ($25 one-time) - for Android

---

## Step 1: Configure app.json

Create `mobile-app/app.json`:

```json
{
  "expo": {
    "name": "Montana Fishing Reports",
    "slug": "montana-fishing-reports",
    "version": "2.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#2d4a3e"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourcompany.montanafishing",
      "buildNumber": "2.0.0",
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "This app uses your location to show nearby rivers and access points.",
        "NSLocationAlwaysUsageDescription": "This app uses your location to show nearby rivers and access points."
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#2d4a3e"
      },
      "package": "com.yourcompany.montanafishing",
      "versionCode": 2,
      "permissions": [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "NOTIFICATIONS"
      ]
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#2d4a3e",
          "sounds": ["./assets/notification-sound.wav"]
        }
      ]
    ],
    "extra": {
      "eas": {
        "projectId": "your-project-id-here"
      }
    }
  }
}
```

---

## Step 2: Configure EAS

Create `mobile-app/eas.json`:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

---

## Step 3: Initialize EAS Project

```bash
cd mobile-app

# Login to Expo
npx expo login

# Initialize EAS project (creates project on Expo servers)
eas init

# Or if project already exists:
# eas init --id your-project-id
```

---

## Step 4: Create Development Build (For Testing Push Notifications)

Since Expo Go doesn't support push notifications, you need a development build:

```bash
# Create development build for iOS
eas build --profile development --platform ios

# Create development build for Android  
eas build --profile development --platform android
```

This creates a custom app with your push notification configuration.

---

## Step 5: Test Push Notifications

1. Install the development build on your device
2. Update the project ID in `utils/notifications.js`:
   ```javascript
   const projectId = 'your-actual-project-id';
   ```
3. Run the app and test notifications

---

## Step 6: Build for Production

### Android
```bash
# Build AAB (Android App Bundle) for Play Store
eas build --platform android --profile production

# Or APK for direct distribution
eas build --platform android --profile production --type apk
```

### iOS
```bash
# Build for App Store
eas build --platform ios --profile production
```

---

## Step 7: Submit to Stores

### Automatic Submission
```bash
# Submit to App Store
eas submit --platform ios

# Submit to Play Store
eas submit --platform android
```

### Manual Submission

#### iOS
1. Download the `.ipa` from EAS build
2. Open **Transporter** app (Mac)
3. Upload the `.ipa`
4. Go to App Store Connect → TestFlight → Submit for Review

#### Android
1. Download the `.aab` from EAS build
2. Go to Google Play Console
3. Create new release → Upload AAB
4. Submit for review

---

## Step 8: Configure Push Notifications for Production

### Server-Side (Expo Push Tokens)

Update server to send push notifications:

```javascript
// server.js - Add this endpoint
app.post('/api/notifications/send', async (req, res) => {
    const { river, title, body } = req.body;
    
    // Get all subscribed tokens for this river
    const result = await db.query(
        'SELECT DISTINCT token FROM notification_subscriptions WHERE river = $1',
        [river]
    );
    
    const tokens = result.rows.map(r => r.token);
    
    // Send via Expo Push API
    const messages = tokens.map(token => ({
        to: token,
        sound: 'default',
        title,
        body,
        data: { river },
    }));
    
    const chunks = expo.chunkPushNotifications(messages);
    
    for (const chunk of chunks) {
        await expo.sendPushNotificationsAsync(chunk);
    }
    
    res.json({ sent: tokens.length });
});
```

---

## Quick Reference Commands

```bash
# Development
npx expo start                    # Start Expo Go
npx expo start --dev-client      # Start with dev client

# Building
eas build --profile development   # Dev build
eas build --profile preview      # Preview build (internal testing)
eas build --profile production   # Production build

# Submitting
eas submit --platform ios        # Submit iOS
eas submit --platform android    # Submit Android

# Build + Submit
eas build --platform ios --auto-submit
```

---

## Important Notes

### Push Notifications
- **Expo Go**: Push notifications DON'T work (limited by Expo)
- **Development Build**: Push notifications work (custom app)
- **Production Build**: Full push notification support

### Environment Variables
Create `.env` file:
```
EXPO_PUBLIC_API_URL=https://your-production-api.com
EXPO_PUBLIC_PROJECT_ID=your-expo-project-id
```

### Updating the App
```bash
# Increment version in app.json, then:
eas build --profile production
eas submit --platform ios --platform android
```

---

## Need Help?

- **Expo Docs**: https://docs.expo.dev
- **EAS Build**: https://docs.expo.dev/build/introduction/
- **Push Notifications**: https://docs.expo.dev/push-notifications/overview/

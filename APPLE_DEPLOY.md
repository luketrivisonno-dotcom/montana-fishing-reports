# Apple App Store Deployment - Direct Path

Skip Expo Go entirely. Build directly for iOS using EAS and TestFlight.

---

## Prerequisites

1. **Apple Developer Account** ($99/year)
   - Sign up at: https://developer.apple.com/programs/
   - Wait for approval (usually 24-48 hours)

2. **Mac Computer**
   - Required for iOS builds and App Store submission

---

## Step 1: Install Tools (One-time)

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo (creates free account)
npx expo login

# Verify you're logged in
npx expo whoami
```

---

## Step 2: Update App Configuration

Edit `mobile-app/app.json`:

```json
{
  "expo": {
    "name": "Montana Fishing Reports",
    "slug": "montana-fishing-reports",
    "version": "2.0.0",
    "ios": {
      "bundleIdentifier": "com.yourname.montanafishing",
      "buildNumber": "2.0.0"
    }
  }
}
```

**Important**: Replace `com.yourname.montanafishing` with your unique bundle ID.

---

## Step 3: Initialize EAS Project

```bash
cd mobile-app

# This creates the project on Expo's servers
eas init

# When prompted, select "Create a new project"
# This gives you a projectId for app.json
```

Copy the projectId and update `app.json`:
```json
{
  "extra": {
    "eas": {
      "projectId": "your-project-id-here"
    }
  }
}
```

---

## Step 4: Build for iOS (TestFlight)

```bash
# This builds an .ipa file and uploads to App Store Connect
eas build --platform ios

# You'll be prompted to:
# 1. Log in with your Apple ID
# 2. Select or create an app on App Store Connect
# 3. Choose build credentials (let EAS handle it)
```

**What happens:**
- EAS builds the iOS app in the cloud
- Uploads directly to App Store Connect
- Appears in TestFlight within 10-30 minutes

---

## Step 5: Test with TestFlight

1. **Download TestFlight app** on your iPhone/iPad
2. **Accept invitation** (you'll get an email from Apple)
3. **Install your app** from TestFlight
4. **Test everything** including push notifications

---

## Step 6: Submit to App Store

### Option A: Automatic (EAS Submit)
```bash
eas submit --platform ios
```

### Option B: Manual (App Store Connect)
1. Go to https://appstoreconnect.apple.com
2. Select your app
3. Go to "App Store" tab
4. Create new version
5. Select your build from TestFlight
6. Fill in app information, screenshots, etc.
7. Submit for review

---

## Quick Commands Reference

```bash
# Build for internal testing (TestFlight)
eas build --platform ios

# Build specific profile
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios

# Build + Submit together
eas build --platform ios --auto-submit

# Check build status
eas build:list
```

---

## Troubleshooting

### "Bundle identifier already taken"
- Use a unique reverse domain: `com.yourname.montanafishing`
- Add your name or company: `com.johnsmith.montanafishingreports`

### "Apple Developer account required"
- Must pay $99 and wait for approval
- Can take 24-48 hours after payment

### Push notifications not working
- They WILL work in TestFlight/production builds
- They do NOT work in Expo Go (expected)
- TestFlight = real iOS app = full push support

### Build fails
```bash
# Clear cache and retry
eas build --platform ios --clear-cache

# Check logs
eas build:logs
```

---

## What You'll Get

| Stage | Result | Push Notifications |
|-------|--------|-------------------|
| `eas build` | TestFlight app | ✅ Yes |
| `eas submit` | App Store review | ✅ Yes |
| Published | Public app | ✅ Yes |

---

## Timeline

1. **Apple Developer signup**: Immediate to 48 hours
2. **First build**: 15-30 minutes
3. **TestFlight availability**: 10-30 minutes after build
4. **App Store review**: 1-3 days

---

## Need Help?

- **EAS Docs**: https://docs.expo.dev/build/introduction/
- **App Store Connect**: https://appstoreconnect.apple.com
- **Expo Forums**: https://forums.expo.dev

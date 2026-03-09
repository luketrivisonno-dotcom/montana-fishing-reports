# Pre-Deployment Checklist
Complete these BEFORE starting App Store submission to avoid delays.

---

## ✅ Required Before Building

### 1. Environment Configuration
```bash
# Create environment files
cp mobile-app/.env.example mobile-app/.env.production
```

Update `mobile-app/.env.production`:
```
EXPO_PUBLIC_API_URL=https://your-production-api.com
EXPO_PUBLIC_PROJECT_ID=your-expo-project-id
EXPO_PUBLIC_GOOGLE_API_KEY=your-maps-api-key
```

**Action**: Create these files and test with production API

---

### 2. App Store Assets Required

You CANNOT submit without these:

#### Screenshots (6.5" iPhone required)
- [ ] 6.5" iPhone screenshots (1242 x 2688) - 3-5 images
- [ ] 5.5" iPhone screenshots (1242 x 2208) - 3-5 images
- [ ] iPad Pro 12.9" screenshots (2048 x 2732) - optional but recommended

**Tip**: Use iOS Simulator → Device Bezels → Screenshot, or use https://screenshot-frames.com

#### App Icon
- [ ] 1024x1024 PNG (no transparency)
- [ ] Verify it looks good at small sizes

#### App Preview Video (Optional but helps)
- [ ] 15-30 second video showing app features

---

### 3. App Store Information

Have these ready before submission:

```
App Name (30 chars max): Montana Fishing Reports
Subtitle (30 chars max): Real-Time River Conditions
Description (4000 chars max): 
  [Write compelling description with keywords]
  
Keywords (100 chars max): 
  fishing,montana,flyfishing,river,trout,reports,conditions

Support URL: https://yoursite.com/support
Marketing URL: https://yoursite.com
Privacy Policy URL: https://yoursite.com/privacy
```

**Action**: Write these now and save in `APP_STORE_INFO.md`

---

### 4. Privacy Policy (REQUIRED)

Apple rejects without this. Create `PRIVACY_POLICY.md`:

```markdown
# Privacy Policy

## Data We Collect
- Location (optional, for showing nearby rivers)
- Push notification tokens
- Fishing log data (stored locally on device)

## How We Use Data
- Location: Show nearby access points
- Notifications: River condition alerts
- Analytics: App improvement

## Third Parties
- USGS (flow data)
- Weather services
- Expo (analytics)

## Contact
[your email]
```

**Action**: Host this on your website or GitHub Pages

---

### 5. Terms of Service

Create simple `TERMS_OF_SERVICE.md`:

```markdown
# Terms of Service

By using this app you agree to:
- Use at your own risk
- Verify regulations before fishing
- Not rely solely on app data for safety

Data provided "as is" from USGS and other sources.
```

---

### 6. Production API Checklist

Server must be ready:

```bash
# Database migrations run
cd server && npm run migrate

# Environment variables set:
NODE_ENV=production
DATABASE_URL=your-production-db
EXPO_ACCESS_TOKEN=your-expo-token
PUSH_NOTIFICATION_KEY=your-push-key

# SSL certificate valid
# Domain configured
# Rate limiting enabled
```

**Action**: Test production API with Postman/curl

---

### 7. Error Tracking Setup

Add Sentry for crash reporting:

```bash
cd mobile-app
npx expo install sentry-expo
```

Create `mobile-app/utils/sentry.js`:
```javascript
import * as Sentry from 'sentry-expo';

Sentry.init({
  dsn: 'your-sentry-dsn',
  enableInExpoDevelopment: false,
  debug: __DEV__,
});
```

**Action**: Sign up at https://sentry.io (free tier available)

---

### 8. Analytics Setup

Track user behavior:

```javascript
// utils/analytics.js
export const logEvent = (event, params) => {
  // Log to your analytics service
  console.log('[Analytics]', event, params);
};
```

Track these events:
- [ ] River viewed
- [ ] Report opened
- [ ] Map accessed
- [ ] Catch logged
- [ ] Premium upgrade attempt

**Action**: Set up Firebase Analytics or Amplitude

---

### 9. Push Notification Certificates

For iOS production:

```bash
# EAS handles this automatically, but verify:
eas credentials:manager

# Select iOS → Push Notifications → Verify
```

**Action**: Run above command, ensure push certs exist

---

### 10. App Store Optimization (ASO)

Keywords research for fishing apps:
```
Primary: fishing app, montana fishing, fly fishing
Secondary: trout fishing, river conditions, fishing reports
Long-tail: best fishing times, river flow rates, fishing access
```

Competitor research:
- [ ] Search "fishing reports" on App Store
- [ ] Note their keywords
- [ ] Differentiate your title/description

---

### 11. In-App Purchase Setup (If Premium)

If keeping premium features:

```bash
# Configure in App Store Connect
App Store Connect → Your App → Features → In-App Purchases

# Create products:
- Monthly: $4.99
- Yearly: $29.99 (discounted)
```

**Action**: Or remove premium gates before launch for simpler review

---

### 12. Content Rating

App Store asks about:
- [ ] Gambling (No)
- [ ] Violence (No)  
- [ ] Mature content (No)
- [ ] Unrestricted web access (Yes - you link to USGS sites)

**Prepare answers** for the content questionnaire

---

### 13. Beta Testing Plan

Before public launch:

```
Week 1: TestFlight internal testing (you + team)
Week 2: TestFlight external testing (20-50 users)
Week 3: Soft launch (1-2 states only)
Week 4: Full launch
```

**Action**: Recruit 20 Montana anglers for beta testing

---

### 14. Support System

Set up before launch:
- [ ] Support email: support@yourapp.com
- [ ] FAQ page on website
- [ ] Response template for common issues

**Action**: Create Gmail account or use help desk (Zendesk/Intercom)

---

### 15. Marketing Materials Ready

Have these ready for launch day:
- [ ] App website/landing page
- [ ] Social media accounts (Instagram, Facebook)
- [ ] Launch announcement text
- [ ] Screenshots for social posts
- [ ] Press kit for fishing blogs

---

## 🔧 Technical Optimizations

### Bundle Size Check
```bash
cd mobile-app
npx expo-optimize

# Should be under 50MB for iOS
```

### Performance Checklist
- [ ] App launches in < 3 seconds
- [ ] Map loads smoothly
- [ ] Images optimized
- [ ] No console.log statements in production

### Security Checklist
- [ ] API keys not hardcoded
- [ ] Database connections use SSL
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints

---

## 📝 Pre-Launch Testing

### Device Testing
Test on physical devices:
- [ ] iPhone (latest iOS)
- [ ] iPhone (iOS 15/16 - older version)
- [ ] iPad (if supporting)
- [ ] Poor network conditions (airplane mode toggling)

### Feature Testing
- [ ] All rivers load correctly
- [ ] Map shows all pins
- [ ] Flow data displays
- [ ] Push notifications work (TestFlight)
- [ ] Fishing log saves/loads
- [ ] Offline mode works

### App Store Review Guidelines
Check these Apple requirements:
- [ ] No broken links
- [ ] No placeholder content
- [ ] App is complete (not beta)
- [ ] Privacy policy accessible
- [ ] Sign-in works (if applicable)

---

## 💰 Monetization Decision

Choose BEFORE building:

**Option A: Free with Ads**
- Add AdMob later
- More users, less revenue per user

**Option B: Freemium (Current)**
- Keep premium features
- Requires in-app purchase setup
- More complex review process

**Option C: Completely Free**
- Remove all premium gates
- Fastest approval
- Build user base first

**RECOMMENDATION**: Start with Option C, add monetization later

---

## 📅 Launch Timeline

| Week | Task |
|------|------|
| Week 1 | Complete this checklist |
| Week 2 | Build first TestFlight version |
| Week 3 | Internal testing + bug fixes |
| Week 4 | Beta testing with anglers |
| Week 5 | Submit to App Store |
| Week 6 | Marketing + launch |

---

## 🚨 Common Rejection Reasons (Avoid These)

1. **Placeholder content** - Remove all "Coming Soon" text
2. **Broken links** - Test all external links
3. **Missing privacy policy** - REQUIRED
4. **App crashes** - Test thoroughly
5. **Confusing UI** - Make navigation obvious
6. **Web content in app** - Don't just wrap a website
7. **Incomplete features** - Remove unfinished features

---

## ✅ Final Go/No-Go Checklist

Before hitting "Submit for Review":

- [ ] Privacy policy live on website
- [ ] App tested on physical device
- [ ] Screenshots uploaded
- [ ] Description written
- [ ] Keywords researched
- [ ] Support email ready
- [ ] No crashes or major bugs
- [ ] Loading states for all async operations
- [ ] Error handling for network failures
- [ ] App icon looks good at all sizes

---

## Next Steps

1. **Complete items 1-5** (Required assets)
2. **Choose monetization strategy**
3. **Remove premium gates if going free**
4. **Build TestFlight version**
5. **Beta test with 20 users**
6. **Submit to App Store**

**Estimated time to complete checklist**: 3-5 days
**Estimated time to App Store approval**: 1-3 days after submission

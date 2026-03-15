# Giving Premium Access to Friends/Family

## Option 1: TestFlight Beta (Free App Testing)

### For You (Developer):
1. Build the app with `eas build --platform ios --profile production`
2. Wait for build to process in App Store Connect
3. Go to **App Store Connect** → Your App → **TestFlight**
4. Under **Internal Testing**, click "+" to add testers
5. Enter their Apple ID email addresses
6. Add the build to internal testing

### For Friends/Family:
1. Download **TestFlight** app from App Store (free)
2. Accept your email invitation
3. Open TestFlight → See your app → Tap "Install"
4. App works for 90 days, then needs new build

---

## Option 2: RevenueCat Promotional Access (Free Premium)

### Method A: Backend Admin Endpoint

Add this endpoint to your server.js to grant premium manually:

```javascript
// Admin endpoint to grant promotional premium access
app.post('/api/admin/grant-premium', async (req, res) => {
  const { adminKey, revenuecatId, months = 12 } = req.body;
  
  // Simple admin check - change this secret!
  if (adminKey !== 'YOUR_SECRET_ADMIN_KEY') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  try {
    // Generate API key
    const apiKey = require('crypto').randomBytes(32).toString('hex');
    const email = `promo-${revenuecatId.substring(0, 8)}@promo.local`;
    
    // Calculate expiry
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + months);
    
    // Save to database
    await db.query(
      `INSERT INTO premium_users (revenuecat_id, api_key, email, is_premium, expiry_date) 
       VALUES ($1, $2, $3, true, $4)
       ON CONFLICT (revenuecat_id) 
       DO UPDATE SET is_premium = true, expiry_date = $4, api_key = $2`,
      [revenuecatId, apiKey, email, expiryDate]
    );
    
    res.json({ 
      success: true, 
      apiKey,
      email,
      expiryDate: expiryDate.toISOString()
    });
  } catch (error) {
    console.error('Grant premium error:', error);
    res.status(500).json({ error: 'Failed to grant premium' });
  }
});
```

### How to Use:

1. Friend installs app (TestFlight or App Store)
2. They open app and go to "Upgrade to Premium"
3. You ask for their RevenueCat ID (display in app somewhere or get from logs)
4. You call your admin endpoint:

```bash
curl -X POST https://montana-fishing-reports-production.up.railway.app/api/admin/grant-premium \
  -H "Content-Type: application/json" \
  -d '{
    "adminKey": "YOUR_SECRET_ADMIN_KEY",
    "revenuecatId": "the_users_revenuecat_id",
    "months": 12
  }'
```

5. They restart app - now have premium!

---

## Option 3: Hardcoded "Friends & Family" Mode

Add a secret way to unlock premium in the app:

### In your Paywall component:

```javascript
// Add a hidden "friends & family" unlock
const [tapCount, setTapCount] = useState(0);

// Hidden in your paywall, maybe on the logo:
<Logo 
  onPress={() => {
    setTapCount(tapCount + 1);
    if (tapCount >= 4) { // Tap 5 times
      // Unlock premium for this device
      AsyncStorage.setItem('isPremium', 'true');
      AsyncStorage.setItem('premiumSource', 'friend');
      Alert.alert('Premium Unlocked!', 'Enjoy!');
    }
  }}
/>
```

Or add a "Secret Code" field:

```javascript
const [secretCode, setSecretCode] = useState('');

const checkSecretCode = () => {
  if (secretCode === 'FISH2026') { // Your secret code
    AsyncStorage.setItem('isPremium', 'true');
    setIsPremium(true);
    Alert.alert('Premium Activated!');
  }
};

// In paywall add:
<TextInput 
  placeholder="Have a code?"
  value={secretCode}
  onChangeText={setSecretCode}
/>
<Button title="Unlock" onPress={checkSecretCode} />
```

---

## Option 4: App Store Promo Codes (Official)

### For Paid Apps Only (Not IAP)
Since your app is free, this won't work for the app itself, but works for subscription:

1. App Store Connect → Features → **Promo Codes**
2. Select your **subscription product**
3. Generate up to 100 codes
4. Send codes to friends
5. They redeem in App Store app

**Limitation:** Only gives free period, doesn't auto-renew

---

## Recommended Approach

### For Beta Testing (Now):
Use **TestFlight Internal Testing**
- 100 people max
- Immediate access
- 90 day builds

### For Giving Premium (Long term):
Use **RevenueCat Backend Admin** method
- You control who gets premium
- Can set expiration (1 year, lifetime, etc.)
- Friends don't pay anything

### For Easy Sharing:
Add **secret code** in app
- Simple 6-digit code
- Tap logo 5 times
- Friends unlock instantly

---

## Quick Setup Steps

1. **Add RevenueCat ID display** in settings so you can see their ID:

```javascript
// In Settings screen
const [rcId, setRcId] = useState('');
useEffect(() => {
  if (customerInfo?.originalAppUserId) {
    setRcId(customerInfo.originalAppUserId);
  }
}, [customerInfo]);

// Show it:
<Text>Your ID: {rcId}</Text>
```

2. **Add admin endpoint** to your backend (code above)

3. **Build for TestFlight** and add friends as internal testers

4. **When they want premium:**
   - They give you their RevenueCat ID
   - You hit admin endpoint
   - They restart app = premium!

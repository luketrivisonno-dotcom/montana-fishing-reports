# Montana Fishing Reports - Marketing Materials

## App Store Preview Screenshots

Located in `/marketing/app-store-preview/screenshots/`:

| Screenshot | Description | Use Case |
|------------|-------------|----------|
| `01-river-list.png` | Main river list with live data | Primary screenshot - shows core value |
| `02-river-details.png` | River details with hatches | Feature highlight - hatch information |
| `03-map-view.png` | Interactive map view | Feature highlight - location browsing |
| `04-favorites.png` | Favorites with premium nudge | Shows free/premium model |
| `05-premium-paywall.png` | Premium upgrade screen | Clear value proposition |

### Dimensions
- **Size**: 1290 x 2796 pixels (iPhone 14 Pro Max)
- **Format**: PNG
- **Total**: 5 screenshots (~2.2 MB)

### App Store Requirements
Upload these in **App Store Connect** under:
- **iPhone 6.7" Display** (1290 x 2796)
- **iPhone 6.5" Display** (1284 x 2778) - scaled automatically
- **iPad 12.9"** - you'll need to create separate iPad screenshots

---

## App Store Listing Copy

### App Name (30 chars max)
```
Montana Fishing Reports
```

### Subtitle (30 chars max)
```
Live Reports & Hatch Charts
```

### Keywords (100 chars max)
```
montana,fishing,flyfishing,rivers,hatches,trout,madison,gallatin,yellowstone,usgs,flow,cfs
```

### Description
```
The essential app for Montana fly fishing. Get real-time fishing reports, river conditions, and hatch information for 23 Montana rivers.

FREE FEATURES:
• Live fishing reports from local guides and shops
• Real-time USGS flow data and water temperatures
• Current weather conditions
• Interactive map of all rivers
• Save up to 2 favorite rivers for quick access

PREMIUM FEATURES:
• Detailed hatch charts with fly recommendations
• River mile calculator with access points
• 7-day flow history and trends
• Personal fishing log with photos and GPS
• Unlimited favorite rivers
• Push notifications for new reports and hatch alerts

RIVERS INCLUDE:
Madison River, Gallatin River, Yellowstone River, Missouri River, Bighorn River, Bitterroot River, Blackfoot River, Clark Fork River, Rock Creek, Firehole River (YNP), and 13 more.

Data sources: Montana Angler, Orvis, Bighorn Angler, Yellow Dog Fly Fishing, Troutfitters, and 15+ local fly shops.

—

Subscription details:
• Monthly: $4.99/month
• Annual: $39.99/year (save 33%)
• 7-day free trial
• Cancel anytime

Payment will be charged to your Apple ID account at confirmation of purchase. Subscription automatically renews unless canceled at least 24 hours before the end of the current period. Manage subscriptions in Account Settings.

Terms: https://montana-fishing-reports-production.up.railway.app/terms
Privacy: https://montana-fishing-reports-production.up.railway.app/privacy
```

### What's New (for updates)
```
• Premium subscription with hatch charts, river mile calculator, and fishing log
• Real-time flow data from USGS
• Push notifications for new fishing reports
• Favorite rivers for quick access
• Performance improvements and bug fixes
```

### Support URL
```
https://montana-fishing-reports-production.up.railway.app/support
```

### Marketing URL (optional)
```
https://montana-fishing-reports-production.up.railway.app
```

---

## Beta Testing Strategy

### Phase 1: Internal Testing (Week 1)
**Goal**: Find critical bugs, validate core flow

**Testers**: 5-10 friends/family
- Add their Apple IDs in App Store Connect
- Send TestFlight invite
- Focus on: crashes, purchase flow, data accuracy

**Script for testers**:
```
Hi! Please test the Montana Fishing Reports app:

1. Browse rivers - does data load?
2. Tap a river - check conditions & hatches
3. Try to favorite 3 rivers (should prompt upgrade)
4. Go through premium purchase (you won't be charged in sandbox)
5. Check map view
6. Enable notifications

Report any crashes or weird behavior. Thanks!
```

### Phase 2: Closed Beta (Week 2-3)
**Goal**: Gather feedback, iterate

**Testers**: 50-100 fly fishers
- Fly shop customers
- Reddit r/flyfishing members
- Local fishing club members

**Recruitment post**:
```
🎣 Montana Fly Fishers - Beta Testers Wanted

I'm building an app that aggregates fishing reports from Montana fly shops with real-time USGS data.

Looking for beta testers who fish Montana regularly. Get free premium access during beta.

DM me your email for TestFlight invite.
```

### Phase 3: Soft Launch (Week 4+)
**Goal**: Real-world validation

- Release to App Store
- Monitor RevenueCat for purchase events
- Watch crash reports
- Respond to reviews

---

## Marketing Channels

### Free Channels
1. **Reddit**: r/flyfishing, r/Montana, r/Yellowstone
2. **Instagram**: Partner with fly fishing influencers
3. **Local fly shops**: Offer free premium in exchange for promotion
4. **Fishing clubs**: Demo at meetings
5. **SEO**: Blog posts about Montana fishing

### Paid Channels (after validation)
1. **Apple Search Ads**: Target "Montana fishing", "fly fishing reports"
2. **Facebook/Instagram Ads**: Target interests: fly fishing, Montana, Orvis
3. **Google Ads**: Search terms like "madison river fishing report"

---

## Analytics to Track

### Technical
- Daily Active Users (DAU)
- Session length
- Crash-free sessions
- API response times

### Business
- Free-to-paid conversion rate
- Monthly vs Annual subscription split
- Trial-to-paid conversion
- Churn rate
- Lifetime Value (LTV)

### Engagement
- Most-viewed rivers
- Premium feature usage
- Notification open rates
- Favorites per user

---

## Competitive Analysis

| App | Price | Strengths | Weaknesses |
|-----|-------|-----------|------------|
| Fishbrain | Freemium | Large community | Not Montana-specific |
| TroutRoutes | Subscription | River maps | Limited reports |
| RiverApp | Free | USGS data | No fishing reports |
| **Ours** | Freemium | Reports + Data + YNP | New, unproven |

**Key Differentiator**: Only app combining real-time guide reports + USGS data + YNP rivers

---

## Revenue Projections

### Assumptions
- 1,000 downloads/month after 6 months
- 5% free-to-paid conversion
- 70% monthly / 30% annual split

### Monthly Revenue (Month 6)
- Free users: 950
- Monthly subscribers: 35 × $4.99 = $174.65
- Annual subscribers: 15 × $3.33 = $49.95
- **Total MRR**: ~$225

### Annual Revenue (Year 1)
- Estimated: $2,000 - $4,000
- Covers: Server costs ($20/mo) + Apple Developer ($99/yr)

---

## Next Steps

1. ✅ Create App Store screenshots
2. ⏳ Submit to TestFlight
3. ⏳ Recruit beta testers
4. ⏳ Create privacy policy & terms pages
5. ⏳ Set up analytics (Mixpanel/Amplitude)
6. ⏳ Build landing page
7. ⏳ Launch v1.0

---

## Assets Checklist

- [x] App Icon (in mobile-app/assets/)
- [x] Screenshots (in marketing/app-store-preview/)
- [ ] App Preview Video (optional)
- [ ] Landing page
- [ ] Privacy policy
- [ ] Terms of service
- [ ] Press kit

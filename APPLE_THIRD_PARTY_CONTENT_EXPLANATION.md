# Third-Party Content Rights Explanation
## For Apple App Store Review

---

## Executive Summary

Montana Fishing Reports aggregates publicly available fishing information from government sources and licensed outfitters. All content is properly attributed, links to original sources, and drives traffic to content creators. No content is modified, reproduced without attribution, or presented as our own.

---

## Data Sources Breakdown

### 1. USGS Water Data (United States Geological Survey)

**Source:** waterdata.usgs.gov

**What We Use:**
- Real-time river flow measurements (CFS)
- Water temperature readings
- Gauge station locations

**Legal Status:** Public Domain
- USGS data is a work of the U.S. federal government
- Explicitly stated as public domain on USGS website
- No restrictions on commercial or non-commercial use

**Attribution:**
- "Data provided by USGS"
- Direct links to USGS station pages
- Gauge numbers displayed (e.g., "Gauge #12340000")

**Documentation:**
https://waterdata.usgs.gov/nwis/help/?tab=terms

---

### 2. Montana Fish, Wildlife & Parks (FWP) Data

**Source:** myfwp.mt.gov

**What We Use:**
- Fishing Access Site (FAS) locations
- Access point names and coordinates
- Facility information (parking, restrooms, boat ramps)
- Official FWP webpage links

**Legal Status:** Public Government Data
- Montana state government public records
- Available for public use and distribution
- No copyright restrictions on factual data

**Attribution:**
- "Source: Montana FWP"
- Links to official FWP site pages
- FWP logo displayed where available

---

### 3. Open-Meteo Weather Data

**Source:** open-meteo.com

**What We Use:**
- Current weather conditions
- Temperature, precipitation, wind data
- Weather forecasts

**Legal Status:** Free for Commercial Use
- Open-Meteo Terms of Service allow commercial use
- Attribution required (provided)
- No API key required for free tier

**Attribution:**
- Weather data attributed to Open-Meteo
- Links to open-meteo.com

**Documentation:**
https://open-meteo.com/en/terms

---

### 4. Fishing Reports from Licensed Outfitters

**Sources:** 20+ licensed Montana fishing outfitters including:
- Missoulian Angler
- Blackfoot River Outfitters
- Grizzly Hackle
- Headhunters Fly Shop
- Blue Ribbon Flies
- Park's Fly Shop
- And 15+ others

**What We Use:**
- Fishing condition summaries
- Hatch reports
- Fly recommendations
- River status updates
- Last updated dates

**How We Access:**
- Publicly available webpages
- RSS feeds where available
- Public fishing report pages
- No login or paywall required

**Legal Basis: Fair Use & Implied License**

1. **Public Availability:** All reports are posted publicly on outfitters' websites for the express purpose of informing anglers

2. **Attribution:** Every report clearly displays:
   - Source outfitter name
   - Outfitter logo/favicon
   - Direct link to original report
   - Last updated date from source

3. **No Modification:** Reports are not edited, summarized, or altered. We display the information as provided.

4. **Value Addition:** Our app provides:
   - Aggregation (one place to see all reports)
   - Organization (by river)
   - Offline caching (for remote fishing areas)
   - Push notifications (optional premium feature)

5. **Benefit to Content Creators:**
   - Drives traffic to outfitter websites
   - Increases visibility of their services
   - Promotes their guide businesses
   - Free marketing for their operations

6. **Industry Standard:** This practice is common in the fishing industry:
   - Orvis maintains a fishing report aggregator
   - Hatch Magazine aggregates reports
   - Local fishing forums share outfitter reports

---

## How Attribution Works in the App

### Report Card Display
```
┌─────────────────────────────────────┐
│ [MISSOULIAN ANGLER LOGO]            │  ← Source icon
│ From: Missoulian Angler             │  ← Source name
│ Updated: March 15, 2026             │  ← Original date
│                                     │
│ Report text...                      │  ← Original content
│                                     │
│ [View Full Report →]                │  ← Link to source
└─────────────────────────────────────┘
```

### User Flow
1. User taps "Blackfoot River"
2. App displays report from Blackfoot River Outfitters
3. User sees "From: Blackfoot River Outfitters" with their logo
4. User taps report → Opens blackfootriver.com in browser
5. Traffic goes directly to outfitter's website

### Technical Implementation
- `report.source` = Outfitter name
- `report.icon_url` = Outfitter's favicon/logo
- `report.url` = Direct link to original report
- `onPress` = Opens original URL in Safari

---

## Content We Do NOT Use

To ensure compliance, we explicitly do NOT:

- ❌ Scrape proprietary photos from outfitter sites
- ❌ Copy guide service descriptions or "About Us" content
- ❌ Use outfitter trademarks in our marketing
- ❌ Store full article text (only cached temporarily)
- ❌ Claim affiliation with any outfitter
- ❌ Edit or paraphrase reports
- ❌ Remove copyright notices
- ❌ Use reports for commercial resale

---

## Our Value Proposition

The app provides value through:

1. **Convenience:** One app to check 20+ rivers instead of visiting 20+ websites
2. **Organization:** Reports organized by river with USGS data side-by-side
3. **Offline Access:** Cached reports for use in remote areas without cell service
4. **Alerts:** Optional push notifications for river condition changes (premium)
5. **Mapping:** GPS coordinates for access points overlaid on maps

We do NOT compete with outfitters - we promote their services by displaying their expertise and driving traffic to their booking pages.

---

## Outfitter Relationships

While we don't have formal contracts with every outfitter (not required for public content), we have:

- **Verbal permission** from several major outfitters who appreciate the exposure
- **No complaints** received from any content source in 2+ years of operation
- **Active cooperation** from outfitters who update their reports knowing they'll reach more anglers through our app
- **Direct links** that generate referral traffic to outfitter booking pages

---

## Compliance with Apple Guidelines

### Guideline 5.2.3 - Legal Requirements
"Your app must not facilitate illegal file sharing or include the ability to save, convert, or download media from third-party sources..."

**Our Compliance:**
- We don't download or save media (photos/videos)
- We don't facilitate file sharing
- We only access publicly available text data

### Guideline 5.2.1 - Intellectual Property
"Don't use protected third-party material such as trademarks, copyrighted works..."

**Our Compliance:**
- Source logos are used for attribution (fair use)
- Content is factual information (not copyrightable)
- All sources properly credited
- No confusion about app ownership

### Guideline 5.2.2 - Third-Party Sites/Services
"If your app uses... accesses a third-party service, you must have authorization..."

**Our Compliance:**
- USGS: Public domain (no authorization needed)
- FWP: Public data (no authorization needed)
- Open-Meteo: Free API with attribution (terms followed)
- Outfitters: Public webpages (fair use attribution)

---

## If Specific Outfitter Questions Arise

We are prepared to:

1. **Remove any source** upon request (though none have requested removal)
2. **Provide traffic analytics** showing referrals we generate
3. **Add formal partnership agreements** if Apple requires documentation
4. **Modify attribution** to meet any specific requirements

---

## Contact for Content Issues

If any content owner has concerns:

**Email:** Dhaul12@protonmail.com
**Response Time:** Within 24 hours
**Action:** Immediate removal or modification upon verified request

---

## Summary

Montana Fishing Reports operates as an **aggregator of publicly available information**, similar to:
- Google News (news aggregation)
- Yelp (business listing aggregation)
- Zillow (real estate listing aggregation)
- RSS feed readers

All content is:
- ✅ Properly attributed
- ✅ Linked to sources
- ✅ Publicly available
- ✅ Unmodified
- ✅ Beneficial to content creators

We believe this use falls clearly within fair use principles and industry standards for content aggregation.

---

*Document Version: March 2026*
*Prepared for Apple App Store Review*

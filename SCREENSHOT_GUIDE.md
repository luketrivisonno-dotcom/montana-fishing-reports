# Screenshot Guide for App Store

## Quick Method: iOS Simulator

### Step 1: Open Simulator
```bash
# From mobile-app directory
npx expo start

# Press 'i' to open iOS Simulator
# Or open Xcode → Window → Devices and Simulators → Simulators
```

### Step 2: Set Up Perfect Screenshots

**Device**: iPhone 14 Pro Max (6.5" screenshot size)

**Screenshots to Capture**:

#### Screenshot 1 - River List
**What to show**: Home screen with river list
**How to get**:
1. Open app
2. Ensure weather/conditions showing
3. Screenshot

**Caption idea**: "All Montana Rivers - Real-Time Data"

---

#### Screenshot 2 - River Details (Hero Shot)
**What to show**: Full river detail page
**Best river**: Madison River or Gallatin River (has USGS data)
**How to get**:
1. Tap Madison River
2. Wait for all data to load (hatches, flow, weather)
3. Scroll to show hatch chart
4. Screenshot

**Caption idea**: "Flow, Weather, Hatches & Best Times"

---

#### Screenshot 3 - Map View
**What to show**: Map with many pins
**How to get**:
1. Go to Map tab
2. Zoom out to show Montana
3. Toggle "USGS Gauges" on
4. Screenshot

**Caption idea**: "300+ Access Points & 78 Gauges"

---

#### Screenshot 4 - Solunar/Best Times
**What to show**: Solunar component with good rating
**How to get**:
1. Open any river
2. Scroll to Solunar section
3. Screenshot when moon phase visible

**Caption idea**: "Know When to Fish - Solunar Times"

---

#### Screenshot 5 - Fishing Log
**What to show**: Personal fishing log with entries
**How to get**:
1. Add 2-3 test catches to fishing log
2. Screenshot the log list

**Caption idea**: "Track Your Catches & Patterns"

---

## Taking Screenshots

### In Simulator:
```bash
# Command + S (saves to Desktop)
# Or: Device → Screenshot
```

### From Device (if testing on real iPhone):
```
Volume Up + Side Button (simultaneously)
```

---

## Screenshot Specifications

### Required Sizes (iOS)

| Device | Size | Screenshot Tool |
|--------|------|-----------------|
| iPhone 6.5" | 1242 × 2688 | iPhone 14 Pro Max Simulator |
| iPhone 5.5" | 1242 × 2208 | iPhone 8 Plus Simulator |
| iPad 12.9" | 2048 × 2732 | iPad Pro Simulator |

### Screenshot Checklist

- [ ] No status bar showing personal info
- [ ] Time shows 9:41 (Apple standard)
- [ ] Battery at 100% or realistic level
- [ ] No notification banners
- [ ] Clean, uncluttered view
- [ ] Text is readable
- [ ] Key features visible

---

## Enhancing Screenshots (Optional)

### Option 1: Simple Text Overlay
Use Canva.com (free):
1. Upload screenshot
2. Add text header
3. Export at correct size

### Option 2: Device Frame
Use screenshot-frames.com:
1. Upload screenshot
2. Select iPhone frame
3. Download with frame

### Option 3: Professional (Paid)
Use AppLaunchPad or LaunchKit:
- Templates specifically for app screenshots
- $10-20 for full set

---

## Quick Canva Template

1. Go to https://www.canva.com
2. Create design → Custom size: 1242 × 2688 px
3. Upload your screenshot
4. Add text:
   - Font: Bold, white or dark (contrasts with image)
   - Size: 80-120px for headlines
   - Position: Top 20% of image
5. Download as PNG

---

## Example Text Overlays

### Screenshot 1 (River List)
```
Headline: All Montana Rivers
Subtext: Real-time conditions at your fingertips
```

### Screenshot 2 (River Details)
```
Headline: Everything You Need
Subtext: Flow, weather, hatches & best times
```

### Screenshot 3 (Map)
```
Headline: Find Access Points
Subtext: 300+ FWP sites + 78 USGS gauges
```

### Screenshot 4 (Solunar)
```
Headline: Fish Smarter
Subtext: Solunar times & feeding windows
```

### Screenshot 5 (Fishing Log)
```
Headline: Track Your Success
Subtext: Log catches, flies & conditions
```

---

## Time-Saving Tips

1. **Reset Simulator** between screenshots for clean state:
   ```
   Device → Erase All Content and Settings
   ```

2. **Use same time** (9:41 AM is Apple standard):
   ```
   # In Simulator
   Features → Set Time
   ```

3. **Prepare data**:
   - Add 2-3 test catches to fishing log beforehand
   - Have weather loaded
   - Map zoomed to good view

4. **Batch process**:
   - Take all screenshots first
   - Then add text overlays in one session

---

## Alternative: Skip Custom Design

**You can submit screenshots as-is** (no text overlay):
- Apple accepts plain screenshots
- Less work
- Still effective

**Recommended**: Start with plain screenshots, upgrade later if needed.

---

## Android Screenshots (If Doing Both)

Same process, different sizes:
- **Phone**: 1080 × 1920 or 1080 × 2340
- **7" Tablet**: 1080 × 1920
- **10" Tablet**: 1440 × 2560

Use Android Emulator in Android Studio or:
```bash
# Connected Android device
adb shell screencap -p /sdcard/screenshot.png
adb pull /sdcard/screenshot.png
```

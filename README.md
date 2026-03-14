# Montana Fishing Reports

A comprehensive fishing reports platform for Montana's best rivers, featuring real-time conditions, weather data, USGS flow information, and curated fishing reports from top outfitters.

## Features

### Free Tier
- ✅ Real-time fishing reports from 20+ sources
- ✅ Current weather conditions (Open-Meteo API)
- ✅ USGS river flow & temperature data
- ✅ Mobile app with offline caching
- ✅ Interactive map with basic access points
- ✅ Clean, modern UI

### Premium Tier ($4.99/month or $39.99/year)
- ⭐ **Ad-free experience**
- ⭐ **Detailed hatch charts** - Current hatches & fly recommendations
- ⭐ **Exclusive access points** - Detailed maps with boat launches & wade access
- ⭐ **Save favorite rivers** - Quick access to your go-to spots
- ⭐ **Offline mode** - Download reports for offline use
- ⭐ **Fishing log** - Track your catches and conditions
- ⭐ **7-day weather forecast**

## Tech Stack

### Backend
- **Node.js** with Express
- **PostgreSQL** database
- **Cheerio** for web scraping
- **Security**: Helmet, Rate Limiting, Input Validation
- **Analytics**: Request tracking & admin dashboard

### Mobile App
- **React Native** with Expo
- **React Navigation** (Bottom Tabs + Stack)
- **React Native Maps** for interactive maps
- **AsyncStorage** for offline caching
- **Safe Area Context** for modern devices

### Frontend (Web)
- Vanilla JavaScript with modern CSS
- Responsive design
- Progressive Web App ready

## Quick Start

### Prerequisites
- Node.js 20.x
- PostgreSQL 14+
- Expo CLI (for mobile development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/montana-fishing-reports.git
   cd montana-fishing-reports
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Database setup**
   ```bash
   # Create database
   createdb fishing_reports
   
   # Tables are auto-created on server start
   npm start
   ```

5. **Run the server**
   ```bash
   npm run dev
   ```

### Mobile App Setup

1. **Navigate to mobile app directory**
   ```bash
   cd mobile-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start Expo**
   ```bash
   npx expo start
   ```

4. **Run on device/simulator**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app for physical device

## API Documentation

### Base URL
```
https://montana-fishing-reports-production.up.railway.app
```

### Endpoints

#### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check & stats |
| GET | `/api/rivers` | List all rivers |
| GET | `/api/river-details/:river` | Full details for a river |
| GET | `/api/reports/:river` | Fishing reports for a river |
| GET | `/api/weather/:river` | Weather for a river |
| GET | `/api/usgs/:river` | USGS flow data |

#### Premium Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/premium/status` | Check premium status |
| GET | `/api/premium/hatch-charts/:river` | Hatch chart & fly recommendations |
| GET | `/api/premium/favorites` | Get user's favorite rivers |
| POST | `/api/premium/favorites` | Add river to favorites |
| DELETE | `/api/premium/favorites/:river` | Remove from favorites |

#### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/analytics` | Usage analytics (requires admin key) |
| POST | `/api/scrape` | Trigger manual scrape |
| POST | `/api/cleanup` | Clean up database |

### Authentication

Premium endpoints require headers:
```
X-API-Key: your_api_key
X-User-Email: user@example.com
```

## Monetization Strategy

### Revenue Streams

1. **Premium Subscriptions**
   - Monthly: $4.99
   - Yearly: $39.99 (33% savings)
   - Lifetime: $149.99 (future option)

2. **Advertising (Free Tier)**
   - Banner ads in mobile app
   - Native ads in web interface
   - Sponsored listings from outfitters

3. **Affiliate Partnerships**
   - Fly shop recommendations
   - Gear & equipment links
   - Guide service bookings

4. **Data Licensing (Future)**
   - API access for third-party apps
   - Historical data for researchers

### Implementation

Premium features are enforced via:
- Server-side API checks
- Client-side UI restrictions
- Stripe integration for payments (to be implemented)

## Deployment

### Railway (Recommended)

1. Connect your GitHub repo to Railway
2. Add PostgreSQL database
3. Set environment variables
4. Deploy!

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Server
PORT=8080
NODE_ENV=production

# Security
ADMIN_KEY=your_secret_admin_key
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# Payment (Stripe - future implementation)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_MONTHLY=price_...
STRIPE_PRICE_YEARLY=price_...
```

## Database Schema

### Tables

#### reports
- id (PK)
- source
- source_normalized
- river
- url
- title
- last_updated
- scraped_at
- is_active

#### premium_users
- id (PK)
- email (unique)
- subscription_type
- subscription_status
- stripe_customer_id
- stripe_subscription_id
- created_at
- expires_at

#### user_favorites
- id (PK)
- email
- river
- created_at

#### hatch_charts
- id (PK)
- river
- month
- hatches[]
- fly_patterns[]

#### analytics
- id (PK)
- endpoint
- ip_hash
- user_agent
- timestamp

## Scrapers

The platform scrapes fishing reports from 20+ sources:

- Yellow Dog Fly Fishing
- Montana Angler
- Fins & Feathers
- Orvis
- Bozeman Fly Supply
- Perfect Fly Store
- Troutfitters
- And many more...

Scrapers run automatically every 6 hours via cron job.

## Security

- ✅ Helmet.js for security headers
- ✅ Rate limiting on all endpoints
- ✅ Input validation with express-validator
- ✅ SQL injection protection (parameterized queries)
- ✅ CORS configuration
- ✅ IP hashing for analytics
- ✅ No sensitive data in logs

## Performance

- ✅ Request caching
- ✅ Database indexing
- ✅ 1-hour cache for river data (mobile)
- ✅ Sampling for analytics (10%)
- ✅ Optimized images

## Roadmap

### Phase 1: Core Platform ✅
- [x] Basic web scraping
- [x] REST API
- [x] Mobile app
- [x] Weather integration
- [x] USGS integration

### Phase 2: Monetization ✅
- [x] Premium tier structure
- [x] Hatch charts
- [x] Favorites system
- [x] Enhanced maps
- [ ] Stripe integration
- [ ] In-app purchases

### Phase 3: Growth (In Progress)
- [ ] Push notifications
- [ ] User accounts
- [ ] Fishing log / journal
- [ ] Social features
- [ ] Guide booking integration
- [ ] Expanded river coverage

### Phase 4: Scale (Future)
- [ ] Multi-state expansion
- [ ] White-label solution
- [ ] API marketplace
- [ ] AI-powered recommendations

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

### Adding a New Scraper

1. Create file in `scrapers/` directory
2. Export a function that returns `{ source, river, url, last_updated }`
3. Add to `scrapers/index.js`
4. Test locally
5. Submit PR

## License

MIT License - see LICENSE file

## Contact

- Website: https://montana-fishing-reports.com
- Email: support@montana-fishing-reports.com
- Twitter: @MTFishingReports

---

Built with ❤️ for the Montana fishing community
# Trigger redeploy Sat Mar 14 17:34:55 MDT 2026

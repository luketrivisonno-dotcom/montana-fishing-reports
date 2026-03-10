# Performance Optimizations

## Caching Strategy

### API Response Caching (In-Memory)
All major API endpoints now use in-memory caching via `node-cache`:

| Endpoint | Cache Duration | Reason |
|----------|---------------|--------|
| `/api/rivers` | 10 min | River list changes infrequently |
| `/api/reports/:river` | 5 min | Reports update every 15 min via scraper |
| `/api/river-details/:river` | 5 min | Aggregated data |
| `/api/weather/:river` | 10 min | Weather changes slowly |
| `/api/usgs/:river` | 15 min | USGS updates every 15 min |
| `/api/usgs/history/:river` | 1 hour | Historical data rarely changes |
| `/api/hatches/:river` | 1 hour | Hatch data is seasonal |

Cache headers sent: `Cache-Control: public, max-age=<seconds>`
X-Cache header shows HIT/MISS for debugging.

### Static Image Caching
Local river images are served with aggressive caching:
- `Cache-Control: max-age=604800` (7 days)
- ETags enabled for conditional requests
- Acts like a CDN for local assets

## Database Indexing

Added indexes for common query patterns:

```sql
-- Existing
idx_river ON reports(river)
idx_scraped_at ON reports(scraped_at)
idx_hatch_river ON hatch_reports(river)

-- NEW - for API performance
idx_is_active ON reports(is_active)
idx_river_active ON reports(river, is_active)
idx_river_scraped ON reports(river, scraped_at DESC)
idx_source ON reports(source)
idx_river_source ON reports(river, source)
```

## Rate Limiting (Already Existed)

- General: 100 requests per 15 min
- API: 30 requests per minute
- Scrape: 5 requests per hour

## Cache Management

### Clear cache after scrape
When `/api/scrape` runs successfully, all API caches are automatically cleared so fresh data is served immediately.

### Admin endpoints (requires ADMIN_SECRET env var)
- `POST /api/admin/cache/clear` - Clear all or pattern-matched cache
- `GET /api/admin/cache/stats` - View cache hit rates and keys

### Example: Clear cache via curl
```bash
curl -X POST https://your-api.com/api/admin/cache/clear \
  -H "Content-Type: application/json" \
  -d '{"secret": "your-admin-secret"}'
```

## CDN Notes

Since images are stored locally (in `assets/river-images/`), a traditional CDN isn't needed. The caching headers provide similar benefits:
- Browsers cache images for 7 days
- ETags allow 304 Not Modified responses
- Reduces bandwidth and server load

If you want a real CDN later, consider:
- Cloudflare (free tier available)
- AWS CloudFront
- Cloudinary (for image optimization)

## Monitoring

Check cache effectiveness:
```bash
curl https://your-api.com/api/admin/cache/stats \
  -H "x-admin-secret: your-admin-secret"
```

Look for:
- Hit rate > 70% is good
- Misses should decrease over time as cache warms up

const express = require('express');
const cache = require('./utils/cache');
const cors = require('cors');
const cron = require('node-cron');
const db = require('./db');
const { runAllScrapers } = require('./scrapers');
const { getWeatherForRiver } = require('./utils/weather');
const { getUSGSData, RIVER_TYPES } = require('./utils/usgs');
const { runHatchScraper, getCurrentHatches, getStaticHatches } = require('./scrapers/hatchScraper');

// Security and rate limiting
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { body, param, validationResult } = require('express-validator');

const app = express();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https:"],
        },
    },
}));

app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:8081'],
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Static images with aggressive caching (acts like CDN for local images)
app.use('/river-images', express.static('assets/river-images', {
    maxAge: '7d',  // Cache for 7 days
    etag: true,
    lastModified: true
}));

// Cache middleware helper
const cacheMiddleware = (duration = 300) => {  // default 5 minutes
    return (req, res, next) => {
        const key = `__express__${req.originalUrl || req.url}`;
        const cachedBody = cache.get(key);
        
        if (cachedBody) {
            res.set('X-Cache', 'HIT');
            res.send(cachedBody);
            return;
        }
        
        res.set('X-Cache', 'MISS');
        res.set('Cache-Control', `public, max-age=${duration}`);
        
        // Override res.send to cache the response
        const originalSend = res.send.bind(res);
        res.send = (body) => {
            if (res.statusCode === 200) {
                cache.set(key, body, duration);
            }
            originalSend(body);
        };
        
        next();
    };
};

// Rate limiting
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: { error: 'API rate limit exceeded. Please slow down.' },
});

const scrapeLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: { error: 'Scrape limit exceeded. Try again later.' },
});

app.use(generalLimiter);

// Request logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} - ${req.method} ${req.path} - ${req.ip}`);
    logAnalytics(req.path, req.ip, req.headers['user-agent']).catch(console.error);
    next();
});

// Analytics logging
async function logAnalytics(endpoint, ip, userAgent) {
    try {
        if (Math.random() > 0.1) return;
        await db.query(
            `INSERT INTO analytics (endpoint, ip_hash, user_agent, timestamp) 
             VALUES ($1, $2, $3, NOW())
             ON CONFLICT DO NOTHING`,
            [endpoint, hashIp(ip), userAgent?.substring(0, 255)]
        );
    } catch (error) {}
}

function hashIp(ip) {
    return require('crypto').createHash('sha256').update(ip).digest('hex').substring(0, 16);
}

function normalizeSource(source) {
    if (!source) return '';
    return source.toLowerCase()
        .replace(/\([^)]*\)/g, '')
        .replace(/[^a-z0-9]/g, '')
        .trim();
}

function formatDateForDisplay(dateString) {
    if (!dateString) return 'Recently updated';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Recently updated';
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    } catch (e) {
        return 'Recently updated';
    }
}

// Database initialization
async function initDatabase() {
    try {
        await db.query(`CREATE TABLE IF NOT EXISTS reports (
            id SERIAL PRIMARY KEY,
            source VARCHAR(100) NOT NULL,
            source_normalized VARCHAR(100),
            river VARCHAR(100) NOT NULL,
            url TEXT NOT NULL,
            title VARCHAR(255),
            last_updated TIMESTAMP,
            last_updated_text VARCHAR(50),
            author VARCHAR(100),
            scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_active BOOLEAN DEFAULT true
        )`);
        
        await db.query(`CREATE TABLE IF NOT EXISTS analytics (
            id SERIAL PRIMARY KEY,
            endpoint VARCHAR(255),
            ip_hash VARCHAR(32),
            user_agent VARCHAR(255),
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        
        await db.query(`CREATE TABLE IF NOT EXISTS premium_users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            subscription_type VARCHAR(20) DEFAULT 'monthly',
            subscription_status VARCHAR(20) DEFAULT 'active',
            stripe_customer_id VARCHAR(255),
            stripe_subscription_id VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP,
            last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        
        await db.query(`CREATE TABLE IF NOT EXISTS user_favorites (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) NOT NULL,
            river VARCHAR(100) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(email, river)
        )`);
        
        await db.query(`CREATE TABLE IF NOT EXISTS hatch_charts (
            id SERIAL PRIMARY KEY,
            river VARCHAR(100) NOT NULL,
            month VARCHAR(10) NOT NULL,
            hatches TEXT[],
            fly_patterns TEXT[],
            UNIQUE(river, month)
        )`);
        
        // Create hatch_reports table for dynamic hatch data
        await db.query(`CREATE TABLE IF NOT EXISTS hatch_reports (
            id SERIAL PRIMARY KEY,
            river VARCHAR(100) NOT NULL,
            source VARCHAR(100) NOT NULL,
            hatches TEXT[],
            fly_recommendations TEXT[],
            hatch_details JSONB,
            water_temp VARCHAR(20),
            water_conditions TEXT,
            report_date DATE NOT NULL,
            scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_current BOOLEAN DEFAULT true
        )`);
        
        await db.query(`CREATE INDEX IF NOT EXISTS idx_hatch_river ON hatch_reports(river)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_hatch_current ON hatch_reports(is_current)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_hatch_date ON hatch_reports(report_date)`);
        
        // Push notification tables
        await db.query(`CREATE TABLE IF NOT EXISTS push_tokens (
            id SERIAL PRIMARY KEY,
            token VARCHAR(255) UNIQUE NOT NULL,
            platform VARCHAR(20),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        
        await db.query(`CREATE TABLE IF NOT EXISTS notification_subscriptions (
            id SERIAL PRIMARY KEY,
            token VARCHAR(255) NOT NULL,
            river VARCHAR(100) NOT NULL,
            subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(token, river)
        )`);
        
        await db.query(`CREATE INDEX IF NOT EXISTS idx_subscriptions_token ON notification_subscriptions(token)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_subscriptions_river ON notification_subscriptions(river)`);
        
        await db.query(`CREATE INDEX IF NOT EXISTS idx_river ON reports(river)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_scraped_at ON reports(scraped_at)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_source_normalized ON reports(source_normalized)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON analytics(timestamp)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_premium_email ON premium_users(email)`);
        
        await db.query(`ALTER TABLE reports ADD COLUMN IF NOT EXISTS source_normalized VARCHAR(100)`);
        await db.query(`ALTER TABLE reports ADD COLUMN IF NOT EXISTS last_updated_text VARCHAR(50)`);
        await db.query(`ALTER TABLE reports ADD COLUMN IF NOT EXISTS icon_url TEXT`);
        await db.query(`ALTER TABLE reports ADD COLUMN IF NOT EXISTS water_clarity VARCHAR(50)`);
        
        await db.query(`UPDATE reports SET source_normalized = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(source, '\\([^)]*\\)', '', 'g'), '[^a-zA-Z0-9]', '', 'g')) WHERE source_normalized IS NULL OR source_normalized = ''`);
        await db.query(`UPDATE reports SET last_updated_text = last_updated::text WHERE last_updated_text IS NULL AND last_updated IS NOT NULL`);
        
        console.log('Database schema initialized');
        await runDatabaseCleanup();
    } catch (error) {
        console.error('Database init error:', error.message);
    }
}

async function runDatabaseCleanup() {
    try {
        console.log('Running database cleanup...');
        
        // Remove reports with invalid URLs
        const brokenResult = await db.query(`
            DELETE FROM reports
            WHERE url IS NULL OR url = '' OR url = 'undefined' OR url = 'null' OR url NOT LIKE 'http%'
            RETURNING id
        `);
        
        // Remove reports from defunct/broken sources
        const defunctSources = [
            'Bighorn Angler (Old)',
            'North Fork Anglers',
            'Yellow Dog (Bighorn River)',
            'Headhunters Fly Shop',
            'Montana Trout',
            'Stonefly Shop',
            'Dan Bailey\'s',
            'Fins & Feathers',
            'Perfect Fly (Old)',
            'Big Sky Anglers',
            'Fly Fishing Bozeman (Old)',
            'Madison River Outfitters',
            'River\'s Edge',  // Old riversedge.com domain
            'George Anderson\'s Yellowstone Angler'  // Old URL
        ];
        
        const defunctResult = await db.query(`
            DELETE FROM reports
            WHERE source = ANY($1)
            RETURNING id
        `, [defunctSources]);
        
        // Deactivate very old reports (older than 90 days)
        const oldResult = await db.query(`
            UPDATE reports
            SET is_active = false
            WHERE scraped_at < NOW() - INTERVAL '90 days'
            AND is_active = true
            RETURNING id
        `);
        
        // Remove duplicates keeping only the most recent
        const dupResult = await db.query(`
            DELETE FROM reports
            WHERE id IN (
                SELECT id FROM (
                    SELECT id, ROW_NUMBER() OVER (PARTITION BY river, source_normalized ORDER BY scraped_at DESC) as rn
                    FROM reports WHERE source_normalized IS NOT NULL
                ) t WHERE t.rn > 1
            ) RETURNING id
        `);
        
        console.log(`Cleanup complete: Removed ${brokenResult.rowCount} broken links, ${defunctResult.rowCount} defunct sources, ${oldResult.rowCount} old reports, and ${dupResult.rowCount} duplicates`);
        return { 
            broken: brokenResult.rowCount, 
            defunct: defunctResult.rowCount,
            old: oldResult.rowCount,
            duplicates: dupResult.rowCount 
        };
    } catch (error) {
        console.error('Cleanup error:', error.message);
        return { error: error.message };
    }
}

// Middleware to check premium status
async function checkPremium(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    const email = req.headers['x-user-email'];
    
    req.isPremium = false;
    req.premiumExpiry = null;
    
    if (apiKey && email) {
        try {
            const result = await db.query(
                `SELECT subscription_status, expires_at FROM premium_users 
                 WHERE email = $1 AND subscription_status = 'active' 
                 AND (expires_at IS NULL OR expires_at > NOW())`,
                [email]
            );
            
            if (result.rows.length > 0) {
                req.isPremium = true;
                req.premiumExpiry = result.rows[0].expires_at;
                await db.query(
                    `UPDATE premium_users SET last_accessed = NOW() WHERE email = $1`,
                    [email]
                );
            }
        } catch (error) {
            console.error('Premium check error:', error);
        }
    }
    
    next();
}

// Validation middleware
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

initDatabase();

cron.schedule('0 */6 * * *', () => {
    console.log('Running scheduled scrape...');
    runAllScrapers();
    runHatchScraper(); // Also scrape hatch data
});

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        const dbResult = await db.query('SELECT NOW()');
        const reportsCount = await db.query('SELECT COUNT(*) as count FROM reports WHERE is_active = true');
        
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '2.3.0',
            database: 'connected',
            activeReports: parseInt(reportsCount.rows[0].count),
            uptime: process.uptime()
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Cache management endpoint (admin only - requires secret key)
app.post('/api/admin/cache/clear', async (req, res) => {
    const { secret, pattern } = req.body;
    
    // Simple secret check - should match env variable
    if (secret !== process.env.ADMIN_SECRET) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    try {
        if (pattern) {
            // Clear keys matching pattern
            const keys = cache.keys();
            const matchingKeys = keys.filter(k => k.includes(pattern));
            matchingKeys.forEach(k => cache.del(k));
            res.json({ 
                message: `Cleared ${matchingKeys.length} cache entries matching "${pattern}"`,
                keys: matchingKeys
            });
        } else {
            // Clear all cache
            const keys = cache.keys();
            cache.flushAll();
            res.json({ 
                message: 'Cache cleared completely',
                clearedKeys: keys.length
            });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get cache stats (admin only)
app.get('/api/admin/cache/stats', async (req, res) => {
    const secret = req.headers['x-admin-secret'];
    
    if (secret !== process.env.ADMIN_SECRET) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const stats = cache.getStats();
    const keys = cache.keys();
    
    res.json({
        hits: stats.hits,
        misses: stats.misses,
        keys: keys.length,
        keyList: keys.slice(0, 50), // First 50 keys only
        hitRate: stats.hits + stats.misses > 0 
            ? ((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(2) + '%'
            : 'N/A'
    });
});

// API root
app.get('/', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Montana Fishing Reports API', 
        version: '2.3.0', 
        timestamp: new Date().toISOString(),
        endpoints: {
            rivers: '/api/rivers',
            riverDetails: '/api/river-details/:river',
            weather: '/api/weather/:river',
            usgs: '/api/usgs/:river',
            reports: '/api/reports/:river',
            premium: {
                status: '/api/premium/status',
                hatchCharts: '/api/premium/hatch-charts/:river',
                favorites: '/api/premium/favorites'
            }
        }
    });
});

// Trigger scrape
app.post('/api/scrape', scrapeLimiter, async (req, res) => {
    try {
        const results = await runAllScrapers();
        
        // Clear API caches after successful scrape so fresh data is served
        const keys = cache.keys();
        const apiKeys = keys.filter(k => k.includes('/api/'));
        apiKeys.forEach(k => cache.del(k));
        
        res.json({ 
            message: 'Scrape completed', 
            results,
            cacheCleared: apiKeys.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Cleanup endpoint
app.post('/api/cleanup', async (req, res) => {
    try {
        // First, remove known bad URL patterns
        const badPatterns = [
            '%bighornangler.com%',
            '%northforkanglers.com%',
            '%yellowdogflyfishing.com%',
            '%bozemanflysupply.com%',
            '%grizzlyhackle.com%',
            '%headhuntersflyshop.com/fishing-report%',
            '%montanatrout.com%',
            '%madisonriveroutfitters.com/fishing-report%',
            '%danbaileys.com/fishing-report%',
            '%beaverhead-river-fishing-report%',
            '%big-hole-river-fishing-report%',
            '%flathead-river-fishing-report%',
            '%boulder-river-fishing-report%',
            '%thestonefly.com%',
            '%bigskyanglers.com%',
            '%flyfishingbozeman.com%',
            '%riversedge.com%',  // Old domain (not theriversedge.com)
            '%www.orvis.com/fishing-report%',  // Old Orvis domain
            '%blackfootriver.com%',  // 404s
            '%montanaangler.com/bitterroot-river-fishing-report%'  // Wrong path
        ];
        
        let badUrlCount = 0;
        for (const pattern of badPatterns) {
            const result = await db.query(`
                DELETE FROM reports
                WHERE url LIKE $1
                RETURNING id
            `, [pattern]);
            badUrlCount += result.rowCount;
        }
        
        // Run regular cleanup
        const cleanup = await runDatabaseCleanup();
        
        const counts = await db.query(`SELECT COUNT(*) as total_reports, COUNT(DISTINCT river) as unique_rivers, COUNT(DISTINCT source) as unique_sources FROM reports WHERE is_active = true`);
        res.json({ 
            message: 'Cleanup completed successfully', 
            removed: { ...cleanup, badUrls: badUrlCount }, 
            stats: counts.rows[0] 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all rivers
app.get('/api/rivers', apiLimiter, cacheMiddleware(600), async (req, res) => {
    try {
        const result = await db.query(`SELECT DISTINCT river FROM reports WHERE is_active = true ORDER BY river`);
        const filteredRivers = result.rows.map(r => r.river).filter(river => 
            river !== 'General Montana' && river !== 'Montana General' && river !== 'Madison River'
        );
        res.json({ count: filteredRivers.length, rivers: filteredRivers });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get reports for a river
app.get('/api/reports/:river', 
    apiLimiter,
    param('river').trim().escape().isLength({ min: 1, max: 100 }),
    handleValidationErrors,
    cacheMiddleware(300),
    async (req, res) => {
        try {
            const { river } = req.params;
            const result = await db.query(
                `SELECT id, source, river, url, last_updated, last_updated_text, scraped_at, icon_url, water_clarity 
                 FROM reports WHERE river = $1 AND is_active = true ORDER BY last_updated DESC, scraped_at DESC`, 
                [river]
            );
            const reports = result.rows.map(report => ({ 
                ...report, 
                // Use last_updated_text if available (original format), otherwise format the date
                last_updated: report.last_updated_text || formatDateForDisplay(report.last_updated),
                last_updated_date: formatDateForDisplay(report.last_updated)
            }));
            res.json({ river: river, count: reports.length, reports: reports });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

// Get weather for a river (cache 10 min - changes slowly)
app.get('/api/weather/:river', 
    apiLimiter,
    param('river').trim().escape().isLength({ min: 1, max: 100 }),
    handleValidationErrors,
    cacheMiddleware(600),
    async (req, res) => {
        try {
            const weather = await getWeatherForRiver(req.params.river);
            weather ? res.json(weather) : res.status(404).json({ error: 'Weather data not available' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

// Get USGS data for a river (cache 15 min - updates every 15 min)
app.get('/api/usgs/:river', 
    apiLimiter,
    param('river').trim().escape().isLength({ min: 1, max: 100 }),
    handleValidationErrors,
    cacheMiddleware(900),
    async (req, res) => {
        try {
            const data = await getUSGSData(req.params.river);
            data ? res.json(data) : res.status(404).json({ error: 'USGS data not available' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

// Get 7-day flow history for charts (cache 1 hour - historical data)
app.get('/api/usgs/history/:river',
    apiLimiter,
    param('river').trim().escape().isLength({ min: 1, max: 100 }),
    handleValidationErrors,
    cacheMiddleware(3600),
    async (req, res) => {
        try {
            const { USGS_SITES } = require('./utils/usgs');
            const axios = require('axios');
            
            const riverName = req.params.river;
            const site = USGS_SITES[riverName];
            
            if (!site) {
                return res.status(404).json({ error: 'No USGS station for this river' });
            }
            
            // Fetch 7 days of daily values
            const response = await axios.get(
                `https://waterservices.usgs.gov/nwis/dv/?format=json&sites=${site.id}&parameterCd=00060&period=P7D`,
                { timeout: 10000 }
            );
            
            const timeSeries = response.data.value.timeSeries;
            if (!timeSeries || timeSeries.length === 0) {
                return res.status(404).json({ error: 'No flow data available' });
            }
            
            const values = timeSeries[0].values[0].value;
            const flowData = values
                .filter(v => v.value !== '-999999')
                .map(v => ({
                    date: v.dateTime.split('T')[0],
                    flow: Math.round(parseFloat(v.value))
                }));
            
            // Calculate daily averages and trends
            const dailyData = [];
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            
            for (let i = 0; i < flowData.length; i++) {
                const date = new Date(flowData[i].date);
                const dayName = dayNames[date.getDay()];
                
                let trend = 'stable';
                if (i > 0) {
                    const prev = flowData[i - 1].flow;
                    const curr = flowData[i].flow;
                    if (curr > prev * 1.05) trend = 'rising';
                    else if (curr < prev * 0.95) trend = 'falling';
                }
                
                dailyData.push({
                    ...flowData[i],
                    day: dayName,
                    trend
                });
            }
            
            // Get current flow (most recent)
            const currentFlow = dailyData.length > 0 ? dailyData[dailyData.length - 1].flow : null;
            
            // Calculate 7-day average
            const avgFlow = dailyData.length > 0 
                ? Math.round(dailyData.reduce((sum, d) => sum + d.flow, 0) / dailyData.length)
                : null;
            
            res.json({
                river: riverName,
                siteId: site.id,
                currentFlow,
                averageFlow: avgFlow,
                flowHistory: dailyData,
                unit: 'CFS'
            });
            
        } catch (error) {
            console.error('Flow history error:', error.message);
            res.status(500).json({ error: 'Failed to fetch flow history' });
        }
    }
);

// ============================================================================
// PUSH NOTIFICATION ENDPOINTS
// ============================================================================

// Store push tokens
app.post('/api/notifications/register', async (req, res) => {
    try {
        const { token, platform } = req.body;
        if (!token) return res.status(400).json({ error: 'Token required' });
        
        await db.query(`
            INSERT INTO push_tokens (token, platform, created_at) 
            VALUES ($1, $2, NOW())
            ON CONFLICT (token) DO UPDATE SET last_used = NOW()
        `, [token, platform || 'unknown']);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Token registration error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Subscribe to river alerts
app.post('/api/notifications/subscribe', async (req, res) => {
    try {
        const { token, river } = req.body;
        if (!token || !river) return res.status(400).json({ error: 'Token and river required' });
        
        await db.query(`
            INSERT INTO notification_subscriptions (token, river, subscribed_at)
            VALUES ($1, $2, NOW())
            ON CONFLICT (token, river) DO UPDATE SET subscribed_at = NOW()
        `, [token, river]);
        
        res.json({ success: true, subscribed: true });
    } catch (error) {
        console.error('Subscription error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Unsubscribe from river alerts
app.post('/api/notifications/unsubscribe', async (req, res) => {
    try {
        const { token, river } = req.body;
        if (!token || !river) return res.status(400).json({ error: 'Token and river required' });
        
        await db.query(`
            DELETE FROM notification_subscriptions WHERE token = $1 AND river = $2
        `, [token, river]);
        
        res.json({ success: true, subscribed: false });
    } catch (error) {
        console.error('Unsubscribe error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Get user subscriptions
app.get('/api/notifications/subscriptions/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const result = await db.query(`
            SELECT river FROM notification_subscriptions WHERE token = $1
        `, [token]);
        
        res.json({ subscriptions: result.rows.map(r => r.river) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get full river details (cache 5 min - aggregates multiple sources)
app.get('/api/river-details/:river', 
    apiLimiter,
    param('river').trim().escape().isLength({ min: 1, max: 100 }),
    handleValidationErrors,
    cacheMiddleware(300),
    async (req, res) => {
        try {
            const { river } = req.params;
            const [weather, usgs, reportsResult, hatchData] = await Promise.all([
                getWeatherForRiver(river),
                getUSGSData(river),
                db.query(`SELECT id, source, river, url, last_updated, last_updated_text, scraped_at, icon_url, water_clarity 
                          FROM reports WHERE river = $1 AND is_active = true 
                          AND source NOT LIKE '%USGS%' AND url IS NOT NULL 
                          AND url != '' AND url LIKE 'http%' ORDER BY last_updated DESC, scraped_at DESC`, 
                         [river]),
                getDynamicHatchData(river)
            ]);
            
            const seenSources = new Set();
            const reports = reportsResult.rows.map(report => ({ 
                ...report, 
                // Use last_updated_text if available (original format), otherwise format the date
                last_updated: report.last_updated_text || formatDateForDisplay(report.last_updated),
                last_updated_date: formatDateForDisplay(report.last_updated)
            })).filter(report => {
                const normalized = normalizeSource(report.source);
                if (seenSources.has(normalized)) return false;
                seenSources.add(normalized);
                return true;
            });

            // Aggregate water clarity from reports
            let clarity = null;
            const clarityReports = reports.filter(r => r.water_clarity);
            if (clarityReports.length > 0) {
                // Use the most recent clarity report
                clarity = clarityReports[0].water_clarity;
            }
            
            // Get river type classification
            const riverType = RIVER_TYPES[river] || 'freestone';
            
            res.json({ 
                river, 
                riverType,
                weather, 
                usgs, 
                reports: reports,
                clarity,
                hatchData
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to fetch river details' });
        }
    }
);

// Weather icon endpoint
app.get('/api/weather-icon/:code', (req, res) => {
    const icons = { 
        0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️', 
        45: '🌫️', 48: '🌫️', 
        51: '🌦️', 53: '🌧️', 55: '🌧️', 
        61: '🌧️', 63: '🌧️', 65: '🌧️', 
        71: '🌨️', 73: '🌨️', 75: '🌨️', 77: '🌨️', 
        80: '🌦️', 81: '🌧️', 82: '🌧️', 
        85: '🌨️', 86: '🌨️', 
        95: '⛈️', 96: '⛈️', 99: '⛈️' 
    };
    res.json({ icon: icons[req.params.code] || '☁️' });
});

// PREMIUM ENDPOINTS

// Check premium status
app.get('/api/premium/status', checkPremium, async (req, res) => {
    res.json({
        isPremium: req.isPremium,
        expiresAt: req.premiumExpiry,
        features: req.isPremium ? [
            'ad_free',
            'hatch_charts',
            'access_points',
            '7_day_forecast',
            'fishing_log',
            'offline_mode'
        ] : []
    });
});

// Get hatch charts (premium) - DYNAMIC from fly shop reports
app.get('/api/premium/hatch-charts/:river', 
    checkPremium,
    param('river').trim().escape(),
    async (req, res) => {
        if (!req.isPremium) {
            return res.status(403).json({ 
                error: 'Premium subscription required',
                upgradeUrl: '/premium'
            });
        }
        
        try {
            const { river } = req.params;
            const month = new Date().toLocaleString('en-US', { month: 'short' });
            
            // Try to get dynamic hatch data from database
            let hatchData = await getCurrentHatches(river);
            
            // If no dynamic data, fall back to static seasonal data
            if (!hatchData || !hatchData.hatches || hatchData.hatches.length === 0) {
                const staticHatches = getStaticHatches(river);
                hatchData = {
                    hatches: staticHatches,
                    fly_recommendations: generateFlyRecommendations(staticHatches),
                    source: 'seasonal forecast',
                    is_forecast: true
                };
            }
            
            res.json({
                river,
                month,
                currentHatches: hatchData.hatches,
                recommendedFlies: hatchData.fly_recommendations || generateFlyRecommendations(hatchData.hatches),
                waterTemp: hatchData.water_temp,
                waterConditions: hatchData.water_conditions,
                source: hatchData.source,
                reportDate: hatchData.report_date,
                isForecast: hatchData.is_forecast || false,
                tips: generateFishingTips(river, month)
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

// Public hatch API (limited data) - cache 1 hour
app.get('/api/hatches/:river',
    apiLimiter,
    param('river').trim().escape(),
    cacheMiddleware(3600),
    async (req, res) => {
        try {
            const { river } = req.params;
            
            // Get dynamic hatch data
            let hatchData = await getCurrentHatches(river);
            
            // If no dynamic data, use static
            if (!hatchData || !hatchData.hatches || hatchData.hatches.length === 0) {
                const staticHatches = getStaticHatches(river);
                hatchData = {
                    hatches: staticHatches.slice(0, 3), // Limit to 3 for non-premium
                    source: 'seasonal forecast'
                };
            } else {
                // Limit data for non-premium users
                hatchData = {
                    hatches: hatchData.hatches.slice(0, 3),
                    source: hatchData.source
                };
            }
            
            res.json({
                river,
                currentHatches: hatchData.hatches,
                source: hatchData.source,
                upgradeMessage: 'Upgrade to Premium for detailed fly recommendations and full hatch charts'
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

// Trigger hatch scrape manually
app.post('/api/scrape-hatches', scrapeLimiter, async (req, res) => {
    try {
        await runHatchScraper();
        res.json({ message: 'Hatch scrape completed' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// User favorites (premium)
app.get('/api/premium/favorites', checkPremium, async (req, res) => {
    if (!req.isPremium) {
        return res.status(403).json({ error: 'Premium subscription required' });
    }
    
    const email = req.headers['x-user-email'];
    
    try {
        const result = await db.query(
            `SELECT river, created_at FROM user_favorites WHERE email = $1 ORDER BY created_at DESC`,
            [email]
        );
        res.json({ favorites: result.rows });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/premium/favorites', 
    checkPremium,
    body('river').trim().escape().isLength({ min: 1, max: 100 }),
    handleValidationErrors,
    async (req, res) => {
        if (!req.isPremium) {
            return res.status(403).json({ error: 'Premium subscription required' });
        }
        
        const email = req.headers['x-user-email'];
        const { river } = req.body;
        
        try {
            await db.query(
                `INSERT INTO user_favorites (email, river) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                [email, river]
            );
            res.json({ message: 'Added to favorites', river });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

app.delete('/api/premium/favorites/:river', checkPremium, async (req, res) => {
    if (!req.isPremium) {
        return res.status(403).json({ error: 'Premium subscription required' });
    }
    
    const email = req.headers['x-user-email'];
    const { river } = req.params;
    
    try {
        await db.query(
            `DELETE FROM user_favorites WHERE email = $1 AND river = $2`,
            [email, river]
        );
        res.json({ message: 'Removed from favorites', river });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Analytics endpoint (admin only)
app.get('/api/admin/analytics', async (req, res) => {
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== process.env.ADMIN_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    try {
        const [dailyStats, endpointStats, premiumStats] = await Promise.all([
            db.query(`SELECT DATE(timestamp) as date, COUNT(*) as requests 
                      FROM analytics 
                      WHERE timestamp > NOW() - INTERVAL '7 days'
                      GROUP BY DATE(timestamp) ORDER BY date DESC`),
            db.query(`SELECT endpoint, COUNT(*) as requests 
                      FROM analytics 
                      WHERE timestamp > NOW() - INTERVAL '24 hours'
                      GROUP BY endpoint ORDER BY requests DESC LIMIT 10`),
            db.query(`SELECT subscription_type, COUNT(*) as users 
                      FROM premium_users 
                      WHERE subscription_status = 'active'
                      GROUP BY subscription_type`)
        ]);
        
        res.json({
            daily: dailyStats.rows,
            topEndpoints: endpointStats.rows,
            premiumUsers: premiumStats.rows,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin endpoint to purge bad URLs
app.post('/api/admin/purge-bad-urls', async (req, res) => {
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== process.env.ADMIN_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    try {
        // Delete by exact source names
        const badSources = [
            'North Fork Anglers', 
            'Yellow Dog (Bighorn River)',
            'Stonefly Shop',
            'Dan Bailey\'s',
            'Fins & Feathers',
            'Montana Trout',
            'Madison River Outfitters',
            'Headhunters Fly Shop',
            'Grizzly Hackle'
        ];
        
        const sourceResult = await db.query(`
            DELETE FROM reports 
            WHERE source = ANY($1)
            RETURNING id, source, river, url
        `, [badSources]);
        
        // Delete by URL patterns
        const badUrlPatterns = [
            'bighornangler.com',
            'northforkanglers.com',
            'yellowdogflyfishing.com',
            'bozemanflysupply.com',
            'grizzlyhackle.com',
            'headhuntersflyshop.com/fishing-report',
            'montanatrout.com',
            'madisonriveroutfitters.com/fishing-report',
            'danbaileys.com/fishing-report',
            'thestonefly.com'
        ];
        
        let urlResultCount = 0;
        for (const pattern of badUrlPatterns) {
            const result = await db.query(`
                DELETE FROM reports 
                WHERE url LIKE $1
                RETURNING id
            `, [`%${pattern}%`]);
            urlResultCount += result.rowCount;
        }
        
        res.json({
            message: 'Bad URLs purged successfully',
            deletedBySource: sourceResult.rowCount,
            deletedByUrl: urlResultCount,
            deletedDetails: sourceResult.rows
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin endpoint to refresh icons from scrapers
app.post('/api/admin/refresh-icons', async (req, res) => {
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== process.env.ADMIN_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    try {
        // Re-run scrapers to update icons
        const { runAllScrapers } = require('./scrapers');
        const result = await runAllScrapers();
        
        res.json({
            message: 'Icons refreshed from scrapers',
            scraperResult: result
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Helper functions
function generateFlyRecommendations(hatches) {
    const flyPatterns = {
        'Midges': ['Zebra Midge #18-20', 'Top Secret Midge #18-22', 'Miracle Midge #20'],
        'BWO': ['Parachute BWO #18-20', 'RS2 #20-22', 'Pheasant Tail #18'],
        'March Browns': ['March Brown Dry #12-14', 'Hare\'s Ear #12-14'],
        'Salmonflies': ['Salmonfly Dry #4-6', 'Chubby Chernobyl #6-8', 'Pats Rubber Legs #6-8'],
        'Golden Stones': ['Golden Stone Dry #8-10', 'Kaufmann Stone #8-10'],
        'PMDs': ['Parachute PMD #16-18', 'Sparkle Dun #16-18', 'Pheasant Tail #16'],
        'Yellow Sallies': ['Yellow Sally Dry #14-16', 'Stimulator Yellow #14'],
        'Caddis': ['Elk Hair Caddis #14-16', 'X-Caddis #16-18', 'Pupa patterns #14-16'],
        'Hoppers': ['Chubby Chernobyl #8-10', 'Morrish Hopper #10-12', 'Dave\'s Hopper #10'],
        'Tricos': ['Trico Spinner #20-22', 'Trico Dun #20-22'],
        'Baetis': ['BWO Comparadun #20-22', 'Barr Emerger #20-22'],
        'October Caddis': ['Orange Stimulator #10-12', 'Pupa patterns #12-14']
    };
    
    const recommendations = [];
    hatches.forEach(hatch => {
        if (flyPatterns[hatch]) {
            recommendations.push(...flyPatterns[hatch]);
        }
    });
    
    return [...new Set(recommendations)].slice(0, 6);
}

function generateFishingTips(river, month) {
    const tips = [
        'Fish early morning or late evening for best results',
        'Watch for rising fish to match the hatch',
        'Check water temperature - trout are most active between 50-65F',
        'Use stealthy approaches in clear, low water',
        'Focus on structure: seams, eddies, and drop-offs'
    ];
    
    if (month === 'Jun' || month === 'Jul') {
        tips.push('Salmonfly season - fish the banks with large dries');
    }
    if (month === 'Aug' || month === 'Sep') {
        tips.push('Hopper season - do not overlook the grassy banks');
    }
    
    return tips.slice(0, 3);
}

// DYNAMIC HATCH DATA - combines seasonal patterns with real-time conditions
async function getDynamicHatchData(riverName) {
    const month = new Date().toLocaleString('en-US', { month: 'short' });
    const monthNum = new Date().getMonth();
    
    // Get seasonal hatches
    const seasonalHatches = getStaticHatches(riverName) || getDefaultHatches(month);
    
    // Get water temperature (real, nearby, or estimated)
    const usgsData = await getUSGSData(riverName);
    let waterTemp = null;
    let tempSource = 'Seasonal forecast';
    
    if (usgsData && usgsData.temp) {
        const tempMatch = usgsData.temp.match(/(\d+)/);
        if (tempMatch) {
            waterTemp = parseInt(tempMatch[1]);
            tempSource = usgsData.tempSource || 'USGS';
        }
    }
    
    // Adjust recommendations based on conditions
    let adjustedHatches = [...seasonalHatches];
    let conditions = [];
    
    if (waterTemp) {
        if (waterTemp < 40) {
            conditions.push('Cold water - fish deep and slow');
            adjustedHatches = ['Midges', 'Baetis'];
        } else if (waterTemp > 65) {
            conditions.push('Warm water - fish early/late');
            adjustedHatches.push('Hoppers');
        } else if (waterTemp >= 50 && waterTemp <= 60) {
            conditions.push('Prime temperature - active feeding');
        }
    }
    
    // Get wind data for recommendations
    const weather = await getWeatherForRiver(riverName);
    if (weather && weather.windSpeed > 15) {
        conditions.push('Windy - use heavier flies, fish lee side');
    }
    
    return {
        hatches: adjustedHatches,
        flies: generateFlyRecommendations(adjustedHatches),
        waterTemp: waterTemp ? `${waterTemp}°F` : null,
        waterConditions: conditions.length > 0 ? conditions.join('. ') : null,
        tempSource: tempSource,
        source: waterTemp ? `${tempSource} + seasonal forecast` : 'Seasonal forecast',
        seasonalForecast: seasonalHatches
    };
}

function getDefaultHatches(month) {
    const defaults = {
        'Jan': ['Midges'], 'Feb': ['Midges'], 'Mar': ['Midges', 'BWO'],
        'Apr': ['BWO', 'March Browns'], 'May': ['March Browns', 'Caddis'],
        'Jun': ['PMDs', 'Caddis', 'Salmonflies'], 'Jul': ['PMDs', 'Caddis', 'Hoppers'],
        'Aug': ['Hoppers', 'Tricos'], 'Sep': ['Tricos', 'Baetis'],
        'Oct': ['Baetis', 'October Caddis'], 'Nov': ['Midges', 'Baetis'], 'Dec': ['Midges']
    };
    return defaults[month] || ['Midges', 'BWO'];
}

// Public hatch endpoint (limited version)
app.get('/api/hatches/:river',
    apiLimiter,
    param('river').trim().escape(),
    async (req, res) => {
        try {
            const { river } = req.params;
            const hatchData = await getDynamicHatchData(river);
            
            res.json({
                river,
                currentHatches: hatchData.hatches.slice(0, 2), // Limited for free tier
                recommendedFlies: hatchData.flies.slice(0, 3), // Limited for free tier
                waterTemp: hatchData.waterTemp,
                waterConditions: hatchData.waterConditions,
                source: hatchData.source
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found', path: req.path });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ 
        error: process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : err.message 
    });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log('\n========================================');
    console.log('Montana Fishing Reports API');
    console.log('Version: 2.3.0');
    console.log('Server running on port ' + PORT);
    console.log('Health: http://localhost:' + PORT + '/health');
    console.log('========================================\n');
});

module.exports = { normalizeSource, formatDateForDisplay };

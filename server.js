const express = require('express');
const cache = require('./utils/cache');
const cors = require('cors');
const cron = require('node-cron');
const db = require('./db');
const { runAllScrapers } = require('./scrapers');
const { getWeatherForRiver } = require('./utils/weather');
const { getUSGSData, RIVER_TYPES, calculateFlowCondition } = require('./utils/usgs');
const { getCurrentHatches, getStaticHatches } = require('./scrapers/hatchScraper');
const { formatForDisplay, getRelativeTime } = require('./utils/dateStandardizer');

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

// All rivers that should always appear in the app
const ALL_RIVERS = [
    'Upper Madison River',
    'Lower Madison River',
    'Yellowstone River',
    'Missouri River',
    'Bighorn River',
    'Gallatin River',
    'Jefferson River',
    'Beaverhead River',
    'Big Hole River',
    'Bitterroot River',
    'Blackfoot River',
    'Boulder River',
    'Clark Fork River',
    'Ruby River',
    'Stillwater River',
    'Swan River',
    'Rock Creek',
    'Spring Creeks',
    // YNP Rivers (marked with YNP designation)
    'Slough Creek',
    'Soda Butte Creek',
    'Lamar River',
    'Gardner River',
    'Firehole River'
];

// Rivers in Yellowstone National Park (for YNP badge)
const YNP_RIVERS = ['Slough Creek', 'Soda Butte Creek', 'Lamar River', 'Gardner River', 'Firehole River'];

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

// Rate limiting - increased for production
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,                    // Increased from 100
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,                    // Increased from 30
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
    // Use centralized date formatter - returns 'Date unknown' if invalid
    return formatForDisplay(dateString);
}

function getReportFreshness(dateString) {
    // Returns relative time like "Today", "Yesterday", "3 days ago"
    return getRelativeTime(dateString);
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
            is_active BOOLEAN DEFAULT true,
            UNIQUE(source, river)
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
        
        // Hatch alert subscriptions (premium feature)
        await db.query(`CREATE TABLE IF NOT EXISTS hatch_subscriptions (
            id SERIAL PRIMARY KEY,
            token VARCHAR(255) NOT NULL,
            river VARCHAR(100) NOT NULL,
            hatch VARCHAR(50) NOT NULL DEFAULT 'all',
            subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(token, river, hatch)
        )`);
        
        await db.query(`CREATE INDEX IF NOT EXISTS idx_subscriptions_token ON notification_subscriptions(token)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_subscriptions_river ON notification_subscriptions(river)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_hatch_subs_token ON hatch_subscriptions(token)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_hatch_subs_river ON hatch_subscriptions(river)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_hatch_subs_hatch ON hatch_subscriptions(hatch)`);
        
        await db.query(`CREATE INDEX IF NOT EXISTS idx_river ON reports(river)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_scraped_at ON reports(scraped_at)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_source_normalized ON reports(source_normalized)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON analytics(timestamp)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_premium_email ON premium_users(email)`);
        
        await db.query(`ALTER TABLE reports ADD COLUMN IF NOT EXISTS source_normalized VARCHAR(100)`);
        await db.query(`ALTER TABLE reports ADD COLUMN IF NOT EXISTS last_updated_text VARCHAR(50)`);
        
        // Add UNIQUE constraint on (source, river) if it doesn't exist
        try {
            await db.query(`ALTER TABLE reports ADD CONSTRAINT reports_source_river_unique UNIQUE (source, river)`);
            console.log('Added UNIQUE constraint on (source, river)');
        } catch (e) {
            // Constraint already exists - ignore
        }
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
            'Stonefly Shop (Old)',
            'Dan Bailey\'s (Old)',
            'Perfect Fly (Old)',
            'Big Sky Anglers',
            'Fly Fishing Bozeman (Old)',
            'Madison River Outfitters',
            'River\'s Edge',  // Old riversedge.com domain
            'George Anderson\'s Yellowstone Angler',  // Old URL
            'Trout Shop',  // Removed per user request
            'Bigfork Anglers',  // Removed per user request
            'Fins & Feathers',  // Website removed fishing reports (404)
            'Blue Ribbon Flies',  // Dates incorrect, removed per user request
            'Sweetcast Angler'  // Removed per user request
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
});

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        const dbResult = await db.query('SELECT NOW()');
        const reportsCount = await db.query('SELECT COUNT(*) as count FROM reports WHERE is_active = true');
        
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '2.3.2',
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

// Test endpoint - verify routing works
app.get('/test', (req, res) => {
    res.json({ test: 'ok', timestamp: new Date().toISOString() });
});

// Debug endpoint - check database contents
app.get('/debug/reports', async (req, res) => {
    try {
        const result = await db.query(
            "SELECT source, river, is_active, last_updated_text FROM reports WHERE source LIKE '%Edge%' ORDER BY source, river"
        );
        res.json({ 
            count: result.rows.length,
            reports: result.rows
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Clear reports endpoint
app.get('/clear', async (req, res) => {
    try {
        await db.query('DELETE FROM reports');
        res.json({ success: true, message: 'All reports cleared' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API root
app.get('/', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Montana Fishing Reports API', 
        version: '2.3.3',
        endpoints: {
            test: '/test',
            clear: '/clear',
            adminClear: '/api/admin/clear-reports'
        }, 
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

// Clear all reports endpoint - GET for easy browser access
app.get('/api/admin/clear-reports', async (req, res) => {
    try {
        console.log('=== MANUAL DATABASE CLEAR (GET) ===');
        
        const before = await db.query('SELECT COUNT(*) FROM reports');
        console.log(`Reports before: ${before.rows[0].count}`);
        
        await db.query('DELETE FROM reports');
        console.log('✓ All reports deleted');
        
        // Clear cache
        const keys = cache.keys();
        const apiKeys = keys.filter(k => k.includes('/api/'));
        apiKeys.forEach(k => cache.del(k));
        console.log(`✓ Cache cleared: ${apiKeys.length} keys`);
        
        res.json({ 
            success: true, 
            message: 'All reports cleared. Run scraper to rebuild.',
            deleted: parseInt(before.rows[0].count),
            nextStep: 'POST to /api/scrape to rebuild'
        });
        
    } catch (error) {
        console.error('Clear failed:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST version for consistency
app.post('/api/admin/clear-reports', async (req, res) => {
    try {
        console.log('=== MANUAL DATABASE CLEAR ===');
        
        const before = await db.query('SELECT COUNT(*) FROM reports');
        console.log(`Reports before: ${before.rows[0].count}`);
        
        await db.query('DELETE FROM reports');
        console.log('✓ All reports deleted');
        
        // Clear cache
        const keys = cache.keys();
        const apiKeys = keys.filter(k => k.includes('/api/'));
        apiKeys.forEach(k => cache.del(k));
        console.log(`✓ Cache cleared: ${apiKeys.length} keys`);
        
        res.json({ 
            success: true, 
            message: 'All reports cleared. Run scraper to rebuild.',
            deleted: parseInt(before.rows[0].count)
        });
        
    } catch (error) {
        console.error('Clear failed:', error);
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
            '%boulder-river-report%',
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

// Cleanup Madison River entries - deactivates plain "Madison River" (keep Upper/Lower)
app.post('/api/cleanup-madison', async (req, res) => {
    try {
        // Check current state
        const before = await db.query(`
            SELECT river, COUNT(*) as count 
            FROM reports 
            WHERE river LIKE '%Madison%'
            GROUP BY river
            ORDER BY river
        `);
        
        // Deactivate plain "Madison River" entries
        const result = await db.query(`
            UPDATE reports 
            SET is_active = false 
            WHERE river = 'Madison River'
            RETURNING id, source
        `);
        
        // Verify after
        const after = await db.query(`
            SELECT river, COUNT(*) as count 
            FROM reports 
            WHERE is_active = true 
              AND river LIKE '%Madison%'
            GROUP BY river
            ORDER BY river
        `);
        
        res.json({
            message: 'Madison River cleanup completed',
            before: before.rows,
            deactivated: result.rowCount,
            after: after.rows
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Cleanup Yellowstone National Park entries - deactivates the old category (individual YNP rivers remain)
app.post('/api/cleanup-ynp-category', async (req, res) => {
    try {
        // Check current state
        const before = await db.query(`
            SELECT river, COUNT(*) as count 
            FROM reports 
            WHERE river = 'Yellowstone National Park'
            GROUP BY river
        `);
        
        // Deactivate "Yellowstone National Park" category entries
        const result = await db.query(`
            UPDATE reports 
            SET is_active = false 
            WHERE river = 'Yellowstone National Park'
            RETURNING id, source
        `);
        
        res.json({
            message: 'Yellowstone National Park category cleanup completed',
            before: before.rows,
            deactivated: result.rowCount,
            note: 'Individual YNP rivers (Slough Creek, Soda Butte, etc.) remain active'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Check rivers and their report counts
app.get('/api/check-rivers', async (req, res) => {
    try {
        // Get all active rivers with counts
        const activeRivers = await db.query(`
            SELECT river, COUNT(*) as report_count 
            FROM reports 
            WHERE is_active = true 
            GROUP BY river 
            ORDER BY river
        `);
        
        // Check for problematic entries
        const madisonCheck = await db.query(`
            SELECT source, is_active 
            FROM reports 
            WHERE river = 'Madison River'
        `);
        
        const ynpCheck = await db.query(`
            SELECT source, is_active 
            FROM reports 
            WHERE river = 'Yellowstone National Park'
        `);
        
        // Check YNP rivers specifically
        const ynpRivers = await db.query(`
            SELECT river, COUNT(*) as count 
            FROM reports 
            WHERE river IN ('Slough Creek', 'Soda Butte Creek', 'Lamar River', 'Gardner River', 'Firehole River')
              AND is_active = true
            GROUP BY river
            ORDER BY river
        `);
        
        res.json({
            totalActiveRivers: activeRivers.rows.length,
            activeRivers: activeRivers.rows,
            problematicEntries: {
                'Madison River': madisonCheck.rows,
                'Yellowstone National Park': ynpCheck.rows
            },
            ynpRivers: ynpRivers.rows
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all rivers
app.get('/api/rivers', apiLimiter, cacheMiddleware(600), async (req, res) => {
    try {
        const result = await db.query(`SELECT DISTINCT river FROM reports WHERE is_active = true ORDER BY river`);
        const dbRivers = result.rows.map(r => r.river).filter(river => 
            river !== 'General Montana' && river !== 'Montana General'
        );
        
        // Merge with static list to ensure all rivers appear even without active reports
        const allRiversSet = new Set([...ALL_RIVERS, ...dbRivers]);
        const mergedRivers = Array.from(allRiversSet).sort((a, b) => a.localeCompare(b));
        
        res.json({ count: mergedRivers.length, rivers: mergedRivers });
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
                 FROM reports WHERE river = $1 AND is_active = true 
                 ORDER BY CASE WHEN last_updated IS NULL THEN 1 ELSE 0 END, last_updated DESC, scraped_at DESC`, 
                [river]
            );
            const FINS_FEATHERS_ICON = 'https://montana-fishing-reports-production.up.railway.app/favicons/fins-feathers.png';
            const MONTANA_ANGLER_ICON = 'https://montana-fishing-reports-production.up.railway.app/favicons/montana-angler.png';
            const SWEETWATER_ICON = 'https://montana-fishing-reports-production.up.railway.app/favicons/sweetwater.png';
            
            // First, normalize all reports and group by source
            const normalizedReports = result.rows.map(report => ({ 
                ...report, 
                // Normalize source names for display
                source: report.source === 'Fly Fishing Bozeman' ? 'Fins and Feathers' : report.source,
                // Add favicon for reports without icons
                icon_url: report.icon_url || 
                    (report.source === 'Fly Fishing Bozeman' || report.source === 'Fins and Feathers' ? FINS_FEATHERS_ICON :
                     report.source === 'Montana Angler' ? MONTANA_ANGLER_ICON :
                     report.source === 'Sweetwater Fly Shop' ? SWEETWATER_ICON :
                     report.icon_url),
                // Use centralized date formatting
                last_updated: formatDateForDisplay(report.last_updated),
                relative_time: getReportFreshness(report.last_updated),
                original_date: report.last_updated_text || report.last_updated
            }));
            
            // Deduplicate - keep the one with icon if possible
            const sourceMap = new Map();
            for (const report of normalizedReports) {
                const key = report.source;
                const existing = sourceMap.get(key);
                // Keep this report if: no existing, or this one has an icon and existing doesn't, or this one is newer
                if (!existing || 
                    (report.icon_url && !existing.icon_url) ||
                    (report.icon_url && existing.icon_url && new Date(report.scraped_at) > new Date(existing.scraped_at))) {
                    sourceMap.set(key, report);
                }
            }
            const reports = Array.from(sourceMap.values());
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
            
            // Get REAL-TIME current flow from instantaneous endpoint (not daily)
            let currentFlow = null;
            try {
                const ivResponse = await axios.get(
                    `https://waterservices.usgs.gov/nwis/iv/?format=json&sites=${site.id}&parameterCd=00060&period=P1D`,
                    { timeout: 5000 }
                );
                const ivTimeSeries = ivResponse.data.value.timeSeries;
                if (ivTimeSeries && ivTimeSeries.length > 0) {
                    const ivValues = ivTimeSeries[0].values[0].value;
                    if (ivValues && ivValues.length > 0) {
                        const latest = ivValues[ivValues.length - 1];
                        if (latest.value !== '-999999') {
                            currentFlow = Math.round(parseFloat(latest.value));
                        }
                    }
                }
            } catch (ivError) {
                console.log('IV fetch failed, using daily value:', ivError.message);
                // Fallback to most recent daily value
                currentFlow = dailyData.length > 0 ? dailyData[dailyData.length - 1].flow : null;
            }
            
            // Calculate 7-day average from daily data
            const avgFlow = dailyData.length > 0 
                ? Math.round(dailyData.reduce((sum, d) => sum + d.flow, 0) / dailyData.length)
                : null;
            
            // Calculate flow condition using shared function
            const flowCondition = currentFlow ? calculateFlowCondition(riverName, currentFlow) : null;
            
            res.json({
                river: riverName,
                siteId: site.id,
                currentFlow,
                averageFlow: avgFlow,
                flowHistory: dailyData,
                flowCondition,
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

// Subscribe to river alerts (PREMIUM ONLY)
app.post('/api/notifications/subscribe', async (req, res) => {
    try {
        const email = req.headers['x-user-email'];
        const isPremium = email ? await checkUserPremium(email) : false;
        
        if (!isPremium) {
            return res.status(403).json({ 
                error: 'Premium subscription required',
                message: 'Push notifications are a premium feature. Upgrade to receive alerts when new fishing reports are posted.',
                upgradeRequired: true
            });
        }
        
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

// Send test push notification
app.post('/api/notifications/test', async (req, res) => {
    try {
        const { token, river } = req.body;
        if (!token) return res.status(400).json({ error: 'Push token required' });
        
        const { sendTestNotification } = require('./utils/pushNotifications');
        const result = await sendTestNotification(
            token,
            river ? `🎣 Test: ${river}` : '🎣 Montana Fishing Reports',
            river 
                ? `This is a test notification for ${river}`
                : 'Your push notifications are working!'
        );
        
        res.json({ 
            success: true, 
            message: 'Test notification sent',
            expoResponse: result 
        });
    } catch (error) {
        console.error('Test notification error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Hatch Alert Subscriptions (Premium Feature)
// ============================================

// Subscribe to hatch alerts for a river
app.post('/api/hatch-alerts/subscribe', checkPremium, async (req, res) => {
    try {
        if (!req.isPremium) {
            return res.status(403).json({ error: 'Premium subscription required for hatch alerts' });
        }
        
        const { token, river, hatch = 'all' } = req.body;
        if (!token || !river) {
            return res.status(400).json({ error: 'Token and river required' });
        }
        
        const { subscribeToHatchAlerts } = require('./utils/hatchNotifications');
        const success = await subscribeToHatchAlerts(token, river, hatch);
        
        if (success) {
            res.json({ 
                success: true, 
                message: `Subscribed to ${hatch === 'all' ? 'all hatches' : hatch} alerts for ${river}`,
                river,
                hatch
            });
        } else {
            res.status(500).json({ error: 'Failed to subscribe' });
        }
    } catch (error) {
        console.error('Hatch subscription error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Unsubscribe from hatch alerts
app.post('/api/hatch-alerts/unsubscribe', async (req, res) => {
    try {
        const { token, river, hatch } = req.body;
        if (!token || !river) {
            return res.status(400).json({ error: 'Token and river required' });
        }
        
        const { unsubscribeFromHatchAlerts } = require('./utils/hatchNotifications');
        const success = await unsubscribeFromHatchAlerts(token, river, hatch);
        
        res.json({ success, message: 'Unsubscribed from hatch alerts' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user's hatch subscriptions
app.get('/api/hatch-alerts/subscriptions/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const result = await db.query(`
            SELECT river, hatch, subscribed_at 
            FROM hatch_subscriptions 
            WHERE token = $1
            ORDER BY river, hatch
        `, [token]);
        
        res.json({ subscriptions: result.rows });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get available hatch types for subscription
app.get('/api/hatch-alerts/types', async (req, res) => {
    const { MAJOR_HATCHES, HATCH_EMOJIS } = require('./utils/hatchNotifications');
    
    res.json({
        hatches: MAJOR_HATCHES.map(hatch => ({
            name: hatch,
            emoji: HATCH_EMOJIS[hatch] || '🎣',
            description: getHatchDescription(hatch)
        }))
    });
});

function getHatchDescription(hatch) {
    const descriptions = {
        'Salmonflies': 'The big one! Size #4-6 stoneflies, late June-July',
        'Golden Stones': 'Slightly smaller cousin of Salmonflies, summer',
        'PMDs': 'Pale Morning Duns, reliable summer mayfly hatch',
        'Caddis': 'Evening caddis hatches, spring through fall',
        'Blue Winged Olives': 'Small mayflies, spring and fall',
        'Hoppers': 'Terrestrial action, late July through September',
        'Tricos': 'Tiny morning mayflies, technical dry fly fishing',
        'Midges': 'Year-round, especially important in winter',
        'October Caddis': 'Large fall caddis, aggressive strikes',
        'Skwalas': 'Early season stoneflies, March-April',
        'Green Drakes': 'Large mayflies, exciting dry fly action',
        'Gray Drakes': 'Spinner falls in the evenings',
    };
    return descriptions[hatch] || 'Seasonal hatch activity';
}

// Get notification stats (admin)
app.get('/api/admin/notifications/stats', async (req, res) => {
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== process.env.ADMIN_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    try {
        const [tokenStats, subscriptionStats, topRivers] = await Promise.all([
            db.query('SELECT COUNT(*) as total_tokens, COUNT(DISTINCT platform) as platforms FROM push_tokens'),
            db.query('SELECT COUNT(*) as total_subscriptions FROM notification_subscriptions'),
            db.query(`
                SELECT river, COUNT(*) as subscriber_count 
                FROM notification_subscriptions 
                GROUP BY river 
                ORDER BY subscriber_count DESC 
                LIMIT 10
            `)
        ]);
        
        res.json({
            tokens: tokenStats.rows[0],
            subscriptions: subscriptionStats.rows[0],
            topSubscribedRivers: topRivers.rows
        });
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
                          AND url != '' AND url LIKE 'http%' 
                          ORDER BY CASE WHEN last_updated IS NULL THEN 1 ELSE 0 END, last_updated DESC, scraped_at DESC`, 
                         [river]),
                getDynamicHatchData(river)
            ]);
            
            const FINS_FEATHERS_ICON = 'https://montana-fishing-reports-production.up.railway.app/favicons/fins-feathers.png';
            const MONTANA_ANGLER_ICON = 'https://montana-fishing-reports-production.up.railway.app/favicons/montana-angler.png';
            const SWEETWATER_ICON = 'https://montana-fishing-reports-production.up.railway.app/favicons/sweetwater.png';
            
            // First, normalize all reports and group by source
            const normalizedReports = reportsResult.rows.map(report => ({ 
                ...report, 
                // Normalize source names for display
                source: report.source === 'Fly Fishing Bozeman' ? 'Fins and Feathers' : report.source,
                // Add favicon for reports without icons
                icon_url: report.icon_url || 
                    (report.source === 'Fly Fishing Bozeman' || report.source === 'Fins and Feathers' ? FINS_FEATHERS_ICON :
                     report.source === 'Montana Angler' ? MONTANA_ANGLER_ICON :
                     report.source === 'Sweetwater Fly Shop' ? SWEETWATER_ICON :
                     report.icon_url),
                // Use centralized date formatting
                last_updated: formatDateForDisplay(report.last_updated),
                relative_time: getReportFreshness(report.last_updated),
                original_date: report.last_updated_text || report.last_updated
            }));
            
            // Deduplicate - keep the one with icon if possible
            const sourceMap = new Map();
            for (const report of normalizedReports) {
                const key = report.source;
                const existing = sourceMap.get(key);
                // Keep this report if: no existing, or this one has an icon and existing doesn't, or this one is newer
                if (!existing || 
                    (report.icon_url && !existing.icon_url) ||
                    (report.icon_url && existing.icon_url && new Date(report.scraped_at) > new Date(existing.scraped_at))) {
                    sourceMap.set(key, report);
                }
            }
            const reports = Array.from(sourceMap.values());

            // Aggregate water clarity from reports
            let clarity = null;
            const clarityReports = reports.filter(r => r.water_clarity);
            if (clarityReports.length > 0) {
                // Use the most recent clarity report
                clarity = clarityReports[0].water_clarity;
            }
            
            // Get river type classification
            const riverType = RIVER_TYPES[river] || 'freestone';
            
            // Add flow condition to USGS data
            if (usgs && usgs.flow) {
                const flowMatch = usgs.flow.match(/(\d+)/);
                if (flowMatch) {
                    const cfs = parseInt(flowMatch[1]);
                    usgs.flowCondition = calculateFlowCondition(river, cfs);
                }
            }
            
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
app.get('/api/premium/status', async (req, res) => {
    const email = req.headers['x-user-email'];
    const apiKey = req.headers['x-api-key'];
    
    let isPremium = false;
    let expiresAt = null;
    
    if (email && apiKey) {
        try {
            const result = await db.query(
                `SELECT subscription_status, expires_at FROM premium_users 
                 WHERE email = $1 AND subscription_status = 'active' 
                 AND (expires_at IS NULL OR expires_at > NOW())`,
                [email]
            );
            if (result.rows.length > 0) {
                isPremium = true;
                expiresAt = result.rows[0].expires_at;
            }
        } catch (error) {
            console.error('Premium check error:', error);
        }
    }
    
    res.json({
        isPremium,
        expiresAt,
        freeFeatures: [
            'fishing_reports',
            'weather',
            'flows',
            'map',
            '1_favorite',
            'ads'
        ],
        premiumFeatures: isPremium ? [
            'ad_free',
            'unlimited_favorites',
            'push_notifications',
            'hatch_alerts',
            'detailed_hatch_charts',
            '7_day_forecast',
            'offline_mode',
            'access_points',
            'river_mile_calculator',
            'regulations'
        ] : [
            'ad_free',
            'unlimited_favorites', 
            'push_notifications',
            'hatch_alerts',
            'detailed_hatch_charts',
            '7_day_forecast',
            'offline_mode',
            'access_points',
            'river_mile_calculator',
            'regulations'
        ],
        limits: {
            favorites: isPremium ? 'unlimited' : 1
        }
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
            
            // Get real water temperature and flow from USGS
            const usgsData = await getUSGSData(river);
            let waterTemp = hatchData?.water_temp;
            let tempSource = hatchData?.source;
            let flowCondition = null;
            
            if (usgsData) {
                // Get temp
                if (usgsData.temp) {
                    const tempMatch = usgsData.temp.match(/(\d+)/);
                    if (tempMatch && !usgsData.temp.includes('-999')) {
                        waterTemp = usgsData.temp;
                        tempSource = usgsData.tempSource || 'USGS';
                    }
                }
                
                // Get flow condition from USGS (consistent with other endpoints)
                if (usgsData.flow) {
                    const flowMatch = usgsData.flow.match(/(\d+)/);
                    if (flowMatch) {
                        const cfs = parseInt(flowMatch[1]);
                        flowCondition = calculateFlowCondition(river, cfs);
                    }
                }
            }
            
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
                waterTemp: waterTemp,
                waterConditions: flowCondition ? flowCondition.label : hatchData.water_conditions,
                flowCondition: flowCondition,
                source: tempSource || hatchData.source,
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
            
            // Get USGS flow condition for consistency
            const usgsData = await getUSGSData(river);
            let flowCondition = null;
            if (usgsData && usgsData.flow) {
                const flowMatch = usgsData.flow.match(/(\d+)/);
                if (flowMatch) {
                    flowCondition = calculateFlowCondition(river, parseInt(flowMatch[1]));
                }
            }
            
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
                waterConditions: flowCondition ? flowCondition.label : null,
                flowCondition: flowCondition,
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
        // Hatch data is now extracted during regular scrape post-processing
        res.json({ message: 'Hatch scraping is now part of regular scrape. Run /api/scrape instead.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// User favorites - FREE users get 1 favorite, PREMIUM get unlimited
// ============================================

const FREE_FAVORITES_LIMIT = 1;

// Get favorites (works for both free and premium)
app.get('/api/favorites', async (req, res) => {
    const email = req.headers['x-user-email'];
    if (!email) {
        return res.status(400).json({ error: 'Email required' });
    }
    
    try {
        const result = await db.query(
            `SELECT river, created_at FROM user_favorites WHERE email = $1 ORDER BY created_at DESC`,
            [email]
        );
        
        // Check premium status
        const isPremium = await checkUserPremium(email);
        
        res.json({ 
            favorites: result.rows,
            isPremium,
            limit: isPremium ? 'unlimited' : FREE_FAVORITES_LIMIT,
            canAddMore: isPremium || result.rows.length < FREE_FAVORITES_LIMIT
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add favorite - FREE users limited to 1, PREMIUM unlimited
app.post('/api/favorites', 
    body('river').trim().escape().isLength({ min: 1, max: 100 }),
    handleValidationErrors,
    async (req, res) => {
        const email = req.headers['x-user-email'];
        if (!email) {
            return res.status(400).json({ error: 'Email required' });
        }
        
        const { river } = req.body;
        
        try {
            // Check current favorites count
            const countResult = await db.query(
                `SELECT COUNT(*) as count FROM user_favorites WHERE email = $1`,
                [email]
            );
            const currentCount = parseInt(countResult.rows[0].count);
            
            // Check if premium
            const isPremium = await checkUserPremium(email);
            
            // Enforce limit for free users
            if (!isPremium && currentCount >= FREE_FAVORITES_LIMIT) {
                return res.status(403).json({ 
                    error: 'Free plan limit reached',
                    message: `Free users can only save ${FREE_FAVORITES_LIMIT} favorite. Upgrade to Premium for unlimited favorites.`,
                    upgradeRequired: true,
                    currentCount,
                    limit: FREE_FAVORITES_LIMIT
                });
            }
            
            await db.query(
                `INSERT INTO user_favorites (email, river) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                [email, river]
            );
            
            res.json({ 
                message: 'Added to favorites', 
                river,
                isPremium,
                totalFavorites: currentCount + 1
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

// Delete favorite (works for both free and premium)
app.delete('/api/favorites/:river', async (req, res) => {
    const email = req.headers['x-user-email'];
    if (!email) {
        return res.status(400).json({ error: 'Email required' });
    }
    
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

// Helper function to check if user is premium
async function checkUserPremium(email) {
    try {
        const result = await db.query(
            `SELECT subscription_status, expires_at FROM premium_users 
             WHERE email = $1 AND subscription_status = 'active' 
             AND (expires_at IS NULL OR expires_at > NOW())`,
            [email]
        );
        return result.rows.length > 0;
    } catch (error) {
        return false;
    }
}

// ============================================
// REVENUECAT INTEGRATION
// ============================================

// Sync purchase with backend (called from mobile app after RevenueCat purchase)
app.post('/api/premium/sync', async (req, res) => {
    try {
        const { revenuecatId, isPremium, expiryDate, productIdentifier } = req.body;
        
        if (!revenuecatId || !isPremium) {
            return res.status(400).json({ error: 'Invalid data' });
        }
        
        // Generate API key for this user
        const apiKey = require('crypto').randomBytes(32).toString('hex');
        const email = `rc_${revenuecatId}@montanafishing.app`;
        
        // Determine subscription type
        const subscriptionType = productIdentifier?.includes('annual') ? 'yearly' : 'monthly';
        
        // Insert or update premium user
        await db.query(`
            INSERT INTO premium_users 
            (email, subscription_type, subscription_status, stripe_customer_id, stripe_subscription_id, expires_at, last_accessed)
            VALUES ($1, $2, 'active', $3, $4, $5, NOW())
            ON CONFLICT (email) DO UPDATE SET
                subscription_type = $2,
                subscription_status = 'active',
                expires_at = $5,
                last_accessed = NOW()
        `, [email, subscriptionType, revenuecatId, productIdentifier, expiryDate || null]);
        
        res.json({
            success: true,
            apiKey,
            email,
            isPremium: true,
            expiresAt: expiryDate
        });
    } catch (error) {
        console.error('RevenueCat sync error:', error);
        res.status(500).json({ error: error.message });
    }
});

// RevenueCat webhook endpoint
// This receives events when subscriptions change (renewals, cancellations, etc.)
app.post('/api/webhooks/revenuecat', async (req, res) => {
    try {
        // Verify webhook signature (you should set a secret in RevenueCat dashboard)
        const authHeader = req.headers.authorization;
        const expectedSecret = process.env.REVENUECAT_WEBHOOK_SECRET;
        
        if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        const event = req.body;
        console.log('RevenueCat webhook:', event.type);
        
        const { app_user_id, product_id, expiration_at_ms } = event;
        const email = `rc_${app_user_id}@montanafishing.app`;
        const expiryDate = expiration_at_ms ? new Date(expiration_at_ms) : null;
        
        switch (event.type) {
            case 'INITIAL_PURCHASE':
            case 'RENEWAL':
            case 'UNCANCELLATION':
                // Activate or extend subscription
                const subscriptionType = product_id?.includes('annual') ? 'yearly' : 'monthly';
                await db.query(`
                    INSERT INTO premium_users 
                    (email, subscription_type, subscription_status, stripe_customer_id, stripe_subscription_id, expires_at, last_accessed)
                    VALUES ($1, $2, 'active', $3, $4, $5, NOW())
                    ON CONFLICT (email) DO UPDATE SET
                        subscription_type = $2,
                        subscription_status = 'active',
                        expires_at = $5,
                        last_accessed = NOW()
                `, [email, subscriptionType, app_user_id, product_id, expiryDate]);
                console.log(`✅ Subscription activated/renewed for ${email}`);
                break;
                
            case 'CANCELLATION':
            case 'EXPIRATION':
                // Mark subscription as cancelled (will expire at expiryDate)
                await db.query(`
                    UPDATE premium_users 
                    SET subscription_status = 'cancelled', last_accessed = NOW()
                    WHERE email = $1
                `, [email]);
                console.log(`⚠️ Subscription cancelled for ${email}`);
                break;
                
            case 'BILLING_ISSUE':
                // Grace period - subscription still active but payment failed
                console.log(`⚠️ Billing issue for ${email}`);
                break;
                
            default:
                console.log(`Unhandled RevenueCat event: ${event.type}`);
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('RevenueCat webhook error:', error);
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
            'Stonefly Shop (Old)',
            'Dan Bailey\'s (Old)',
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
    
    // Get USGS water temp first (to override scraped air temps)
    const usgsData = await getUSGSData(riverName);
    let usgsWaterTemp = null;
    let usgsTempSource = null;
    
    if (usgsData && usgsData.temp) {
        const tempMatch = usgsData.temp.match(/(\d+)/);
        if (tempMatch && !usgsData.temp.includes('-999')) {
            usgsWaterTemp = usgsData.temp;
            usgsTempSource = usgsData.tempSource || 'USGS';
        }
    }
    
    // FIRST: Try to get REAL scraped hatch data from fly shop reports
    // Get the MOST RECENT hatch report across ALL sources
    try {
        const scrapedResult = await db.query(
            `SELECT hatches, fly_recommendations, water_temp, water_conditions, source, report_date 
             FROM hatch_reports 
             WHERE river = $1 
             ORDER BY report_date DESC, scraped_at DESC 
             LIMIT 1`,
            [riverName]
        );
        
        if (scrapedResult.rows.length > 0) {
            const scraped = scrapedResult.rows[0];
            console.log(`Using scraped hatch data for ${riverName} from ${scraped.source}`);
            
            // Use USGS water temp if available, otherwise fall back to scraped temp
            const finalWaterTemp = usgsWaterTemp || scraped.water_temp;
            const finalTempSource = usgsTempSource || scraped.source;
            
            return {
                hatches: scraped.hatches,
                flies: scraped.fly_recommendations || generateFlyRecommendations(scraped.hatches),
                waterTemp: finalWaterTemp,
                waterConditions: scraped.water_conditions,
                source: finalTempSource,
                reportDate: scraped.report_date,
                isScraped: true,
                isForecast: false
            };
        }
    } catch (error) {
        console.error('Error fetching scraped hatch data:', error.message);
    }
    
    // FALLBACK: Use seasonal forecast if no scraped data available
    const seasonalHatches = getStaticHatches(riverName) || getDefaultHatches(month);
    
    // Use already-fetched USGS water temperature
    let waterTemp = usgsWaterTemp ? parseInt(usgsWaterTemp.match(/(\d+)/)[1]) : null;
    let tempSource = usgsTempSource || 'Seasonal forecast';
    
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
    
    return {
        hatches: adjustedHatches,
        flies: generateFlyRecommendations(adjustedHatches),
        waterTemp: waterTemp ? `${waterTemp}°F` : null,
        waterConditions: conditions.length > 0 ? conditions.join('. ') : null,
        tempSource: tempSource,
        source: waterTemp ? `${tempSource} + seasonal forecast` : 'Seasonal forecast',
        seasonalForecast: seasonalHatches,
        isScraped: false,
        isForecast: true
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

// Cleanup removed sources endpoint
app.post('/api/admin/cleanup-removed-sources', async (req, res) => {
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== process.env.ADMIN_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    try {
        // Deactivate Trout Shop reports
        const troutShopResult = await db.query(
            "UPDATE reports SET is_active = false WHERE source = 'Trout Shop' RETURNING id, river"
        );
        
        // Deactivate Bigfork Anglers reports
        const bigforkResult = await db.query(
            "UPDATE reports SET is_active = false WHERE source = 'Bigfork Anglers' RETURNING id, river"
        );
        
        res.json({
            message: 'Cleanup completed',
            troutShop: {
                deactivated: troutShopResult.rowCount,
                entries: troutShopResult.rows
            },
            bigforkAnglers: {
                deactivated: bigforkResult.rowCount,
                entries: bigforkResult.rows
            }
        });
    } catch (error) {
        console.error('Cleanup error:', error);
        res.status(500).json({ error: error.message });
    }
});

// TEMP: Debug endpoint to check hatch data
app.get('/api/debug/hatch-reports/:river', async (req, res) => {
    try {
        const { river } = req.params;
        const result = await db.query(
            `SELECT id, river, source, hatches, report_date, scraped_at, is_current 
             FROM hatch_reports 
             WHERE river = $1 
             ORDER BY report_date DESC, scraped_at DESC 
             LIMIT 5`,
            [river]
        );
        res.json({
            river,
            count: result.rows.length,
            reports: result.rows
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin: Extract hatch data from all existing reports (one-time migration)
app.post('/api/admin/extract-all-hatch-data', async (req, res) => {
    // TEMP: Allow without auth for debugging - remove in production
    // const adminKey = req.headers['x-admin-key'];
    // if (adminKey !== process.env.ADMIN_KEY) {
    //     return res.status(401).json({ error: 'Unauthorized' });
    // }
    
    try {
        const { extractAndSaveHatchData } = require('./utils/scraperHelpers');
        
        // Get all active reports with content
        const reportsResult = await db.query(
            `SELECT id, source, river, content, last_updated 
             FROM reports 
             WHERE is_active = true AND content IS NOT NULL AND content != ''`
        );
        
        console.log(`Extracting hatch data from ${reportsResult.rows.length} reports...`);
        
        let extracted = 0;
        let skipped = 0;
        const results = [];
        
        for (const report of reportsResult.rows) {
            try {
                const result = await extractAndSaveHatchData(report, report.content);
                if (result) {
                    extracted++;
                    results.push({
                        river: report.river,
                        source: report.source,
                        hatches: result.hatches.length,
                        hatchNames: result.hatches
                    });
                    console.log(`✓ ${report.source} (${report.river}): ${result.hatches.length} hatches`);
                } else {
                    skipped++;
                }
            } catch (err) {
                console.error(`Error extracting from ${report.source}:`, err.message);
                skipped++;
            }
        }
        
        res.json({
            message: 'Hatch data extraction complete',
            totalReports: reportsResult.rows.length,
            extracted,
            skipped,
            results: results.slice(0, 20) // Limit results in response
        });
        
    } catch (error) {
        console.error('Extract all hatch data error:', error);
        res.status(500).json({ error: error.message });
    }
});

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
    console.log('Version: 2.3.2');
    console.log('Server running on port ' + PORT);
    console.log('Health: http://localhost:' + PORT + '/health');
    console.log('========================================\n');
});

module.exports = { normalizeSource, formatDateForDisplay };
// Deploy timestamp: Fri Mar 13 17:44:31 MDT 2026
// Cache clear trigger: Sun Mar 15 19:19:46 MDT 2026

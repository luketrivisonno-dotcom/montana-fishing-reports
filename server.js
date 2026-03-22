const express = require('express');
const cache = require('./utils/cache');
const cors = require('cors');
const cron = require('node-cron');
const db = require('./db');
const { runAllScrapers } = require('./scrapers');
const { getWeatherForRiver } = require('./utils/weather');
const { getUSGSData, RIVER_TYPES } = require('./utils/usgs');
const { runHatchScraper, getCurrentHatches, getStaticHatches } = require('./scrapers/hatchScraper');
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
        
        // River Reports Table (Live user-submitted conditions)
        await db.query(`CREATE TABLE IF NOT EXISTS river_reports (
            id SERIAL PRIMARY KEY,
            river VARCHAR(100) NOT NULL,
            user_email VARCHAR(255),
            user_name VARCHAR(100),
            water_color VARCHAR(50),
            water_temp INTEGER,
            fish_activity VARCHAR(50),
            fish_behavior VARCHAR(50),
            fish_caught INTEGER DEFAULT 0,
            fish_rising BOOLEAN DEFAULT FALSE,
            insects_active VARCHAR(300),
            crowd_level VARCHAR(50),
            boat_activity VARCHAR(50),
            pressure_signs VARCHAR(50),
            hours_fished DECIMAL(4,1),
            access_point VARCHAR(200),
            flies_used TEXT,
            fly_hook_size VARCHAR(10),
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        
        await db.query(`CREATE INDEX IF NOT EXISTS idx_river_reports_river ON river_reports(river)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_river_reports_created ON river_reports(created_at DESC)`);
        
        // Migration: Add new columns if they don't exist (for existing tables)
        try {
            await db.query(`ALTER TABLE river_reports ADD COLUMN IF NOT EXISTS fish_behavior VARCHAR(50)`);
            await db.query(`ALTER TABLE river_reports ADD COLUMN IF NOT EXISTS crowd_level VARCHAR(50)`);
            await db.query(`ALTER TABLE river_reports ADD COLUMN IF NOT EXISTS boat_activity VARCHAR(50)`);
            await db.query(`ALTER TABLE river_reports ADD COLUMN IF NOT EXISTS pressure_signs VARCHAR(50)`);
            await db.query(`ALTER TABLE river_reports ADD COLUMN IF NOT EXISTS hours_fished DECIMAL(4,1)`);
            await db.query(`ALTER TABLE river_reports ADD COLUMN IF NOT EXISTS fly_hook_size VARCHAR(10)`);
            await db.query(`ALTER TABLE river_reports ALTER COLUMN insects_active TYPE VARCHAR(300)`);
        } catch (e) {
            console.log('Migration note:', e.message);
        }
        
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
            const reports = result.rows.map(report => ({ 
                ...report, 
                // Use centralized date formatting
                last_updated: formatDateForDisplay(report.last_updated),
                relative_time: getReportFreshness(report.last_updated),
                original_date: report.last_updated_text || report.last_updated
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

// Send push notification (server-side for scheduled jobs)
app.post('/api/notifications/send', async (req, res) => {
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== process.env.ADMIN_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    try {
        const { tokens, title, body, data = {} } = req.body;
        
        if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
            return res.status(400).json({ error: 'Tokens array required' });
        }
        if (!title || !body) {
            return res.status(400).json({ error: 'Title and body required' });
        }
        
        const { sendBulkNotifications } = require('./utils/pushNotifications');
        const result = await sendBulkNotifications(tokens, title, body, data);
        
        res.json({
            success: true,
            sent: result.successCount || 0,
            failed: result.failureCount || 0,
            details: result
        });
    } catch (error) {
        console.error('Send notification error:', error);
        res.status(500).json({ error: error.message });
    }
});

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
            
            // Fetch user reports separately with error handling (table may not exist yet)
            let userReportsResult = { rows: [] };
            try {
                userReportsResult = await db.query(`SELECT * FROM river_reports 
                          WHERE river = $1 AND created_at > NOW() - INTERVAL '7 days'
                          ORDER BY created_at DESC LIMIT 20`, [river]);
            } catch (e) {
                console.log('User reports table not ready yet:', e.message);
                userReportsResult = { rows: [] };
            }
            
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
            
            const seenSources = new Set();
            const reports = reportsResult.rows.map(report => ({ 
                ...report, 
                // Use centralized date formatting
                last_updated: formatDateForDisplay(report.last_updated),
                relative_time: getReportFreshness(report.last_updated),
                original_date: report.last_updated_text || report.last_updated
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
            
            // Aggregate user reports
            const userReports = userReportsResult.rows || [];
            const userReportAggregates = aggregateReports(userReports);
            
            res.json({ 
                river, 
                riverType,
                weather, 
                usgs, 
                reports: reports,
                clarity,
                hatchData,
                userReports: {
                    count: userReports.length,
                    recent: userReports.slice(0, 5),
                    aggregates: userReportAggregates
                }
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
            
            return {
                hatches: scraped.hatches,
                flies: scraped.fly_recommendations || generateFlyRecommendations(scraped.hatches),
                waterTemp: scraped.water_temp,
                waterConditions: scraped.water_conditions,
                source: scraped.source,
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

// ============================================================================
// SMARTCAST ENDPOINTS - HatchCast Score API
// ============================================================================

// Get SmartCast score for a river (cache 10 min)
app.get('/api/smartcast/:river',
    apiLimiter,
    param('river').trim().escape().isLength({ min: 1, max: 100 }),
    handleValidationErrors,
    cacheMiddleware(600),
    async (req, res) => {
        try {
            const { river } = req.params;
            
            // Gather data
            const [weather, usgs] = await Promise.all([
                getWeatherForRiver(river),
                getUSGSData(river)
            ]);
            
            // Calculate HatchCast score (includes user reports)
            const smartcast = await calculateHatchCastScore(river, weather, usgs);
            
            res.json({
                river,
                smartcast,
                conditions: {
                    flow_cfs: smartcast.conditions?.flow?.cfs || null,
                    flow_trend: smartcast.conditions?.flow?.trend || null,
                    water_temp_f: smartcast.conditions?.temp?.fahrenheit || null,
                    wind_mph: weather?.windSpeed || null,
                    wind_direction: weather?.windDirection || null,
                    pressure_in: smartcast.conditions?.pressure?.pressure || null,
                    pressure_trend: smartcast.conditions?.pressure?.trend || null,
                    runoff: smartcast.conditions?.runoff || null,
                    tailwater: smartcast.conditions?.tailwater || null
                },
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('SmartCast error:', error);
            res.status(500).json({ error: 'Failed to calculate SmartCast score' });
        }
    }
);

// Tailwater dam release schedules
const TAILWATER_RIVERS = {
  'Bighorn River': { 
    dam: 'Yellowtail Dam',
    warningThreshold: 5000,
    optimalRange: [2000, 4500]
  },
  'Missouri River': { 
    dam: 'Holter Dam', 
    warningThreshold: 8000,
    optimalRange: [3000, 7000]
  },
  'Beaverhead River': {
    dam: 'Clark Canyon Dam',
    warningThreshold: 500,
    optimalRange: [150, 400]
  },
  'Lower Madison River': {
    dam: 'Ennis Lake/Hebgen',
    warningThreshold: 2500,
    optimalRange: [1000, 2000]
  },
  'Ruby River': {
    dam: 'Ruby Dam',
    warningThreshold: 300,
    optimalRange: [100, 250]
  }
};

// Runoff-prone rivers
const RUNOFF_RIVERS = [
  'Yellowstone River', 'Gallatin River', 'Big Hole River',
  'Bitterroot River', 'Rock Creek', 'Stillwater River',
  'Boulder River', 'Swan River'
];

// Check if river is in runoff
function isRunoff(riverName, flowCfs, month) {
  if (!RUNOFF_RIVERS.includes(riverName)) return { inRunoff: false, highFlow: false };
  
  const isRunoffSeason = month >= 5 && month <= 7;
  const highFlowThresholds = {
    'Yellowstone River': 15000, 'Gallatin River': 3000, 'Big Hole River': 3000,
    'Bitterroot River': 4000, 'Rock Creek': 800, 'Stillwater River': 2500,
    'Boulder River': 1500, 'Swan River': 4000
  };
  
  const threshold = highFlowThresholds[riverName] || 5000;
  const isHighFlow = flowCfs && flowCfs > threshold;
  
  return {
    inRunoff: isRunoffSeason && isHighFlow,
    highFlow: isHighFlow,
    runoffSeason: isRunoffSeason,
    threshold: threshold
  };
}

// Get flow trend from USGS data
async function getFlowTrend(riverName, currentFlow) {
  const site = USGS_SITES[riverName];
  if (!site || !currentFlow) return { trend: 'stable', change: 0, changePercent: 0 };
  
  try {
    const response = await axios.get(
      `https://waterservices.usgs.gov/nwis/iv/?format=json&sites=${site.id}&parameterCd=00060&period=P2D`,
      { timeout: 5000 }
    );
    
    const values = response.data.value?.timeSeries?.[0]?.values?.[0]?.value;
    if (!values || values.length < 2) return { trend: 'stable', change: 0, changePercent: 0 };
    
    const yesterdayValue = parseFloat(values[0].value);
    const currentValue = parseFloat(values[values.length - 1].value);
    
    if (isNaN(yesterdayValue) || isNaN(currentValue)) {
      return { trend: 'stable', change: 0, changePercent: 0 };
    }
    
    const change = currentValue - yesterdayValue;
    const changePercent = (change / yesterdayValue) * 100;
    
    let trend = 'stable';
    if (changePercent > 15) trend = 'rising_fast';
    else if (changePercent > 5) trend = 'rising';
    else if (changePercent < -15) trend = 'falling_fast';
    else if (changePercent < -5) trend = 'falling';
    
    return { 
      trend, 
      change: Math.round(change),
      changePercent: Math.round(changePercent * 10) / 10
    };
  } catch (error) {
    return { trend: 'stable', change: 0, changePercent: 0 };
  }
}

// Get barometric pressure from Open-Meteo
async function getBarometricPressure(lat, lon) {
  try {
    const response = await axios.get(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=surface_pressure&timezone=America/Denver&forecast_days=2`,
      { timeout: 5000 }
    );
    
    const pressures = response.data.hourly?.surface_pressure;
    if (!pressures || pressures.length < 25) return null;
    
    const current = pressures[0];
    const yesterday = pressures[24];
    const trend = current > yesterday ? 'rising' : current < yesterday ? 'falling' : 'steady';
    
    return {
      pressure: parseFloat((current * 0.02953).toFixed(2)),
      trend: trend,
      change: parseFloat(((current - yesterday) * 0.02953).toFixed(2))
    };
  } catch (error) {
    return null;
  }
}

// Calculate HatchCast score based on ALL conditions
async function calculateHatchCastScore(river, weather, usgs) {
    let score = 40; // Lower base score
    const factors = [];
    const month = new Date().getMonth() + 1;
    
    // Parse flow data
    let flowCfs = null;
    if (usgs?.flow && usgs.flow !== 'Ice/No Data' && usgs.flow !== 'Seasonal Gauge') {
        flowCfs = parseInt(usgs.flow);
    }
    
    // Parse water temp
    let waterTemp = null;
    if (usgs?.temp) {
        const tempMatch = usgs.temp.match(/(\d+)/);
        if (tempMatch) waterTemp = parseInt(tempMatch[1]);
    }
    
    // =====================
    // 1. RUNOFF DETECTION (Can kill the score)
    // =====================
    const runoff = isRunoff(river, flowCfs, month);
    if (runoff.inRunoff) {
        score -= 30;
        factors.push({ name: 'runoff conditions', score: -30, icon: '🌊' });
    } else if (runoff.highFlow) {
        score -= 10;
        factors.push({ name: 'high water', score: -10, icon: '💧' });
    }
    
    // =====================
    // 2. FLOW TREND (0-20 points)
    // =====================
    const flowTrend = await getFlowTrend(river, flowCfs);
    let flowTrendScore = 10;
    let flowTrendLabel = 'stable';
    
    if (flowTrend.trend === 'falling') {
        flowTrendScore = 20; flowTrendLabel = 'falling (good)';
    } else if (flowTrend.trend === 'falling_fast') {
        flowTrendScore = 12; flowTrendLabel = 'falling fast';
    } else if (flowTrend.trend === 'rising') {
        flowTrendScore = 5; flowTrendLabel = 'rising (poor)';
    } else if (flowTrend.trend === 'rising_fast') {
        flowTrendScore = 0; flowTrendLabel = 'rising fast (blowout!)';
    }
    
    score += flowTrendScore;
    factors.push({ 
        name: `flow trend: ${flowTrendLabel}`, 
        score: flowTrendScore,
        change: flowTrend.change,
        icon: flowTrend.trend.includes('falling') ? '📉' : flowTrend.trend.includes('rising') ? '📈' : '➡️'
    });
    
    // =====================
    // 3. FLOW LEVEL (0-15 points)
    // =====================
    const optimalFlows = {
        'Upper Madison River': { min: 800, max: 2500 },
        'Lower Madison River': { min: 1000, max: 2000 },
        'Missouri River': { min: 3000, max: 7000 },
        'Yellowstone River': { min: 2000, max: 6000 },
        'Gallatin River': { min: 300, max: 1500 },
        'Bighorn River': { min: 2000, max: 4500 },
        'Bitterroot River': { min: 500, max: 2000 },
        'Beaverhead River': { min: 150, max: 400 },
        'Big Hole River': { min: 1000, max: 2000 },
        'Rock Creek': { min: 100, max: 500 },
        'Stillwater River': { min: 300, max: 1200 },
        'Boulder River': { min: 150, max: 600 }
    };
    
    const flowRange = optimalFlows[river];
    let flowLevelScore = 8;
    
    if (flowCfs && flowRange) {
        if (flowCfs >= flowRange.min && flowCfs <= flowRange.max) flowLevelScore = 15;
        else if (flowCfs >= flowRange.min * 0.7 && flowCfs <= flowRange.max * 1.3) flowLevelScore = 10;
        else if (flowCfs >= flowRange.min * 0.5 && flowCfs <= flowRange.max * 1.5) flowLevelScore = 5;
        else flowLevelScore = 2;
    }
    score += flowLevelScore;
    factors.push({ name: 'flow level', score: flowLevelScore, cfs: flowCfs, icon: '🌊' });
    
    // =====================
    // 4. TAILWATER/DAM STATUS (0-10 points)
    // =====================
    const tailwater = TAILWATER_RIVERS[river];
    let damScore = 0;
    
    if (tailwater) {
        if (flowCfs && flowCfs > tailwater.warningThreshold) {
            damScore = 2;
            factors.push({ name: `${tailwater.dam}: variable flows`, score: damScore, icon: '🏗️', warning: 'Check dam schedule' });
        } else if (flowCfs && flowCfs >= tailwater.optimalRange[0] && flowCfs <= tailwater.optimalRange[1]) {
            damScore = 10;
            factors.push({ name: `${tailwater.dam}: steady flows`, score: damScore, icon: '✅' });
        } else {
            damScore = 5;
            factors.push({ name: `${tailwater.dam}: moderate flows`, score: damScore, icon: '🏗️' });
        }
        score += damScore;
    }
    
    // =====================
    // 5. WATER TEMPERATURE (0-15 points)
    // =====================
    let tempScore = 8;
    if (waterTemp) {
        if (waterTemp >= 50 && waterTemp <= 65) tempScore = 15;
        else if (waterTemp >= 45 && waterTemp <= 70) tempScore = 12;
        else if (waterTemp >= 40 && waterTemp <= 75) tempScore = 8;
        else if (waterTemp > 75) tempScore = 3;
        else tempScore = 4;
    }
    score += tempScore;
    factors.push({ name: 'water temp', score: tempScore, temp: waterTemp, icon: '🌡️' });
    
    // =====================
    // 6. BAROMETRIC PRESSURE (0-10 points)
    // =====================
    let pressureScore = 5;
    let pressureData = null;
    
    const location = RIVER_LOCATIONS[river];
    if (location) {
        pressureData = await getBarometricPressure(location.lat, location.lon);
    }
    
    if (pressureData) {
        const pressure = pressureData.pressure;
        const trend = pressureData.trend;
        
        if (pressure >= 29.80 && pressure <= 30.40) {
            if (trend === 'falling') pressureScore = 10;
            else if (trend === 'rising') pressureScore = 7;
            else pressureScore = 8;
        } else if (pressure >= 29.50 && pressure <= 30.70) {
            pressureScore = trend === 'falling' ? 8 : 5;
        } else {
            pressureScore = 3;
        }
        
        factors.push({ 
            name: `barometric: ${pressure}" ${trend}`, 
            score: pressureScore,
            pressure: pressure,
            trend: trend,
            icon: '🌡️'
        });
        score += pressureScore;
    }
    
    // =====================
    // 7. WIND (0-10 points)
    // =====================
    let windScore = 5;
    if (weather) {
        const windSpeed = weather.windSpeed || 0;
        if (windSpeed <= 5) windScore = 10;
        else if (windSpeed <= 10) windScore = 8;
        else if (windSpeed <= 15) windScore = 5;
        else if (windSpeed <= 20) windScore = 2;
        else windScore = 0;
    }
    score += windScore;
    factors.push({ name: 'wind', score: windScore, mph: weather?.windSpeed, icon: '💨' });
    
    // =====================
    // 8. WEATHER CONDITIONS (0-10 points)
    // =====================
    let weatherCondScore = 5;
    if (weather) {
        const airTemp = weather.high || 60;
        if (airTemp >= 55 && airTemp <= 75) weatherCondScore = 10;
        else if (airTemp >= 45 && airTemp <= 85) weatherCondScore = 7;
        else if (airTemp > 85) weatherCondScore = 4;
        else weatherCondScore = 5;
        
        if (weather.condition?.includes('rain') || weather.condition?.includes('shower')) {
            weatherCondScore -= 2;
        }
    }
    score += weatherCondScore;
    factors.push({ name: 'air temp/sky', score: weatherCondScore, icon: weather?.icon || '☁️' });
    
    // =====================
    // 9. USER REPORTS (0-15 points)
    // =====================
    let userReportScore = 0;
    let userReportCount = 0;
    
    try {
        const reportResult = await db.query(`
            SELECT * FROM river_reports 
            WHERE river = $1 
            AND created_at > NOW() - INTERVAL '3 days'
            ORDER BY created_at DESC
            LIMIT 20
        `, [river]);
        
        if (reportResult.rows.length > 0) {
            const userReportData = aggregateReports(reportResult.rows);
            userReportCount = userReportData.reportCount;
            
            let activityScore = 0, clarityScore = 0;
            
            const activity = userReportData.mostCommonFishActivity;
            if (activity === 'rising') activityScore = 10;
            else if (activity === 'active') activityScore = 7;
            else if (activity === 'slow') activityScore = 3;
            
            if (userReportData.avgWaterClarity) {
                if (userReportData.avgWaterClarity >= 7) clarityScore = 5;
                else if (userReportData.avgWaterClarity >= 5) clarityScore = 3;
                else clarityScore = 1;
            }
            
            userReportScore = activityScore + clarityScore;
            const confidenceMultiplier = Math.min(1, userReportCount / 5);
            userReportScore = Math.round(userReportScore * confidenceMultiplier);
        }
    } catch (e) {
        console.log('User reports not available:', e.message);
    }
    
    if (userReportScore > 0) {
        score += userReportScore;
        factors.push({ name: `angler reports (${userReportCount})`, score: userReportScore, icon: '👥' });
    }
    
    // =====================
    // 10. SOLUNAR (0-10 points)
    // =====================
    const solunar = calculateSolunarScore();
    score += solunar.score;
    factors.push({ name: 'solunar', score: solunar.score, icon: '🌙' });
    
    // =====================
    // 11. SEASONAL (0-5 points)
    // =====================
    let seasonalScore = 3;
    if ([5, 6, 9, 10].includes(month)) seasonalScore = 5;
    else if ([4, 7, 8].includes(month)) seasonalScore = 4;
    else if ([3, 11].includes(month)) seasonalScore = 3;
    else seasonalScore = 2;
    score += seasonalScore;
    factors.push({ name: 'season', score: seasonalScore, icon: '📅' });
    
    // Clamp score to 0-100
    score = Math.max(0, Math.min(100, score));
    
    // Determine quality
    let quality = 'Poor', recommendation = 'Conditions are tough - consider a different river.', emoji = '😞';
    
    if (score >= 80) {
        quality = 'Excellent'; recommendation = 'Prime conditions! Get out there and fish.'; emoji = '🎣🔥';
    } else if (score >= 60) {
        quality = 'Good'; recommendation = 'Solid conditions - should be good fishing.'; emoji = '👍';
    } else if (score >= 40) {
        quality = 'Fair'; recommendation = 'Decent conditions but may be challenging.'; emoji = '🤔';
    } else if (score >= 20) {
        quality = 'Poor'; recommendation = 'Tough conditions. Pick your spots carefully.'; emoji = '😬';
    }
    
    // Add warnings
    if (runoff.inRunoff) {
        recommendation = '⚠️ River in runoff - unfishable or dangerous.'; emoji = '🌊⚠️';
    } else if (flowTrend.trend === 'rising_fast') {
        recommendation = '⚠️ Flows rising quickly - wait for them to drop.';
    }
    
    return {
        score,
        quality: { label: quality, emoji },
        factors: factors.sort((a, b) => Math.abs(b.score) - Math.abs(a.score)),
        recommendation,
        conditions: {
            flow: { cfs: flowCfs, trend: flowTrend },
            temp: { fahrenheit: waterTemp },
            pressure: pressureData,
            runoff: runoff,
            tailwater: tailwater ? { name: tailwater.dam } : null
        },
        best_window: generateBestWindow(solunar),
        solunar: solunar.data
    };
}

function generateBestWindow(solunar) {
    const now = new Date();
    const hour = now.getHours();
    if (hour >= 6 && hour < 10) return 'Now through noon';
    if (hour >= 10 && hour < 14) return 'Evening rise (5-8 PM)';
    if (hour >= 14 && hour < 18) return 'Evening rise (5-8 PM)';
    return 'Early morning (6-9 AM)';
}

function calculateSolunarScore() {
    const now = new Date();
    const times = getSolunarTimes(now);
    
    // Calculate how close we are to major feeding periods
    const currentHour = now.getHours() + now.getMinutes() / 60;
    let closestMajorDistance = 24;
    
    for (const period of times.periods) {
        if (period.type === 'major') {
            const periodHour = parseInt(period.time.split(':')[0]);
            const distance = Math.abs(currentHour - periodHour);
            if (distance < closestMajorDistance) {
                closestMajorDistance = distance;
            }
        }
    }
    
    let score = 5; // Base score
    if (closestMajorDistance < 1) score = 15;
    else if (closestMajorDistance < 2) score = 12;
    else if (closestMajorDistance < 3) score = 10;
    else if (closestMajorDistance < 4) score = 8;
    else if (closestMajorDistance < 6) score = 6;
    
    return {
        score,
        data: {
            activity_rating: score >= 12 ? 'High' : score >= 8 ? 'Good' : 'Low',
            feeding_periods: times.periods.slice(0, 4)
        }
    };
}

// ============================================================================
// SOLUNAR ENDPOINTS
// ============================================================================

// Get solunar feeding times for a river (cache 1 hour)
app.get('/api/solunar/:river',
    apiLimiter,
    param('river').trim().escape().isLength({ min: 1, max: 100 }),
    handleValidationErrors,
    cacheMiddleware(3600),
    async (req, res) => {
        try {
            const { river } = req.params;
            const { RIVER_LOCATIONS } = require('./utils/weather');
            const location = RIVER_LOCATIONS[river];
            
            if (!location) {
                return res.status(404).json({ error: 'River location not found' });
            }
            
            const solunarData = getSolunarTimes(new Date(), location.lat, location.lon);
            
            res.json({
                river,
                location: { lat: location.lat, lon: location.lon },
                ...solunarData
            });
        } catch (error) {
            console.error('Solunar error:', error);
            res.status(500).json({ error: 'Failed to calculate solunar data' });
        }
    }
);

// Calculate solunar times
function getSolunarTimes(date, lat = 45.5, lon = -111.0) {
    // Simplified solunar calculation
    // Major periods: ~2 hours around moon overhead and underfoot
    // Minor periods: ~1 hour around moonrise and moonset
    
    const now = new Date(date);
    const moonPhase = getMoonPhase(now);
    
    // Calculate periods based on moon transit times (simplified)
    // In production, you'd use a proper astronomical calculation library
    const transit1 = 6; // Moon overhead (approx)
    const transit2 = 18; // Moon underfoot (approx)
    
    const periods = [];
    
    // Major periods (moon overhead/underfoot)
    periods.push({
        time: formatTime(transit1),
        type: 'major',
        position: 'overhead',
        rating: moonPhase > 0.25 && moonPhase < 0.75 ? 'excellent' : 'good'
    });
    
    periods.push({
        time: formatTime(transit2),
        type: 'major',
        position: 'underfoot',
        rating: moonPhase > 0.25 && moonPhase < 0.75 ? 'excellent' : 'good'
    });
    
    // Minor periods (dawn/dusk)
    periods.push({
        time: '6:30 AM',
        type: 'minor',
        position: 'dawn',
        rating: 'good'
    });
    
    periods.push({
        time: '7:30 PM',
        type: 'minor',
        position: 'dusk',
        rating: 'good'
    });
    
    // Sort by time
    periods.sort((a, b) => {
        const aHour = parseInt(a.time.split(':')[0]) + (a.time.includes('PM') ? 12 : 0);
        const bHour = parseInt(b.time.split(':')[0]) + (b.time.includes('PM') ? 12 : 0);
        return aHour - bHour;
    });
    
    return {
        date: now.toISOString().split('T')[0],
        moon_phase: moonPhase,
        moon_phase_name: getMoonPhaseName(moonPhase),
        activity_rating: moonPhase > 0.2 && moonPhase < 0.8 ? 'High' : 'Moderate',
        periods,
        best_times: periods
            .filter(p => p.type === 'major')
            .map(p => p.time)
            .slice(0, 2)
    };
}

function getMoonPhase(date) {
    // Simplified moon phase calculation
    const knownNewMoon = new Date('2000-01-06').getTime();
    const lunarCycle = 29.53058867 * 24 * 60 * 60 * 1000;
    const diff = date.getTime() - knownNewMoon;
    const cycles = diff / lunarCycle;
    return cycles - Math.floor(cycles);
}

function getMoonPhaseName(phase) {
    if (phase < 0.03) return 'New Moon';
    if (phase < 0.22) return 'Waxing Crescent';
    if (phase < 0.28) return 'First Quarter';
    if (phase < 0.47) return 'Waxing Gibbous';
    if (phase < 0.53) return 'Full Moon';
    if (phase < 0.72) return 'Waning Gibbous';
    if (phase < 0.78) return 'Last Quarter';
    if (phase < 0.97) return 'Waning Crescent';
    return 'New Moon';
}

function formatTime(hour24) {
    const hour = Math.floor(hour24);
    const min = Math.round((hour24 - hour) * 60);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${min.toString().padStart(2, '0')} ${ampm}`;
}

// ============================================================================
// HATCHCAST FORECAST ENDPOINT
// ============================================================================

// Get detailed hatch forecast for a river (cache 1 hour)
app.get('/api/hatchcast/forecast/:river',
    apiLimiter,
    param('river').trim().escape().isLength({ min: 1, max: 100 }),
    handleValidationErrors,
    cacheMiddleware(3600),
    async (req, res) => {
        try {
            const { river } = req.params;
            
            // Get current hatches
            const hatchData = await getDynamicHatchData(river);
            
            // Generate forecast for next 7 days
            const forecast = generateHatchForecast(river, hatchData);
            
            res.json({
                river,
                current: hatchData,
                forecast,
                generated_at: new Date().toISOString()
            });
        } catch (error) {
            console.error('HatchCast forecast error:', error);
            res.status(500).json({ error: 'Failed to generate forecast' });
        }
    }
);

function generateHatchForecast(river, currentHatches) {
    const forecast = [];
    const today = new Date();
    
    // Weather factors that affect hatches
    const weatherFactors = ['warming', 'stable', 'front_approaching', 'post_front', 'cooling'];
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        // Base confidence on how far out
        const baseConfidence = Math.max(20, 90 - (i * 10));
        
        // Determine likely hatches for this date
        const likelyHatches = [];
        const month = date.getMonth() + 1;
        
        // Month-based hatch predictions
        const monthHatches = {
            3: ['BWO', 'Midges', 'Skwalas'],
            4: ['BWO', 'March Browns', 'Caddis'],
            5: ['March Browns', 'Caddis', 'PMDs', 'Salmonflies'],
            6: ['Salmonflies', 'Golden Stones', 'PMDs', 'Caddis'],
            7: ['PMDs', 'Caddis', 'Yellow Sallies', 'Golden Stones'],
            8: ['Tricos', 'Caddis', 'Hoppers', 'Ants'],
            9: ['BWO', 'Tricos', 'Hoppers', 'October Caddis'],
            10: ['BWO', 'October Caddis', 'Midges'],
            11: ['Midges', 'BWO'],
            12: ['Midges'],
            1: ['Midges'],
            2: ['Midges', 'BWO']
        };
        
        const possibleHatches = monthHatches[month] || ['Midges'];
        
        // Add hatches with varying confidence
        possibleHatches.forEach((hatch, idx) => {
            const confidence = Math.max(10, baseConfidence - (idx * 15));
            if (confidence > 30) {
                likelyHatches.push({
                    insect: hatch,
                    confidence,
                    timing: getHatchTiming(hatch),
                    intensity: confidence > 70 ? 'heavy' : confidence > 40 ? 'moderate' : 'light'
                });
            }
        });
        
        forecast.push({
            date: dateStr,
            day: dayName,
            hatches: likelyHatches.slice(0, 3),
            weather_factor: weatherFactors[i % weatherFactors.length],
            confidence: baseConfidence,
            best_window: likelyHatches.length > 0 ? `${getHatchTiming(likelyHatches[0].insect)}` : null
        });
    }
    
    return forecast;
}

function getHatchTiming(insect) {
    const timings = {
        'BWO': 'Afternoon (1-4 PM)',
        'PMDs': 'Late morning (10 AM-1 PM)',
        'Caddis': 'Evening (6-9 PM)',
        'Tricos': 'Early morning (7-10 AM)',
        'Midges': 'Morning & Evening',
        'Hoppers': 'Midday (11 AM-3 PM)',
        'Salmonflies': 'Afternoon (1-5 PM)',
        'Golden Stones': 'Afternoon (1-5 PM)',
        'Yellow Sallies': 'Afternoon (2-5 PM)',
        'March Browns': 'Late morning (10 AM-1 PM)',
        'Skwalas': 'Afternoon (12-4 PM)',
        'October Caddis': 'Evening (5-8 PM)',
        'Ants': 'Midday',
        'Beetles': 'Midday'
    };
    return timings[insect] || 'Variable';
}

// ============================================================================
// LIVE RIVER REPORTS - User-submitted conditions
// ============================================================================

// Test endpoint to verify API is working
app.get('/api/river-reports/test', (req, res) => {
    res.json({ status: 'ok', message: 'River reports API is working', timestamp: new Date().toISOString() });
});

// Simple test without validation
app.get('/api/river-reports/ping', (req, res) => {
    res.json({ pong: true, time: Date.now() });
});

// Debug: List all registered routes
app.get('/api/routes', (req, res) => {
    const routes = [];
    app._router.stack.forEach((middleware) => {
        if (middleware.route) {
            routes.push(Object.keys(middleware.route.methods)[0].toUpperCase() + ' ' + middleware.route.path);
        } else if (middleware.name === 'router') {
            middleware.handle.stack.forEach((handler) => {
                if (handler.route) {
                    const method = Object.keys(handler.route.methods)[0].toUpperCase();
                    const path = handler.route.path;
                    routes.push(method + ' ' + path);
                }
            });
        }
    });
    res.json({ routes: routes.filter(r => r.includes('river-reports')) });
});

// Submit a river report
app.post('/api/river-reports',
    body('river').trim().notEmpty().isLength({ max: 100 }),
    body('user_email').optional().trim().isEmail(),
    body('water_color').optional().trim(),
    body('fish_activity').optional().trim(),
    handleValidationErrors,
    async (req, res) => {
        try {
            const {
                river, user_email, user_name,
                water_color, water_temp,
                fish_activity, fish_behavior, insects_active, fish_caught, fish_rising,
                crowd_level, boat_activity, pressure_signs, hours_fished,
                access_point, flies_used, fly_hook_size, notes
            } = req.body;
            
            const result = await db.query(`
                INSERT INTO river_reports (
                    river, user_email, user_name,
                    water_color, water_temp,
                    fish_activity, fish_behavior, insects_active, fish_caught, fish_rising,
                    crowd_level, boat_activity, pressure_signs, hours_fished,
                    access_point, flies_used, fly_hook_size, notes
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
                RETURNING *
            `, [
                river, user_email, user_name,
                water_color, water_temp ? parseInt(water_temp) : null,
                fish_activity, fish_behavior, insects_active, fish_caught || 0, fish_rising || false,
                crowd_level, boat_activity, pressure_signs, hours_fished ? parseFloat(hours_fished) : null,
                access_point, flies_used, fly_hook_size, notes
            ]);
            
            res.json({ success: true, report: result.rows[0] });
        } catch (error) {
            console.error('Submit report error:', error);
            res.status(500).json({ error: 'Failed to submit report', details: error.message });
        }
    }
);

// Get recent river reports (last 7 days)
app.get('/api/river-reports/:river',
    param('river').trim().escape(),
    cacheMiddleware(300),
    async (req, res) => {
        try {
            const { river } = req.params;
            const days = parseInt(req.query.days) || 7;
            
            const result = await db.query(`
                SELECT * FROM river_reports 
                WHERE river = $1 
                AND created_at > NOW() - INTERVAL '${days} days'
                ORDER BY created_at DESC
                LIMIT 50
            `, [river]);
            
            // Aggregate conditions from reports
            const aggregates = aggregateReports(result.rows);
            
            res.json({
                river,
                count: result.rows.length,
                reports: result.rows,
                aggregates
            });
        } catch (error) {
            console.error('Get reports error:', error);
            res.status(500).json({ error: 'Failed to fetch reports' });
        }
    }
);

// Get user's reports
app.get('/api/river-reports/user/:email',
    param('email').trim().isEmail(),
    async (req, res) => {
        try {
            const { email } = req.params;
            
            const result = await db.query(`
                SELECT * FROM river_reports 
                WHERE user_email = $1 
                ORDER BY created_at DESC
                LIMIT 100
            `, [email]);
            
            res.json({
                count: result.rows.length,
                reports: result.rows
            });
        } catch (error) {
            console.error('Get user reports error:', error);
            res.status(500).json({ error: 'Failed to fetch user reports' });
        }
    }
);

// Aggregate report data for HatchCast
function aggregateReports(reports) {
    if (!reports || reports.length === 0) return null;
    
    const waterColors = {};
    const fishActivities = {};
    const fishBehaviors = {};
    const crowdLevels = {};
    const boatActivity = {};
    const pressureSigns = {};
    
    let totalFishCaught = 0;
    let fishRisingCount = 0;
    let totalHoursFished = 0;
    let hoursCount = 0;
    
    reports.forEach(r => {
        // Water conditions
        if (r.water_color) waterColors[r.water_color] = (waterColors[r.water_color] || 0) + 1;
        
        // Fish activity
        if (r.fish_activity) fishActivities[r.fish_activity] = (fishActivities[r.fish_activity] || 0) + 1;
        if (r.fish_behavior) fishBehaviors[r.fish_behavior] = (fishBehaviors[r.fish_behavior] || 0) + 1;
        if (r.fish_caught) totalFishCaught += parseInt(r.fish_caught);
        if (r.fish_rising) fishRisingCount++;
        
        // NEW: Crowd & pressure data
        if (r.crowd_level) crowdLevels[r.crowd_level] = (crowdLevels[r.crowd_level] || 0) + 1;
        if (r.boat_activity) boatActivity[r.boat_activity] = (boatActivity[r.boat_activity] || 0) + 1;
        if (r.pressure_signs) pressureSigns[r.pressure_signs] = (pressureSigns[r.pressure_signs] || 0) + 1;
        
        if (r.hours_fished) {
            totalHoursFished += parseFloat(r.hours_fished);
            hoursCount++;
        }
    });
    
    const mostCommon = (obj) => Object.entries(obj).sort((a, b) => b[1] - a[1])[0]?.[0];
    
    return {
        reportCount: reports.length,
        
        // Water
        mostCommonWaterColor: mostCommon(waterColors),
        
        // Fish activity
        mostCommonFishActivity: mostCommon(fishActivities),
        mostCommonFishBehavior: mostCommon(fishBehaviors),
        totalFishCaught,
        fishRisingPercent: reports.length > 0 ? Math.round((fishRisingCount / reports.length) * 100) : 0,
        avgCatchesPerReport: reports.length > 0 ? (totalFishCaught / reports.length).toFixed(1) : 0,
        
        // NEW: Crowd & pressure (for algorithm training)
        mostCommonCrowdLevel: mostCommon(crowdLevels),
        mostCommonBoatActivity: mostCommon(boatActivity),
        mostCommonPressureSign: mostCommon(pressureSigns),
        avgHoursFished: hoursCount > 0 ? (totalHoursFished / hoursCount).toFixed(1) : null,
        
        latestReport: reports[0]
    };
}

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

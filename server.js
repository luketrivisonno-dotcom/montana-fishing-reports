const express = require('express');
const cache = require('./utils/cache');
const cors = require('cors');
const cron = require('node-cron');
const db = require('./db');
const { runAllScrapers } = require('./scrapers');
const { getWeatherForRiver } = require('./utils/weather');
const { getUSGSData } = require('./utils/usgs');
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
        
        await db.query(`CREATE INDEX IF NOT EXISTS idx_river ON reports(river)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_scraped_at ON reports(scraped_at)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_source_normalized ON reports(source_normalized)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON analytics(timestamp)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_premium_email ON premium_users(email)`);
        
        await db.query(`ALTER TABLE reports ADD COLUMN IF NOT EXISTS source_normalized VARCHAR(100)`);
        await db.query(`ALTER TABLE reports ADD COLUMN IF NOT EXISTS last_updated_text VARCHAR(50)`);
        
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
        const brokenResult = await db.query(`
            DELETE FROM reports
            WHERE url IS NULL OR url = '' OR url = 'undefined' OR url = 'null' OR url NOT LIKE 'http%'
            RETURNING id
        `);
        const dupResult = await db.query(`
            DELETE FROM reports
            WHERE id IN (
                SELECT id FROM (
                    SELECT id, ROW_NUMBER() OVER (PARTITION BY river, source_normalized ORDER BY scraped_at DESC) as rn
                    FROM reports WHERE source_normalized IS NOT NULL
                ) t WHERE t.rn > 1
            ) RETURNING id
        `);
        console.log(`Cleanup complete: Removed ${brokenResult.rowCount} broken links and ${dupResult.rowCount} duplicates`);
        return { broken: brokenResult.rowCount, duplicates: dupResult.rowCount };
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
        res.json({ message: 'Scrape completed', results });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Cleanup endpoint
app.post('/api/cleanup', async (req, res) => {
    try {
        const cleanup = await runDatabaseCleanup();
        const counts = await db.query(`SELECT COUNT(*) as total_reports, COUNT(DISTINCT river) as unique_rivers, COUNT(DISTINCT source) as unique_sources FROM reports WHERE is_active = true`);
        res.json({ message: 'Cleanup completed successfully', removed: cleanup, stats: counts.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all rivers
app.get('/api/rivers', apiLimiter, async (req, res) => {
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
    async (req, res) => {
        try {
            const { river } = req.params;
            const result = await db.query(
                `SELECT id, source, river, url, last_updated, last_updated_text, scraped_at 
                 FROM reports WHERE river = $1 AND is_active = true ORDER BY scraped_at DESC`, 
                [river]
            );
            const reports = result.rows.map(report => ({ 
                ...report, 
                last_updated: formatDateForDisplay(report.last_updated) 
            }));
            res.json({ river: river, count: reports.length, reports: reports });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

// Get weather for a river
app.get('/api/weather/:river', 
    apiLimiter,
    param('river').trim().escape().isLength({ min: 1, max: 100 }),
    handleValidationErrors,
    async (req, res) => {
        try {
            const weather = await getWeatherForRiver(req.params.river);
            weather ? res.json(weather) : res.status(404).json({ error: 'Weather data not available' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

// Get USGS data for a river
app.get('/api/usgs/:river', 
    apiLimiter,
    param('river').trim().escape().isLength({ min: 1, max: 100 }),
    handleValidationErrors,
    async (req, res) => {
        try {
            const data = await getUSGSData(req.params.river);
            data ? res.json(data) : res.status(404).json({ error: 'USGS data not available' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

// Get full river details
app.get('/api/river-details/:river', 
    apiLimiter,
    param('river').trim().escape().isLength({ min: 1, max: 100 }),
    handleValidationErrors,
    async (req, res) => {
        try {
            const { river } = req.params;
            const [weather, usgs, reportsResult] = await Promise.all([
                getWeatherForRiver(river),
                getUSGSData(river),
                db.query(`SELECT id, source, river, url, last_updated, last_updated_text, scraped_at 
                          FROM reports WHERE river = $1 AND is_active = true 
                          AND source NOT LIKE '%USGS%' AND url IS NOT NULL 
                          AND url != '' AND url LIKE 'http%' ORDER BY scraped_at DESC`, 
                         [river])
            ]);
            
            const seenSources = new Set();
            const reports = reportsResult.rows.map(report => ({ 
                ...report, 
                last_updated: formatDateForDisplay(report.last_updated) 
            })).filter(report => {
                const normalized = normalizeSource(report.source);
                if (seenSources.has(normalized)) return false;
                seenSources.add(normalized);
                return true;
            });
            
            res.json({ river, weather, usgs, reports: reports });
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

// Public hatch API (limited data)
app.get('/api/hatches/:river',
    apiLimiter,
    param('river').trim().escape(),
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

const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const db = require('./db');
const { runAllScrapers } = require('./scrapers');
const { getWeatherForRiver } = require('./utils/weather');
const { getUSGSData } = require('./utils/usgs');
const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

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

async function runDatabaseCleanup() {
    try {
        console.log('🧹 Running database cleanup...');
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
        console.log(`✅ Cleanup complete: Removed ${brokenResult.rowCount} broken links and ${dupResult.rowCount} duplicates`);
        return { broken: brokenResult.rowCount, duplicates: dupResult.rowCount };
    } catch (error) {
        console.error('❌ Cleanup error:', error.message);
        return { error: error.message };
    }
}

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
        await db.query(`ALTER TABLE reports ADD COLUMN IF NOT EXISTS source_normalized VARCHAR(100)`);
        await db.query(`ALTER TABLE reports ADD COLUMN IF NOT EXISTS last_updated_text VARCHAR(50)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_river ON reports(river)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_scraped_at ON reports(scraped_at)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_source_normalized ON reports(source_normalized)`);
        await db.query(`UPDATE reports SET source_normalized = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(source, '\\([^)]*\\)', '', 'g'), '[^a-zA-Z0-9]', '', 'g')) WHERE source_normalized IS NULL OR source_normalized = ''`);
        await db.query(`UPDATE reports SET last_updated_text = last_updated::text WHERE last_updated_text IS NULL AND last_updated IS NOT NULL`);
        console.log('✅ Database schema updated');
        await runDatabaseCleanup();
    } catch (error) {
        console.error('❌ Database init error:', error.message);
    }
}

initDatabase();

cron.schedule('0 */6 * * *', () => {
    console.log('Running scheduled scrape...');
    runAllScrapers();
});

app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'Montana Fishing Reports API', version: '2.2', timestamp: new Date().toISOString() });
});

app.post('/api/scrape', async (req, res) => {
    try {
        const results = await runAllScrapers();
        res.json({ message: 'Scrape completed', results });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/cleanup', async (req, res) => {
    try {
        const cleanup = await runDatabaseCleanup();
        const counts = await db.query(`SELECT COUNT(*) as total_reports, COUNT(DISTINCT river) as unique_rivers, COUNT(DISTINCT source) as unique_sources FROM reports WHERE is_active = true`);
        res.json({ message: 'Cleanup completed successfully', removed: cleanup, stats: counts.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/rivers', async (req, res) => {
    try {
        const result = await db.query(`SELECT DISTINCT river FROM reports WHERE is_active = true ORDER BY river`);
        const filteredRivers = result.rows.map(r => r.river).filter(river => river !== 'General Montana' && river !== 'Montana General' && river !== 'Madison River');
        res.json({ count: filteredRivers.length, rivers: filteredRivers });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/reports/:river', async (req, res) => {
    try {
        const { river } = req.params;
        const result = await db.query(`SELECT id, source, river, url, last_updated, last_updated_text, scraped_at FROM reports WHERE river = $1 AND is_active = true ORDER BY scraped_at DESC`, [river]);
        const reports = result.rows.map(report => ({ ...report, last_updated: formatDateForDisplay(report.last_updated) }));
        res.json({ river: river, count: reports.length, reports: reports });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/weather/:river', async (req, res) => {
    try {
        const weather = await getWeatherForRiver(req.params.river);
        weather ? res.json(weather) : res.status(404).json({ error: 'Weather data not available' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/usgs/:river', async (req, res) => {
    try {
        const data = await getUSGSData(req.params.river);
        data ? res.json(data) : res.status(404).json({ error: 'USGS data not available' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/river-details/:river', async (req, res) => {
    try {
        const { river } = req.params;
        const weather = await getWeatherForRiver(river);
        const usgs = await getUSGSData(river);
        const reportsResult = await db.query(`SELECT id, source, river, url, last_updated, last_updated_text, scraped_at FROM reports WHERE river = $1 AND is_active = true AND source NOT LIKE '%USGS%' AND url IS NOT NULL AND url != '' AND url LIKE 'http%' ORDER BY scraped_at DESC`, [river]);
        const seenSources = new Set();
        const reports = reportsResult.rows.map(report => ({ ...report, last_updated: formatDateForDisplay(report.last_updated) })).filter(report => {
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
});

app.get('/api/weather-icon/:code', (req, res) => {
    const icons = { 0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️', 45: '🌫️', 48: '🌫️', 51: '🌦️', 53: '🌧️', 55: '🌧️', 61: '🌧️', 63: '🌧️', 65: '🌧️', 71: '🌨️', 73: '🌨️', 75: '🌨️', 77: '🌨️', 80: '🌦️', 81: '🌧️', 82: '🌧️', 85: '🌨️', 86: '🌨️', 95: '⛈️', 96: '⛈️', 99: '⛈️' };
    res.json({ icon: icons[req.params.code] || '☁️' });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log('\n========================================');
    console.log('Server running on port ' + PORT);
    console.log('Cleanup: POST http://localhost:' + PORT + '/api/cleanup');
    console.log('========================================\n');
});

module.exports = { normalizeSource, formatDateForDisplay };

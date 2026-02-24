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

// Normalize source name for deduplication
function normalizeSource(source) {
    if (!source) return '';
    return source.toLowerCase()
        .replace(/\([^)]*\)/g, '')
        .replace(/[^a-z0-9]/g, '')
        .trim();
}

// Standardize date to ISO format
function standardizeDate(dateString) {
    if (!dateString) return null;
    
    try {
        const isoDate = new Date(dateString);
        if (!isNaN(isoDate.getTime())) {
            return isoDate.toISOString();
        }
        
        const formats = [
            /^(\w{3,})\s+(\d{1,2}),?\s+(\d{4})$/i,
            /^(\d{1,2})\s+(\w{3,})\s+(\d{4})$/i,
            /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
            /^(\d{4})-(\d{2})-(\d{2})$/
        ];
        
        const months = {
            'jan': 0, 'january': 0, 'feb': 1, 'february': 1,
            'mar': 2, 'march': 2, 'apr': 3, 'april': 3,
            'may': 4, 'jun': 5, 'june': 5, 'jul': 6, 'july': 6,
            'aug': 7, 'august': 7, 'sep': 8, 'sept': 8, 'september': 8,
            'oct': 9, 'october': 9, 'nov': 10, 'november': 10,
            'dec': 11, 'december': 11
        };
        
        for (const regex of formats) {
            const match = dateString.match(regex);
            if (match) {
                let year, month, day;
                
                if (regex.source.includes('^\\w')) {
                    month = months[match[1].toLowerCase()];
                    day = parseInt(match[2]);
                    year = parseInt(match[3]);
                } else if (regex.source.includes('^\\d{4}')) {
                    year = parseInt(match[1]);
                    month = parseInt(match[2]) - 1;
                    day = parseInt(match[3]);
                } else if (regex.source.includes('\\/')) {
                    month = parseInt(match[1]) - 1;
                    day = parseInt(match[2]);
                    year = parseInt(match[3]);
                } else {
                    day = parseInt(match[1]);
                    month = months[match[2].toLowerCase()];
                    year = parseInt(match[3]);
                }
                
                if (month !== undefined && !isNaN(day) && !isNaN(year)) {
                    const date = new Date(year, month, day);
                    if (!isNaN(date.getTime())) {
                        return date.toISOString();
                    }
                }
            }
        }
        
        return null;
    } catch (e) {
        return null;
    }
}

// Format date for display
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

async function initDatabase() {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS reports (
                id SERIAL PRIMARY KEY,
                source VARCHAR(100) NOT NULL,
                source_normalized VARCHAR(100) NOT NULL,
                river VARCHAR(100) NOT NULL,
                url TEXT NOT NULL,
                title VARCHAR(255),
                last_updated TIMESTAMP,
                last_updated_text VARCHAR(50),
                author VARCHAR(100),
                scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT true
            )
        `);
        
        await db.query(`CREATE INDEX IF NOT EXISTS idx_river ON reports(river)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_scraped_at ON reports(scraped_at)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_source_normalized ON reports(source_normalized)`);
        
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Database init error:', error.message);
    }
}

initDatabase();

cron.schedule('0 */6 * * *', () => {
    console.log('Running scheduled scrape...');
    runAllScrapers();
});

app.get('/', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Montana Fishing Reports API',
        version: '2.2',
        features: ['Weather', 'USGS Data', 'Duplicate Prevention', 'Date Standardization'],
        timestamp: new Date().toISOString()
    });
});

app.post('/api/scrape', async (req, res) => {
    try {
        const results = await runAllScrapers();
        res.json({ message: 'Scrape completed', results });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Cleanup endpoint - remove duplicates and broken links
app.post('/api/cleanup', async (req, res) => {
    try {
        const brokenResult = await db.query(`
            DELETE FROM reports
            WHERE url IS NULL 
               OR url = '' 
               OR url = 'undefined'
               OR url = 'null'
               OR url NOT LIKE 'http%'
            RETURNING id
        `);
        
        const dupResult = await db.query(`
            DELETE FROM reports
            WHERE id IN (
                SELECT id FROM (
                    SELECT id,
                           ROW_NUMBER() OVER (
                               PARTITION BY river, source_normalized 
                               ORDER BY scraped_at DESC
                           ) as rn
                    FROM reports
                ) t
                WHERE t.rn > 1
            )
            RETURNING id
        `);
        
        res.json({
            message: 'Cleanup completed',
            brokenLinksRemoved: brokenResult.rowCount,
            duplicatesRemoved: dupResult.rowCount
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/rivers', async (req, res) => {
    try {
        const result = await db.query(
            'SELECT DISTINCT river FROM reports WHERE is_active = true ORDER BY river'
        );
        
        const filteredRivers = result.rows
            .map(r => r.river)
            .filter(river => 
                river !== 'General Montana' &&
                river !== 'Montana General' &&
                river !== 'Madison River'
            );
        
        res.json({
            count: filteredRivers.length,
            rivers: filteredRivers
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/reports/:river', async (req, res) => {
    try {
        const { river } = req.params;
        const result = await db.query(
            `SELECT id, source, river, url, last_updated, last_updated_text, scraped_at 
             FROM reports 
             WHERE river = $1 AND is_active = true
             ORDER BY scraped_at DESC`,
            [river]
        );
        
        const reports = result.rows.map(report => ({
            ...report,
            last_updated: formatDateForDisplay(report.last_updated)
        }));
        
        res.json({
            river: river,
            count: reports.length,
            reports: reports
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/weather/:river', async (req, res) => {
    try {
        const { river } = req.params;
        const weather = await getWeatherForRiver(river);
        if (weather) {
            res.json(weather);
        } else {
            res.status(404).json({ error: 'Weather data not available' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/usgs/:river', async (req, res) => {
    try {
        const { river } = req.params;
        const data = await getUSGSData(river);
        if (data) {
            res.json(data);
        } else {
            res.status(404).json({ error: 'USGS data not available' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/river-details/:river', async (req, res) => {
  try {
    const { river } = req.params;
    
    const weather = await getWeatherForRiver(river);
    const usgs = await getUSGSData(river);
    
    const reportsResult = await db.query(
      `SELECT id, source, river, url, last_updated, last_updated_text, scraped_at 
       FROM reports 
       WHERE river = $1 
       AND is_active = true 
       AND source NOT LIKE '%USGS%'
       AND url IS NOT NULL
       AND url != ''
       AND url LIKE 'http%'
       ORDER BY scraped_at DESC`,
      [river]
    );
    
    const seenSources = new Set();
    const reports = reportsResult.rows
        .map(report => ({
            ...report

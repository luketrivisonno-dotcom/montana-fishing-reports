const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const db = require('./db');
const { runAllScrapers } = require('./scrapers');
const { getWeatherForRiver } = require('./utils/weather');
const { getUSGSData } = require('./utils/usgs');

const app = express();

// Enable CORS for all origins
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Create table if not exists
async function initDatabase() {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS reports (
                id SERIAL PRIMARY KEY,
                source VARCHAR(100) NOT NULL,
                river VARCHAR(100) NOT NULL,
                url TEXT NOT NULL,
                title VARCHAR(255),
                last_updated VARCHAR(50),
                author VARCHAR(100),
                scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT true
            )
        `);
        
        await db.query(`CREATE INDEX IF NOT EXISTS idx_river ON reports(river)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_scraped_at ON reports(scraped_at)`);
        
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Database init error:', error.message);
    }
}

// Initialize database
initDatabase();

// Schedule scrapers every 6 hours
cron.schedule('0 */6 * * *', () => {
    console.log('Running scheduled scrape...');
    runAllScrapers();
});

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Montana Fishing Reports API',
        version: '2.0',
        features: ['Weather', 'USGS Data', 'Upper/Lower Madison', '25+ Sources'],
        timestamp: new Date().toISOString()
    });
});

// Manual trigger endpoint
app.post('/api/scrape', async (req, res) => {
    try {
        const results = await runAllScrapers();
        res.json({ message: 'Scrape completed', results });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all rivers
app.get('/api/rivers', async (req, res) => {
    try {
        const result = await db.query(
            'SELECT DISTINCT river FROM reports WHERE is_active = true ORDER BY river'
        );
        res.json({
            count: result.rows.length,
            rivers: result.rows.map(r => r.river)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get reports for specific river
app.get('/api/reports/:river', async (req, res) => {
    try {
        const { river } = req.params;
        const result = await db.query(
            `SELECT id, source, river, url, last_updated, scraped_at 
             FROM reports 
             WHERE river = $1 AND is_active = true
             ORDER BY scraped_at DESC`,
            [river]
        );
        
        res.json({
            river: river,
            count: result.rows.length,
            reports: result.rows
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get weather for a river
app.get('/api/weather/:river', async (req, res) => {
    try {
        const { river } = req.params;
        const weather = await getWeatherForRiver(river);
        
        if (weather) {
            res.json(weather);
        } else {
            res.status(404).json({ error: 'Weather data not available for this river' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get USGS data for a river
app.get('/api/usgs/:river', async (req, res) => {
    try {
        const { river } = req.params;
        const data = await getUSGSData(river);
        
        if (data) {
            res.json(data);
        } else {
            res.status(404).json({ error: 'USGS data not available for this river' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get enhanced river data (reports + weather + USGS)
app.get('/api/river-details/:river', async (req, res) => {
    try {
        const { river } = req.params;
        
        // Get reports
        const reportsResult = await db.query(
            `SELECT id, source, river, url, last_updated, scraped_at 
             FROM reports 
             WHERE river = $1 AND is_active = true
             ORDER BY scraped_at DESC`,
            [river]
        );
        
        // Get weather
        const weather = await getWeatherForRiver(river);
        
        // Get USGS data
        const usgs = await getUSGSData(river);
        
        res.json({
            river: river,
            reports: reportsResult.rows,
            weather: weather,
            usgs: usgs,
            reportCount: reportsResult.rows.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all reports (admin endpoint)
app.get('/api/all-reports', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT * FROM reports ORDER BY scraped_at DESC`
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log('\n========================================');
    console.log(`Server running on port ${PORT}`);
    console.log(`Test: http://localhost:${PORT}/`);
    console.log(`Rivers: http://localhost:${PORT}/api/rivers`);
    console.log(`River Details: http://localhost:${PORT}/api/river-details/Gallatin%20River`);
    console.log(`Weather: http://localhost:${PORT}/api/weather/Gallatin%20River`);
    console.log(`USGS: http://localhost:${PORT}/api/usgs/Gallatin%20River`);
    console.log('========================================\n');
});
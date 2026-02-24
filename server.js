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

// Date standardization function
function standardizeDate(dateString) {
    if (!dateString) return 'Recently updated';
    
    try {
        let date;
        
        if (dateString instanceof Date) {
            date = dateString;
        } 
        else if (dateString.includes(',')) {
            date = new Date(dateString);
        }
        else if (dateString.includes('/')) {
            const parts = dateString.split('/');
            if (parts.length === 3) {
                let month = parseInt(parts[0]) - 1;
                let day = parseInt(parts[1]);
                let year = parseInt(parts[2]);
                if (year < 100) year += 2000;
                date = new Date(year, month, day);
            }
        }
        else {
            date = new Date(dateString);
        }
        
        if (isNaN(date.getTime())) {
            return dateString;
        }
        
        const options = { month: 'long', day: 'numeric', year: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    } catch (e) {
        return dateString;
    }
}

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

initDatabase();

cron.schedule('0 */6 * * *', () => {
    console.log('Running scheduled scrape...');
    runAllScrapers();
});

app.get('/', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Montana Fishing Reports API',
        version: '2.1',
        features: ['Weather', 'USGS Data', 'Upper/Lower Madison', '15+ Rivers', '25+ Sources'],
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
        const reportsResult = await db.query(
            `SELECT id, source, river, url, last_updated, scraped_at 
             FROM reports 
             WHERE river = $1 AND is_active = true
             ORDER BY scraped_at DESC`,
            [river]
        );
        
        // Standardize dates
        const standardizedReports = reportsResult.rows.map(r => ({
            ...r,
            last_updated: standardizeDate(r.last_updated)
        }));
        
        const weather = await getWeatherForRiver(river);
        const usgs = await getUSGSData(river);
        
        res.json({
            river: river,
            reports: standardizedReports,
            weather: weather,
            usgs: usgs,
            reportCount: standardizedReports.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/weather-icon/:code', (req, res) => {
    const { code } = req.params;
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
    res.json({ icon: icons[code] || '☁️' });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(`Server running on port ${PORT}`);
    console.log(`Test: http://localhost:${PORT}/`);
    console.log(`River Details: http://localhost:${PORT}/api/river-details/Gallatin%20River`);
    console.log('========================================\n');
});

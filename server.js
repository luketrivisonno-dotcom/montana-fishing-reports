const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const db = require('./db');
const { runAllScrapers } = require('./scrapers');

const app = express();

// Enable CORS for all origins
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Schedule scrapers every 6 hours
cron.schedule('0 */6 * * *', () => {
    console.log('Running scheduled scrape...');
    runAllScrapers();
});

// Health check
app.get('/', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Fishing Reports API',
        timestamp: new Date().toISOString()
    });
});

// Manual scrape trigger
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

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log('\n========================================');
    console.log(`Server running on port ${PORT}`);
    console.log(`Test: http://localhost:${PORT}/`);
    console.log(`Rivers: http://localhost:${PORT}/api/rivers`);
    console.log(`Reports: http://localhost:${PORT}/api/reports/Gallatin%20River`);
    console.log('========================================\n');
});
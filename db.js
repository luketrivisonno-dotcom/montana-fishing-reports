const { Pool } = require('pg');
require('dotenv').config();

// Use Railway's DATABASE_URL if available, otherwise use local
const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/fishing_reports';

const pool = new Pool({
    connectionString: connectionString,
    ssl: connectionString.includes('railway.app') ? { rejectUnauthorized: false } : false,
    // Production connection pool settings
    max: 20,                    // Maximum 20 connections
    idleTimeoutMillis: 30000,   // Close idle connections after 30s
    connectionTimeoutMillis: 5000, // 5s timeout for new connections
});

// Handle pool errors
pool.on('error', (err) => {
    console.error('Unexpected database pool error:', err);
});

// Test connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Database connection error:', err.message);
    } else {
        console.log('Database connected successfully');
    }
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool // Export pool for graceful shutdown
};

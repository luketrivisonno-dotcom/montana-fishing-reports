const { Pool } = require('pg');
require('dotenv').config();

// Use Railway's DATABASE_URL if available, otherwise use local
const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/fishing_reports';

const pool = new Pool({
    connectionString: connectionString,
    ssl: connectionString.includes('railway.app') ? { rejectUnauthorized: false } : false
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
    query: (text, params) => pool.query(text, params)
};
const db = require('../db');
const { standardizeDate, formatForDisplay, extractDateFromText } = require('./dateStandardizer');

function normalizeSource(source) {
    if (!source) return '';
    return source.toLowerCase()
        .replace(/\([^)]*\)/g, '')
        .replace(/[^a-z0-9]/g, '')
        .trim();
}

function isValidUrl(url) {
    if (!url) return false;
    if (typeof url !== 'string') return false;
    if (url.trim() === '') return false;
    if (url === 'undefined' || url === 'null') return false;
    if (!url.startsWith('http')) return false;
    
    try {
        new URL(url);
        return true;
    } catch (e) {
        return false;
    }
}

async function saveReport(report) {
    try {
        if (!report.source || !report.river) {
            console.log(`Skipping report: missing source or river`);
            return null;
        }
        
        if (!isValidUrl(report.url)) {
            console.log(`Skipping report from ${report.source}: invalid URL`);
            return null;
        }
        
        const normalizedSource = normalizeSource(report.source);
        
        // Use the centralized date standardizer - does NOT default to today
        const standardizedDate = standardizeDate(report.last_updated);
        const displayDate = standardizedDate ? formatForDisplay(standardizedDate) : 'Date unknown';
        
        const query = `
            INSERT INTO reports 
            (source, source_normalized, river, url, title, last_updated, last_updated_text, author, scraped_at, is_active, icon_url, water_clarity)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, true, $9, $10)
            ON CONFLICT (river, source_normalized) 
            DO UPDATE SET
                url = EXCLUDED.url,
                title = EXCLUDED.title,
                last_updated = EXCLUDED.last_updated,
                last_updated_text = EXCLUDED.last_updated_text,
                author = EXCLUDED.author,
                scraped_at = CURRENT_TIMESTAMP,
                is_active = true,
                icon_url = EXCLUDED.icon_url,
                water_clarity = EXCLUDED.water_clarity
            RETURNING id
        `;
        
        const values = [
            report.source,
            normalizedSource,
            report.river,
            report.url,
            report.title || null,
            standardizedDate,      // ISO format for DB
            displayDate,           // Human readable for display
            report.author || null,
            report.icon_url || null,
            report.water_clarity || null
        ];
        
        const result = await db.query(query, values);
        console.log(`Saved report: ${report.source} - ${report.river} (${displayDate})`);
        return result.rows[0];
        
    } catch (error) {
        if (error.message.includes('unique_url')) {
            try {
                const standardizedDate = standardizeDate(report.last_updated);
                const displayDate = standardizedDate ? formatForDisplay(standardizedDate) : 'Date unknown';
                
                const updateQuery = `
                    UPDATE reports 
                    SET source = $1,
                        source_normalized = $2,
                        river = $3,
                        title = $4,
                        last_updated = $5,
                        last_updated_text = $6,
                        author = $7,
                        scraped_at = CURRENT_TIMESTAMP,
                        is_active = true,
                        icon_url = $8,
                        water_clarity = $9
                    WHERE url = $10
                    RETURNING id
                `;
                
                const result = await db.query(updateQuery, [
                    report.source,
                    normalizeSource(report.source),
                    report.river,
                    report.title || null,
                    standardizedDate,  // ISO format for DB
                    displayDate,       // Human readable for display
                    report.author || null,
                    report.icon_url || null,
                    report.water_clarity || null,
                    report.url
                ]);
                
                if (result.rowCount > 0) {
                    console.log(`Updated report by URL: ${report.source} - ${report.river} (${displayDate})`);
                    return result.rows[0];
                }
            } catch (updateError) {
                console.error(`Error updating by URL:`, updateError.message);
            }
        }
        
        console.error(`Error saving report from ${report.source}:`, error.message);
        return null;
    }
}

async function saveReports(reports) {
    const results = [];
    for (const report of reports) {
        const result = await saveReport(report);
        if (result) results.push(result);
    }
    return results;
}

module.exports = {
    normalizeSource,
    standardizeDate,
    isValidUrl,
    saveReport,
    saveReports
};

const db = require('../db');

function normalizeSource(source) {
    if (!source) return '';
    return source.toLowerCase()
        .replace(/\([^)]*\)/g, '')
        .replace(/[^a-z0-9]/g, '')
        .trim();
}

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
        const standardizedDate = standardizeDate(report.last_updated);
        
        const query = `
            INSERT INTO reports 
            (source, source_normalized, river, url, title, last_updated, last_updated_text, author, scraped_at, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, true)
            ON CONFLICT (river, source_normalized) 
            DO UPDATE SET
                url = EXCLUDED.url,
                title = EXCLUDED.title,
                last_updated = EXCLUDED.last_updated,
                last_updated_text = EXCLUDED.last_updated_text,
                author = EXCLUDED.author,
                scraped_at = CURRENT_TIMESTAMP,
                is_active = true
            RETURNING id
        `;
        
        const values = [
            report.source,
            normalizedSource,
            report.river,
            report.url,
            report.title || null,
            standardizedDate,
            report.last_updated || null,
            report.author || null
        ];
        
        const result = await db.query(query, values);
        console.log(`Saved report: ${report.source} - ${report.river}`);
        return result.rows[0];
        
    } catch (error) {
        if (error.message.includes('unique_url')) {
            try {
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
                        is_active = true
                    WHERE url = $8
                    RETURNING id
                `;
                
                const result = await db.query(updateQuery, [
                    report.source,
                    normalizeSource(report.source),
                    report.river,
                    report.title || null,
                    standardizeDate(report.last_updated),
                    report.last_updated || null,
                    report.author || null,
                    report.url
                ]);
                
                if (result.rowCount > 0) {
                    console.log(`Updated report by URL: ${report.source} - ${report.river}`);
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

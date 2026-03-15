const db = require('../db');
const { standardizeDate, formatForDisplay, extractDateFromText } = require('./dateStandardizer');
const { extractHatches, getFlyRecommendations, extractWaterTemp, extractWaterConditions } = require('./hatchExtractor');

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

// Extract and save hatch data from report content
async function extractAndSaveHatchData(report, content) {
    try {
        if (!report.river || !content) return null;
        
        // Extract hatch data from content
        const hatches = extractHatches(content);
        
        // Only save if we found hatches
        if (hatches.length === 0) return null;
        
        const flyRecommendations = getFlyRecommendations(hatches);
        const waterTemp = extractWaterTemp(content);
        const waterConditions = extractWaterConditions(content);
        
        // Parse date
        let reportDate = new Date();
        if (report.last_updated) {
            const parsed = standardizeDate(report.last_updated);
            if (parsed) reportDate = new Date(parsed);
        }
        
        // Mark previous reports for this river as not current
        await db.query(
            `UPDATE hatch_reports SET is_current = false WHERE river = $1`,
            [report.river]
        );
        
        // Insert new hatch data
        const result = await db.query(
            `INSERT INTO hatch_reports 
             (river, source, hatches, fly_recommendations, hatch_details, water_temp, water_conditions, report_date, is_current)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
             RETURNING *`,
            [
                report.river,
                report.source,
                hatches,
                flyRecommendations,
                JSON.stringify({ extracted_from: 'fishing report', confidence: 'medium' }),
                waterTemp,
                waterConditions,
                reportDate
            ]
        );
        
        console.log(`  Extracted ${hatches.length} hatches: ${hatches.join(', ')}`);
        return result.rows[0];
        
    } catch (error) {
        console.error(`Error extracting hatch data:`, error.message);
        return null;
    }
}

module.exports = {
    normalizeSource,
    standardizeDate,
    isValidUrl,
    saveReport,
    saveReports,
    extractAndSaveHatchData
};

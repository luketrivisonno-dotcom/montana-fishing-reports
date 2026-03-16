const axios = require('axios');
const cheerio = require('cheerio');
const { extractHatchData } = require('../utils/hatchExtractor');
const db = require('../db');

const RIVERS = [
    { name: 'Bitterroot River', path: 'bitterroot-river-fishing-report' },
    { name: 'Blackfoot River', path: 'blackfoot-river-fishing-report' },
    { name: 'Clark Fork River', path: 'clark-fork-river-fishing-report' },
    { name: 'Rock Creek', path: 'rock-creek-fishing-report' },
    { name: 'Missouri River', path: 'missouri-river-fishing-report' }
];

const ICON_URL = 'https://montana-fishing-reports-production.up.railway.app/favicons/grizzly-hackle.jpg';

async function scrapeGrizzlyHackle() {
    let reports = [];
    
    for (const river of RIVERS) {
        try {
            const url = `https://grizzlyhackle.com/pages/${river.path}`;
            const { data } = await axios.get(url, {
                headers: { 
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' 
                },
                timeout: 10000
            });
            
            const $ = cheerio.load(data);
            const pageText = $('body').text();
            
            // Extract date - look for "Month DD, YYYY" pattern
            // Grizzly Hackle uses format like "February 25, 2026"
            const dateMatch = pageText.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})/i);
            
            let lastUpdated = null;
            let lastUpdatedText = null;
            
            if (dateMatch) {
                lastUpdatedText = dateMatch[0];
                try {
                    const parsedDate = new Date(dateMatch[0]);
                    if (!isNaN(parsedDate.getTime())) {
                        lastUpdated = parsedDate.toISOString();
                    }
                } catch (e) {
                    console.log(`  → Error parsing Grizzly Hackle date for ${river.name}: ${dateMatch[0]}`);
                }
            }
            
            // Extract water clarity from various patterns
            let waterClarity = null;
            const clarityPatterns = [
                /clarity[:\s]+([^.]+)/i,
                /visibility[:\s]+([^.]+)/i,
                /water\s+is\s+([^.]*(?:clear|off|muddy|stained|gin|excellent|good)[^.]*)/i,
                /(?:clear|off\s*color|muddy|stained|gin\s*clear)\s+water/i
            ];
            
            for (const pattern of clarityPatterns) {
                const match = pageText.match(pattern);
                if (match) {
                    waterClarity = match[1] ? match[1].trim().substring(0, 50) : match[0].trim().substring(0, 50);
                    break;
                }
            }
            
            // Extract hatch data for Primary hatch source
            const hatchData = extractHatchData(pageText.toLowerCase());
            console.log(`  → DEBUG Grizzly Hackle ${river.name}: extracted ${hatchData.hatches.length} hatches: ${hatchData.hatches.join(', ')}`);
            
            // Save hatch data if found (Primary)
            if (hatchData.hatches.length > 0) {
                try {
                    console.log(`  → DEBUG Saving Grizzly Hackle hatch data for ${river.name}...`);
                    await db.query(`UPDATE hatch_reports SET is_current = false WHERE river = $1`, [river.name]);
                    console.log(`  → DEBUG Set existing reports to not current for ${river.name}`);
                    const insertResult = await db.query(
                        `INSERT INTO hatch_reports (river, source, hatches, fly_recommendations, hatch_details, water_temp, water_conditions, report_date, is_current)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
                         RETURNING id`,
                        [river.name, 'Grizzly Hackle', hatchData.hatches, hatchData.fly_recommendations,
                         JSON.stringify({ extracted_from: 'Grizzly Hackle fishing report', url }),
                         hatchData.water_temp, hatchData.water_conditions,
                         lastUpdated || new Date()]
                    );
                    console.log(`  → Grizzly Hackle hatches for ${river.name}: ${hatchData.hatches.join(', ')} (ID: ${insertResult.rows[0].id})`);
                } catch (dbError) {
                    console.error(`  → Error saving Grizzly Hackle hatch data:`, dbError.message);
                    console.error(`  → Error details:`, dbError.stack);
                }
            } else {
                console.log(`  → DEBUG No hatches found for ${river.name}`);
            }
            
            reports.push({
                source: 'Grizzly Hackle',
                river: river.name,
                url: url,
                last_updated: lastUpdated,
                last_updated_text: lastUpdatedText,
                scraped_at: new Date(),
                icon_url: ICON_URL,
                water_clarity: waterClarity,
                hatches: hatchData.hatches,
                content: pageText.substring(0, 10000)
            });
            
            console.log(`  → Grizzly Hackle - ${river.name}: ${lastUpdatedText || 'No date found'}`);
            
        } catch (error) {
            console.error(`Grizzly Hackle error for ${river.name}:`, error.message);
        }
    }
    
    return reports.length > 0 ? reports : null;
}

module.exports = scrapeGrizzlyHackle;

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

const ICON_URL = null;

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
            const pageText = $('body').text().toLowerCase();
            
            // Extract date
            const dateMatch = $('body').text().match(/([A-Za-z]+\s+\d{1,2},?\s+\d{4})|(\d{1,2}\/\d{1,2}\/\d{4})/);
            
            // Extract water clarity from various patterns
            let waterClarity = null;
            const clarityPatterns = [
                /clarity[:\s]+([^.]+)/i,
                /visibility[:\s]+([^.]+)/i,
                /water\s+is\s+([^.]*(?:clear|off|muddy|stained|gin|excellent|good)[^.]*)/i,
                /(?:clear|off\s*color|muddy|stained|gin\s*clear)\s+water/i
            ];
            
            for (const pattern of clarityPatterns) {
                const match = $('body').text().match(pattern);
                if (match) {
                    waterClarity = match[1] ? match[1].trim().substring(0, 50) : match[0].trim().substring(0, 50);
                    break;
                }
            }
            
            // Extract hatch data for Primary hatch source
            const hatchData = extractHatchData(pageText);
            
            // Save hatch data if found (Primary)
            if (hatchData.hatches.length > 0) {
                try {
                    await db.query(`UPDATE hatch_reports SET is_current = false WHERE river = $1`, [river.name]);
                    await db.query(
                        `INSERT INTO hatch_reports (river, source, hatches, fly_recommendations, hatch_details, water_temp, water_conditions, report_date, is_current)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)`,
                        [river.name, 'Grizzly Hackle', hatchData.hatches, hatchData.fly_recommendations,
                         JSON.stringify({ extracted_from: 'Grizzly Hackle fishing report', url }),
                         hatchData.water_temp, hatchData.water_conditions,
                         dateMatch ? new Date(dateMatch[0]) : new Date()]
                    );
                    console.log(`  → Grizzly Hackle hatches for ${river.name}: ${hatchData.hatches.join(', ')}`);
                } catch (dbError) {
                    console.error(`  → Error saving Grizzly Hackle hatch data:`, dbError.message);
                }
            }
            
            reports.push({
                source: 'Grizzly Hackle',
                river: river.name,
                url: url,
                last_updated: dateMatch ? dateMatch[0] : new Date().toLocaleDateString(),
                last_updated_text: dateMatch ? dateMatch[0] : new Date().toLocaleDateString(),
                scraped_at: new Date(),
                icon_url: ICON_URL,
                water_clarity: waterClarity,
                hatches: hatchData.hatches
            });
            
        } catch (error) {
            console.error(`Grizzly Hackle error for ${river.name}:`, error.message);
        }
    }
    
    return reports.length > 0 ? reports : null;
}

module.exports = scrapeGrizzlyHackle;

const axios = require('axios');
const cheerio = require('cheerio');

const RIVERS = [
    { name: 'Bitterroot River', path: 'bitterroot-river-fishing-report' },
    { name: 'Blackfoot River', path: 'blackfoot-river-fishing-report' },
    { name: 'Clark Fork River', path: 'clark-fork-river-fishing-report' },
    { name: 'Rock Creek', path: 'rock-creek-fishing-report' },
    { name: 'Missouri River', path: 'missouri-river-fishing-report' }
];

const ICON_URL = 'https://grizzlyhackle.com/cdn/shop/files/GH_Logo_400x.png?v=1614323385';

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
            
            reports.push({
                source: 'Grizzly Hackle',
                river: river.name,
                url: url,
                last_updated: dateMatch ? dateMatch[0] : new Date().toLocaleDateString(),
                last_updated_text: dateMatch ? dateMatch[0] : new Date().toLocaleDateString(),
                scraped_at: new Date(),
                icon_url: ICON_URL,
                water_clarity: waterClarity
            });
            
        } catch (error) {
            console.error(`Grizzly Hackle error for ${river.name}:`, error.message);
        }
    }
    
    return reports.length > 0 ? reports : null;
}

module.exports = scrapeGrizzlyHackle;

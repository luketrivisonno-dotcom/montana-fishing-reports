const axios = require('axios');

const ICON_URL = 'https://montana-fishing-reports-production.up.railway.app/favicons/blackfoot.png';
const cheerio = require('cheerio');

const RIVERS = [
    { name: 'Blackfoot River', path: 'the-blackfoot-river-fishing-report' },
    { name: 'Clark Fork River', path: 'clark-fork-river-fishing-report' },
    { name: 'Bitterroot River', path: 'bitterroot-river-fishing-report' },
    { name: 'Rock Creek', path: 'rock-creek-fishing-report' }
];

async function scrapeBlackfootBRO() {
    const baseUrl = 'https://blackfootriver.com/blogs/fishing-reports';
    let reports = [];
    
    for (const river of RIVERS) {
        try {
            const url = `${baseUrl}/${river.path}`;
            const { data } = await axios.get(url, {
                headers: { 
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' 
                },
                timeout: 10000
            });
            
            const $ = cheerio.load(data);
            const pageText = $('body').text();
            
            // Extract date - look for "Month DD, YYYY" pattern
            // Shopify articles typically have date in format "February 25, 2026"
            const dateMatch = pageText.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})/i);
            
            let lastUpdated = null;
            let lastUpdatedText = null;
            
            if (dateMatch) {
                lastUpdatedText = dateMatch[0];
                try {
                    lastUpdated = new Date(dateMatch[0]).toISOString();
                } catch (e) {
                    console.log(`  → Error parsing date for ${river.name}: ${dateMatch[0]}`);
                }
            }
            
            reports.push({
                source: 'Blackfoot River Outfitters',
                river: river.name,
                url: url,
                last_updated: lastUpdated,
                last_updated_text: lastUpdatedText,
                scraped_at: new Date(),
                icon_url: ICON_URL,
                water_clarity: null
            });
            
            console.log(`  → Blackfoot River Outfitters - ${river.name}: ${lastUpdatedText || 'No date found'}`);
            
        } catch (error) {
            console.error(`Blackfoot River Outfitters error for ${river.name}:`, error.message);
            // Return fallback with null date
            reports.push({
                source: 'Blackfoot River Outfitters',
                river: river.name,
                url: `https://blackfootriver.com/blogs/fishing-reports/${river.path}`,
                last_updated: null,
                last_updated_text: null,
                scraped_at: new Date(),
                icon_url: ICON_URL,
                water_clarity: null
            });
        }
    }
    
    return reports;
}

async function scrapeBlackfootMissoulian() {
    const url = 'https://www.missoulianangler.com/pages/blackfoot-river-fishing-report';
    
    try {
        const { data } = await axios.get(url, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' 
            },
            timeout: 10000
        });
        
        const $ = cheerio.load(data);
        const pageText = $('body').text();
        
        // Extract date - look for "Month DD, YYYY" pattern
        const dateMatch = pageText.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})/i);
        
        let lastUpdated = null;
        let lastUpdatedText = null;
        
        if (dateMatch) {
            lastUpdatedText = dateMatch[0];
            try {
                lastUpdated = new Date(dateMatch[0]).toISOString();
            } catch (e) {
                console.log(`  → Error parsing date for Missoulian Angler: ${dateMatch[0]}`);
            }
        }
        
        console.log(`  → Missoulian Angler - Blackfoot River: ${lastUpdatedText || 'No date found'}`);
        
        return {
            source: 'The Missoulian Angler',
            river: 'Blackfoot River',
            url: url,
            last_updated: lastUpdated,
            last_updated_text: lastUpdatedText,
            scraped_at: new Date(),
            icon_url: ICON_URL,
            water_clarity: null
        };
        
    } catch (error) {
        console.error('Missoulian Angler error:', error.message);
        // Return fallback with correct URL
        return {
            source: 'The Missoulian Angler',
            river: 'Blackfoot River',
            url: url,
            last_updated: null,
            last_updated_text: null,
            scraped_at: new Date(),
            icon_url: ICON_URL,
            water_clarity: null
        };
    }
}

module.exports = {
    scrapeBlackfootMissoulian,
    scrapeBlackfootBRO
};

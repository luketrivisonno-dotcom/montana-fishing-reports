const axios = require('axios');
const cheerio = require('cheerio');

const ICON_URL = 'https://montana-fishing-reports-production.up.railway.app/favicons/kingfisher.png';

async function scrapeKingfisher() {
    const url = 'https://kingfisherflyshop.com/blog/';
    
    try {
        const { data } = await axios.get(url, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' 
            },
            timeout: 10000
        });
        
        const $ = cheerio.load(data);
        const pageText = $('body').html(); // Use html to get comments too
        
        // Kingfisher dates are in HTML comments: "<!-- on 18th Sep 2025 -->"
        // Also look for "Posted by Jimmy <!-- on 18th Sep 2025 -->"
        const dateMatch = pageText.match(/on\s+(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\s+(\d{4})/i);
        
        let lastUpdated = null;
        let lastUpdatedText = null;
        
        if (dateMatch) {
            // Reconstruct date in standard format: "18 Sep 2025"
            lastUpdatedText = `${dateMatch[1]} ${dateMatch[2]} ${dateMatch[3]}`;
            try {
                const parsedDate = new Date(lastUpdatedText);
                if (!isNaN(parsedDate.getTime())) {
                    lastUpdated = parsedDate.toISOString();
                }
            } catch (e) {
                console.log(`  → Error parsing Kingfisher date: ${lastUpdatedText}`);
            }
        }
        
        console.log(`  → Kingfisher: ${lastUpdatedText || 'No date found'}`);
        
        return {
            source: 'The Kingfisher Fly Shop',
            river: 'Bitterroot River',
            url: url,
            last_updated: lastUpdated,
            last_updated_text: lastUpdatedText,
            scraped_at: new Date(),
            icon_url: ICON_URL,
            water_clarity: null
        };
        
    } catch (error) {
        console.error('Kingfisher error:', error.message);
        // Return fallback
        return {
            source: 'The Kingfisher Fly Shop',
            river: 'Bitterroot River',
            url: url,
            last_updated: null,
            last_updated_text: null,
            scraped_at: new Date(),
            icon_url: ICON_URL,
            water_clarity: null
        };
    }
}

module.exports = scrapeKingfisher;

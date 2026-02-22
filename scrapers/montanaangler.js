const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeMontanaAngler() {
    const url = 'https://www.montanaangler.com/montana-fishing-report/gallatin-river-fishing-report';
    
    console.log('Scraping Montana Angler...');
    
    try {
        const { data } = await axios.get(url, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' 
            },
            timeout: 10000
        });
        
        const $ = cheerio.load(data);
        
        // Get page text and look for date pattern
        const pageText = $('body').text();
        
        // Look for patterns like "Friday, November 14, 2025" or "November 14, 2025"
        const dateMatch = pageText.match(/([A-Za-z]+,\s+)?[A-Za-z]+\s+\d{1,2},\s+\d{4}/);
        
        let reportDate = null;
        if (dateMatch) {
            reportDate = dateMatch[0];
            console.log('Found date:', reportDate);
        } else {
            console.log('Date not found');
        }
        
        return {
            source: 'Montana Angler',
            river: 'Gallatin River',
            url: url,
            last_updated: reportDate,
            scraped_at: new Date()
        };
        
    } catch (error) {
        console.error('Montana Angler error:', error.message);
        return null;
    }
}

if (require.main === module) {
    scrapeMontanaAngler().then(() => process.exit(0));
}

module.exports = scrapeMontanaAngler;
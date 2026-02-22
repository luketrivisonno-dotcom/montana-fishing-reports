const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeFinsFeathers() {
    const url = 'https://flyfishingbozeman.com/montana-fly-fishing-reports/gallatin-river-fishing-report';
    
    console.log('Scraping Fins & Feathers...');
    
    try {
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000
        });
        
        const $ = cheerio.load(data);
        const pageText = $('body').text();
        
        // Look for "Date: 12/23/2025" or similar
        const dateMatch = pageText.match(/Date:\s*(\d{1,2}\/\d{1,2}\/\d{4})/);
        
        return {
            source: 'Fins & Feathers',
            river: 'Gallatin River',
            url: url,
            last_updated: dateMatch ? dateMatch[1] : null,
            scraped_at: new Date()
        };
        
    } catch (error) {
        console.error('Fins & Feathers error:', error.message);
        return null;
    }
}

module.exports = scrapeFinsFeathers;
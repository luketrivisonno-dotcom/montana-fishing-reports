const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeOrvis() {
    const url = 'https://fishingreports.orvis.com/west/montana/gallatin-river';
    
    console.log('Scraping Orvis...');
    
    try {
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000
        });
        
        const $ = cheerio.load(data);
        const pageText = $('body').text();
        
        // Look for "as of 6/17/25"
        const dateMatch = pageText.match(/as of\s+(\d{1,2}\/\d{1,2}\/\d{2,4})/i);
        
        return {
            source: 'Orvis',
            river: 'Gallatin River',
            url: url,
            last_updated: dateMatch ? dateMatch[1] : null,
            scraped_at: new Date()
        };
        
    } catch (error) {
        console.error('Orvis error:', error.message);
        return null;
    }
}

module.exports = scrapeOrvis;
const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeBozemanFlySupply() {
    const url = 'https://www.bozemanflysupply.com/river-report/gallatin';
    
    console.log('Scraping Bozeman Fly Supply...');
    
    try {
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000
        });
        
        const $ = cheerio.load(data);
        const pageText = $('body').text();
        
        // Look for "February 10, 2026"
        const dateMatch = pageText.match(/([A-Za-z]+\s+\d{1,2},\s+\d{4})/);
        
        return {
            source: 'Bozeman Fly Supply',
            river: 'Gallatin River',
            url: url,
            last_updated: dateMatch ? dateMatch[0] : null,
            scraped_at: new Date()
        };
        
    } catch (error) {
        console.error('Bozeman Fly Supply error:', error.message);
        return null;
    }
}

module.exports = scrapeBozemanFlySupply;
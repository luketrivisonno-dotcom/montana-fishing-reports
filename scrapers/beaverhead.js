const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeBeaverheadOrvis() {
    // Orvis doesn't have a dedicated Beaverhead page, skip
    return null;
}

async function scrapeBeaverheadBlueRibbon() {
    const url = 'https://www.blueribbonflies.net/fishing-reports/';
    
    try {
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000
        });
        
        const $ = cheerio.load(data);
        const pageText = $('body').text();
        
        // Look for Beaverhead mention with date
        if (pageText.toLowerCase().includes('beaverhead')) {
            const dateMatch = pageText.match(/([A-Za-z]+\s+\d{1,2},\s+\d{4})/);
            return {
                source: 'Blue Ribbon Flies',
                river: 'Beaverhead River',
                url: url,
                last_updated: dateMatch ? dateMatch[0] : null,
                scraped_at: new Date()
            };
        }
        return null;
    } catch (error) {
        console.error('Beaverhead BRF error:', error.message);
        return null;
    }
}

// Add alternative source
async function scrapeBeaverheadMontanaAngler() {
    const url = 'https://www.montanaangler.com/montana-fishing-report/beaverhead-river-fishing-report';
    
    try {
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000
        });
        
        const $ = cheerio.load(data);
        const pageText = $('body').text();
        const dateMatch = pageText.match(/([A-Za-z]+,\s+[A-Za-z]+\s+\d{1,2},\s+\d{4})/);
        
        return {
            source: 'Montana Angler (Beaverhead)',
            river: 'Beaverhead River',
            url: url,
            last_updated: dateMatch ? dateMatch[0] : null,
            scraped_at: new Date()
        };
    } catch (error) {
        console.error('Beaverhead MA error:', error.message);
        return null;
    }
}

module.exports = { scrapeBeaverheadOrvis, scrapeBeaverheadBlueRibbon, scrapeBeaverheadMontanaAngler };
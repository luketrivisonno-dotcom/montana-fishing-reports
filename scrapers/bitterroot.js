const axios = require('axios');

const ICON_URL = 'https://montana-fishing-reports-production.up.railway.app/favicons/bitterroot-anglers.jpg';
const cheerio = require('cheerio');
const { extractDateFromText } = require('../utils/dateStandardizer');

async function scrapeBitterrootAnglers() {
    const url = 'https://www.bitterrootanglers.com/fishing-report';
    
    try {
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000
        });
        
        const $ = cheerio.load(data);
        const pageText = $('body').text();
        
        const extractedDate = extractDateFromText(pageText);
        
        return {
            source: 'Bitterroot Anglers',
            river: 'Bitterroot River',
            url: url,
            last_updated: extractedDate ? extractedDate.toISOString() : null,
            scraped_at: new Date().toISOString(),
            content: pageText.substring(0, 10000)
        };
    } catch (error) {
        console.error('Bitterroot Anglers error:', error.message);
        return {
            source: 'Bitterroot Anglers',
            river: 'Bitterroot River',
            url: url,
            last_updated: null,
            scraped_at: new Date().toISOString(),
            content: null
        };
    }
}

module.exports = {
    scrapeBitterrootAnglers
};

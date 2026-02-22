const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeRockCreekOrvis() {
    const url = 'https://fishingreports.orvis.com/west/montana/rock-creek';
    
    try {
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000
        });
        
        const $ = cheerio.load(data);
        const pageText = $('body').text();
        const dateMatch = pageText.match(/as of\s+(\d{1,2}\/\d{1,2}\/\d{2,4})/i);
        
        return {
            source: 'Orvis (Rock Creek)',
            river: 'Rock Creek',
            url: url,
            last_updated: dateMatch ? dateMatch[1] : null,
            scraped_at: new Date()
        };
    } catch (error) {
        console.error('Rock Creek Orvis error:', error.message);
        return null;
    }
}

async function scrapeRockCreekMontanaAngler() {
    const url = 'https://www.montanaangler.com/montana-fishing-report/rock-creek-fishing-report';
    
    try {
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000
        });
        
        const $ = cheerio.load(data);
        const pageText = $('body').text();
        const dateMatch = pageText.match(/([A-Za-z]+,\s+[A-Za-z]+\s+\d{1,2},\s+\d{4})/);
        
        return {
            source: 'Montana Angler (Rock Creek)',
            river: 'Rock Creek',
            url: url,
            last_updated: dateMatch ? dateMatch[0] : null,
            scraped_at: new Date()
        };
    } catch (error) {
        console.error('Rock Creek MA error:', error.message);
        return null;
    }
}

module.exports = { scrapeRockCreekOrvis, scrapeRockCreekMontanaAngler };
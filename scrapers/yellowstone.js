const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeYellowstoneMontanaAngler() {
    const url = 'https://www.montanaangler.com/montana-fishing-report/yellowstone-river-fishing-report';
    
    try {
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000
        });
        
        const $ = cheerio.load(data);
        const pageText = $('body').text();
        
        // Look for date like "Thursday, March 12, 2026"
        let dateMatch = pageText.match(/[A-Za-z]+,\s+[A-Za-z]+\s+\d{1,2},\s+\d{4}/);
        if (!dateMatch) {
            dateMatch = pageText.match(/[A-Za-z]+\s+\d{1,2},\s+\d{4}/);
        }
        
        return {
            source: 'Montana Angler',
            river: 'Yellowstone River',
            url: url,
            last_updated: dateMatch ? dateMatch[0] : null,
            scraped_at: new Date().toISOString()
        };
    } catch (error) {
        console.error('Yellowstone Montana Angler error:', error.message);
        return {
            source: 'Montana Angler',
            river: 'Yellowstone River',
            url: url,
            last_updated: null,
            scraped_at: new Date().toISOString()
        };
    }
}

async function scrapeYellowstoneRiversEdge() {
    const url = 'https://theriversedge.com/pages/yellowstone-river-fishing-report';
    
    try {
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000
        });
        
        const $ = cheerio.load(data);
        const pageText = $('body').text();
        
        // Look for ISO date format YYYY-MM-DD
        const dateMatch = pageText.match(/(\d{4}-\d{2}-\d{2})/);
        
        return {
            source: 'River\'s Edge',
            river: 'Yellowstone River',
            url: url,
            last_updated: dateMatch ? dateMatch[1] : null,
            scraped_at: new Date().toISOString()
        };
    } catch (error) {
        console.error('Yellowstone Rivers Edge error:', error.message);
        return {
            source: 'River\'s Edge',
            river: 'Yellowstone River',
            url: url,
            last_updated: null,
            scraped_at: new Date().toISOString()
        };
    }
}

async function scrapeYellowstoneSweetwater() {
    const url = 'https://www.sweetwaterflyshop.com/fishing-reports/';
    
    try {
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000
        });
        
        const $ = cheerio.load(data);
        const pageText = $('body').text();
        
        // Sweetwater shows dates like "March 5, 2026" on their reports page
        const dateMatch = pageText.match(/([A-Za-z]+\s+\d{1,2},\s+\d{4})/);
        
        return {
            source: 'Sweetwater Fly Shop',
            river: 'Yellowstone River',
            url: url,
            last_updated: dateMatch ? dateMatch[1] : null,
            scraped_at: new Date().toISOString()
        };
    } catch (error) {
        console.error('Yellowstone Sweetwater error:', error.message);
        return {
            source: 'Sweetwater Fly Shop',
            river: 'Yellowstone River',
            url: url,
            last_updated: null,
            scraped_at: new Date().toISOString()
        };
    }
}

module.exports = {
    scrapeYellowstoneMontanaAngler,
    scrapeYellowstoneRiversEdge,
    scrapeYellowstoneSweetwater
};

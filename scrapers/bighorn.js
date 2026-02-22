const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeBighornNorthFork() {
    const url = 'https://northforkanglers.com/fishing-reports';
    
    try {
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000
        });
        
        const $ = cheerio.load(data);
        const pageText = $('body').text();
        // Look for "September 29, 2025" pattern
        const dateMatch = pageText.match(/([A-Za-z]+\s+\d{1,2},\s+\d{4})/);
        
        return {
            source: 'North Fork Anglers',
            river: 'Bighorn River',
            url: url,
            last_updated: dateMatch ? dateMatch[0] : null,
            scraped_at: new Date()
        };
    } catch (error) {
        console.error('Bighorn NFA error:', error.message);
        return null;
    }
}

async function scrapeBighornYellowDog() {
    const url = 'https://www.yellowdogflyfishing.com/pages/bighorn-river-fishing-reports';
    
    try {
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000
        });
        
        const $ = cheerio.load(data);
        const pageText = $('body').text();
        const dateMatch = pageText.match(/Updated\s+([A-Za-z]+\s+\d{1,2},?\s+\d{2,4})/i);
        
        return {
            source: 'Yellow Dog (Bighorn)',
            river: 'Bighorn River',
            url: url,
            last_updated: dateMatch ? dateMatch[1] : null,
            scraped_at: new Date()
        };
    } catch (error) {
        console.error('Bighorn YD error:', error.message);
        return null;
    }
}

async function scrapeBighornAngler() {
    const url = 'https://bighornangler.com/reports/';
    
    try {
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000
        });
        
        const $ = cheerio.load(data);
        const pageText = $('body').text();
        const dateMatch = pageText.match(/([A-Za-z]+\s+\d{1,2},\s+\d{4})/);
        
        return {
            source: 'Bighorn Angler',
            river: 'Bighorn River',
            url: url,
            last_updated: dateMatch ? dateMatch[0] : null,
            scraped_at: new Date()
        };
    } catch (error) {
        console.error('Bighorn Angler error:', error.message);
        return null;
    }
}

module.exports = { scrapeBighornNorthFork, scrapeBighornYellowDog, scrapeBighornAngler };
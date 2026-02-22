const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeClarkForkOrvis() {
    const url = 'https://fishingreports.orvis.com/west/montana/clark-fork-river';
    
    try {
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000
        });
        
        const $ = cheerio.load(data);
        const pageText = $('body').text();
        const dateMatch = pageText.match(/as of\s+(\d{1,2}\/\d{1,2}\/\d{2,4})/i);
        
        return {
            source: 'Orvis (Clark Fork)',
            river: 'Clark Fork River',
            url: url,
            last_updated: dateMatch ? dateMatch[1] : null,
            scraped_at: new Date()
        };
    } catch (error) {
        console.error('Clark Fork Orvis error:', error.message);
        return null;
    }
}

async function scrapeClarkForkGrizzly() {
    const url = 'https://grizzlyhackle.com/pages/clark-fork-river-fishing-report';
    
    try {
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000
        });
        
        const $ = cheerio.load(data);
        const pageText = $('body').text();
        const dateMatch = pageText.match(/([A-Za-z]+\s+\d{1,2},\s+\d{4})/);
        
        return {
            source: 'Grizzly Hackle (Clark Fork)',
            river: 'Clark Fork River',
            url: url,
            last_updated: dateMatch ? dateMatch[0] : null,
            scraped_at: new Date()
        };
    } catch (error) {
        console.error('Clark Fork GH error:', error.message);
        return null;
    }
}

async function scrapeClarkForkBlackfoot() {
    const url = 'https://blackfootriver.com/blogs/fishing-reports/clark-fork-river-fishing-report';
    
    try {
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000
        });
        
        const $ = cheerio.load(data);
        const pageText = $('body').text();
        const dateMatch = pageText.match(/([A-Za-z]+\s+\d{1,2},\s+\d{4})/);
        
        return {
            source: 'Blackfoot River Outfitters',
            river: 'Clark Fork River',
            url: url,
            last_updated: dateMatch ? dateMatch[0] : null,
            scraped_at: new Date()
        };
    } catch (error) {
        console.error('Clark Fork BRO error:', error.message);
        return null;
    }
}

module.exports = { scrapeClarkForkOrvis, scrapeClarkForkGrizzly, scrapeClarkForkBlackfoot };
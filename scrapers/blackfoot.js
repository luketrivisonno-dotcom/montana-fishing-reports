const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeBlackfootOrvis() {
    const url = 'https://fishingreports.orvis.com/west/montana/blackfoot-river';
    
    try {
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000
        });
        
        const $ = cheerio.load(data);
        const pageText = $('body').text();
        const dateMatch = pageText.match(/as of\s+(\d{1,2}\/\d{1,2}\/\d{2,4})/i);
        
        return {
            source: 'Orvis (Blackfoot)',
            river: 'Blackfoot River',
            url: url,
            last_updated: dateMatch ? dateMatch[1] : null,
            scraped_at: new Date()
        };
    } catch (error) {
        console.error('Blackfoot Orvis error:', error.message);
        return null;
    }
}

async function scrapeBlackfootGrizzly() {
    const url = 'https://grizzlyhackle.com/pages/blackfoot-river-fishing-report';
    
    try {
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000
        });
        
        const $ = cheerio.load(data);
        const pageText = $('body').text();
        const dateMatch = pageText.match(/([A-Za-z]+\s+\d{1,2},\s+\d{4})/);
        
        return {
            source: 'Grizzly Hackle (Blackfoot)',
            river: 'Blackfoot River',
            url: url,
            last_updated: dateMatch ? dateMatch[0] : null,
            scraped_at: new Date()
        };
    } catch (error) {
        console.error('Blackfoot GH error:', error.message);
        return null;
    }
}

async function scrapeBlackfootBRO() {
    const url = 'https://blackfootriver.com/blogs/fishing-reports/the-blackfoot-river-fishing-report';
    
    try {
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000
        });
        
        const $ = cheerio.load(data);
        const pageText = $('body').text();
        const dateMatch = pageText.match(/([A-Za-z]+\s+\d{1,2},\s+\d{4})/);
        
        return {
            source: 'Blackfoot River Outfitters (Blackfoot)',
            river: 'Blackfoot River',
            url: url,
            last_updated: dateMatch ? dateMatch[0] : null,
            scraped_at: new Date()
        };
    } catch (error) {
        console.error('Blackfoot BRO error:', error.message);
        return null;
    }
}

module.exports = { scrapeBlackfootOrvis, scrapeBlackfootGrizzly, scrapeBlackfootBRO };
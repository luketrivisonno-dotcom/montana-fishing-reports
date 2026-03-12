const axios = require('axios');
const cheerio = require('cheerio');
const { extractDateFromText } = require('../utils/dateStandardizer');

async function scrapeBeaverheadMontanaAngler() {
    const url = 'https://www.montanaangler.com/beaverhead-river-fishing-report';
    
    try {
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000
        });
        
        const $ = cheerio.load(data);
        const pageText = $('body').text();
        
        // Try to extract actual date from page content
        const extractedDate = extractDateFromText(pageText);
        
        return {
            source: 'Montana Angler',
            river: 'Beaverhead River',
            url: url,
            last_updated: extractedDate ? extractedDate.toISOString() : null,
            scraped_at: new Date().toISOString()
        };
    } catch (error) {
        console.error('Beaverhead Montana Angler error:', error.message);
        return {
            source: 'Montana Angler',
            river: 'Beaverhead River',
            url: url,
            last_updated: null,
            scraped_at: new Date().toISOString()
        };
    }
}

async function scrapeBeaverheadHeadhunters() {
    const url = 'https://www.headhuntersflyshop.com/fishing-report/';
    
    try {
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000
        });
        
        const $ = cheerio.load(data);
        const pageText = $('body').text();
        
        // Try to extract actual date from page content
        const extractedDate = extractDateFromText(pageText);
        
        return {
            source: 'Headhunters Fly Shop',
            river: 'Beaverhead River',
            url: url,
            last_updated: extractedDate ? extractedDate.toISOString() : null,
            scraped_at: new Date().toISOString()
        };
    } catch (error) {
        console.error('Beaverhead Headhunters error:', error.message);
        return {
            source: 'Headhunters Fly Shop',
            river: 'Beaverhead River',
            url: url,
            last_updated: null,
            scraped_at: new Date().toISOString()
        };
    }
}

module.exports = {
    scrapeBeaverheadMontanaAngler,
    scrapeBeaverheadHeadhunters
};

const axios = require('axios');

const ICON_URL = 'https://montana-fishing-reports-production.up.railway.app/favicons/headhunters.png';
const cheerio = require('cheerio');
const { extractDateFromText } = require('../utils/dateStandardizer');

async function scrapeBigholeHeadhunters() {
    const url = 'https://www.headhuntersflyshop.com/fishing-report/';
    
    try {
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000
        });
        
        const $ = cheerio.load(data);
        const pageText = $('body').text();
        
        const extractedDate = extractDateFromText(pageText);
        
        return {
            source: 'Headhunters Fly Shop',
            river: 'Big Hole River',
            url: url,
            last_updated: extractedDate ? extractedDate.toISOString() : null,
            scraped_at: new Date().toISOString()
        };
    } catch (error) {
        console.error('Big Hole Headhunters error:', error.message);
        return {
            source: 'Headhunters Fly Shop',
            river: 'Big Hole River',
            url: url,
            last_updated: null,
            scraped_at: new Date().toISOString()
        };
    }
}

async function scrapeBigholeSunrise() {
    const url = 'https://sunriseflyshop.com/big-hole-river-fishing-report/';
    
    try {
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000
        });
        
        const $ = cheerio.load(data);
        const pageText = $('body').text();
        
        const extractedDate = extractDateFromText(pageText);
        
        return {
            source: 'Sunrise Fly Shop',
            river: 'Big Hole River',
            url: url,
            last_updated: extractedDate ? extractedDate.toISOString() : null,
            scraped_at: new Date().toISOString()
        };
    } catch (error) {
        console.error('Big Hole Sunrise error:', error.message);
        return {
            source: 'Sunrise Fly Shop',
            river: 'Big Hole River',
            url: url,
            last_updated: null,
            scraped_at: new Date().toISOString()
        };
    }
}

module.exports = {
    scrapeBigholeHeadhunters,
    scrapeBigholeSunrise
};

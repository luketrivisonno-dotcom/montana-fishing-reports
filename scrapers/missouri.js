const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeMissouriMontanaAngler() {
    const url = 'https://www.montanaangler.com/montana-fishing-report/missouri-river-fishing-report';
    
    try {
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000
        });
        
        const $ = cheerio.load(data);
        const pageText = $('body').text();
        const dateMatch = pageText.match(/([A-Za-z]+,\s+[A-Za-z]+\s+\d{1,2},\s+\d{4})/);
        
        return {
            source: 'Montana Angler (Missouri)',
            river: 'Missouri River',
            url: url,
            last_updated: dateMatch ? dateMatch[0] : null,
            scraped_at: new Date()
        };
    } catch (error) {
        console.error('Missouri MA error:', error.message);
        return null;
    }
}

async function scrapeMissouriHeadhunters() {
    const url = 'https://www.headhuntersflyshop.com/blog/5yy13c28g88zvv0questvfttwv5apl';
    
    try {
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000
        });
        
        const $ = cheerio.load(data);
        const pageText = $('body').text();
        // Look for date like "2025-10-27" or similar
        const dateMatch = pageText.match(/(\d{4}-\d{2}-\d{2})/) ||
                         pageText.match(/([A-Za-z]+\s+\d{1,2},\s+\d{4})/);
        
        return {
            source: 'Headhunters Fly Shop',
            river: 'Missouri River',
            url: url,
            last_updated: dateMatch ? dateMatch[0] : null,
            scraped_at: new Date()
        };
    } catch (error) {
        console.error('Missouri HH error:', error.message);
        return null;
    }
}

async function scrapeMissouriRiversEdge() {
    const url = 'https://theriversedge.com/pages/missouri-river-fishing-report';
    
    try {
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000
        });
        
        const $ = cheerio.load(data);
        const pageText = $('body').text();
        const dateMatch = pageText.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/);
        
        return {
            source: 'River\'s Edge (Missouri)',
            river: 'Missouri River',
            url: url,
            last_updated: dateMatch ? dateMatch[0] : null,
            scraped_at: new Date()
        };
    } catch (error) {
        console.error('Missouri RE error:', error.message);
        return null;
    }
}

module.exports = { scrapeMissouriMontanaAngler, scrapeMissouriHeadhunters, scrapeMissouriRiversEdge };
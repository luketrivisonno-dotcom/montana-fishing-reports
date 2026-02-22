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
        const dateMatch = pageText.match(/([A-Za-z]+,\s+[A-Za-z]+\s+\d{1,2},\s+\d{4})/);
        
        return {
            source: 'Montana Angler (Yellowstone)',
            river: 'Yellowstone River',
            url: url,
            last_updated: dateMatch ? dateMatch[0] : null,
            scraped_at: new Date()
        };
    } catch (error) {
        console.error('Yellowstone MA error:', error.message);
        return null;
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
        // Look for "905 CFS @ Corwin" or date patterns
        const dateMatch = pageText.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/) ||
                         pageText.match(/Updated\s+([A-Za-z]+\s+\d{1,2})/i);
        
        return {
            source: 'River\'s Edge (Yellowstone)',
            river: 'Yellowstone River',
            url: url,
            last_updated: dateMatch ? dateMatch[0] : null,
            scraped_at: new Date()
        };
    } catch (error) {
        console.error('Yellowstone RE error:', error.message);
        return null;
    }
}

async function scrapeYellowstoneYellowDog() {
    const url = 'https://www.yellowdogflyfishing.com/pages/yellowstone-river-fishing-reports';
    
    try {
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000
        });
        
        const $ = cheerio.load(data);
        const pageText = $('body').text();
        const dateMatch = pageText.match(/Updated\s+([A-Za-z]+\s+\d{1,2},?\s+\d{2,4})/i);
        
        return {
            source: 'Yellow Dog (Yellowstone)',
            river: 'Yellowstone River',
            url: url,
            last_updated: dateMatch ? dateMatch[1] : null,
            scraped_at: new Date()
        };
    } catch (error) {
        console.error('Yellowstone YD error:', error.message);
        return null;
    }
}

module.exports = { scrapeYellowstoneMontanaAngler, scrapeYellowstoneRiversEdge, scrapeYellowstoneYellowDog };
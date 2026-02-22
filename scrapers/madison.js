const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeMadisonMT() {
    const url = 'https://www.montanatrout.com/pages/madison-river-fishing-report';
    
    try {
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000
        });
        
        const $ = cheerio.load(data);
        const pageText = $('body').text();
        
        // Look for "UPDATED 12/6/2024" pattern
        const dateMatch = pageText.match(/UPDATED\s+(\d{1,2}\/\d{1,2}\/\d{4})/i) ||
                         pageText.match(/Updated\s+([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i);
        
        return {
            source: 'Montana Trout',
            river: 'Madison River',
            url: url,
            last_updated: dateMatch ? dateMatch[1] : null,
            scraped_at: new Date()
        };
    } catch (error) {
        console.error('Madison MT error:', error.message);
        return null;
    }
}

async function scrapeMadisonRiverOutfitters() {
    const url = 'https://madisonriveroutfitters.com/blogs/fly-fishing-report';
    
    try {
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000
        });
        
        const $ = cheerio.load(data);
        // Find first report mentioning Madison
        const articles = $('article, .blog-post, .report');
        let madisonReport = null;
        
        articles.each((i, elem) => {
            const text = $(elem).text();
            if (text.toLowerCase().includes('madison') && text.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/)) {
                madisonReport = $(elem);
                return false;
            }
        });
        
        const dateText = madisonReport ? madisonReport.text() : $('body').text();
        const dateMatch = dateText.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/);
        
        return {
            source: 'Madison River Outfitters',
            river: 'Madison River',
            url: url,
            last_updated: dateMatch ? dateMatch[0] : null,
            scraped_at: new Date()
        };
    } catch (error) {
        console.error('Madison Outfitters error:', error.message);
        return null;
    }
}

async function scrapeMadisonYellowDog() {
    const url = 'https://www.yellowdogflyfishing.com/pages/upper-madison-fishing-reports';
    
    try {
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000
        });
        
        const $ = cheerio.load(data);
        const pageText = $('body').text();
        const dateMatch = pageText.match(/Updated\s+([A-Za-z]+\s+\d{1,2},?\s+\d{2,4})/i);
        
        return {
            source: 'Yellow Dog (Madison)',
            river: 'Madison River',
            url: url,
            last_updated: dateMatch ? dateMatch[1] : null,
            scraped_at: new Date()
        };
    } catch (error) {
        console.error('Madison Yellow Dog error:', error.message);
        return null;
    }
}

module.exports = { scrapeMadisonMT, scrapeMadisonRiverOutfitters, scrapeMadisonYellowDog };
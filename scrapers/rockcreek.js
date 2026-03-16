const axios = require('axios');
const cheerio = require('cheerio');

const ORVIS_ICON = 'https://montana-fishing-reports-production.up.railway.app/favicons/orvis.png';
const MISSOULIAN_ICON = 'https://montana-fishing-reports-production.up.railway.app/favicons/missoulian-angler.jpg';

async function scrapeRockCreekOrvis() {
    return {
        source: 'Orvis',
        river: 'Rock Creek',
        url: 'https://fishingreports.orvis.com/west/montana/rock-creek',
        last_updated: null,
        scraped_at: new Date().toISOString(),
        icon_url: ORVIS_ICON
    };
}

async function scrapeRockCreekMissoulian() {
    const url = 'https://www.missoulianangler.com/pages/rock-creek-fishing-report';
    
    try {
        const { data } = await axios.get(url, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            },
            timeout: 10000
        });
        
        const $ = cheerio.load(data);
        const pageText = $('body').text();
        const metaDate = $('time').attr('datetime') || '';
        
        let lastUpdated = null;
        if (metaDate) {
            lastUpdated = new Date(metaDate).toLocaleDateString();
        }
        
        return {
            source: 'The Missoulian Angler',
            river: 'Rock Creek',
            url: url,
            last_updated: lastUpdated,
            last_updated_text: lastUpdated,
            scraped_at: new Date().toISOString(),
            icon_url: MISSOULIAN_ICON,
            content: pageText.substring(0, 10000)
        };
    } catch (error) {
        console.error(`Error scraping Rock Creek Missoulian:`, error.message);
        return null;
    }
}

module.exports = {
    scrapeRockCreekOrvis,
    scrapeRockCreekMissoulian
};

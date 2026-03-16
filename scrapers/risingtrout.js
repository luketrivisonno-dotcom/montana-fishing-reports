const axios = require('axios');
const cheerio = require('cheerio');

const ICON_URL = 'https://montana-fishing-reports-production.up.railway.app/favicons/rising-trout.ico';

const RISING_TROUT_URLS = {
  'Gallatin River': 'https://www.risingtroutflyfishing.com/gallatin-river-fly-fishing-report',
  'Lower Madison River': 'https://www.risingtroutflyfishing.com/lower-madison-river-fly-fishing-report',
  'Yellowstone River': 'https://www.risingtroutflyfishing.com/yellowstone-river-fly-fishing-report'
};

async function scrapeRisingTrout() {
  let reports = [];
  
  for (const [river, url] of Object.entries(RISING_TROUT_URLS)) {
    try {
      const { data } = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        timeout: 10000
      });
      
      const $ = cheerio.load(data);
      const pageText = $('body').text();
      
      const dateMatch = 
        pageText.match(/Updated[:\s]+([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i) ||
        pageText.match(/([A-Za-z]+\s+\d{1,2},?\s+\d{4})/) ||
        pageText.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
      
      reports.push({
        source: 'Rising Trout Fly Fishing',
        river: river,
        url: url,
        last_updated: dateMatch ? dateMatch[1] : null,
        scraped_at: new Date(),
        icon_url: ICON_URL,
        content: pageText.substring(0, 10000)
      });
      
    } catch (error) {
      console.error(`Rising Trout error for ${river}:`, error.message);
    }
  }
  
  return reports.length > 0 ? reports : null;
}

module.exports = scrapeRisingTrout;

const axios = require('axios');
const cheerio = require('cheerio');

const ICON_URL = 'https://montana-fishing-reports-production.up.railway.app/favicons/bozeman-fly-supply.png';

const BOZEMAN_FLY_SUPPLY_URLS = {
  'Gallatin River': 'https://www.bozemanflysupply.com/river-report/gallatin',
  'Upper Madison River': 'https://www.bozemanflysupply.com/river-report/upper-madison',
  'Lower Madison River': 'https://www.bozemanflysupply.com/river-report/lower-madison',
  'Yellowstone River': 'https://www.bozemanflysupply.com/river-report/yellowstone'
};

async function scrapeBozemanFlySupply() {
  let reports = [];
  
  for (const [river, url] of Object.entries(BOZEMAN_FLY_SUPPLY_URLS)) {
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
        source: 'Bozeman Fly Supply',
        river: river,
        url: url,
        last_updated: dateMatch ? dateMatch[1] : null,
        scraped_at: new Date(),
        icon_url: ICON_URL,
        content: pageText.substring(0, 10000)
      });
      
    } catch (error) {
      console.error(`Bozeman Fly Supply error for ${river}:`, error.message);
    }
  }
  
  return reports.length > 0 ? reports : null;
}

module.exports = scrapeBozemanFlySupply;

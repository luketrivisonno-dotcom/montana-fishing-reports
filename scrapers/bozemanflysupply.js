const axios = require('axios');
const cheerio = require('cheerio');

const BOZEMAN_URLS = {
  'Gallatin River': 'https://www.bozemanflysupply.com/fishing-reports/gallatin-river',
  'Upper Madison River': 'https://www.bozemanflysupply.com/fishing-reports/upper-madison',
  'Lower Madison River': 'https://www.bozemanflysupply.com/fishing-reports/lower-madison',
  'Yellowstone River': 'https://www.bozemanflysupply.com/fishing-reports/yellowstone-river'
};

async function scrapeBozemanFlySupply() {
  let reports = [];
  
  for (const [river, url] of Object.entries(BOZEMAN_URLS)) {
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
        last_updated: dateMatch ? dateMatch[1] : new Date().toLocaleDateString(),
        scraped_at: new Date()
      });
      
    } catch (error) {
      console.error(`Bozeman Fly Supply error for ${river}:`, error.message);
    }
  }
  
  return reports.length > 0 ? reports : null;
}

module.exports = scrapeBozemanFlySupply;

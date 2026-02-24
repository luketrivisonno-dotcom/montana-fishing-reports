const axios = require('axios');
const cheerio = require('cheerio');

const SUNRISE_URLS = {
  'Beaverhead River': 'https://www.sunriseflyshop.com/fishing-reports/beaver-head-river',
  'Bighole River': 'https://www.sunriseflyshop.com/montana-fishing-reports/big-hole-river/'
};

async function scrapeSunriseFlyShop() {
  let reports = [];
  
  for (const [river, url] of Object.entries(SUNRISE_URLS)) {
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
        source: 'Sunrise Fly Shop',
        river: river,
        url: url,
        last_updated: dateMatch ? dateMatch[1] : new Date().toLocaleDateString(),
        scraped_at: new Date()
      });
      
    } catch (error) {
      console.error(`Sunrise Fly Shop error for ${river}:`, error.message);
    }
  }
  
  return reports.length > 0 ? reports : null;
}

module.exports = scrapeSunriseFlyShop;

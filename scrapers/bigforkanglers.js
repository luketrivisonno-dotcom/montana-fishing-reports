const axios = require('axios');
const cheerio = require('cheerio');

const BIGFORK_URLS = {
  'Flathead River': 'https://www.bigforkanglers.com/fishing-reports/flathead-river',
  'Swan River': 'https://www.bigforkanglers.com/fishing-reports/swan-river',
  'Blackfoot River': 'https://www.bigforkanglers.com/fishing-reports/blackfoot-river',
  'Clark Fork River': 'https://www.bigforkanglers.com/fishing-reports/clark-fork-river',
  'Bitterroot River': 'https://www.bigforkanglers.com/fishing-reports/bitterroot-river',
  'Rock Creek': 'https://www.bigforkanglers.com/fishing-reports/rock-creek',
  'Missouri River': 'https://www.bigforkanglers.com/fishing-reports/missouri-river',
  'Yellowstone River': 'https://www.bigforkanglers.com/fishing-reports/yellowstone-river'
};

async function scrapeBigforkAnglers() {
  let reports = [];
  
  for (const [river, url] of Object.entries(BIGFORK_URLS)) {
    try {
      const { data } = await axios.get(url, {
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        },
        timeout: 10000
      });
      
      const $ = cheerio.load(data);
      const pageText = $('body').text();
      
      // Look for date patterns
      const dateMatch = 
        pageText.match(/Updated[:\s]+([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i) ||
        pageText.match(/Report\s+Date[:\s]+([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i) ||
        pageText.match(/([A-Za-z]+\s+\d{1,2},?\s+\d{4})/) ||
        pageText.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
      
      reports.push({
        source: 'Bigfork Anglers',
        river: river,
        url: url,
        last_updated: dateMatch ? dateMatch[1] : new Date().toLocaleDateString(),
        scraped_at: new Date()
      });
      
    } catch (error) {
      console.error(`Bigfork Anglers error for ${river}:`, error.message);
    }
  }
  
  return reports.length > 0 ? reports : null;
}

module.exports = scrapeBigforkAnglers;

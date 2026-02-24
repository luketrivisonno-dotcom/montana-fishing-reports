const axios = require('axios');
const cheerio = require('cheerio');

const YELLOWDOG_URLS = {
  'Gallatin River': 'https://www.yellowdogflyfishing.com/pages/gallatin-river-fishing-report',
  'Upper Madison River': 'https://www.yellowdogflyfishing.com/pages/upper-madison-fishing-reports',
  'Lower Madison River': 'https://www.yellowdogflyfishing.com/pages/lower-madison-fishing-reports',
  'Yellowstone River': 'https://www.yellowdogflyfishing.com/pages/yellowstone-river-fishing-reports',
  'Missouri River': 'https://www.yellowdogflyfishing.com/pages/missouri-river-fishing-reports',
  'Bighorn River': 'https://www.yellowdogflyfishing.com/pages/bighorn-river-fishing-reports'
};

async function scrapeYellowDog() {
  let reports = [];
  
  for (const [river, url] of Object.entries(YELLOWDOG_URLS)) {
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
        source: `Yellow Dog (${river})`,
        river: river,
        url: url,
        last_updated: dateMatch ? dateMatch[1] : new Date().toLocaleDateString(),
        scraped_at: new Date()
      });
      
    } catch (error) {
      console.error(`Yellow Dog error for ${river}:`, error.message);
    }
  }
  
  return reports.length > 0 ? reports : null;
}

module.exports = scrapeYellowDog;

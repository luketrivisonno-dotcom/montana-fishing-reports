const axios = require('axios');
const cheerio = require('cheerio');

const GEORGE_URLS = {
  'Yellowstone River': 'https://www.yellowstoneangler.com/pages/yellowstone-river-fishing-report',
  'Spring Creeks': 'https://www.yellowstoneangler.com/pages/spring-creek-fishing-report',
  'Yellowstone National Park': 'https://www.yellowstoneangler.com/pages/yellowstone-national-park-fishing-report'
};

async function scrapeGeorgeAnderson() {
  let reports = [];
  
  for (const [river, url] of Object.entries(GEORGE_URLS)) {
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
        source: 'George Anderson\'s Yellowstone Angler',
        river: river,
        url: url,
        last_updated: dateMatch ? dateMatch[1] : new Date().toLocaleDateString(),
        scraped_at: new Date()
      });
      
    } catch (error) {
      console.error(`George Anderson error for ${river}:`, error.message);
    }
  }
  
  return reports.length > 0 ? reports : null;
}

module.exports = scrapeGeorgeAnderson;

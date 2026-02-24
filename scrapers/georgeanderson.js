const axios = require('axios');
const cheerio = require('cheerio');

const GEORGE_URLS = {
  'Yellowstone River': 'https://www.georgeandersons.com/fishing-reports/yellowstone-river',
  'Upper Madison River': 'https://www.georgeandersons.com/fishing-reports/madison-river',
  'Lower Madison River': 'https://www.georgeandersons.com/fishing-reports/madison-river',
  'Gallatin River': 'https://www.georgeandersons.com/fishing-reports/gallatin-river',
  'Spring Creeks': 'https://www.georgeandersons.com/fishing-reports/spring-creeks',
  'Boulder River': 'https://www.georgeandersons.com/fishing-reports/boulder-river'
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
        source: 'George Anderson\'s',
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

const axios = require('axios');
const cheerio = require('cheerio');

const GALLATIN_RIVER_GUIDES_URLS = {
  'Gallatin River': 'https://www.montanaflyfishing.com/gallatin-river-fishing-report',
  'Yellowstone River': 'https://www.montanaflyfishing.com/yellowstone-river-fishing-report'
};

async function scrapeGallatinRiverGuides() {
  let reports = [];
  
  for (const [river, url] of Object.entries(GALLATIN_RIVER_GUIDES_URLS)) {
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
        source: 'Gallatin River Guides',
        river: river,
        url: url,
        last_updated: dateMatch ? dateMatch[1] : new Date().toLocaleDateString(),
        scraped_at: new Date(),
        icon_url: 'https://www.montanaflyfishing.com/wp-content/uploads/2021/03/grg-logo.png'
      });
      
    } catch (error) {
      console.error(`Gallatin River Guides error for ${river}:`, error.message);
    }
  }
  
  return reports.length > 0 ? reports : null;
}

module.exports = scrapeGallatinRiverGuides;

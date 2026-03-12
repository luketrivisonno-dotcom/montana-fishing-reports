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
      
      // Gallatin River Guides uses format like "3/6/2026" in HTML
      // Search in raw HTML since cheerio text extraction doesn't work well for this site
      const dateMatch = 
        data.match(/(\d{1,2}\/\d{1,2}\/\d{4})/) ||
        data.match(/Updated[:\s]+([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i) ||
        data.match(/([A-Za-z]+\s+\d{1,2},?\s+\d{4})/);
      
      reports.push({
        source: 'Gallatin River Guides',
        river: river,
        url: url,
        last_updated: dateMatch ? dateMatch[1] : null,
        scraped_at: new Date(),
        icon_url: null
      });
      
    } catch (error) {
      console.error(`Gallatin River Guides error for ${river}:`, error.message);
    }
  }
  
  return reports.length > 0 ? reports : null;
}

module.exports = scrapeGallatinRiverGuides;

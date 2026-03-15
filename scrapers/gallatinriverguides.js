const axios = require('axios');
const cheerio = require('cheerio');

const ICON_URL = 'https://montana-fishing-reports-production.up.railway.app/favicons/gallatin-river-guides.ico';

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
        timeout: 10000,
        responseType: 'text'
      });
      
      // Gallatin River Guides uses format like "PublicationDate: 'Fri Mar 06 19:50:10 UTC 2026'"
      const dateMatch = 
        data.match(/PublicationDate:\s*'([^']+)'/) ||
        data.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
      
      reports.push({
        source: 'Gallatin River Guides',
        river: river,
        url: url,
        last_updated: dateMatch ? dateMatch[1] : null,
        scraped_at: new Date(),
        icon_url: ICON_URL
      });
      
    } catch (error) {
      console.error(`Gallatin River Guides error for ${river}:`, error.message);
    }
  }
  
  return reports.length > 0 ? reports : null;
}

module.exports = scrapeGallatinRiverGuides;

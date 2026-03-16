const axios = require('axios');
const cheerio = require('cheerio');

const ICON_URL = 'https://montana-fishing-reports-production.up.railway.app/favicons/gallatin-river-guides.ico';

const GALLATIN_RIVER_GUIDES_URLS = {
  'Gallatin River': 'https://www.montanaflyfishing.com/gallatin-river-fishing-report',
  'Upper Madison River': 'https://www.montanaflyfishing.com/upper-madison-river-fishing-report',
  'Lower Madison River': 'https://www.montanaflyfishing.com/lower-madison-river-fishing-report',
  'Yellowstone River': 'https://www.montanaflyfishing.com/yellowstone-river-fishing-report',
  'Slough Creek': 'https://www.montanaflyfishing.com/yellowstone-national-park-fishing-report',
  'Soda Butte Creek': 'https://www.montanaflyfishing.com/yellowstone-national-park-fishing-report',
  'Lamar River': 'https://www.montanaflyfishing.com/yellowstone-national-park-fishing-report',
  'Gardner River': 'https://www.montanaflyfishing.com/yellowstone-national-park-fishing-report',
  'Firehole River': 'https://www.montanaflyfishing.com/yellowstone-national-park-fishing-report'
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
      const $ = cheerio.load(data);
      const pageText = $('body').text();
      
      // Gallatin River Guides uses format like "PublicationDate: 'Fri Mar 06 19:50:10 UTC 2026'"
      // Find all dates and pick the most recent one
      const dateMatch = 
        data.match(/PublicationDate:\s*'([^']+)'/) ||
        pageText.match(/Updated[:\s]+([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i) ||
        pageText.match(/([A-Za-z]+\s+\d{1,2},?\s+\d{4})/) ||
        pageText.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
      
      reports.push({
        source: 'Gallatin River Guides',
        river: river,
        url: url,
        last_updated: dateMatch ? dateMatch[1] : null,
        scraped_at: new Date(),
        icon_url: ICON_URL,
        content: pageText.substring(0, 10000)
      });
      
    } catch (error) {
      console.error(`Gallatin River Guides error for ${river}:`, error.message);
    }
  }
  
  return reports.length > 0 ? reports : null;
}

module.exports = scrapeGallatinRiverGuides;

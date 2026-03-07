const axios = require('axios');
const cheerio = require('cheerio');

const FLY_FISHING_BOZEMAN_URLS = {
  'Gallatin River': 'https://flyfishingbozeman.com/montana-fly-fishing-reports/gallatin-river-fishing-report',
  'Madison River': 'https://flyfishingbozeman.com/montana-fly-fishing-reports/madison-river-fishing-report',
  'Yellowstone River': 'https://flyfishingbozeman.com/montana-fly-fishing-reports/yellowstone-river-fishing-report'
};

async function scrapeFlyFishingBozeman() {
  let reports = [];
  
  for (const [river, url] of Object.entries(FLY_FISHING_BOZEMAN_URLS)) {
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
        source: 'Fly Fishing Bozeman',
        river: river,
        url: url,
        last_updated: dateMatch ? dateMatch[1] : new Date().toLocaleDateString(),
        scraped_at: new Date(),
        icon_url: 'https://flyfishingbozeman.com/wp-content/uploads/2021/03/FFB-Logo-2021.png'
      });
      
    } catch (error) {
      console.error(`Fly Fishing Bozeman error for ${river}:`, error.message);
    }
  }
  
  return reports.length > 0 ? reports : null;
}

module.exports = scrapeFlyFishingBozeman;

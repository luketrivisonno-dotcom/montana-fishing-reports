const axios = require('axios');
const cheerio = require('cheerio');

const ICON_URL = 'https://montana-fishing-reports-production.up.railway.app/favicons/fins-feathers.svg';

const FLY_FISHING_BOZEMAN_URLS = {
  'Gallatin River': 'https://flyfishingbozeman.com/montana-fly-fishing-reports/gallatin-river-fishing-report',
  'Upper Madison River': 'https://flyfishingbozeman.com/montana-fly-fishing-reports/upper-madison-river-fishing-report',
  'Yellowstone River': 'https://flyfishingbozeman.com/montana-fly-fishing-reports/yellowstone-river-fishing-report',
  'Bighorn River': 'https://flyfishingbozeman.com/montana-fly-fishing-reports/bighorn-river-fishing-report'
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
      
      // Fly Fishing Bozeman uses "Last Updated: 03/12/2026" format
      // Find all dates and pick the most recent one
      const allDates = pageText.match(/\d{1,2}\/\d{1,2}\/\d{4}/g);
      let mostRecentDate = null;
      if (allDates) {
        // Parse all dates and find the most recent
        const parsedDates = allDates.map(d => {
          const [m, day, y] = d.split('/').map(Number);
          return { dateStr: d, timestamp: new Date(y, m - 1, day).getTime() };
        });
        parsedDates.sort((a, b) => b.timestamp - a.timestamp);
        mostRecentDate = parsedDates[0].dateStr;
      }
      
      reports.push({
        source: 'Fins and Feathers',
        river: river,
        url: url,
        last_updated: mostRecentDate,
        scraped_at: new Date(),
        icon_url: ICON_URL
      });
      
    } catch (error) {
      console.error(`Fly Fishing Bozeman error for ${river}:`, error.message);
    }
  }
  
  return reports.length > 0 ? reports : null;
}

module.exports = scrapeFlyFishingBozeman;

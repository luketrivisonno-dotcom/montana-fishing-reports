const axios = require('axios');
const cheerio = require('cheerio');

const ICON_URL = 'https://montana-fishing-reports-production.up.railway.app/favicons/parks.png';

// NOTE: Individual river URLs are 404, using main report page for all YNP rivers
// The page contains reports for all YNP rivers together
const PARKS_FLY_SHOP_URLS = {
  'Slough Creek': 'https://parksflyshop.com/fishing-report',
  'Soda Butte Creek': 'https://parksflyshop.com/fishing-report',
  'Lamar River': 'https://parksflyshop.com/fishing-report',
  'Gardner River': 'https://parksflyshop.com/fishing-report',
  'Firehole River': 'https://parksflyshop.com/fishing-report'
};

async function scrapeParksFlyShop() {
  let reports = [];

  for (const [river, url] of Object.entries(PARKS_FLY_SHOP_URLS)) {
    try {
      const { data } = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        timeout: 10000
      });

      const $ = cheerio.load(data);
      const pageText = $('body').text();

      // Look for date
      const dateMatch =
        pageText.match(/Updated[:\s]+([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i) ||
        pageText.match(/([A-Za-z]+\s+\d{1,2},?\s+\d{4})/) ||
        pageText.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);

      // Extract water clarity/conditions
      let waterClarity = null;
      const clarityPatterns = [
        /clarity[:\s]+([^.]+)/i,
        /visibility[:\s]+([^.]+)/i,
        /water\s+is\s+([^.]*(?:clear|off|muddy|stained|gin|excellent|good)[^.]*)/i,
        /(?:clear|off\s*color|muddy|stained|gin\s*clear)\s+water/i
      ];

      for (const pattern of clarityPatterns) {
        const match = pageText.match(pattern);
        if (match) {
          waterClarity = match[1] ? match[1].trim().substring(0, 50) : match[0].trim().substring(0, 50);
          break;
        }
      }

      reports.push({
        source: 'Parks Fly Shop',
        river: river,
        url: url,
        last_updated: dateMatch ? dateMatch[1] : null,
        last_updated_text: dateMatch ? dateMatch[1] : null,
        scraped_at: new Date(),
        icon_url: ICON_URL,
        water_clarity: waterClarity,
        content: pageText.substring(0, 10000)
      });

    } catch (error) {
      console.error(`Parks Fly Shop error for ${river}:`, error.message);
    }
  }

  return reports.length > 0 ? reports : null;
}

module.exports = scrapeParksFlyShop;

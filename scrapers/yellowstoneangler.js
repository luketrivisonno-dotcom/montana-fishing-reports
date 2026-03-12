const axios = require('axios');
const cheerio = require('cheerio');

const YELLOWSTONE_ANGLER_URLS = {
  'Slough Creek': 'https://yellowstoneangler.com/fishing-report/slough-creek',
  'Soda Butte Creek': 'https://yellowstoneangler.com/fishing-report/soda-butte-creek',
  'Lamar River': 'https://yellowstoneangler.com/fishing-report/lamar-river',
  'Gardner River': 'https://yellowstoneangler.com/fishing-report/gardner-river',
  'Firehole River': 'https://yellowstoneangler.com/fishing-report/firehole-river',
  'Yellowstone River': 'https://yellowstoneangler.com/fishing-report/yellowstone-river'
};

async function scrapeYellowstoneAngler() {
  let reports = [];

  for (const [river, url] of Object.entries(YELLOWSTONE_ANGLER_URLS)) {
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
        source: 'Yellowstone Angler',
        river: river,
        url: url,
        last_updated: dateMatch ? dateMatch[1] : new Date().toLocaleDateString(),
        last_updated_text: dateMatch ? dateMatch[1] : new Date().toLocaleDateString(),
        scraped_at: new Date(),
        icon_url: null,
        water_clarity: waterClarity
      });

    } catch (error) {
      console.error(`Yellowstone Angler error for ${river}:`, error.message);
    }
  }

  return reports.length > 0 ? reports : null;
}

module.exports = scrapeYellowstoneAngler;

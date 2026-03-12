const axios = require('axios');
const cheerio = require('cheerio');

// NOTE: These URLs redirect to georgeanderson.com which has the actual reports
// Keeping for reference but georgeanderson.js handles these rivers
const YELLOWSTONE_ANGLER_URLS = {
  'Yellowstone River': 'https://www.yellowstoneangler.com/pages/yellowstone-river-fishing-report',
  'Slough Creek': 'https://www.yellowstoneangler.com/pages/yellowstone-national-park-fishing-report',
  'Soda Butte Creek': 'https://www.yellowstoneangler.com/pages/yellowstone-national-park-fishing-report',
  'Lamar River': 'https://www.yellowstoneangler.com/pages/yellowstone-national-park-fishing-report',
  'Gardner River': 'https://www.yellowstoneangler.com/pages/yellowstone-national-park-fishing-report',
  'Firehole River': 'https://www.yellowstoneangler.com/pages/yellowstone-national-park-fishing-report'
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
        last_updated: dateMatch ? dateMatch[1] : null,
        last_updated_text: dateMatch ? dateMatch[1] : null,
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

const axios = require('axios');
const cheerio = require('cheerio');
const { extractHatchData } = require('../utils/hatchExtractor');
const db = require('../db');

const PARKS_FLY_SHOP_URLS = {
  // YNP Rivers only
  'Slough Creek': 'https://parksflyshop.com/fishing-report/slough-creek',
  'Soda Butte Creek': 'https://parksflyshop.com/fishing-report/soda-butte-creek',
  'Lamar River': 'https://parksflyshop.com/fishing-report/lamar-river',
  'Gardner River': 'https://parksflyshop.com/fishing-report/gardner-river',
  'Firehole River': 'https://parksflyshop.com/fishing-report/firehole-river'
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

      // Extract hatch data from the page content
      const hatchData = extractHatchData(pageText);
      
      // Save hatch data if we found any
      if (hatchData.hatches.length > 0) {
        try {
          await db.query(`UPDATE hatch_reports SET is_current = false WHERE river = $1`, [river]);
          await db.query(
            `INSERT INTO hatch_reports (river, source, hatches, fly_recommendations, hatch_details, water_temp, water_conditions, report_date, is_current)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)`,
            [river, 'Parks Fly Shop', hatchData.hatches, hatchData.fly_recommendations,
             JSON.stringify({ extracted_from: 'Parks Fly Shop fishing report', url }),
             hatchData.water_temp, hatchData.water_conditions,
             dateMatch ? new Date(dateMatch[1]) : new Date()]
          );
          console.log(`  → Hatches: ${hatchData.hatches.join(', ')}`);
        } catch (dbError) {
          console.error(`  → Error saving hatch data:`, dbError.message);
        }
      }

      reports.push({
        source: 'Parks Fly Shop',
        river: river,
        url: url,
        last_updated: dateMatch ? dateMatch[1] : null,
        last_updated_text: dateMatch ? dateMatch[1] : null,
        scraped_at: new Date(),
        icon_url: null,
        water_clarity: waterClarity,
        hatches: hatchData.hatches
      });

    } catch (error) {
      console.error(`Parks Fly Shop error for ${river}:`, error.message);
    }
  }

  return reports.length > 0 ? reports : null;
}

module.exports = scrapeParksFlyShop;

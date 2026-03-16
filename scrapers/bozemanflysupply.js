const axios = require('axios');
const cheerio = require('cheerio');
const { extractHatchData } = require('../utils/hatchExtractor');
const db = require('../db');

const ICON_URL = 'https://montana-fishing-reports-production.up.railway.app/favicons/bozeman-fly-supply.png';

const BOZEMAN_FLY_SUPPLY_URLS = {
  'Gallatin River': 'https://www.bozemanflysupply.com/river-report/gallatin',
  'Upper Madison River': 'https://www.bozemanflysupply.com/river-report/upper-madison',
  'Lower Madison River': 'https://www.bozemanflysupply.com/river-report/lower-madison',
  'Yellowstone River': 'https://www.bozemanflysupply.com/river-report/yellowstone'
};

async function scrapeBozemanFlySupply() {
  let reports = [];
  
  for (const [river, url] of Object.entries(BOZEMAN_FLY_SUPPLY_URLS)) {
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
      
      // Extract hatch data for Tier 2 hatch source
      const hatchData = extractHatchData(pageText);
      
      // Save hatch data if found (Tier 2 - supplementary)
      if (hatchData.hatches.length > 0) {
        try {
          await db.query(`UPDATE hatch_reports SET is_current = false WHERE river = $1`, [river]);
          await db.query(
            `INSERT INTO hatch_reports (river, source, hatches, fly_recommendations, hatch_details, water_temp, water_conditions, report_date, is_current)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)`,
            [river, 'Bozeman Fly Supply', hatchData.hatches, hatchData.fly_recommendations,
             JSON.stringify({ extracted_from: 'Bozeman Fly Supply fishing report', url }),
             hatchData.water_temp, hatchData.water_conditions,
             dateMatch ? new Date(dateMatch[1]) : new Date()]
          );
          console.log(`  → Bozeman Fly Supply hatches for ${river}: ${hatchData.hatches.join(', ')}`);
        } catch (dbError) {
          console.error(`  → Error saving Bozeman Fly Supply hatch data:`, dbError.message);
        }
      }
      
      reports.push({
        source: 'Bozeman Fly Supply',
        river: river,
        url: url,
        last_updated: dateMatch ? dateMatch[1] : null,
        scraped_at: new Date(),
        icon_url: ICON_URL,
        hatches: hatchData.hatches,
        content: pageText.substring(0, 10000)
      });
      
    } catch (error) {
      console.error(`Bozeman Fly Supply error for ${river}:`, error.message);
    }
  }
  
  return reports.length > 0 ? reports : null;
}

module.exports = scrapeBozemanFlySupply;

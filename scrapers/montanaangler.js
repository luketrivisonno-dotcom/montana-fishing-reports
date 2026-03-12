const axios = require('axios');
const cheerio = require('cheerio');
const { extractHatchData } = require('../utils/hatchExtractor');
const db = require('../db');

const MONTANA_ANGLER_URLS = {
  'Gallatin River': 'https://www.montanaangler.com/montana-fishing-report/gallatin-river-fishing-report',
  'Upper Madison River': 'https://www.montanaangler.com/montana-fishing-report/upper-madison-river-fishing-report',
  'Lower Madison River': 'https://www.montanaangler.com/montana-fishing-report/lower-madison-river-fishing-report',
  'Yellowstone River': 'https://www.montanaangler.com/montana-fishing-report/yellowstone-river-fishing-report',
  'Missouri River': 'https://www.montanaangler.com/montana-fishing-report/missouri-river-fishing-report',
  'Jefferson River': 'https://www.montanaangler.com/montana-fishing-report/jefferson-river-fishing-report',
  'Stillwater River': 'https://www.montanaangler.com/montana-fishing-report/stillwater-river-fishing-report',
  'Ruby River': 'https://www.montanaangler.com/montana-fishing-report/ruby-river-fishing-report',
  'Boulder River': 'https://www.montanaangler.com/montana-fishing-report/boulder-river-report',
  'Spring Creeks': 'https://www.montanaangler.com/montana-fishing-report/spring-creeks-fishing-report',
  'Slough Creek': 'https://www.montanaangler.com/fly-fishing-yellowstone-park',
  'Soda Butte Creek': 'https://www.montanaangler.com/fly-fishing-yellowstone-park',
  'Lamar River': 'https://www.montanaangler.com/fly-fishing-yellowstone-park',
  'Gardner River': 'https://www.montanaangler.com/fly-fishing-yellowstone-park',
  'Firehole River': 'https://www.montanaangler.com/fly-fishing-yellowstone-park'
};

const ICON_URL = null;

async function scrapeMontanaAngler() {
  let reports = [];
  
  for (const [river, url] of Object.entries(MONTANA_ANGLER_URLS)) {
    try {
      const { data } = await axios.get(url, {
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' 
        },
        timeout: 10000
      });
      
      const $ = cheerio.load(data);
      const pageText = $('body').text();
      
      // Look for date patterns like "Thursday, March 13, 2026" or "March 13, 2026"
      // Try the full pattern first, then fallback to simpler pattern
      let dateMatch = pageText.match(/[A-Za-z]+,\s+[A-Za-z]+\s+\d{1,2},\s+\d{4}/);
      if (!dateMatch) {
        dateMatch = pageText.match(/[A-Za-z]+\s+\d{1,2},\s+\d{4}/);
      }
      
      // Extract water clarity
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
          // Mark previous reports for this river as not current
          await db.query(
            `UPDATE hatch_reports SET is_current = false WHERE river = $1`,
            [river]
          );
          
          // Insert new hatch report
          await db.query(
            `INSERT INTO hatch_reports 
             (river, source, hatches, fly_recommendations, hatch_details, water_temp, water_conditions, report_date, is_current)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)`,
            [
              river,
              'Montana Angler',
              hatchData.hatches,
              hatchData.fly_recommendations,
              JSON.stringify({ extracted_from: 'Montana Angler fishing report', url }),
              hatchData.water_temp,
              hatchData.water_conditions,
              dateMatch ? new Date(dateMatch[0]) : null
            ]
          );
          console.log(`  → Hatches: ${hatchData.hatches.join(', ')}`);
        } catch (dbError) {
          console.error(`  → Error saving hatch data:`, dbError.message);
        }
      }
      
      reports.push({
        source: 'Montana Angler',
        river: river,
        url: url,
        last_updated: dateMatch ? dateMatch[0] : null,
        last_updated_text: dateMatch ? dateMatch[0] : null,
        scraped_at: new Date(),
        icon_url: ICON_URL,
        water_clarity: waterClarity,
        hatches: hatchData.hatches // Include in report for potential notifications
      });
      
    } catch (error) {
      console.error(`Montana Angler error for ${river}:`, error.message);
    }
  }
  
  return reports.length > 0 ? reports : null;
}

module.exports = scrapeMontanaAngler;

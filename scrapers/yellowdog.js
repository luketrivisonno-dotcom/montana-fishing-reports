const axios = require('axios');
const cheerio = require('cheerio');
const { extractHatchData } = require('../utils/hatchExtractor');
const db = require('../db');

const ICON_URL = 'https://montana-fishing-reports-production.up.railway.app/favicons/yellowdog.webp';

const YELLOWDOG_URLS = {
  'Gallatin River': 'https://www.yellowdogflyfishing.com/pages/gallatin-river-fishing-report',
  'Upper Madison River': 'https://www.yellowdogflyfishing.com/pages/upper-madison-fishing-reports',
  'Lower Madison River': 'https://www.yellowdogflyfishing.com/pages/lower-madison-fishing-reports',
  'Yellowstone River': 'https://www.yellowdogflyfishing.com/pages/yellowstone-river-fishing-reports',
  'Spring Creeks': 'https://www.yellowdogflyfishing.com/pages/spring-creeks-fishing-reports',
  'Missouri River': 'https://www.yellowdogflyfishing.com/pages/missouri-river-fishing-reports',
  'Slough Creek': 'https://www.yellowdogflyfishing.com/pages/yellowstone-park-fishing-reports',
  'Soda Butte Creek': 'https://www.yellowdogflyfishing.com/pages/yellowstone-park-fishing-reports',
  'Lamar River': 'https://www.yellowdogflyfishing.com/pages/yellowstone-park-fishing-reports',
  'Gardner River': 'https://www.yellowdogflyfishing.com/pages/yellowstone-park-fishing-reports',
  'Firehole River': 'https://www.yellowdogflyfishing.com/pages/yellowstone-park-fishing-reports',
  'Bighorn River': 'https://www.yellowdogflyfishing.com/pages/bighorn-river-fishing-reports'
};

async function scrapeYellowDog() {
  let reports = [];
  
  for (const [river, url] of Object.entries(YELLOWDOG_URLS)) {
    try {
      const { data } = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        timeout: 10000
      });
      
      const $ = cheerio.load(data);
      const pageText = $('body').text();
      
      // Yellow Dog pages show dates like "Mar 12, 26" (2-digit year) or "January 1, 1988" (fake)
      let dateMatch = 
        pageText.match(/Updated[:\s]+([A-Za-z]+\s+\d{1,2},?\s+\d{2,4})/i) ||
        pageText.match(/([A-Za-z]+\s+\d{1,2},?\s+\d{2,4})/) ||
        pageText.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/);
      
      // Validate date - reject old fake dates (1980s-1990s), accept 2020s
      if (dateMatch) {
        const dateStr = dateMatch[1] || dateMatch[0];
        let year = parseInt(dateStr.match(/\d{4}/)?.[0]);
        // Handle 2-digit years at end of string (e.g., "Mar 12, 26")
        if (!year) {
          const yearMatch = dateStr.match(/(\d{2})$/); // Get last 2 digits at end
          if (yearMatch) {
            const year2digit = parseInt(yearMatch[1]);
            if (year2digit >= 20 && year2digit <= 99) year = 2000 + year2digit;
            else if (year2digit >= 0 && year2digit < 20) year = 2000 + year2digit;
          }
        }
        if (year && (year < 2020 || year > 2030)) {
          dateMatch = null; // Reject old fake dates or far future dates
        }
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
          await db.query(`UPDATE hatch_reports SET is_current = false WHERE river = $1`, [river]);
          await db.query(
            `INSERT INTO hatch_reports (river, source, hatches, fly_recommendations, hatch_details, water_temp, water_conditions, report_date, is_current)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)`,
            [river, 'Yellow Dog Fly Fishing', hatchData.hatches, hatchData.fly_recommendations,
             JSON.stringify({ extracted_from: 'Yellow Dog fishing report', url }),
             hatchData.water_temp, hatchData.water_conditions,
             dateMatch ? new Date(dateMatch[1]) : new Date()]
          );
          console.log(`  → Hatches: ${hatchData.hatches.join(', ')}`);
        } catch (dbError) {
          console.error(`  → Error saving hatch data:`, dbError.message);
        }
      }
      
      reports.push({
        source: 'Yellow Dog Fly Fishing',
        river: river,
        url: url,
        last_updated: dateMatch ? dateMatch[1] : null,
        last_updated_text: dateMatch ? dateMatch[1] : null,
        scraped_at: new Date(),
        icon_url: ICON_URL,
        water_clarity: waterClarity,
        hatches: hatchData.hatches
      });
      
    } catch (error) {
      console.error(`Yellow Dog error for ${river}:`, error.message);
    }
  }
  
  return reports.length > 0 ? reports : null;
}

module.exports = scrapeYellowDog;

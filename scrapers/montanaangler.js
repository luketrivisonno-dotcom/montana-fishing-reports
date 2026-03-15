const axios = require('axios');
const cheerio = require('cheerio');

const ICON_URL = 'https://montana-fishing-reports-production.up.railway.app/favicons/montana-angler.png';

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
      let dateMatch = pageText.match(/[A-Za-z]+,\s+[A-Za-z]+\s+\d{1,2},\s+\d{4}/);
      if (!dateMatch) {
        dateMatch = pageText.match(/[A-Za-z]+\s+\d{1,2},\s+\d{4}/);
      }
      
      let lastUpdated = null;
      let lastUpdatedText = null;
      
      if (dateMatch) {
        lastUpdatedText = dateMatch[0];
        try {
          lastUpdated = new Date(dateMatch[0]).toISOString();
        } catch (e) {
          console.log(`  → Error parsing date for ${river}: ${dateMatch[0]}`);
        }
      }
      
      // Extract water clarity
      let waterClarity = null;
      const clarityMatch = pageText.match(/clarity[:\s]+([^.]+)/i);
      if (clarityMatch) {
        waterClarity = clarityMatch[1].trim().substring(0, 50);
      }
      
      reports.push({
        source: 'Montana Angler',
        river: river,
        url: url,
        last_updated: lastUpdated,
        last_updated_text: lastUpdatedText,
        scraped_at: new Date(),
        icon_url: ICON_URL,
        water_clarity: waterClarity
      });
      
      console.log(`  → Montana Angler - ${river}: ${lastUpdatedText || 'No date'}`);
      
    } catch (error) {
      console.error(`Montana Angler error for ${river}:`, error.message);
      // Still add the report with null date
      reports.push({
        source: 'Montana Angler',
        river: river,
        url: url,
        last_updated: null,
        last_updated_text: null,
        scraped_at: new Date(),
        icon_url: ICON_URL,
        water_clarity: null
      });
    }
  }
  
  return reports;
}

module.exports = scrapeMontanaAngler;

const axios = require('axios');
const cheerio = require('cheerio');

const MONTANA_ANGLER_URLS = {
  'Gallatin River': 'https://www.montanaangler.com/montana-fishing-report/gallatin-river-fishing-report',
  'Upper Madison River': 'https://www.montanaangler.com/montana-fishing-report/upper-madison-river-fishing-report',
  'Lower Madison River': 'https://www.montanaangler.com/montana-fishing-report/lower-madison-river-fishing-report',
  'Yellowstone River': 'https://www.montanaangler.com/montana-fishing-report/yellowstone-river-fishing-report',
  'Missouri River': 'https://www.montanaangler.com/montana-fishing-report/missouri-river-fishing-report',
  'Jefferson River': 'https://www.montanaangler.com/montana-fishing-report/jefferson-river-fishing-report',
  'Boulder River': 'https://www.montanaangler.com/montana-fishing-report/boulder-river-fishing-report',
  'Stillwater River': 'https://www.montanaangler.com/montana-fishing-report/stillwater-river-fishing-report',
  'Ruby River': 'https://www.montanaangler.com/montana-fishing-report/ruby-river-fishing-report',
  'Spring Creeks': 'https://www.montanaangler.com/montana-fishing-report/spring-creeks-fishing-report',
  'Yellowstone National Park': 'https://www.montanaangler.com/fly-fishing-yellowstone-park'
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
      
      const dateMatch = pageText.match(/([A-Za-z]+,\s+)?[A-Za-z]+\s+\d{1,2},\s+\d{4}/);
      
      reports.push({
        source: 'Montana Angler',
        river: river,
        url: url,
        last_updated: dateMatch ? dateMatch[0] : new Date().toLocaleDateString(),
        scraped_at: new Date()
      });
      
    } catch (error) {
      console.error(`Montana Angler error for ${river}:`, error.message);
    }
  }
  
  return reports.length > 0 ? reports : null;
}

module.exports = scrapeMontanaAngler;

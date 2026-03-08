const axios = require('axios');
const cheerio = require('cheerio');

const RIVERS_EDGE_URLS = {
  'Gallatin River': 'https://theriversedge.com/pages/gallatin-river-fishing-report',
  'Lower Madison River': 'https://theriversedge.com/pages/lower-madison-river-fishing-report',
  'Upper Madison River': 'https://theriversedge.com/pages/upper-madison-river-fishing-report',
  'Yellowstone River': 'https://theriversedge.com/pages/yellowstone-river-fishing-report',
  'Missouri River': 'https://theriversedge.com/pages/missouri-river-fishing-report',
  'Spring Creeks': 'https://theriversedge.com/pages/spring-creeks-fishing-report'
};

// Icon URL for The River's Edge
const RIVERS_EDGE_ICON = 'https://theriversedge.com/cdn/shop/files/TRE_Logo_Black_600x.png?v=1614309653';

async function scrapeRiversEdge() {
  let reports = [];
  
  for (const [river, url] of Object.entries(RIVERS_EDGE_URLS)) {
    try {
      const { data } = await axios.get(url, {
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        },
        timeout: 10000
      });
      
      const $ = cheerio.load(data);
      
      // Try to find date in the page
      const pageText = $('body').text();
      
      // Look for various date patterns
      const datePatterns = [
        /([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})/,
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
        /Updated[\s:]+([A-Za-z]+)\s+(\d{1,2})/i,
        /Report[\s:]+([A-Za-z]+)\s+(\d{1,2})/i
      ];
      
      let lastUpdated = null;
      for (const pattern of datePatterns) {
        const match = pageText.match(pattern);
        if (match) {
          lastUpdated = match[0];
          break;
        }
      }
      
      // Try to find water clarity info
      let waterClarity = null;
      const clarityPatterns = [
        /clarity[:\s]+([^.]+)/i,
        /visibility[:\s]+([^.]+)/i,
        /water\s+is\s+([^.]*(?:clear|off|muddy|stained|gin)[^.]*)/i,
        /(?:clear|off\s*color|muddy|stained)\s+water/i
      ];
      
      for (const pattern of clarityPatterns) {
        const match = pageText.match(pattern);
        if (match) {
          waterClarity = match[1] || match[0];
          break;
        }
      }
      
      reports.push({
        source: "The River's Edge",
        river: river,
        url: url,
        last_updated: lastUpdated || new Date().toLocaleDateString(),
        last_updated_text: lastUpdated || new Date().toLocaleDateString(),
        scraped_at: new Date(),
        icon_url: RIVERS_EDGE_ICON,
        water_clarity: waterClarity
      });
      
    } catch (error) {
      console.error(`River's Edge error for ${river}:`, error.message);
    }
  }
  
  return reports.length > 0 ? reports : null;
}

module.exports = scrapeRiversEdge;

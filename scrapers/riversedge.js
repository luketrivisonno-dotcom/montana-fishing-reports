const axios = require('axios');
const cheerio = require('cheerio');

const RIVERS_EDGE_URLS = {
  'Gallatin River': 'https://theriversedge.com/pages/gallatin-river-fishing-report',
  'Lower Madison River': 'https://theriversedge.com/pages/lower-madison-river-fishing-report',
  'Upper Madison River': 'https://theriversedge.com/pages/upper-madison-river-fishing-report',
  'Yellowstone River': 'https://theriversedge.com/pages/yellowstone-river-fishing-report',
  'Spring Creeks': 'https://theriversedge.com/pages/spring-creeks-fishing-report'
};

// Icon disabled - using letter avatar
const RIVERS_EDGE_ICON = null;

function formatDate(dateStr) {
  // Convert YYYY-MM-DD to "Month Day, YYYY" format
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

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
      const pageText = $('body').text();
      
      // Look for ISO date format YYYY-MM-DD (e.g., 2026-03-10)
      // These are blog-style dates on the River's Edge pages
      const isoDatePattern = /(\d{4})-(\d{1,2})-(\d{1,2})/;
      const isoMatch = pageText.match(isoDatePattern);
      console.log('ISO date match:', isoMatch ? isoMatch[0] : 'none found');
      
      let lastUpdated = null;
      if (isoMatch) {
        lastUpdated = formatDate(isoMatch[0]);
      } else {
        // Fallback to other date patterns
        const datePatterns = [
          /([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})/,
          /(\d{1,2})\/(\d{1,2})\/(\d{4})/
        ];
        
        for (const pattern of datePatterns) {
          const match = pageText.match(pattern);
          if (match) {
            lastUpdated = match[0];
            break;
          }
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
        last_updated: lastUpdated || null,
        last_updated_text: lastUpdated || null,
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

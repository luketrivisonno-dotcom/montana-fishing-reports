const axios = require('axios');
const cheerio = require('cheerio');

const TROUTFITTERS_URLS = {
  'Gallatin River': 'https://troutfitters.com/reports/gallatin-river',
  'Yellowstone River': 'https://troutfitters.com/reports/yellowstone-river',
  'Missouri River': 'https://troutfitters.com/reports/missouri-river',
  'Big Hole River': 'https://troutfitters.com/reports/big-hole-river'
};

async function scrapeTroutfitters() {
  let reports = [];
  
  for (const [river, url] of Object.entries(TROUTFITTERS_URLS)) {
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
      
      reports.push({
        source: 'Troutfitters',
        river: river,
        url: url,
        last_updated: dateMatch ? dateMatch[1] : new Date().toLocaleDateString(),
        last_updated_text: dateMatch ? dateMatch[1] : new Date().toLocaleDateString(),
        scraped_at: new Date(),
        icon_url: null,
        water_clarity: waterClarity
      });
      
    } catch (error) {
      console.error(`Troutfitters error for ${river}:`, error.message);
    }
  }
  
  return reports.length > 0 ? reports : null;
}

module.exports = scrapeTroutfitters;

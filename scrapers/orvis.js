const axios = require('axios');
const cheerio = require('cheerio');
const ICON_URL = 'https://fishingreports.orvis.com/favicon.ico';

const ORVIS_URLS = {
  'Gallatin River': 'https://fishingreports.orvis.com/west/montana/gallatin-river',
  'Upper Madison River': 'https://fishingreports.orvis.com/west/montana/madison-river',
  'Lower Madison River': 'https://fishingreports.orvis.com/west/montana/madison-river',
  'Yellowstone River': 'https://fishingreports.orvis.com/west/montana/yellowstone-river',
  'Missouri River': 'https://fishingreports.orvis.com/west/montana/missouri-river',
  'Big Hole River': 'https://fishingreports.orvis.com/west/montana/big-hole-river',
  'Bighorn River': 'https://fishingreports.orvis.com/west/montana/bighorn-river',
  'Rock Creek': 'https://fishingreports.orvis.com/west/montana/rock-creek',
  'Clark Fork River': 'https://fishingreports.orvis.com/west/montana/clark-fork-river',
  'Blackfoot River': 'https://fishingreports.orvis.com/west/montana/blackfoot-river',
  'Bitterroot River': 'https://fishingreports.orvis.com/west/montana/bitterroot-river',
};

async function scrapeOrvis() {
  let reports = [];
  
  for (const [river, url] of Object.entries(ORVIS_URLS)) {
    try {
      const { data } = await axios.get(url, {
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 15000
      });
      
      const $ = cheerio.load(data);
      const pageText = $('body').text();
      
      // Try to get date from HTML element first (Orvis specific)
      const lastUpdatedEl = $('.last-updated span').text();
      
      let finalDate = lastUpdatedEl || null;
      
      if (!finalDate) {
        const dateMatch = 
          pageText.match(/Updated[:\s]+([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i) ||
          pageText.match(/Report\s+Date[:\s]+([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i) ||
          pageText.match(/([A-Za-z]+\s+\d{1,2},?\s+\d{4})/) ||
          pageText.match(/(\d{1,2}\/\d{1,2}\/\d{4})/) ||
          pageText.match(/(\d{1,2}\/\d{1,2}\/\d{2})/);
        
        if (dateMatch) {
          // Convert short year format (3/4/26) to full date
          if (dateMatch[1].match(/^\d{1,2}\/\d{1,2}\/\d{2}$/)) {
            const [m, d, y] = dateMatch[1].split('/');
            const fullYear = parseInt(y) > 50 ? '19' + y : '20' + y;
            finalDate = new Date(`${fullYear}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`).toLocaleDateString('en-US', {
              month: 'long', day: 'numeric', year: 'numeric'
            });
          } else {
            finalDate = dateMatch[1];
          }
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
      
      reports.push({
        source: 'Orvis',
        river: river,
        url: url,
        title: `${river} - Orvis Fishing Report`,
        last_updated: finalDate || new Date().toLocaleDateString(),
        last_updated_text: finalDate || new Date().toLocaleDateString(),
        author: 'Orvis',
        icon_url: ICON_URL,
        water_clarity: waterClarity,
        scraped_at: new Date()
      });
      
    } catch (error) {
      console.error(`Orvis error for ${river}:`, error.message);
    }
  }
  
  if (reports.length > 0) {
    console.log(`\nOrvis: Found ${reports.length} reports`);
    return reports;
  }
  
  return [];
}

module.exports = scrapeOrvis;

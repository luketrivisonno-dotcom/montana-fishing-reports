const axios = require('axios');

const ICON_URL = 'https://montana-fishing-reports-production.up.railway.app/favicons/perfect-fly.png';

const PERFECT_FLY_URLS = {
  'Stillwater River': 'https://perfectflystore.com/your-streams/fly-fishing-stillwater-river-montana/',
  'Ruby River': 'https://perfectflystore.com/your-streams/fly-fishing-ruby-river-montana/',
  'Boulder River': 'https://perfectflystore.com/your-streams/fly-fishing-boulder-river-montana/'
};

async function scrapePerfectFly() {
  let reports = [];
  
  for (const [river, url] of Object.entries(PERFECT_FLY_URLS)) {
    try {
      const { data } = await axios.get(url, {
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 10000
      });
      
      // Look for dateModified in JSON-LD schema
      const schemaMatch = data.match(/"dateModified":"([^"]+)"/);
      let lastUpdated = null;
      
      if (schemaMatch) {
        const date = new Date(schemaMatch[1]);
        lastUpdated = date.toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric', 
          year: 'numeric' 
        });
      }
      
      // Extract water clarity
      let waterClarity = null;
      const clarityPatterns = [
        /clarity[:\s]+([^.]+)/i,
        /visibility[:\s]+([^.]+)/i,
        /water\s+is\s+([^.]*(?:clear|off|muddy|stained|gin|excellent|good)[^.]*)/i
      ];
      
      for (const pattern of clarityPatterns) {
        const match = data.match(pattern);
        if (match) {
          waterClarity = match[1] ? match[1].trim().substring(0, 50) : match[0].trim().substring(0, 50);
          break;
        }
      }
      
      const pageText = cheerio.load(data)('body').text();
      
      reports.push({
        source: 'Perfect Fly Store',
        river: river,
        url: url,
        last_updated: lastUpdated,
        last_updated_text: lastUpdated,
        scraped_at: new Date(),
        icon_url: ICON_URL,
        water_clarity: waterClarity,
        content: pageText.substring(0, 10000)
      });
      
    } catch (error) {
      console.error(`Perfect Fly error for ${river}:`, error.message);
    }
  }
  
  return reports.length > 0 ? reports : null;
}

module.exports = scrapePerfectFly;

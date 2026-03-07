const axios = require('axios');

const PERFECT_FLY_URLS = {
  'Stillwater River': 'https://perfectflystore.com/your-streams/fly-fishing-stillwater-river-montana/',
  'Ruby River': 'https://perfectflystore.com/your-streams/fly-fishing-ruby-river-montana/'
};

async function scrapePerfectFly() {
  let reports = [];
  
  for (const [river, url] of Object.entries(PERFECT_FLY_URLS)) {
    try {
      const { data } = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        timeout: 10000
      });
      
      // Look for dateModified in JSON-LD schema
      const schemaMatch = data.match(/"dateModified":"([^"]+)"/);
      let lastUpdated = new Date().toLocaleDateString();
      
      if (schemaMatch) {
        const date = new Date(schemaMatch[1]);
        lastUpdated = date.toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric', 
          year: 'numeric' 
        });
      }
      
      reports.push({
        source: 'Perfect Fly Store',
        river: river,
        url: url,
        last_updated: lastUpdated,
        scraped_at: new Date(),
        icon_url: null
      });
      
    } catch (error) {
      console.error(`Perfect Fly error for ${river}:`, error.message);
    }
  }
  
  return reports.length > 0 ? reports : null;
}

module.exports = scrapePerfectFly;

const axios = require('axios');

async function scrapePerfectFly() {
  const url = 'https://perfectflystore.com/your-streams/fly-fishing-stillwater-river-montana/';
  
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
    
    return [{
      source: 'Perfect Fly Store',
      river: 'Stillwater River',
      url: url,
      last_updated: lastUpdated,
      scraped_at: new Date()
    }];
    
  } catch (error) {
    console.error('Perfect Fly error:', error.message);
    return null;
  }
}

module.exports = scrapePerfectFly;

const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeFlyFishingBozeman() {
  const url = 'https://flyfishingbozeman.com/montana-fly-fishing-reports/yellowstone-river-fishing-report';
  
  try {
    const { data } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 10000
    });
    
    const $ = cheerio.load(data);
    const pageText = $('body').text();
    const dateMatch = pageText.match(/Date:\s*(\d{1,2}\/\d{1,2}\/\d{4})/);
    
    return {
      source: 'Fly Fishing Bozeman (Yellowstone)',
      river: 'Yellowstone River',
      url: url,
      last_updated: dateMatch ? dateMatch[1] : null,
      scraped_at: new Date()
    };
  } catch (error) {
    console.error('Fly Fishing Bozeman error:', error.message);
    return null;
  }
}

module.exports = scrapeFlyFishingBozeman;
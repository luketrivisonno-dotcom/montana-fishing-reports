const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeYellowstoneAngler() {
  const url = 'https://www.yellowstoneangler.com/pages/yellowstone-river-fishing-report';
  
  try {
    const { data } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 10000
    });
    
    const $ = cheerio.load(data);
    const pageText = $('body').text();
    const dateMatch = pageText.match(/([A-Za-z]+\s+\d{1,2},?\s+\d{4})/);
    
    return {
      source: 'Yellowstone Angler',
      river: 'Yellowstone River',
      url: url,
      last_updated: dateMatch ? dateMatch[0] : null,
      scraped_at: new Date()
    };
  } catch (error) {
    console.error('Yellowstone Angler error:', error.message);
    return null;
  }
}

module.exports = scrapeYellowstoneAngler;

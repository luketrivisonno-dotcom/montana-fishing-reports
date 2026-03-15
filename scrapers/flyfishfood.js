const axios = require('axios');

const ICON_URL = 'https://montana-fishing-reports-production.up.railway.app/favicons/fly-fish-food.jpg';
const cheerio = require('cheerio');

async function scrapeFlyFishFood() {
  const url = 'https://flyfishfood.com/blog';
  
  try {
    const { data } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 10000
    });
    
    const $ = cheerio.load(data);
    const pageText = $('body').text();
    
    // Look for date patterns
    const dateMatch = 
      pageText.match(/Updated[:\s]+([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i) ||
      pageText.match(/([A-Za-z]+\s+\d{1,2},?\s+\d{4})/) ||
      pageText.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
    
    // Fly Fish Food is based in Utah but has general fly fishing info
    // They don't have specific Montana river reports, so we'll link to their blog
    return [{
      source: 'Fly Fish Food',
      river: 'General Montana',
      url: url,
      last_updated: dateMatch ? dateMatch[1] : null,
      scraped_at: new Date(),
      icon_url: ICON_URL
    }];
    
  } catch (error) {
    console.error('Fly Fish Food error:', error.message);
    return null;
  }
}

module.exports = scrapeFlyFishFood;

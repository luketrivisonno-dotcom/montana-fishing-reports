const axios = require('axios');

const ICON_URL = 'https://montana-fishing-reports-production.up.railway.app/favicons/sunrise.png';
const cheerio = require('cheerio');

async function scrapeSunriseFlyShop() {
  const url = 'https://www.sunriseflyshop.com/fishing-report/';
  
  try {
    const { data } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 10000
    });
    
    const $ = cheerio.load(data);
    const pageText = $('body').text();
    
    const dateMatch = 
      pageText.match(/([A-Za-z]+\s+\d{1,2},?\s+\d{4})/) ||
      pageText.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
    
    return [
      {
        source: 'Sunrise Fly Shop',
        river: 'Big Hole River',
        url: url,
        last_updated: dateMatch ? dateMatch[1] : null,
        scraped_at: new Date()
      },
      {
        source: 'Sunrise Fly Shop',
        river: 'Beaverhead River',
        url: url,
        last_updated: dateMatch ? dateMatch[1] : null,
        scraped_at: new Date()
      }
    ];
    
  } catch (error) {
    console.error('Sunrise Fly Shop error:', error.message);
    return null;
  }
}

module.exports = scrapeSunriseFlyShop;

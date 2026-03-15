const axios = require('axios');

const ICON_URL = 'https://montana-fishing-reports-production.up.railway.app/favicons/jacklins.png';
const cheerio = require('cheerio');

async function scrapeJacklins() {
  const url = 'http://jacklinsflyshop.qwestoffice.net/prods/fishingyellowstone.html';
  
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
    
    // Return reports for all YNP rivers since this is a general YNP report
    const dateStr = dateMatch ? dateMatch[1] : null;
    return [
      {
        source: 'Jacklin\'s Fly Shop',
        river: 'Slough Creek',
        url: url,
        last_updated: dateStr,
        scraped_at: new Date()
      },
      {
        source: 'Jacklin\'s Fly Shop',
        river: 'Soda Butte Creek',
        url: url,
        last_updated: dateStr,
        scraped_at: new Date()
      },
      {
        source: 'Jacklin\'s Fly Shop',
        river: 'Lamar River',
        url: url,
        last_updated: dateStr,
        scraped_at: new Date()
      },
      {
        source: 'Jacklin\'s Fly Shop',
        river: 'Gardner River',
        url: url,
        last_updated: dateStr,
        scraped_at: new Date()
      },
      {
        source: 'Jacklin\'s Fly Shop',
        river: 'Firehole River',
        url: url,
        last_updated: dateStr,
        scraped_at: new Date()
      }
    ];
    
  } catch (error) {
    console.error('Jacklin\'s error:', error.message);
    return null;
  }
}

module.exports = scrapeJacklins;

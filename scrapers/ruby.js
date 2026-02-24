const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeRuby() {
  const url = 'https://www.orvis.com/fishing-report/ruby-river';
  
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
    
    return [{
      source: 'Orvis',
      river: 'Ruby River',
      url: url,
      last_updated: dateMatch ? dateMatch[1] : new Date().toLocaleDateString(),
      scraped_at: new Date()
    }];
    
  } catch (error) {
    console.error('Ruby River error:', error.message);
    return null;
  }
}

module.exports = scrapeRuby;

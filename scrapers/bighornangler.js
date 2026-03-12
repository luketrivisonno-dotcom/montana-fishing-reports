const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeBighornAngler() {
  const url = 'https://bighornangler.com/reports';
  
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
    
    return [{
      source: 'Bighorn Angler',
      river: 'Bighorn River',
      url: url,
      last_updated: dateMatch ? dateMatch[1] : new Date().toLocaleDateString(),
      scraped_at: new Date(),
      icon_url: null
    }];
    
  } catch (error) {
    console.error('Bighorn Angler error:', error.message);
    return null;
  }
}

module.exports = scrapeBighornAngler;

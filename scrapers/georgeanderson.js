const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeGeorgeAnderson() {
  // Yellowstone Angler (George Anderson's shop)
  const url = 'https://www.yellowstoneangler.com/fishing-reports/';
  
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
    
    // Yellowstone Angler covers these rivers
    const rivers = [
      'Yellowstone River',
      'Madison River',
      'Gallatin River',
      'Spring Creeks',
      'Boulder River'
    ];
    
    return rivers.map(river => ({
      source: 'George Anderson\'s Yellowstone Angler',
      river: river,
      url: url,
      last_updated: dateMatch ? dateMatch[1] : new Date().toLocaleDateString(),
      scraped_at: new Date()
    }));
    
  } catch (error) {
    console.error('George Anderson error:', error.message);
    return null;
  }
}

module.exports = scrapeGeorgeAnderson;


const axios = require('cheerio');
const cheerio = require('cheerio');

async function scrapeStoneflyShop() {
  const url = 'https://www.thestonefly.com/pages/fishing-reports';
  
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
    
    // The Stonefly guides on: Big Hole, Beaverhead, Jefferson, Clark Fork, Madison, Missouri
    const rivers = [
      'Big Hole River',
      'Beaverhead River',
      'Jefferson River',
      'Clark Fork River',
      'Madison River',
      'Missouri River'
    ];
    
    return rivers.map(river => ({
      source: 'Stonefly Shop',
      river: river,
      url: url,
      last_updated: dateMatch ? dateMatch[1] : new Date().toLocaleDateString(),
      scraped_at: new Date()
    }));
    
  } catch (error) {
    console.error('Stonefly Shop error:', error.message);
    return null;
  }
}

module.exports = scrapeStoneflyShop;

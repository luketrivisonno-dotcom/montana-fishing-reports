const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeBigforkAnglers() {
  const url = 'https://bigforkanglers.com/blog/';
  
  try {
    const { data } = await axios.get(url, {
      headers: { 
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(data);
    const pageText = $('body').text();
    
    const dateMatch = 
      pageText.match(/Updated[:\s]+([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i) ||
      pageText.match(/([A-Za-z]+\s+\d{1,2},?\s+\d{4})/) ||
      pageText.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
    
    // Bigfork Anglers guides on these rivers
    const rivers = [
      'Flathead River',
      'Swan River',
      'Blackfoot River',
      'Clark Fork River',
      'Bitterroot River',
      'Missouri River',
      'Rock Creek'
    ];
    
    return rivers.map(river => ({
      source: 'Bigfork Anglers',
      river: river,
      url: url,
      last_updated: dateMatch ? dateMatch[1] : new Date().toLocaleDateString(),
      scraped_at: new Date()
    }));
    
  } catch (error) {
    console.error('Bigfork Anglers error:', error.message);
    return null;
  }
}

module.exports = scrapeBigforkAnglers;

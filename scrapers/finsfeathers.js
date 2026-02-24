const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeFinsFeathers() {
  const url = 'https://www.finsandfeathers.com/fishing-reports';
  
  try {
    const { data } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 10000
    });
    
    const $ = cheerio.load(data);
    const pageText = $('body').text();
    
    const dateMatch = 
      pageText.match(/([A-Za-z]+\s+\d{1,2},?\s+\d{4})/) ||
      pageText.match(/Updated[:\s]+([A-Za-z]+\s+\d{1,2})/i);
    
    // Fins & Feathers covers multiple Montana rivers
    const rivers = [
      'Gallatin River',
      'Madison River',
      'Yellowstone River',
      'Missouri River',
      'Bighorn River'
    ];
    
    return rivers.map(river => ({
      source: 'Fins & Feathers',
      river: river,
      url: url,
      last_updated: dateMatch ? dateMatch[1] : new Date().toLocaleDateString(),
      scraped_at: new Date()
    }));
    
  } catch (error) {
    console.error('Fins & Feathers error:', error.message);
    return null;
  }
}

module.exports = scrapeFinsFeathers;

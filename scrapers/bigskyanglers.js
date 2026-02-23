const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeBigSkyAnglers() {
  const url = 'https://bigskyanglers.com/blogs/fishing-reports';
  
  try {
    const { data } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 10000
    });
    
    const $ = cheerio.load(data);
    const pageText = $('body').text();
    const dateMatch = pageText.match(/([A-Za-z]+\s+\d{1,2},?\s+\d{4})/);
    
    return {
      source: 'Big Sky Anglers',
      river: 'Madison River',
      url: url,
      last_updated: dateMatch ? dateMatch[0] : null,
      scraped_at: new Date()
    };
  } catch (error) {
    console.error('Big Sky Anglers error:', error.message);
    return null;
  }
}

module.exports = scrapeBigSkyAnglers;

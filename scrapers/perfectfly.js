const axios = require('axios');
const cheerio = require('cheerio');

async function scrapePerfectFly() {
  const url = 'https://www.perfectflystore.com/Stillwater-River-fishing-report.php';
  
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
      source: 'Perfect Fly Store',
      river: 'Stillwater River',
      url: url,
      last_updated: dateMatch ? dateMatch[1] : new Date().toLocaleDateString(),
      scraped_at: new Date()
    }];
    
  } catch (error) {
    console.error('Perfect Fly error:', error.message);
    return null;
  }
}

module.exports = scrapePerfectFly;

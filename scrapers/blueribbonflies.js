const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeBlueRibbonFlies() {
  const url = 'https://www.blueribbonflies.com/';
  
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
    const dateStr = dateMatch ? dateMatch[1] : new Date().toLocaleDateString();
    return [
      {
        source: 'Blue Ribbon Flies',
        river: 'Slough Creek',
        url: url,
        last_updated: dateStr,
        scraped_at: new Date()
      },
      {
        source: 'Blue Ribbon Flies',
        river: 'Soda Butte Creek',
        url: url,
        last_updated: dateStr,
        scraped_at: new Date()
      },
      {
        source: 'Blue Ribbon Flies',
        river: 'Lamar River',
        url: url,
        last_updated: dateStr,
        scraped_at: new Date()
      },
      {
        source: 'Blue Ribbon Flies',
        river: 'Gardner River',
        url: url,
        last_updated: dateStr,
        scraped_at: new Date()
      },
      {
        source: 'Blue Ribbon Flies',
        river: 'Firehole River',
        url: url,
        last_updated: dateStr,
        scraped_at: new Date()
      }
    ];
    
  } catch (error) {
    console.error('Blue Ribbon Flies error:', error.message);
    return null;
  }
}

module.exports = scrapeBlueRibbonFlies;

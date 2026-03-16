const axios = require('axios');
const cheerio = require('cheerio');

const ICON_URL = 'https://montana-fishing-reports-production.up.railway.app/favicons/blue-ribbon-flies.png';

async function scrapeBlueRibbonFlies() {
  const url = 'https://www.blueribbonflies.com/fishing-report/';
  
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
    
    const dateStr = dateMatch ? dateMatch[1] : null;
    
    // Return reports for all YNP rivers since this is a general YNP report
    const rivers = ['Slough Creek', 'Soda Butte Creek', 'Lamar River', 'Gardner River', 'Firehole River'];
    const reports = [];
    
    for (const river of rivers) {
      reports.push({
        source: 'Blue Ribbon Flies',
        river: river,
        url: url,
        last_updated: dateStr,
        scraped_at: new Date(),
        content: pageText.substring(0, 10000)
      });
    }
    
    return reports;
    
  } catch (error) {
    console.error('Blue Ribbon Flies error:', error.message);
    return null;
  }
}

module.exports = scrapeBlueRibbonFlies;

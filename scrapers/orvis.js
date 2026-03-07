const axios = require('axios');
const cheerio = require('cheerio');
const { saveReports } = require('../utils/scraperHelpers');

const ORVIS_URLS = {
  'Gallatin River': 'https://fishingreports.orvis.com/west/montana/gallatin-river',
  'Upper Madison River': 'https://fishingreports.orvis.com/west/montana/madison-river',
  'Lower Madison River': 'https://fishingreports.orvis.com/west/montana/madison-river',
  'Yellowstone River': 'https://fishingreports.orvis.com/west/montana/yellowstone-river',
  'Missouri River': 'https://fishingreports.orvis.com/west/montana/missouri-river',
  'Big Hole River': 'https://fishingreports.orvis.com/west/montana/big-hole-river',
  'Beaverhead River': 'https://fishingreports.orvis.com/west/montana/beaverhead-river',
  'Bighorn River': 'https://fishingreports.orvis.com/west/montana/bighorn-river',
  'Rock Creek': 'https://fishingreports.orvis.com/west/montana/rock-creek',
  'Clark Fork River': 'https://fishingreports.orvis.com/west/montana/clark-fork-river',
  'Blackfoot River': 'https://fishingreports.orvis.com/west/montana/blackfoot-river',
  'Bitterroot River': 'https://fishingreports.orvis.com/west/montana/bitterroot-river',
  'Flathead River': 'https://fishingreports.orvis.com/west/montana/flathead-river',
  'Jefferson River': 'https://fishingreports.orvis.com/west/montana/jefferson-river',
};

async function scrapeOrvis() {
  let reports = [];
  
  for (const [river, url] of Object.entries(ORVIS_URLS)) {
    try {
      const { data } = await axios.get(url, {
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 15000
      });
      
      const $ = cheerio.load(data);
      const pageText = $('body').text();
      
      const dateMatch = 
        pageText.match(/Updated[:\s]+([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i) ||
        pageText.match(/Report\s+Date[:\s]+([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i) ||
        pageText.match(/([A-Za-z]+\s+\d{1,2},?\s+\d{4})/) ||
        pageText.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
      
      const metaDate = $('meta[property="article:modified_time"]').attr('content') ||
                       $('meta[property="article:published_time"]').attr('content');
      
      let finalDate = dateMatch ? dateMatch[1] : null;
      
      if (!finalDate && metaDate) {
        finalDate = new Date(metaDate).toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric', 
          year: 'numeric' 
        });
      }
      
      reports.push({
        source: 'Orvis',
        river: river,
        url: url,
        title: `${river} - Orvis Fishing Report`,
        last_updated: finalDate || new Date().toLocaleDateString(),
        author: 'Orvis',
        icon_url: null
      });
      
    } catch (error) {
      console.error(`Orvis error for ${river}:`, error.message);
    }
  }
  
  if (reports.length > 0) {
    console.log(`\nOrvis: Found ${reports.length} reports`);
    const saved = await saveReports(reports);
    console.log(`Orvis: Saved ${saved.length} reports\n`);
    return saved;
  }
  
  return [];
}

module.exports = scrapeOrvis;

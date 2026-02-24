const axios = require('axios');
const cheerio = require('cheerio');

const ORVIS_URLS = {
  'Gallatin River': 'https://www.orvis.com/fishing-report/gallatin-river',
  'Upper Madison River': 'https://www.orvis.com/fishing-report/upper-madison-river',
  'Lower Madison River': 'https://www.orvis.com/fishing-report/lower-madison-river',
  'Yellowstone River': 'https://www.orvis.com/fishing-report/yellowstone-river',
  'Missouri River': 'https://www.orvis.com/fishing-report/missouri-river',
  'Big Hole River': 'https://www.orvis.com/fishing-report/big-hole-river',
  'Beaverhead River': 'https://www.orvis.com/fishing-report/beaverhead-river',
  'Bighorn River': 'https://www.orvis.com/fishing-report/bighorn-river',
  'Bitterroot River': 'https://www.orvis.com/fishing-report/bitterroot-river',
  'Rock Creek': 'https://www.orvis.com/fishing-report/rock-creek',
  'Clark Fork River': 'https://www.orvis.com/fishing-report/clark-fork-river',
  'Blackfoot River': 'https://www.orvis.com/fishing-report/blackfoot-river',
  'Flathead River': 'https://www.orvis.com/fishing-report/flathead-river',
  'Jefferson River': 'https://www.orvis.com/fishing-report/jefferson-river'
};

async function scrapeOrvis() {
  let reports = [];
  
  for (const [river, url] of Object.entries(ORVIS_URLS)) {
    try {
      const { data } = await axios.get(url, {
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: 15000
      });
      
      const $ = cheerio.load(data);
      const pageText = $('body').text();
      
      // Look for date patterns in the page
      const dateMatch = 
        pageText.match(/Updated[:\s]+([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i) ||
        pageText.match(/Report\s+Date[:\s]+([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i) ||
        pageText.match(/([A-Za-z]+\s+\d{1,2},?\s+\d{4})/) ||
        pageText.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
      
      // Try to find the report date in meta tags or specific elements
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
        last_updated: finalDate || new Date().toLocaleDateString(),
        scraped_at: new Date()
      });
      
    } catch (error) {
      console.error(`Orvis error for ${river}:`, error.message);
    }
  }
  
  return reports.length > 0 ? reports : null;
}

module.exports = scrapeOrvis;

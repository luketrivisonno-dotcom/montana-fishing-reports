const axios = require('axios');
const cheerio = require('cheerio');

const MONTANA_ANGLER_ICON = 'https://montana-fishing-reports-production.up.railway.app/favicons/montana-angler.png';
const SWEETWATER_ICON = 'https://montana-fishing-reports-production.up.railway.app/favicons/sweetwater.png';

async function scrapeBoulderMontanaAngler() {
  const url = 'https://www.montanaangler.com/montana-fishing-report/boulder-river-report';
  
  try {
    const { data } = await axios.get(url, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' 
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(data);
    const pageText = $('body').text();
    
    // Extract date - look for "Month DD, YYYY" pattern
    const dateMatch = pageText.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})/i);
    
    let lastUpdated = null;
    let lastUpdatedText = null;
    
    if (dateMatch) {
      lastUpdatedText = dateMatch[0];
      try {
        lastUpdated = new Date(dateMatch[0]).toISOString();
      } catch (e) {
        console.log(`  → Error parsing date for Boulder Montana Angler: ${dateMatch[0]}`);
      }
    }
    
    console.log(`  → Montana Angler - Boulder River: ${lastUpdatedText || 'No date found'}`);
    
    return {
      source: 'Montana Angler',
      river: 'Boulder River',
      url: url,
      last_updated: lastUpdated,
      last_updated_text: lastUpdatedText,
      scraped_at: new Date(),
      icon_url: MONTANA_ANGLER_ICON,
      water_clarity: null
    };
    
  } catch (error) {
    console.error('Montana Angler Boulder error:', error.message);
    return {
      source: 'Montana Angler',
      river: 'Boulder River',
      url: url,
      last_updated: null,
      last_updated_text: null,
      scraped_at: new Date(),
      icon_url: MONTANA_ANGLER_ICON,
      water_clarity: null
    };
  }
}

async function scrapeBoulderSweetwater() {
  return {
    source: 'Sweetwater Fly Shop',
    river: 'Boulder River',
    url: 'https://www.sweetwaterflyshop.com/fishing-reports/',
    last_updated: null,
    last_updated_text: null,
    scraped_at: new Date(),
    icon_url: SWEETWATER_ICON,
    water_clarity: null
  };
}

async function scrapeBoulder() {
  // Run both scrapers
  const [montanaAngler, sweetwater] = await Promise.all([
    scrapeBoulderMontanaAngler(),
    scrapeBoulderSweetwater()
  ]);
  
  return [montanaAngler, sweetwater];
}

module.exports = scrapeBoulder;

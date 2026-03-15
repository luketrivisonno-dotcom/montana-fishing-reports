const axios = require('axios');

const ICON_URL = 'https://montana-fishing-reports-production.up.railway.app/favicons/missoulian-angler.jpg';
const cheerio = require('cheerio');

async function scrapeClarkForkMissoulian() {
  const url = 'https://www.missoulianangler.com/pages/clark-fork-river-fishing-report';
  
  try {
    const { data } = await axios.get(url, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' 
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(data);
    const pageText = $('body').text();
    
    // Missoulian Angler uses format: "Last Updated: March 11,2026" (no space after comma)
    // Also handle normal format "Month DD, YYYY"
    const dateMatch = pageText.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s*(\d{4})/i);
    
    let lastUpdated = null;
    let lastUpdatedText = null;
    
    if (dateMatch) {
      // Reconstruct the date string properly
      lastUpdatedText = `${dateMatch[1]} ${dateMatch[2]}, ${dateMatch[3]}`;
      try {
        lastUpdated = new Date(lastUpdatedText).toISOString();
      } catch (e) {
        console.log(`  → Error parsing date for Clark Fork Missoulian: ${lastUpdatedText}`);
      }
    }
    
    console.log(`  → Missoulian Angler - Clark Fork River: ${lastUpdatedText || 'No date found'}`);
    
    return {
      source: 'The Missoulian Angler',
      river: 'Clark Fork River',
      url: url,
      last_updated: lastUpdated,
      last_updated_text: lastUpdatedText,
      scraped_at: new Date(),
      icon_url: ICON_URL,
      water_clarity: null
    };
    
  } catch (error) {
    console.error('Missoulian Angler Clark Fork error:', error.message);
    return {
      source: 'The Missoulian Angler',
      river: 'Clark Fork River',
      url: url,
      last_updated: null,
      last_updated_text: null,
      scraped_at: new Date(),
      icon_url: ICON_URL,
      water_clarity: null
    };
  }
}

module.exports = {
  scrapeClarkForkMissoulian
};

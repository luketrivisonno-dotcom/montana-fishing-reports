const axios = require('axios');

const ICON_URL = 'https://montana-fishing-reports-production.up.railway.app/favicons/missoulian-angler.jpg';
const cheerio = require('cheerio');

// Missoulian Angler - Individual river report URLs
const MISSOULIAN_URLS = {
  'Bitterroot River': 'https://www.missoulianangler.com/pages/bitterroot',
  'Blackfoot River': 'https://www.missoulianangler.com/pages/blackfoot-river-fly-fishing',
  'Clark Fork River': 'https://www.missoulianangler.com/pages/clark-fork-river-fishing-report',
  'Rock Creek': 'https://www.missoulianangler.com/pages/rock-creek-fishing-report'
};

async function scrapeMissoulianAngler() {
  const reports = [];
  
  for (const [river, url] of Object.entries(MISSOULIAN_URLS)) {
    try {
      console.log(`Scraping Missoulian Angler for ${river}...`);
      
      const { data } = await axios.get(url, {
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        },
        timeout: 10000
      });
      
      const $ = cheerio.load(data);
      const pageText = $('body').text();
      
      // Look for date in the content
      // Common patterns: "Updated March 10, 2024" or just "March 10, 2024"
      const dateMatch = 
        pageText.match(/Updated[\s:]+([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i) ||
        pageText.match(/([A-Za-z]+\s+\d{1,2},?\s+\d{4})/);
      
      // Try to find a more specific date from the page content
      const titleText = $('h1').first().text() || '';
      const metaDate = $('time').attr('datetime') || '';
      
      let lastUpdated = null;
      if (metaDate) {
        lastUpdated = new Date(metaDate).toLocaleDateString();
      } else if (dateMatch) {
        lastUpdated = dateMatch[1];
      }
      
      reports.push({
        source: 'The Missoulian Angler',
        river: river,
        url: url,
        last_updated: lastUpdated,
        last_updated_text: lastUpdated,
        scraped_at: new Date().toISOString(),
        icon_url: ICON_URL
      });
      
      console.log(`  ✓ ${river}: ${lastUpdated}`);
      
    } catch (error) {
      console.error(`  ✗ Error scraping ${river}:`, error.message);
    }
  }
  
  return reports.length > 0 ? reports : null;
}

// Individual river scrapers for backward compatibility
async function scrapeBitterrootMissoulian() {
  return scrapeSingleRiver('Bitterroot River');
}

async function scrapeBlackfootMissoulian() {
  return scrapeSingleRiver('Blackfoot River');
}

async function scrapeClarkForkMissoulian() {
  return scrapeSingleRiver('Clark Fork River');
}

async function scrapeRockCreekMissoulian() {
  return scrapeSingleRiver('Rock Creek');
}

async function scrapeSingleRiver(riverName) {
  const url = MISSOULIAN_URLS[riverName];
  if (!url) return null;
  
  try {
    const { data } = await axios.get(url, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(data);
    const metaDate = $('time').attr('datetime') || '';
    
    let lastUpdated = null;
    if (metaDate) {
      lastUpdated = new Date(metaDate).toLocaleDateString();
    }
    
    return {
      source: 'The Missoulian Angler',
      river: riverName,
      url: url,
      last_updated: lastUpdated,
      last_updated_text: lastUpdated,
      scraped_at: new Date().toISOString(),
      icon_url: ICON_URL
    };
  } catch (error) {
    console.error(`Error scraping ${riverName}:`, error.message);
    return null;
  }
}

module.exports = {
  scrapeMissoulianAngler,
  scrapeBitterrootMissoulian,
  scrapeBlackfootMissoulian,
  scrapeClarkForkMissoulian,
  scrapeRockCreekMissoulian
};

const db = require('../db');
const { getWeatherForRiver } = require('../utils/weather');
const { getUSGSData } = require('../utils/usgs');

// Import all scrapers
const scrapeYellowDog = require('./yellowdog');
const scrapeMontanaAngler = require('./montanaangler');
const scrapeFinsFeathers = require('./finsfeathers');
const scrapeOrvis = require('./orvis');
const scrapeBozemanFlySupply = require('./bozemanflysupply');

const madison = require('./madison');
const yellowstone = require('./yellowstone');
const missouri = require('./missouri');
const clarkfork = require('./clarkfork');
const blackfoot = require('./blackfoot');
const bighorn = require('./bighorn');
const bitterroot = require('./bitterroot');
const rockcreek = require('./rockcreek');

// New scrapers
const scrapeFlyFishingBozeman = require('./flyfishingbozeman');
const scrapeDanBaileys = require('./danbaileys');
const scrapeBigSkyAnglers = require('./bigskyanglers');
const scrapeFlyFishFood = require('./flyfishfood');
const scrapeTroutfitters = require('./troutfitters');
const scrapeBigforkAnglers = require('./bigforkanglers');
const scrapeSunriseFlyShop = require('./sunriseflyshop');
const scrapeStoneflyShop = require('./stoneflyshop');
const scrapeGeorgeAnderson = require('./georgeanderson');

// Helper function to parse date strings
function parseDate(dateString) {
  if (!dateString) return new Date();
  
  const formats = [
    /([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})/,
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
    /(\d{4})-(\d{2})-(\d{2})/
  ];
  
  for (const format of formats) {
    const match = dateString.match(format);
    if (match) {
      try {
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) return date;
      } catch (e) {
        continue;
      }
    }
  }
  
  return new Date();
}

async function runAllScrapers() {
  console.log('\n========================================');
  console.log('Starting scraper run:', new Date().toISOString());
  console.log('========================================\n');
  
  const allScrapers = [
    // Multi-river scrapers
    { name: 'Yellow Dog', fn: scrapeYellowDog },
    { name: 'Fins & Feathers', fn: scrapeFinsFeathers },
    { name: 'Orvis', fn: scrapeOrvis },
    { name: 'Troutfitters', fn: scrapeTroutfitters },
    { name: 'Bigfork Anglers', fn: scrapeBigforkAnglers },
    { name: 'Bozeman Fly Supply', fn: scrapeBozemanFlySupply },
    { name: 'Montana Angler', fn: scrapeMontanaAngler },
    { name: 'Dan Bailey\'s', fn: scrapeDanBaileys },
    { name: 'George Anderson\'s', fn: scrapeGeorgeAnderson },
    { name: 'Sunrise Fly Shop', fn: scrapeSunriseFlyShop },
    { name: 'Stonefly Shop', fn: scrapeStoneflyShop },
    
    // River-specific scrapers
    { name: 'Fly Fishing Bozeman', fn: scrapeFlyFishingBozeman },
    { name: 'Big Sky Anglers', fn: scrapeBigSkyAnglers },
    { name: 'Fly Fish Food', fn: scrapeFlyFishFood },
    
    // Madison River
    { name: 'Montana Trout (Madison)', fn: madison.scrapeMadisonMT },
    { name: 'Madison River Outfitters', fn: madison.scrapeMadisonRiverOutfitters },
    
    // Yellowstone River
    { name: 'River\'s Edge (Yellowstone)', fn: yellowstone.scrapeYellowstoneRiversEdge },
    
    // Missouri River
    { name: 'Headhunters Fly Shop', fn: missouri.scrapeMissouriHeadhunters },
    { name: 'River\'s Edge (Missouri)', fn: missouri.scrapeMissouriRiversEdge },
    
    // Clark Fork River
    { name: 'Grizzly Hackle (Clark Fork)', fn: clarkfork.scrapeClarkForkGrizzly },
    { name: 'Blackfoot River Outfitters (Clark Fork)', fn: clarkfork.scrapeClarkForkBlackfoot },
    
    // Blackfoot River
    { name: 'Grizzly Hackle (Blackfoot)', fn: blackfoot.scrapeBlackfootGrizzly },
    { name: 'Blackfoot River Outfitters', fn: blackfoot.scrapeBlackfootBRO },
    
    // Bighorn River
    { name: 'North Fork Anglers', fn: bighorn.scrapeBighornNorthFork },
    { name: 'Bighorn Angler', fn: bighorn.scrapeBighornAngler },
    
    // Bitterroot River
    { name: 'Montana Angler (Bitterroot)', fn: bitterroot.scrapeBitterrootMontanaAngler },
    
    // Rock Creek
    { name: 'Grizzly Hackle (Rock Creek)', fn: rockcreek.scrapeRockCreekGrizzly },
    { name: 'Montana Angler (Rock Creek)', fn: rockcreek.scrapeRockCreekMontanaAngler },
    
    // New rivers
    { name: 'Spring Creeks', fn: require('./springcreeks') },
    { name: 'Boulder River', fn: require('./boulder') },
    { name: 'Ruby River', fn: require('./ruby') },
    { name: 'Stillwater River', fn: require('./stillwater') }
  ];
  
  let successCount = 0;
  let failCount = 0;
  
  for (const scraper of allScrapers) {
    console.log(`\n--- Running ${scraper.name} ---`);
    
    try {
      const result = await scraper.fn();
      
      const results = Array.isArray(result) ? result : [result];
      
      for (const item of results) {
        if (item && item.last_updated) {
          const parsedDate = parseDate(item.last_updated);
          const dateString = parsedDate.toISOString().split('T')[0];
          
          const existing = await db.query(
            'SELECT * FROM reports WHERE source = $1 AND river = $2 ORDER BY scraped_at DESC LIMIT 1',
            [item.source, item.river]
          );
          
          if (existing.rows.length === 0) {
            await db.query(
              `INSERT INTO reports (source, river, url, last_updated, scraped_at, is_active) 
               VALUES ($1, $2, $3, $4, $5, true)`,
              [item.source, item.river, item.url, dateString, item.scraped_at]
            );
            console.log(`✓ Inserted: ${item.source} (${item.river}) - ${dateString}`);
            successCount++;
          } else {
            const existingDate = new Date(existing.rows[0].last_updated);
            const newDate = parsedDate;
            
            if (newDate >= existingDate || isNaN(existingDate.getTime())) {
              await db.query(
                `UPDATE reports 
                 SET last_updated = $1, scraped_at = $2, url = $3, is_active = true 
                 WHERE source = $4 AND river = $5`,
                [dateString, item.scraped_at, item.url, item.source, item.river]
              );
              console.log(`✓ Updated: ${item.source} (${item.river}) - ${dateString}`);
              successCount++;
            } else {
              console.log(`⊘ Skipped (older): ${item.source} (${item.river})`);
            }
          }
        }
      }
    } catch (error) {
      failCount++;
      console.error(`✗ Error: ${scraper.name}`, error.message);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Deactivate old duplicates
  await db.query(`
    UPDATE reports 
    SET is_active = false 
    WHERE id NOT IN (
      SELECT DISTINCT ON (source, river) id 
      FROM reports 
      WHERE is_active = true 
      ORDER BY source, river, scraped_at DESC
    )
  `);
  
  console.log('\n========================================');
  console.log(`Complete: ${successCount} succeeded, ${failCount} failed`);
  console.log('========================================\n');
  
  return { successCount, failCount };
}

module.exports = { runAllScrapers };

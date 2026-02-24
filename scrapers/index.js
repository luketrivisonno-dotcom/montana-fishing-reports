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
const scrapeYellowstoneAngler = require('./yellowstoneangler');
const scrapeFlyFishingBozeman = require('./flyfishingbozeman');
const scrapeDanBaileys = require('./danbaileys');
const scrapeBigSkyAnglers = require('./bigskyanglers');
const scrapeFlyFishFood = require('./flyfishfood');
const scrapeTroutfitters = require('./troutfitters');
const scrapeBigforkAnglers = require('./bigforkanglers');

async function runAllScrapers() {
  console.log('\n========================================');
  console.log('Starting scraper run:', new Date().toISOString());
  console.log('========================================\n');
  
  const allScrapers = [
    // Gallatin River
    { name: 'Yellow Dog (Gallatin)', fn: scrapeYellowDog },
    { name: 'Montana Angler (Gallatin)', fn: scrapeMontanaAngler },
    { name: 'Fins & Feathers', fn: scrapeFinsFeathers },
    { name: 'Orvis (Gallatin)', fn: scrapeOrvis },
    { name: 'Bozeman Fly Supply', fn: scrapeBozemanFlySupply },
    { name: 'Troutfitters (Gallatin)', fn: scrapeTroutfitters },
    
    // Madison River (split into Upper/Lower)
    { name: 'Montana Trout (Madison)', fn: madison.scrapeMadisonMT },
    { name: 'Madison River Outfitters', fn: madison.scrapeMadisonRiverOutfitters },
    { name: 'Yellow Dog (Upper Madison)', fn: madison.scrapeMadisonYellowDog },
    { name: 'Big Sky Anglers', fn: scrapeBigSkyAnglers },
    { name: 'Dan Bailey\'s (Madison)', fn: scrapeDanBaileys },
    { name: 'Troutfitters (Madison)', fn: scrapeTroutfitters },
    
    // Yellowstone River
    { name: 'Montana Angler (Yellowstone)', fn: yellowstone.scrapeYellowstoneMontanaAngler },
    { name: 'River\'s Edge (Yellowstone)', fn: yellowstone.scrapeYellowstoneRiversEdge },
    { name: 'Yellow Dog (Yellowstone)', fn: yellowstone.scrapeYellowstoneYellowDog },
    { name: 'Yellowstone Angler', fn: scrapeYellowstoneAngler },
    { name: 'Fly Fishing Bozeman (Yellowstone)', fn: scrapeFlyFishingBozeman },
    { name: 'Dan Bailey\'s (Yellowstone)', fn: scrapeDanBaileys },
    { name: 'Troutfitters (Yellowstone)', fn: scrapeTroutfitters },
    { name: 'Bigfork Anglers (Yellowstone)', fn: scrapeBigforkAnglers },
    
    // Missouri River
    { name: 'Montana Angler (Missouri)', fn: missouri.scrapeMissouriMontanaAngler },
    { name: 'Headhunters Fly Shop', fn: missouri.scrapeMissouriHeadhunters },
    { name: 'River\'s Edge (Missouri)', fn: missouri.scrapeMissouriRiversEdge },
    { name: 'Yellow Dog (Missouri)', fn: scrapeYellowDog },
    { name: 'Fins & Feathers (Missouri)', fn: scrapeFinsFeathers },
    { name: 'Dan Bailey\'s (Missouri)', fn: scrapeDanBaileys },
    { name: 'Troutfitters (Missouri)', fn: scrapeTroutfitters },
    { name: 'Bigfork Anglers (Missouri)', fn: scrapeBigforkAnglers },
    
    // Clark Fork River
    { name: 'Orvis (Clark Fork)', fn: clarkfork.scrapeClarkForkOrvis },
    { name: 'Grizzly Hackle (Clark Fork)', fn: clarkfork.scrapeClarkForkGrizzly },
    { name: 'Blackfoot River Outfitters (Clark Fork)', fn: clarkfork.scrapeClarkForkBlackfoot },
    { name: 'Troutfitters (Clark Fork)', fn: scrapeTroutfitters },
    { name: 'Bigfork Anglers (Clark Fork)', fn: scrapeBigforkAnglers },
    
    // Blackfoot River
    { name: 'Orvis (Blackfoot)', fn: blackfoot.scrapeBlackfootOrvis },
    { name: 'Grizzly Hackle (Blackfoot)', fn: blackfoot.scrapeBlackfootGrizzly },
    { name: 'Blackfoot River Outfitters', fn: blackfoot.scrapeBlackfootBRO },
    { name: 'Troutfitters (Blackfoot)', fn: scrapeTroutfitters },
    { name: 'Bigfork Anglers (Blackfoot)', fn: scrapeBigforkAnglers },
    
    // Bighorn River
    { name: 'North Fork Anglers', fn: bighorn.scrapeBighornNorthFork },
    { name: 'Yellow Dog (Bighorn)', fn: bighorn.scrapeBighornYellowDog },
    { name: 'Bighorn Angler', fn: bighorn.scrapeBighornAngler },
    { name: 'Troutfitters (Bighorn)', fn: scrapeTroutfitters },
    
    // Bitterroot River
    { name: 'Orvis (Bitterroot)', fn: bitterroot.scrapeBitterrootOrvis },
    { name: 'Montana Angler (Bitterroot)', fn: bitterroot.scrapeBitterrootMontanaAngler },
    { name: 'Troutfitters (Bitterroot)', fn: scrapeTroutfitters },
    { name: 'Bigfork Anglers (Bitterroot)', fn: scrapeBigforkAnglers },
    
    // Rock Creek
    { name: 'Orvis (Rock Creek)', fn: rockcreek.scrapeRockCreekOrvis },
    { name: 'Montana Angler (Rock Creek)', fn: rockcreek.scrapeRockCreekMontanaAngler },
    { name: 'Troutfitters (Rock Creek)', fn: scrapeTroutfitters },
    { name: 'Bigfork Anglers (Rock Creek)', fn: scrapeBigforkAnglers },
    
    // Beaverhead River
    { name: 'Troutfitters (Beaverhead)', fn: scrapeTroutfitters },
    
    // Big Hole River
    { name: 'Troutfitters (Big Hole)', fn: scrapeTroutfitters },
    
    // Flathead River
    { name: 'Troutfitters (Flathead)', fn: scrapeTroutfitters },
    { name: 'Bigfork Anglers (Flathead)', fn: scrapeBigforkAnglers },
    
    // Jefferson River
    { name: 'Troutfitters (Jefferson)', fn: scrapeTroutfitters },
    
    // Swan River (new - only from Bigfork Anglers)
    { name: 'Bigfork Anglers (Swan)', fn: scrapeBigforkAnglers },
    
    // General sources
    { name: 'Fly Fish Food', fn: scrapeFlyFishFood }
  ];
  
  let successCount = 0;
  let failCount = 0;
  
  for (const scraper of allScrapers) {
    console.log(`\n--- Running ${scraper.name} ---`);
    
    try {
      const result = await scraper.fn();
      
      // Handle array results (for split rivers or multiple reports)
      const results = Array.isArray(result) ? result : [result];
      
      for (const item of results) {
        if (item && item.last_updated) {
          successCount++;
          
          const existing = await db.query(
            'SELECT * FROM reports WHERE source = $1 AND river = $2',
            [item.source, item.river]
          );
          
          if (existing.rows.length === 0) {
            await db.query(
              `INSERT INTO reports (source, river, url, last_updated, scraped_at) 
               VALUES ($1, $2, $3, $4, $5)`,
              [item.source, item.river, item.url, item.last_updated, item.scraped_at]
            );
            console.log(`✓ Inserted: ${item.source} (${item.river})`);
          } else {
            await db.query(
              `UPDATE reports 
               SET last_updated = $1, scraped_at = $2, url = $3 
               WHERE source = $4 AND river = $5`,
              [item.last_updated, item.scraped_at, item.url, item.source, item.river]
            );
            console.log(`✓ Updated: ${item.source} (${item.river})`);
          }
        }
      }
    } catch (error) {
      failCount++;
      console.error(`✗ Error: ${scraper.name}`, error.message);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n========================================');
  console.log(`Complete: ${successCount} succeeded, ${failCount} failed`);
  console.log('========================================\n');
  
  return { successCount, failCount };
}

module.exports = { runAllScrapers };

const db = require('../db');

// Import working scrapers (ones with actual implementations)
const scrapeMontanaAngler = require('./montanaangler');
const scrapeBlueRibbonFlies = require('./blueribbonflies');
const scrapeOrvis = require('./orvis');
const scrapeBighornAngler = require('./bighornangler');
const scrapeBozemanFlySupply = require('./bozemanflysupply');
const scrapeFlyFishFood = require('./flyfishfood');
const scrapeYellowDog = require('./yellowdog');
const scrapeFlyFishingBozeman = require('./flyfishingbozeman');
const scrapeTroutfitters = require('./troutfitters');
const scrapeGallatinRiverGuides = require('./gallatinriverguides');
const scrapeRisingTrout = require('./risingtrout');
const scrapeGrizzlyHackle = require('./grizzlyhackle');
const scrapeKingfisher = require('./kingfisher');
const scrapePerfectFly = require('./perfectfly');
const scrapeRiversEdge = require('./riversedge');
const scrapeFinsFeathers = require('./finsfeathers');
const scrapeStoneflyShop = require('./stoneflyshop');

// River-specific scrapers
const madison = require('./madison');
const yellowstone = require('./yellowstone');
const missouri = require('./missouri');
const clarkfork = require('./clarkfork');
const blackfoot = require('./blackfoot');
const bighorn = require('./bighorn');
const bitterroot = require('./bitterroot');
const rockcreek = require('./rockcreek');
const gallatin = require('./gallatin');

// Helper function to parse date strings
function parseDate(dateString) {
  if (!dateString) return new Date();
  
  // Try parsing the date string directly first
  let parsed = new Date(dateString);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }
  
  // Common date formats to try
  const formats = [
    // March 10, 2026
    { regex: /([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})/, fn: (m) => new Date(`${m[1]} ${m[2]}, ${m[3]}`) },
    // 03/10/2026
    { regex: /(\d{1,2})\/(\d{1,2})\/(\d{4})/, fn: (m) => new Date(`${m[3]}-${m[1].padStart(2,'0')}-${m[2].padStart(2,'0')}`) },
    // 2026-03-10
    { regex: /(\d{4})-(\d{2})-(\d{2})/, fn: (m) => new Date(`${m[1]}-${m[2]}-${m[3]}`) },
    // Mar 10
    { regex: /([A-Za-z]{3})\s+(\d{1,2})/, fn: (m) => new Date(`${m[1]} ${m[2]}, ${new Date().getFullYear()}`) }
  ];
  
  for (const format of formats) {
    const match = dateString.match(format.regex);
    if (match) {
      try {
        const date = format.fn(match);
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
    // Main multi-river scrapers (with working implementations)
    { name: 'Montana Angler', fn: scrapeMontanaAngler },
    { name: 'Blue Ribbon Flies', fn: scrapeBlueRibbonFlies },
    { name: 'Orvis', fn: scrapeOrvis },
    { name: 'Bighorn Angler', fn: scrapeBighornAngler },
    { name: 'Bozeman Fly Supply', fn: scrapeBozemanFlySupply },
    { name: 'Fly Fish Food', fn: scrapeFlyFishFood },
    { name: 'Yellow Dog Fly Fishing', fn: scrapeYellowDog },
    { name: 'Fly Fishing Bozeman', fn: scrapeFlyFishingBozeman },
    { name: 'Troutfitters', fn: scrapeTroutfitters },
    { name: 'Gallatin River Guides', fn: scrapeGallatinRiverGuides },
    { name: 'Rising Trout Fly Fishing', fn: scrapeRisingTrout },
    { name: 'Grizzly Hackle', fn: scrapeGrizzlyHackle },
    { name: 'Kingfisher Fly Shop', fn: scrapeKingfisher },
    { name: 'Perfect Fly Store', fn: scrapePerfectFly },
    { name: 'The River\'s Edge', fn: scrapeRiversEdge },
    { name: 'Fins & Feathers', fn: scrapeFinsFeathers },
    { name: 'Stonefly Shop', fn: scrapeStoneflyShop },
    
    // River-specific scrapers (with hardcoded URLs)
    { name: 'Montana Angler (Madison)', fn: madison.scrapeMadisonMontanaAngler },
    { name: 'Orvis (Madison)', fn: madison.scrapeMadisonOrvis },
    { name: 'River\'s Edge (Madison)', fn: madison.scrapeMadisonRiversEdge },
    { name: 'Bozeman Fly Supply (Madison)', fn: madison.scrapeMadisonBozemanFlySupply },
    { name: 'Yellow Dog (Madison)', fn: madison.scrapeMadisonYellowDog },
    { name: 'Montana Angler (Yellowstone)', fn: yellowstone.scrapeYellowstoneMontanaAngler },
    { name: 'River\'s Edge (Yellowstone)', fn: yellowstone.scrapeYellowstoneRiversEdge },
    { name: 'Sweetwater Fly Shop (Yellowstone)', fn: yellowstone.scrapeYellowstoneSweetwater },
    { name: 'Montana Angler (Missouri)', fn: missouri.scrapeMissouriMontanaAngler },
    { name: 'Trout Shop (Missouri)', fn: missouri.scrapeMissouriTroutShop },
    { name: 'Montana Angler (Gallatin)', fn: gallatin.scrapeMontanaAngler },
    { name: 'Missoulian Angler (Clark Fork)', fn: clarkfork.scrapeClarkForkMissoulian },
    { name: 'Bigfork Anglers (Clark Fork)', fn: clarkfork.scrapeClarkForkBigfork },
    { name: 'Missoulian Angler (Blackfoot)', fn: blackfoot.scrapeBlackfootMissoulian },
    { name: 'Bigfork Anglers (Blackfoot)', fn: blackfoot.scrapeBlackfootBigfork },
    { name: 'Blackfoot River Outfitters', fn: blackfoot.scrapeBlackfootBRO },
    { name: 'Trout Shop (Bighorn)', fn: bighorn.scrapeBighornTroutShop },
  ];
  
  let successCount = 0;
  let failCount = 0;
  
  for (const scraper of allScrapers) {
    console.log(`\n--- Running ${scraper.name} ---`);
    
    try {
      const result = await scraper.fn();
      
      const results = Array.isArray(result) ? result : [result];
      
      for (const item of results) {
        if (item && item.url) {
          const parsedDate = parseDate(item.last_updated);
          // Store full ISO string for proper date comparison, but keep the date-only format for the field
          // Also store the original text for display purposes
          const dateString = parsedDate.toISOString(); // Full timestamp
          const displayDate = item.last_updated_text || item.last_updated || parsedDate.toLocaleDateString();
          
          const existing = await db.query(
            'SELECT * FROM reports WHERE source = $1 AND river = $2 ORDER BY scraped_at DESC LIMIT 1',
            [item.source, item.river]
          );
          
          if (existing.rows.length === 0) {
            await db.query(
              `INSERT INTO reports (source, river, url, last_updated, last_updated_text, scraped_at, is_active, icon_url, water_clarity) 
               VALUES ($1, $2, $3, $4, $5, $6, true, $7, $8)`,
              [item.source, item.river, item.url, dateString, displayDate, item.scraped_at, item.icon_url || null, item.water_clarity || null]
            );
            console.log(`✓ Inserted: ${item.source} (${item.river}) - ${displayDate}`);
            successCount++;
          } else {
            const existingDate = new Date(existing.rows[0].last_updated);
            const newDate = parsedDate;
            
            // Only update if new date is newer or same day but scraped more recently
            const shouldUpdate = newDate > existingDate || 
                                 (newDate.getTime() === existingDate.getTime() && 
                                  new Date(item.scraped_at) > new Date(existing.rows[0].scraped_at));
            
            if (shouldUpdate || isNaN(existingDate.getTime())) {
              await db.query(
                `UPDATE reports 
                 SET last_updated = $1, last_updated_text = $2, scraped_at = $3, url = $4, is_active = true, icon_url = $5, water_clarity = $6
                 WHERE source = $7 AND river = $8`,
                [dateString, displayDate, item.scraped_at, item.url, item.icon_url || null, item.water_clarity || null, item.source, item.river]
              );
              console.log(`✓ Updated: ${item.source} (${item.river}) - ${displayDate}`);
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
    
    await new Promise(resolve => setTimeout(resolve, 500));
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

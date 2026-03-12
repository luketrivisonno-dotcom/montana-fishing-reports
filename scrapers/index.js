const db = require('../db');
const { notifyNewReports } = require('../utils/pushNotifications');
const { extractHatches, getFlyRecommendations } = require('./hatchScraper');
const { standardizeDate, formatForDisplay } = require('../utils/dateStandardizer');

// Hatch patterns to extract from any report content
const HATCH_PATTERNS = [
  { name: 'Midges', patterns: [/\bmidge/i, /\bmidges/i] },
  { name: 'Blue Winged Olives', patterns: [/\bbwo\b/i, /\bblue.?winged/i, /\bbaetis/i] },
  { name: 'March Browns', patterns: [/\bmarch brown/i] },
  { name: 'Salmonflies', patterns: [/\bsalmonfly/i, /\bsalmon fly/i] },
  { name: 'Golden Stones', patterns: [/\bgolden stone/i] },
  { name: 'PMDs', patterns: [/\bpmd\b/i, /\bpale morning dun/i] },
  { name: 'Yellow Sallies', patterns: [/\byellow sall/i, /\bisoperla/i] },
  { name: 'Caddis', patterns: [/\bcaddis/i] },
  { name: 'Hoppers', patterns: [/\bhopper/i] },
  { name: 'Tricos', patterns: [/\btrico/i] },
  { name: 'Mahogany Duns', patterns: [/\bmahogany/i] },
  { name: 'October Caddis', patterns: [/\boctober caddis/i] },
  { name: 'Skwalas', patterns: [/\bskwala/i] },
  { name: 'Green Drakes', patterns: [/\bgreen drake/i] },
  { name: 'Gray Drakes', patterns: [/\bgray drake/i] },
  { name: 'Callibaetis', patterns: [/\bcallibaetis/i] },
  { name: 'Pseudos', patterns: [/\bpseudo/i] },
  { name: 'Ants', patterns: [/\bants?\b/i] },
  { name: 'Beetles', patterns: [/\bbeetles?\b/i] },
];

function extractHatchesFromText(text) {
  if (!text) return [];
  const foundHatches = [];
  const lowerText = text.toLowerCase();
  
  for (const hatch of HATCH_PATTERNS) {
    for (const pattern of hatch.patterns) {
      if (pattern.test(lowerText)) {
        foundHatches.push(hatch.name);
        break;
      }
    }
  }
  
  return [...new Set(foundHatches)];
}

// Import working scrapers (ones with actual implementations)
const scrapeMontanaAngler = require('./montanaangler');
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
const scrapeStoneflyShop = require('./stoneflyshop');
const scrapeYellowstoneAngler = require('./yellowstoneangler');
const scrapeParksFlyShop = require('./parksflyshop');
const scrapeBoulder = require('./boulder');

// River-specific scrapers
const yellowstone = require('./yellowstone');
const missouri = require('./missouri');
const clarkfork = require('./clarkfork');
const blackfoot = require('./blackfoot');
const bighorn = require('./bighorn');
const bitterroot = require('./bitterroot');
const rockcreek = require('./rockcreek');
const missoulianangler = require('./missoulianangler');
const gallatin = require('./gallatin');

// DEPRECATED: Use standardizeDate() from utils/dateStandardizer instead
// Keeping for backwards compatibility during transition
function parseDate(dateString) {
  const standardized = standardizeDate(dateString);
  return standardized ? new Date(standardized) : new Date();
}

async function runAllScrapers() {
  console.log('\n========================================');
  console.log('Starting scraper run:', new Date().toISOString());
  console.log('========================================\n');
  
  // Track new/updated reports for notifications
  const newReports = [];
  
  const allScrapers = [
    // Main multi-river scrapers (with working implementations)
    { name: 'Montana Angler', fn: scrapeMontanaAngler },
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
    { name: 'Stonefly Shop', fn: scrapeStoneflyShop },
    { name: 'Yellowstone Angler', fn: scrapeYellowstoneAngler },
    { name: 'Parks Fly Shop', fn: scrapeParksFlyShop },
    { name: 'Boulder River', fn: scrapeBoulder },
    { name: 'The Missoulian Angler', fn: missoulianangler.scrapeMissoulianAngler },
    
    // River-specific scrapers (with hardcoded URLs)
    { name: 'Montana Angler (Yellowstone)', fn: yellowstone.scrapeYellowstoneMontanaAngler },
    { name: 'Sweetwater Fly Shop (Yellowstone)', fn: yellowstone.scrapeYellowstoneSweetwater },
    { name: 'Montana Angler (Missouri)', fn: missouri.scrapeMissouriMontanaAngler },

    { name: 'Montana Angler (Gallatin)', fn: gallatin.scrapeMontanaAngler },
    { name: 'Missoulian Angler (Clark Fork)', fn: clarkfork.scrapeClarkForkMissoulian },
    { name: 'Missoulian Angler (Blackfoot)', fn: blackfoot.scrapeBlackfootMissoulian },
    { name: 'Blackfoot River Outfitters', fn: blackfoot.scrapeBlackfootBRO },
    { name: 'Missoulian Angler (Rock Creek)', fn: rockcreek.scrapeRockCreekMissoulian },
    { name: 'Orvis (Rock Creek)', fn: rockcreek.scrapeRockCreekOrvis },

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
          // Use centralized date standardizer - returns null if no valid date found
          const standardizedDate = standardizeDate(item.last_updated);
          const parsedDate = standardizedDate ? new Date(standardizedDate) : null;
          
          // ISO string for DB storage, display text for UI
          const dateString = standardizedDate; // Can be null
          const displayDate = standardizedDate ? formatForDisplay(standardizedDate) : 'Date unknown';
          
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
            // Track for push notification
            newReports.push({
              source: item.source,
              river: item.river,
              url: item.url,
              last_updated: displayDate
            });
            successCount++;
          } else {
            const existingDateStr = existing.rows[0].last_updated;
            const existingDate = existingDateStr ? new Date(existingDateStr) : null;
            const newDate = parsedDate;
            
            // Determine if we should update:
            // 1. New date is valid and newer than existing
            // 2. Existing has no date but new has a date
            // 3. Same date but scraped more recently (content refresh)
            // 4. FORCE_UPDATE mode: always update (for fixing old bad data)
            // 5. Existing date is suspiciously recent (likely fake) - replace with real date
            // 6. Source is River's Edge or Bozeman Fly Supply (known to have had bad data)
            const isExistingFake = existingDate && existingDate > new Date(Date.now() + 24 * 60 * 60 * 1000); // Future date = fake
            const isExistingVeryRecent = existingDate && 
              (new Date() - existingDate) < (7 * 24 * 60 * 60 * 1000) && // Within last 7 days
              (!newDate || newDate < existingDate); // But new date is older (suspicious)
            
            const isProblemSource = item.source === "The River's Edge" || 
                                    item.source === "River's Edge" ||
                                    item.source === "Bozeman Fly Supply";
            
            const shouldUpdate = 
              process.env.FORCE_UPDATE === 'true' ||  // Force update mode
              (isProblemSource && newDate) ||  // Always update problem sources if we have a real date
              (newDate && !existingDate) ||  // New date found where none existed
              (newDate && existingDate && newDate > existingDate) ||  // Newer date
              (newDate && existingDate && newDate.getTime() === existingDate.getTime() && 
               new Date(item.scraped_at) > new Date(existing.rows[0].scraped_at)) ||  // Same date, newer scrape
              (!newDate && !existingDate) ||  // Both have no date, allow refresh
              isExistingVeryRecent;  // Existing date is suspiciously recent (likely fake)
            
            if (shouldUpdate) {
              await db.query(
                `UPDATE reports 
                 SET last_updated = $1, last_updated_text = $2, scraped_at = $3, url = $4, is_active = true, icon_url = $5, water_clarity = $6
                 WHERE source = $7 AND river = $8`,
                [dateString, displayDate, item.scraped_at, item.url, item.icon_url || null, item.water_clarity || null, item.source, item.river]
              );
              console.log(`✓ Updated: ${item.source} (${item.river}) - ${displayDate}`);
              // Track for push notification (only if actually new content with newer date)
              if (newDate && (!existingDate || newDate > existingDate)) {
                newReports.push({
                  source: item.source,
                  river: item.river,
                  url: item.url,
                  last_updated: displayDate
                });
              }
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
  
  // Process hatch alerts from new reports that include hatch data
  // (Scrapers that extract hatches will include them in the report)
  const reportsWithHatches = newReports.filter(r => r.hatches && r.hatches.length > 0);
  
  if (reportsWithHatches.length > 0) {
    console.log(`\nProcessing ${reportsWithHatches.length} reports with hatch data for alerts...`);
    
    const { processHatchAlerts } = require('../utils/hatchNotifications');
    
    // Convert to hatch report format
    const hatchReports = reportsWithHatches.map(r => ({
      river: r.river,
      source: r.source,
      hatches: r.hatches,
      url: r.url,
      report_date: r.last_updated
    }));
    
    await processHatchAlerts(hatchReports);
  }
  
  // Send push notifications for new reports
  if (newReports.length > 0) {
    console.log(`📱 Sending push notifications for ${newReports.length} new reports...`);
    await notifyNewReports(newReports);
  }
  
  return { successCount, failCount, newReports: newReports.length };
}

module.exports = { runAllScrapers };

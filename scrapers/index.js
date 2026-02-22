const db = require('../db');

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
        
        // Madison River
        { name: 'Montana Trout', fn: madison.scrapeMadisonMT },
        { name: 'Madison River Outfitters', fn: madison.scrapeMadisonRiverOutfitters },
        { name: 'Yellow Dog (Madison)', fn: madison.scrapeMadisonYellowDog },
        
        // Yellowstone River
        { name: 'Montana Angler (Yellowstone)', fn: yellowstone.scrapeYellowstoneMontanaAngler },
        { name: 'River\'s Edge (Yellowstone)', fn: yellowstone.scrapeYellowstoneRiversEdge },
        { name: 'Yellow Dog (Yellowstone)', fn: yellowstone.scrapeYellowstoneYellowDog },
        
        // Missouri River
        { name: 'Montana Angler (Missouri)', fn: missouri.scrapeMissouriMontanaAngler },
        { name: 'Headhunters Fly Shop', fn: missouri.scrapeMissouriHeadhunters },
        { name: 'River\'s Edge (Missouri)', fn: missouri.scrapeMissouriRiversEdge },
        
        // Clark Fork River
        { name: 'Orvis (Clark Fork)', fn: clarkfork.scrapeClarkForkOrvis },
        { name: 'Grizzly Hackle (Clark Fork)', fn: clarkfork.scrapeClarkForkGrizzly },
        { name: 'Blackfoot River Outfitters (Clark Fork)', fn: clarkfork.scrapeClarkForkBlackfoot },
        
        // Blackfoot River
        { name: 'Orvis (Blackfoot)', fn: blackfoot.scrapeBlackfootOrvis },
        { name: 'Grizzly Hackle (Blackfoot)', fn: blackfoot.scrapeBlackfootGrizzly },
        { name: 'Blackfoot River Outfitters', fn: blackfoot.scrapeBlackfootBRO },
        
        // Bighorn River
        { name: 'North Fork Anglers', fn: bighorn.scrapeBighornNorthFork },
        { name: 'Yellow Dog (Bighorn)', fn: bighorn.scrapeBighornYellowDog },
        { name: 'Bighorn Angler', fn: bighorn.scrapeBighornAngler },
        
        // Bitterroot River
        { name: 'Orvis (Bitterroot)', fn: bitterroot.scrapeBitterrootOrvis },
        { name: 'Montana Angler (Bitterroot)', fn: bitterroot.scrapeBitterrootMontanaAngler },
        
        // Rock Creek
        { name: 'Orvis (Rock Creek)', fn: rockcreek.scrapeRockCreekOrvis },
        { name: 'Montana Angler (Rock Creek)', fn: rockcreek.scrapeRockCreekMontanaAngler },
        
        // Beaverhead River
    ];
    
    let successCount = 0;
    let failCount = 0;
    
    for (const scraper of allScrapers) {
        console.log(`\n--- Running ${scraper.name} ---`);
        
        try {
            const result = await scraper.fn();
            
            if (result && result.last_updated) {
                successCount++;
                
                const existing = await db.query(
                    'SELECT * FROM reports WHERE source = $1 AND river = $2',
                    [result.source, result.river]
                );
                
                if (existing.rows.length === 0) {
                    await db.query(
                        `INSERT INTO reports (source, river, url, last_updated, scraped_at) 
                         VALUES ($1, $2, $3, $4, $5)`,
                        [result.source, result.river, result.url, result.last_updated, result.scraped_at]
                    );
                    console.log(`✓ Inserted: ${result.source} (${result.river})`);
                } else {
                    await db.query(
                        `UPDATE reports 
                         SET last_updated = $1, scraped_at = $2, url = $3 
                         WHERE source = $4 AND river = $5`,
                        [result.last_updated, result.scraped_at, result.url, result.source, result.river]
                    );
                    console.log(`✓ Updated: ${result.source} (${result.river})`);
                }
            } else {
                failCount++;
                console.log(`✗ Failed or no date: ${scraper.name}`);
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

if (require.main === module) {
    runAllScrapers()
        .then(() => process.exit(0))
        .catch(err => {
            console.error('Fatal error:', err);
            process.exit(1);
        });
}

module.exports = { runAllScrapers };
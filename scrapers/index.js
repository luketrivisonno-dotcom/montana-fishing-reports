cat > scrapers/index.js << 'EOF'
const db = require('../db');

const gallatin = require('./gallatin');
const madison = require('./madison');
const yellowstone = require('./yellowstone');
const missouri = require('./missouri');
const clarkfork = require('./clarkfork');
const blackfoot = require('./blackfoot');
const bighorn = require('./bighorn');
const bitterroot = require('./bitterroot');
const rockcreek = require('./rockcreek');
const beaverhead = require('./beaverhead');
const bighole = require('./bighole');
const flathead = require('./flathead');
const jefferson = require('./jefferson');

const scrapeYellowstoneAngler = require('./yellowstoneangler');
const scrapeFlyFishingBozeman = require('./flyfishingbozeman');
const scrapeDanBaileys = require('./danbaileys');
const scrapeBigSkyAnglers = require('./bigskyanglers');
const scrapeFlyFishFood = require('./flyfishfood');

async function runAllScrapers() {
    console.log('\n========================================');
    console.log('Starting scraper run:', new Date().toISOString());
    console.log('========================================\n');
    
    const allScrapers = [
        { name: 'Yellow Dog (Gallatin)', fn: gallatin.scrapeYellowDog },
        { name: 'Montana Angler (Gallatin)', fn: gallatin.scrapeMontanaAngler },
        { name: 'Fins & Feathers', fn: gallatin.scrapeFinsFeathers },
        { name: 'Orvis (Gallatin)', fn: gallatin.scrapeOrvis },
        { name: 'Bozeman Fly Supply', fn: gallatin.scrapeBozemanFlySupply },
        { name: 'Montana Trout (Upper Madison)', fn: madison.scrapeMadisonMT },
        { name: 'Madison River Outfitters (Upper)', fn: madison.scrapeMadisonRiverOutfitters },
        { name: 'Yellow Dog (Upper Madison)', fn: madison.scrapeMadisonYellowDog },
        { name: 'Montana Trout (Lower Madison)', fn: madison.scrapeMadisonMT },
        { name: 'Madison River Outfitters (Lower)', fn: madison.scrapeMadisonRiverOutfitters },
        { name: 'Montana Angler (Yellowstone)', fn: yellowstone.scrapeYellowstoneMontanaAngler },
        { name: 'River\'s Edge (Yellowstone)', fn: yellowstone.scrapeYellowstoneRiversEdge },
        { name: 'Yellow Dog (Yellowstone)', fn: yellowstone.scrapeYellowstoneYellowDog },
        { name: 'Yellowstone Angler', fn: scrapeYellowstoneAngler },
        { name: 'Fly Fishing Bozeman (Yellowstone)', fn: scrapeFlyFishingBozeman },
        { name: 'Montana Angler (Missouri)', fn: missouri.scrapeMissouriMontanaAngler },
        { name: 'Headhunters Fly Shop', fn: missouri.scrapeMissouriHeadhunters },
        { name: 'River\'s Edge (Missouri)', fn: missouri.scrapeMissouriRiversEdge },
        { name: 'Dan Bailey\'s', fn: scrapeDanBaileys },
        { name: 'Orvis (Clark Fork)', fn: clarkfork.scrapeClarkForkOrvis },
        { name: 'Grizzly Hackle (Clark Fork)', fn: clarkfork.scrapeClarkForkGrizzly },
        { name: 'Blackfoot River Outfitters (Clark Fork)', fn: clarkfork.scrapeClarkForkBlackfoot },
        { name: 'Orvis (Blackfoot)', fn: blackfoot.scrapeBlackfootOrvis },
        { name: 'Grizzly Hackle (Blackfoot)', fn: blackfoot.scrapeBlackfootGrizzly },
        { name: 'Blackfoot River Outfitters', fn: blackfoot.scrapeBlackfootBRO },
        { name: 'North Fork Anglers', fn: bighorn.scrapeBighornNorthFork },
        { name: 'Yellow Dog (Bighorn)', fn: bighorn.scrapeBighornYellowDog },
        { name: 'Bighorn Angler', fn: bighorn.scrapeBighornAngler },
        { name: 'Orvis (Bitterroot)', fn: bitterroot.scrapeBitterrootOrvis },
        { name: 'Montana Angler (Bitterroot)', fn: bitterroot.scrapeBitterrootMontanaAngler },
        { name: 'Orvis (Rock Creek)', fn: rockcreek.scrapeRockCreekOrvis },
        { name: 'Montana Angler (Rock Creek)', fn: rockcreek.scrapeRockCreekMontanaAngler },
        { name: 'Montana Angler (Beaverhead)', fn: beaverhead.scrapeBeaverheadMontanaAngler },
        { name: 'Headhunters (Beaverhead)', fn: beaverhead.scrapeBeaverheadHeadhunters },
        { name: 'Montana Angler (Big Hole)', fn: bighole.scrapeBigHoleMontanaAngler },
        { name: 'Sunrise Fly Shop (Big Hole)', fn: bighole.scrapeBigHoleSunrise },
        { name: 'Montana Angler (Flathead)', fn: flathead.scrapeFlatheadMontanaAngler },
        { name: 'Crown of the Continent (Flathead)', fn: flathead.scrapeFlatheadCrown },
        { name: 'Montana Angler (Jefferson)', fn: jefferson.scrapeJeffersonMontanaAngler },
        { name: 'Headhunters (Jefferson)', fn: jefferson.scrapeJeffersonHeadhunters },
        { name: 'Big Sky Anglers', fn: scrapeBigSkyAnglers },
        { name: 'Fly Fish Food', fn: scrapeFlyFishFood }
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
                            `UPDATE reports SET last_updated = $1, scraped_at = $2, url = $3 
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
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n========================================');
    console.log(`Complete: ${successCount} succeeded, ${failCount} failed`);
    console.log('========================================\n');
    
    return { successCount, failCount };
}

module.exports = { runAllScrapers };
EOF
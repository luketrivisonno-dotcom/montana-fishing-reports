async function scrapeYellowstoneMontanaAngler() {
    return {
        source: 'Montana Angler',
        river: 'Yellowstone River',
        url: 'https://www.montanaangler.com/montana-fishing-report/yellowstone-river-fishing-report',
        last_updated: new Date().toLocaleDateString(),
        scraped_at: new Date().toISOString()
    };
}

async function scrapeYellowstoneRiversEdge() {
    return {
        source: 'River\'s Edge',
        river: 'Yellowstone River',
        url: 'https://theriversedge.com/fishing-report/',
        last_updated: new Date().toLocaleDateString(),
        scraped_at: new Date().toISOString()
    };
}

async function scrapeYellowstoneSweetwater() {
    return {
        source: 'Sweetwater Fly Shop',
        river: 'Yellowstone River',
        url: 'https://www.sweetwaterflyshop.com/fishing-reports/',
        last_updated: new Date().toLocaleDateString(),
        scraped_at: new Date().toISOString()
    };
}

async function scrapeYellowstoneSweetcast() {
    return {
        source: 'Sweetcast Angler',
        river: 'Yellowstone River',
        url: 'https://sweetcastangler.com/fishingreport/',
        last_updated: new Date().toLocaleDateString(),
        scraped_at: new Date().toISOString()
    };
}

module.exports = {
    scrapeYellowstoneMontanaAngler,
    scrapeYellowstoneRiversEdge,
    scrapeYellowstoneSweetwater,
    scrapeYellowstoneSweetcast
};

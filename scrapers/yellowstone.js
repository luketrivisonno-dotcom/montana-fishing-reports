async function scrapeYellowstoneMontanaAngler() {
    return {
        source: 'Montana Angler',
        river: 'Yellowstone River',
        url: 'https://www.montanaangler.com/yellowstone-river-fishing-report',
        last_updated: new Date().toLocaleDateString(),
        scraped_at: new Date().toISOString()
    };
}

async function scrapeYellowstoneRiversEdge() {
    return {
        source: 'River\'s Edge',
        river: 'Yellowstone River',
        url: 'https://riversedge.com/yellowstone-river-fishing-report',
        last_updated: new Date().toLocaleDateString(),
        scraped_at: new Date().toISOString()
    };
}

async function scrapeYellowstoneYellowDog() {
    return {
        source: 'Yellow Dog Fly Fishing',
        river: 'Yellowstone River',
        url: 'https://www.yellowdogflyfishing.com/yellowstone-river-fishing-report/',
        last_updated: new Date().toLocaleDateString(),
        scraped_at: new Date().toISOString()
    };
}

module.exports = {
    scrapeYellowstoneMontanaAngler,
    scrapeYellowstoneRiversEdge,
    scrapeYellowstoneYellowDog
};

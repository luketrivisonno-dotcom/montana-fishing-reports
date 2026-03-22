async function scrapeFlatheadMontanaAngler() {
    return {
        source: 'Montana Angler',
        river: 'Flathead River',
        url: 'https://www.montanaangler.com/flathead-river-fishing-report',
        last_updated: new Date().toLocaleDateString(),
        scraped_at: new Date().toISOString()
    };
}

async function scrapeFlatheadCrown() {
    return {
        source: 'Crown of the Continent',
        river: 'Flathead River',
        url: 'https://crownofcontinent.com/fishing-reports/',
        last_updated: new Date().toLocaleDateString(),
        scraped_at: new Date().toISOString()
    };
}

module.exports = {
    scrapeFlatheadMontanaAngler,
    scrapeFlatheadCrown
};

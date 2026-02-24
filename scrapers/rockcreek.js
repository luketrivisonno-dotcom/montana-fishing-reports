async function scrapeRockCreekOrvis() {
    return {
        source: 'Orvis',
        river: 'Rock Creek',
        url: 'https://www.orvis.com/fishing-report/rock-creek',
        last_updated: new Date().toLocaleDateString(),
        scraped_at: new Date().toISOString()
    };
}

async function scrapeRockCreekMontanaAngler() {
    return {
        source: 'Montana Angler',
        river: 'Rock Creek',
        url: 'https://www.montanaangler.com/rock-creek-fishing-report',
        last_updated: new Date().toLocaleDateString(),
        scraped_at: new Date().toISOString()
    };
}

module.exports = {
    scrapeRockCreekOrvis,
    scrapeRockCreekMontanaAngler
};

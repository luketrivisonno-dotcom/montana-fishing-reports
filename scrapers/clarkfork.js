async function scrapeClarkForkMissoulian() {
    return {
        source: 'The Missoulian Angler',
        river: 'Clark Fork River',
        url: 'https://www.missoulianangler.com/fishing-reports',
        last_updated: new Date().toLocaleDateString(),
        scraped_at: new Date().toISOString()
    };
}

async function scrapeClarkForkBigfork() {
    return {
        source: 'Bigfork Anglers',
        river: 'Clark Fork River',
        url: 'https://bigforkanglers.com/fishing-report',
        last_updated: new Date().toLocaleDateString(),
        scraped_at: new Date().toISOString()
    };
}

module.exports = {
    scrapeClarkForkMissoulian,
    scrapeClarkForkBigfork
};

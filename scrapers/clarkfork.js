async function scrapeClarkForkMissoulian() {
    return {
        source: 'The Missoulian Angler',
        river: 'Clark Fork River',
        url: 'https://www.missoulianangler.com/fishing-reports',
        last_updated: null,
        scraped_at: new Date().toISOString()
    };
}

module.exports = {
    scrapeClarkForkMissoulian
};

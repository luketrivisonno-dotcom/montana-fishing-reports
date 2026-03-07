async function scrapeBlackfootMissoulian() {
    return {
        source: 'The Missoulian Angler',
        river: 'Blackfoot River',
        url: 'https://www.missoulianangler.com/fishing-reports',
        last_updated: new Date().toLocaleDateString(),
        scraped_at: new Date().toISOString()
    };
}

async function scrapeBlackfootBigfork() {
    return {
        source: 'Bigfork Anglers',
        river: 'Blackfoot River',
        url: 'https://bigforkanglers.com/fishing-report',
        last_updated: new Date().toLocaleDateString(),
        scraped_at: new Date().toISOString()
    };
}

module.exports = {
    scrapeBlackfootMissoulian,
    scrapeBlackfootBigfork
};

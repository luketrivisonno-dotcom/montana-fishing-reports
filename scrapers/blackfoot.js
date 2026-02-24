async function scrapeBlackfootOrvis() {
    return {
        source: 'Orvis',
        river: 'Blackfoot River',
        url: 'https://www.orvis.com/fishing-report/blackfoot-river',
        last_updated: new Date().toLocaleDateString(),
        scraped_at: new Date().toISOString()
    };
}

async function scrapeBlackfootGrizzly() {
    return {
        source: 'Grizzly Hackle',
        river: 'Blackfoot River',
        url: 'https://grizzlyhackle.com/blackfoot-river-fishing-report',
        last_updated: new Date().toLocaleDateString(),
        scraped_at: new Date().toISOString()
    };
}

async function scrapeBlackfootBRO() {
    return {
        source: 'Blackfoot River Outfitters',
        river: 'Blackfoot River',
        url: 'https://www.blackfootriver.com/blackfoot-river-fishing-report',
        last_updated: new Date().toLocaleDateString(),
        scraped_at: new Date().toISOString()
    };
}

module.exports = {
    scrapeBlackfootOrvis,
    scrapeBlackfootGrizzly,
    scrapeBlackfootBRO
};

async function scrapeBlackfootMissoulian() {
    return {
        source: 'The Missoulian Angler',
        river: 'Blackfoot River',
        url: 'https://www.missoulianangler.com/fishing-reports',
        last_updated: new Date().toLocaleDateString(),
        scraped_at: new Date().toISOString(),
        icon_url: null
    };
}

async function scrapeBlackfootBigfork() {
    return {
        source: 'Bigfork Anglers',
        river: 'Blackfoot River',
        url: 'https://bigforkanglers.com/fishing-report',
        last_updated: new Date().toLocaleDateString(),
        scraped_at: new Date().toISOString(),
        icon_url: null
    };
}

async function scrapeBlackfootBRO() {
    return [
        {
            source: 'Blackfoot River Outfitters',
            river: 'Blackfoot River',
            url: 'https://blackfootriver.com/blogs/fishing-reports/the-blackfoot-river-fishing-report',
            last_updated: new Date().toLocaleDateString(),
            scraped_at: new Date().toISOString(),
            icon_url: null
        },
        {
            source: 'Blackfoot River Outfitters',
            river: 'Clark Fork River',
            url: 'https://blackfootriver.com/blogs/fishing-reports/clark-fork-river-fishing-report',
            last_updated: new Date().toLocaleDateString(),
            scraped_at: new Date().toISOString(),
            icon_url: null
        },
        {
            source: 'Blackfoot River Outfitters',
            river: 'Bitterroot River',
            url: 'https://blackfootriver.com/blogs/fishing-reports/bitterroot-river-fishing-report',
            last_updated: new Date().toLocaleDateString(),
            scraped_at: new Date().toISOString(),
            icon_url: null
        },
        {
            source: 'Blackfoot River Outfitters',
            river: 'Rock Creek',
            url: 'https://blackfootriver.com/blogs/fishing-reports/rock-creek-fishing-report',
            last_updated: new Date().toLocaleDateString(),
            scraped_at: new Date().toISOString(),
            icon_url: null
        }
    ];
}

module.exports = {
    scrapeBlackfootMissoulian,
    scrapeBlackfootBigfork,
    scrapeBlackfootBRO
};

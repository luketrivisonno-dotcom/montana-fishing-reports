async function scrapeBlackfootMissoulian() {
    return {
        source: 'The Missoulian Angler',
        river: 'Blackfoot River',
        url: 'https://www.missoulianangler.com/fishing-reports',
        last_updated: null,
        last_updated_text: null,
        scraped_at: new Date(),
        icon_url: null,
        water_clarity: null
    };
}

async function scrapeBlackfootBRO() {
    const baseUrl = 'https://blackfootriver.com';
    return [
        {
            source: 'Blackfoot River Outfitters',
            river: 'Blackfoot River',
            url: baseUrl + '/blogs/fishing-reports/the-blackfoot-river-fishing-report',
            last_updated: null,
            last_updated_text: null,
            scraped_at: new Date(),
            icon_url: null,
            water_clarity: null
        },
        {
            source: 'Blackfoot River Outfitters',
            river: 'Clark Fork River',
            url: baseUrl + '/blogs/fishing-reports/clark-fork-river-fishing-report',
            last_updated: null,
            last_updated_text: null,
            scraped_at: new Date(),
            icon_url: null,
            water_clarity: null
        },
        {
            source: 'Blackfoot River Outfitters',
            river: 'Bitterroot River',
            url: baseUrl + '/blogs/fishing-reports/bitterroot-river-fishing-report',
            last_updated: null,
            last_updated_text: null,
            scraped_at: new Date(),
            icon_url: null,
            water_clarity: null
        },
        {
            source: 'Blackfoot River Outfitters',
            river: 'Rock Creek',
            url: baseUrl + '/blogs/fishing-reports/rock-creek-fishing-report',
            last_updated: null,
            last_updated_text: null,
            scraped_at: new Date(),
            icon_url: null,
            water_clarity: null
        }
    ];
}

module.exports = {
    scrapeBlackfootMissoulian,
    scrapeBlackfootBRO
};

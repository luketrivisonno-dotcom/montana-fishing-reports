async function scrapeGrizzlyHackle() {
    return [
        {
            source: 'Grizzly Hackle',
            river: 'Bitterroot River',
            url: 'https://grizzlyhackle.com/pages/bitterroot-river-fishing-report',
            last_updated: new Date().toLocaleDateString(),
            scraped_at: new Date().toISOString(),
            icon_url: null
        },
        {
            source: 'Grizzly Hackle',
            river: 'Blackfoot River',
            url: 'https://grizzlyhackle.com/pages/blackfoot-river-fishing-report',
            last_updated: new Date().toLocaleDateString(),
            scraped_at: new Date().toISOString(),
            icon_url: null
        },
        {
            source: 'Grizzly Hackle',
            river: 'Clark Fork River',
            url: 'https://grizzlyhackle.com/pages/clark-fork-river-fishing-report',
            last_updated: new Date().toLocaleDateString(),
            scraped_at: new Date().toISOString(),
            icon_url: null
        },
        {
            source: 'Grizzly Hackle',
            river: 'Rock Creek',
            url: 'https://grizzlyhackle.com/pages/rock-creek-fishing-report',
            last_updated: new Date().toLocaleDateString(),
            scraped_at: new Date().toISOString(),
            icon_url: null
        },
        {
            source: 'Grizzly Hackle',
            river: 'Missouri River',
            url: 'https://grizzlyhackle.com/pages/missouri-river-fishing-report',
            last_updated: new Date().toLocaleDateString(),
            scraped_at: new Date().toISOString(),
            icon_url: null
        }
    ];
}

module.exports = scrapeGrizzlyHackle;

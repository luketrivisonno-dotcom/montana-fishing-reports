async function scrapeMadisonMT() {
    return [
        {
            source: 'Montana Trout',
            river: 'Upper Madison River',
            url: 'https://montanatrout.com/upper-madison-river-fishing-report',
            last_updated: new Date().toLocaleDateString(),
            scraped_at: new Date().toISOString()
        },
        {
            source: 'Montana Trout',
            river: 'Lower Madison River',
            url: 'https://montanatrout.com/lower-madison-river-fishing-report',
            last_updated: new Date().toLocaleDateString(),
            scraped_at: new Date().toISOString()
        }
    ];
}

async function scrapeMadisonRiverOutfitters() {
    return [
        {
            source: 'Madison River Outfitters',
            river: 'Upper Madison River',
            url: 'https://madisonriveroutfitters.com/upper-madison-river-fishing-report',
            last_updated: new Date().toLocaleDateString(),
            scraped_at: new Date().toISOString()
        },
        {
            source: 'Madison River Outfitters',
            river: 'Lower Madison River',
            url: 'https://madisonriveroutfitters.com/lower-madison-river-fishing-report',
            last_updated: new Date().toLocaleDateString(),
            scraped_at: new Date().toISOString()
        }
    ];
}

async function scrapeMadisonYellowDog() {
    return {
        source: 'Yellow Dog Fly Fishing',
        river: 'Upper Madison River',
        url: 'https://www.yellowdogflyfishing.com/upper-madison-river-fishing-report/',
        last_updated: new Date().toLocaleDateString(),
        scraped_at: new Date().toISOString()
    };
}

module.exports = {
    scrapeMadisonMT,
    scrapeMadisonRiverOutfitters,
    scrapeMadisonYellowDog
};

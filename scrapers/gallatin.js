async function scrapeYellowDog() {
    return {
        source: 'Yellow Dog Fly Fishing',
        river: 'Gallatin River',
        url: 'https://www.yellowdogflyfishing.com/gallatin-river-fishing-report/',
        last_updated: new Date().toLocaleDateString(),
        scraped_at: new Date().toISOString()
    };
}

async function scrapeMontanaAngler() {
    return {
        source: 'Montana Angler',
        river: 'Gallatin River',
        url: 'https://www.montanaangler.com/gallatin-river-fishing-report',
        last_updated: new Date().toLocaleDateString(),
        scraped_at: new Date().toISOString()
    };
}

async function scrapeFinsFeathers() {
    return {
        source: 'Fins & Feathers',
        river: 'Gallatin River',
        url: 'https://www.finsandfeathers.com/gallatin-river-fishing-report',
        last_updated: new Date().toLocaleDateString(),
        scraped_at: new Date().toISOString()
    };
}

async function scrapeOrvis() {
    return {
        source: 'Orvis',
        river: 'Gallatin River',
        url: 'https://www.orvis.com/fishing-report/gallatin-river',
        last_updated: new Date().toLocaleDateString(),
        scraped_at: new Date().toISOString()
    };
}

async function scrapeBozemanFlySupply() {
    return {
        source: 'Bozeman Fly Supply',
        river: 'Gallatin River',
        url: 'https://bozemanflysupply.com/gallatin-river-fishing-report',
        last_updated: new Date().toLocaleDateString(),
        scraped_at: new Date().toISOString()
    };
}

module.exports = {
    scrapeYellowDog,
    scrapeMontanaAngler,
    scrapeFinsFeathers,
    scrapeOrvis,
    scrapeBozemanFlySupply
};

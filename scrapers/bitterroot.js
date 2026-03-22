async function scrapeBitterrootOrvis() {
    return {
        source: 'Orvis',
        river: 'Bitterroot River',
        url: 'https://www.orvis.com/fishing-report/bitterroot-river',
        last_updated: new Date().toLocaleDateString(),
        scraped_at: new Date().toISOString()
    };
}

async function scrapeBitterrootMontanaAngler() {
    return {
        source: 'Montana Angler',
        river: 'Bitterroot River',
        url: 'https://www.montanaangler.com/bitterroot-river-fishing-report',
        last_updated: new Date().toLocaleDateString(),
        scraped_at: new Date().toISOString()
    };
}

module.exports = {
    scrapeBitterrootOrvis,
    scrapeBitterrootMontanaAngler
};

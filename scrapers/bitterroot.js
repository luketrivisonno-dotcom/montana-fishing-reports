async function scrapeBitterrootOrvis() {
    return {
        source: 'Orvis',
        river: 'Bitterroot River',
        url: 'https://fishingreports.orvis.com/west/montana/bitterroot-river',
        last_updated: new Date().toLocaleDateString(),
        scraped_at: new Date().toISOString()
    };
}

module.exports = {
    scrapeBitterrootOrvis
};

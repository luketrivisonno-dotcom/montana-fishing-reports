async function scrapeMontanaAngler() {
    return {
        source: 'Montana Angler',
        river: 'Gallatin River',
        url: 'https://www.montanaangler.com/montana-fishing-report/gallatin-river-fishing-report',
        last_updated: new Date().toLocaleDateString(),
        scraped_at: new Date().toISOString()
    };
}

module.exports = {
    scrapeMontanaAngler
};

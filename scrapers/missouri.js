async function scrapeMissouriMontanaAngler() {
    return {
        source: 'Montana Angler',
        river: 'Missouri River',
        url: 'https://www.montanaangler.com/montana-fishing-report/missouri-river-fishing-report',
        last_updated: new Date().toLocaleDateString(),
        scraped_at: new Date().toISOString()
    };
}

module.exports = {
    scrapeMissouriMontanaAngler
};

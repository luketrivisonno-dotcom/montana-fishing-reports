async function scrapeDanBaileys() {
    return {
        source: "Dan Bailey's",
        river: 'Missouri River',
        url: 'https://danbaileys.com/fishing-report',
        last_updated: null,
        scraped_at: new Date().toISOString()
    };
}
module.exports = scrapeDanBaileys;

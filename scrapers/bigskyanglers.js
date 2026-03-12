async function scrapeBigSkyAnglers() {
    return {
        source: 'Big Sky Anglers',
        river: 'Gallatin River',
        url: 'https://bigskyanglers.com/fishing-report',
        last_updated: null,
        scraped_at: new Date().toISOString()
    };
}
module.exports = scrapeBigSkyAnglers;

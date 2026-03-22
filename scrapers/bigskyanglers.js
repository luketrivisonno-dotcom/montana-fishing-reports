async function scrapeBigSkyAnglers() {
    return {
        source: 'Big Sky Anglers',
        river: 'Gallatin River',
        url: 'https://bigskyanglers.com/fishing-report',
        last_updated: new Date().toLocaleDateString(),
        scraped_at: new Date().toISOString()
    };
}
module.exports = scrapeBigSkyAnglers;

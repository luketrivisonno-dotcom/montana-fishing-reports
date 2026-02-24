async function scrapeFlyFishFood() {
    return {
        source: 'Fly Fish Food',
        river: 'Gallatin River',
        url: 'https://flyfishfood.com/fishing-report',
        last_updated: new Date().toLocaleDateString(),
        scraped_at: new Date().toISOString()
    };
}
module.exports = scrapeFlyFishFood;

async function scrapeRockCreekOrvis() {
    return {
        source: 'Orvis',
        river: 'Rock Creek',
        url: 'https://fishingreports.orvis.com/west/montana/rock-creek',
        last_updated: new Date().toLocaleDateString(),
        scraped_at: new Date().toISOString()
    };
}

module.exports = {
    scrapeRockCreekOrvis
};

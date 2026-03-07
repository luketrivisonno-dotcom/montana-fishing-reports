async function scrapeBighornTroutShop() {
    return {
        source: 'Trout Shop',
        river: 'Bighorn River',
        url: 'https://www.troutshop.com/fishing-report',
        last_updated: new Date().toLocaleDateString(),
        scraped_at: new Date().toISOString()
    };
}

module.exports = {
    scrapeBighornTroutShop
};

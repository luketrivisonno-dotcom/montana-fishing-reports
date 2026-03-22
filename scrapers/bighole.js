async function scrapeBigHoleMontanaAngler() {
    return {
        source: 'Montana Angler',
        river: 'Big Hole River',
        url: 'https://www.montanaangler.com/big-hole-river-fishing-report',
        last_updated: new Date().toLocaleDateString(),
        scraped_at: new Date().toISOString()
    };
}

async function scrapeBigHoleSunrise() {
    return {
        source: 'Sunrise Fly Shop',
        river: 'Big Hole River',
        url: 'https://www.sunriseflyshop.com/big-hole-river-fishing-report',
        last_updated: new Date().toLocaleDateString(),
        scraped_at: new Date().toISOString()
    };
}

module.exports = {
    scrapeBigHoleMontanaAngler,
    scrapeBigHoleSunrise
};

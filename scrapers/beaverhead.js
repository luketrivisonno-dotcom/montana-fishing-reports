async function scrapeBeaverheadMontanaAngler() {
    return {
        source: 'Montana Angler',
        river: 'Beaverhead River',
        url: 'https://www.montanaangler.com/beaverhead-river-fishing-report',
        last_updated: new Date().toLocaleDateString(),
        scraped_at: new Date().toISOString()
    };
}

async function scrapeBeaverheadHeadhunters() {
    return {
        source: 'Headhunters Fly Shop',
        river: 'Beaverhead River',
        url: 'https://www.headhuntersflyshop.com/fishing-report/',
        last_updated: new Date().toLocaleDateString(),
        scraped_at: new Date().toISOString()
    };
}

module.exports = {
    scrapeBeaverheadMontanaAngler,
    scrapeBeaverheadHeadhunters
};

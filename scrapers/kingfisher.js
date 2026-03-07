async function scrapeKingfisher() {
    return {
        source: 'The Kingfisher Fly Shop',
        river: 'Bitterroot River',
        url: 'https://kingfisherflyshop.com/blog/',
        last_updated: new Date().toLocaleDateString(),
        scraped_at: new Date().toISOString(),
        icon_url: null
    };
}

module.exports = scrapeKingfisher;

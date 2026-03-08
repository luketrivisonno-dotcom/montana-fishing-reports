async function scrapeKingfisher() {
    return {
        source: 'The Kingfisher Fly Shop',
        river: 'Bitterroot River',
        url: 'https://kingfisherflyshop.com/blog/',
        last_updated: new Date().toLocaleDateString(),
        last_updated_text: new Date().toLocaleDateString(),
        scraped_at: new Date(),
        icon_url: null,
        water_clarity: null
    };
}

module.exports = scrapeKingfisher;

async function scrapeKingfisher() {
    return {
        source: 'The Kingfisher Fly Shop',
        river: 'Bitterroot River',
        url: 'https://kingfisherflyshop.com/blog/',
        last_updated: null,
        last_updated_text: null,
        scraped_at: new Date(),
        icon_url: null,
        water_clarity: null
    };
}

module.exports = scrapeKingfisher;

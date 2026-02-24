cat > scrapers/jefferson.js << 'EOF'
async function scrapeJeffersonMontanaAngler() {
    return {
        source: 'Montana Angler',
        river: 'Jefferson River',
        url: 'https://www.montanaangler.com/jefferson-river-fishing-report',
        last_updated: new Date().toLocaleDateString(),
        scraped_at: new Date().toISOString()
    };
}

async function scrapeJeffersonHeadhunters() {
    return {
        source: 'Headhunters Fly Shop',
        river: 'Jefferson River',
        url: 'https://www.headhuntersflyshop.com/fishing-report/',
        last_updated: new Date().toLocaleDateString(),
        scraped_at: new Date().toISOString()
    };
}

module.exports = {
    scrapeJeffersonMontanaAngler,
    scrapeJeffersonHeadhunters
};
EOF
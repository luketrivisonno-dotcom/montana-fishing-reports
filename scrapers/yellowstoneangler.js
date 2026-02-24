cat > scrapers/yellowstoneangler.js << 'EOF'
async function scrapeYellowstoneAngler() {
    return {
        source: 'Yellowstone Angler',
        river: 'Yellowstone River',
        url: 'https://yellowstoneangler.com/fishing-report',
        last_updated: new Date().toLocaleDateString(),
        scraped_at: new Date().toISOString()
    };
}
module.exports = scrapeYellowstoneAngler;
EOF
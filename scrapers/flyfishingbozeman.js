cat > scrapers/flyfishingbozeman.js << 'EOF'
async function scrapeFlyFishingBozeman() {
    return {
        source: 'Fly Fishing Bozeman',
        river: 'Yellowstone River',
        url: 'https://flyfishingbozeman.com/yellowstone-river-fishing-report',
        last_updated: new Date().toLocaleDateString(),
        scraped_at: new Date().toISOString()
    };
}
module.exports = scrapeFlyFishingBozeman;
EOF
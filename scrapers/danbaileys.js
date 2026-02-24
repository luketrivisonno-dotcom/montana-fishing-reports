cat > scrapers/danbaileys.js << 'EOF'
async function scrapeDanBaileys() {
    return {
        source: "Dan Bailey's",
        river: 'Missouri River',
        url: 'https://danbaileys.com/fishing-report',
        last_updated: new Date().toLocaleDateString(),
        scraped_at: new Date().toISOString()
    };
}
module.exports = scrapeDanBaileys;
EOF
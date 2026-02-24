cat > scrapers/missouri.js << 'EOF'
async function scrapeMissouriMontanaAngler() {
    return {
        source: 'Montana Angler',
        river: 'Missouri River',
        url: 'https://www.montanaangler.com/missouri-river-fishing-report',
        last_updated: new Date().toLocaleDateString(),
        scraped_at: new Date().toISOString()
    };
}

async function scrapeMissouriHeadhunters() {
    return {
        source: 'Headhunters Fly Shop',
        river: 'Missouri River',
        url: 'https://www.headhuntersflyshop.com/fishing-report/',
        last_updated: new Date().toLocaleDateString(),
        scraped_at: new Date().toISOString()
    };
}

async function scrapeMissouriRiversEdge() {
    return {
        source: 'River\'s Edge',
        river: 'Missouri River',
        url: 'https://riversedge.com/missouri-river-fishing-report',
        last_updated: new Date().toLocaleDateString(),
        scraped_at: new Date().toISOString()
    };
}

module.exports = {
    scrapeMissouriMontanaAngler,
    scrapeMissouriHeadhunters,
    scrapeMissouriRiversEdge
};
EOF
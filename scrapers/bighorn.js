cat > scrapers/bighorn.js << 'EOF'
async function scrapeBighornNorthFork() {
    return {
        source: 'North Fork Anglers',
        river: 'Bighorn River',
        url: 'https://northforkanglers.com/bighorn-river-fishing-report',
        last_updated: new Date().toLocaleDateString(),
        scraped_at: new Date().toISOString()
    };
}

async function scrapeBighornYellowDog() {
    return {
        source: 'Yellow Dog Fly Fishing',
        river: 'Bighorn River',
        url: 'https://www.yellowdogflyfishing.com/bighorn-river-fishing-report/',
        last_updated: new Date().toLocaleDateString(),
        scraped_at: new Date().toISOString()
    };
}

async function scrapeBighornAngler() {
    return {
        source: 'Bighorn Angler',
        river: 'Bighorn River',
        url: 'https://bighornangler.com/fishing-report/',
        last_updated: new Date().toLocaleDateString(),
        scraped_at: new Date().toISOString()
    };
}

module.exports = {
    scrapeBighornNorthFork,
    scrapeBighornYellowDog,
    scrapeBighornAngler
};
EOF
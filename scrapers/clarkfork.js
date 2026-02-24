cat > scrapers/clarkfork.js << 'EOF'
async function scrapeClarkForkOrvis() {
    return {
        source: 'Orvis',
        river: 'Clark Fork River',
        url: 'https://www.orvis.com/fishing-report/clark-fork-river',
        last_updated: new Date().toLocaleDateString(),
        scraped_at: new Date().toISOString()
    };
}

async function scrapeClarkForkGrizzly() {
    return {
        source: 'Grizzly Hackle',
        river: 'Clark Fork River',
        url: 'https://grizzlyhackle.com/clark-fork-river-fishing-report',
        last_updated: new Date().toLocaleDateString(),
        scraped_at: new Date().toISOString()
    };
}

async function scrapeClarkForkBlackfoot() {
    return {
        source: 'Blackfoot River Outfitters',
        river: 'Clark Fork River',
        url: 'https://www.blackfootriver.com/clark-fork-river-fishing-report',
        last_updated: new Date().toLocaleDateString(),
        scraped_at: new Date().toISOString()
    };
}

module.exports = {
    scrapeClarkForkOrvis,
    scrapeClarkForkGrizzly,
    scrapeClarkForkBlackfoot
};
EOF
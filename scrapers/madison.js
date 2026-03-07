async function scrapeMadisonMontanaAngler() {
    return [
        {
            source: 'Montana Angler',
            river: 'Upper Madison River',
            url: 'https://www.montanaangler.com/montana-fishing-report/upper-madison-river-fishing-report',
            last_updated: new Date().toLocaleDateString(),
            scraped_at: new Date().toISOString()
        },
        {
            source: 'Montana Angler',
            river: 'Lower Madison River',
            url: 'https://www.montanaangler.com/montana-fishing-report/lower-madison-river-fishing-report',
            last_updated: new Date().toLocaleDateString(),
            scraped_at: new Date().toISOString()
        }
    ];
}

async function scrapeMadisonOrvis() {
    return [
        {
            source: 'Orvis',
            river: 'Upper Madison River',
            url: 'https://fishingreports.orvis.com/west/montana/madison-river',
            last_updated: new Date().toLocaleDateString(),
            scraped_at: new Date().toISOString()
        },
        {
            source: 'Orvis',
            river: 'Lower Madison River',
            url: 'https://fishingreports.orvis.com/west/montana/madison-river',
            last_updated: new Date().toLocaleDateString(),
            scraped_at: new Date().toISOString()
        }
    ];
}

module.exports = {
    scrapeMadisonMontanaAngler,
    scrapeMadisonOrvis
};

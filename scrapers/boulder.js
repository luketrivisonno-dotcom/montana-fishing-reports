const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeBoulder() {
  // Boulder River reports are covered by multiple sources
  return [
    {
      source: 'Montana Angler',
      river: 'Boulder River',
      url: 'https://www.montanaangler.com/montana-fishing-report/boulder-river-report',
      last_updated: new Date().toLocaleDateString(),
      scraped_at: new Date().toISOString()
    },
    {
      source: 'Sweetwater Fly Shop',
      river: 'Boulder River',
      url: 'https://www.sweetwaterflyshop.com/fishing-reports/',
      last_updated: new Date().toLocaleDateString(),
      scraped_at: new Date().toISOString()
    }
  ];
}

module.exports = scrapeBoulder;

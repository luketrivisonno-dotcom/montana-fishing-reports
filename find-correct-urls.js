const axios = require('axios');

// Try different URL patterns for broken scrapers
const URL_TESTS = {
  'Troutfitters': [
    'https://www.troutfitters.com',
    'https://www.troutfitters.com/fishing-reports',
    'https://troutfitters.com',
  ],
  'Bighorn Angler': [
    'https://www.bighornangler.com',
    'https://bighornangler.com',
    'https://www.bighornangler.com/fishing',
  ],
  'Yellowstone Angler': [
    'https://yellowstoneangler.com',
    'https://www.yellowstoneangler.com',
    'https://yellowstoneangler.com/fishing-reports',
  ],
  'Stonefly Shop': [
    'https://www.stoneflyshop.com',
    'https://stoneflyshop.com',
    'https://www.stoneflyshop.com/fishing',
  ],
  'Yellow Dog': [
    'https://www.yellowdogflyfishing.com',
    'https://yellowdogflyfishing.com',
    'https://www.yellowdogflyfishing.com/fishing-reports',
  ],
  'Grizzly Hackle': [
    'https://grizzlyhackle.com',
    'https://www.grizzlyhackle.com',
    'https://grizzlyhackle.com/fishing-reports',
  ],
};

async function findUrls() {
  for (const [name, urls] of Object.entries(URL_TESTS)) {
    console.log(`\n=== ${name} ===`);
    for (const url of urls) {
      try {
        const res = await axios.get(url, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          timeout: 10000,
          maxRedirects: 5
        });
        console.log(`  ✓ ${url} (${res.status})`);
        // Look for date in content
        const dateMatch = res.data.match(/[A-Za-z]+\s+\d{1,2},?\s+\d{4}|\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}/);
        if (dateMatch) {
          console.log(`     Date found: ${dateMatch[0]}`);
        }
      } catch (err) {
        console.log(`  ✗ ${url}: ${err.response?.status || err.code}`);
      }
    }
  }
}

findUrls();

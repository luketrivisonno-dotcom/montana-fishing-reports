const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeSpringCreekReports() {
  const reports = [];
  
  try {
    // Montana Angler Spring Creeks
    console.log('Fetching Montana Angler Spring Creeks...');
    const maResponse = await axios.get('https://www.montanaangler.com/fishing-report/', {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const $ma = cheerio.load(maResponse.data);
    
    $ma('.report-section, .fishing-report, .river-report, .report-item').each((i, elem) => {
      const text = $ma(elem).text().toLowerCase();
      if (text.includes('spring creek') || text.includes('depuy') || text.includes('armstrong')) {
        const title = $ma(elem).find('h2, h3, .report-title').first().text().trim();
        const content = $ma(elem).find('.report-content, p').text().trim();
        const date = $ma(elem).find('.report-date, .date').text().trim();
        const link = $ma(elem).find('a').attr('href');
        
        if (title && (title.toLowerCase().includes('spring') || content.toLowerCase().includes('spring creek'))) {
          reports.push({
            river: 'Spring Creeks',
            source: 'Montana Angler',
            title: title || 'Spring Creeks Fishing Report',
            content: content.substring(0, 500),
            url: link && link.startsWith('http') ? link : `https://www.montanaangler.com${link || '/fishing-report/'}`,
            last_updated: date || new Date().toISOString(),
            flow: null,
            temp: null
          });
        }
      }
    });

    // Troutfitters Spring Creeks Report
    console.log('Fetching Troutfitters Spring Creeks...');
    try {
      const tfResponse = await axios.get('https://www.troutfitters.com/fishing-report', {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const $tf = cheerio.load(tfResponse.data);
      
      $tf('.report-section, .fishing-report, .river-report, .report-item, article').each((i, elem) => {
        const text = $tf(elem).text().toLowerCase();
        if (text.includes('spring creek') || text.includes('depuy') || text.includes('armstrong') || text.includes('nelson')) {
          const title = $tf(elem).find('h2, h3, .report-title, .entry-title').first().text().trim();
          const content = $tf(elem).find('.report-content, p, .entry-content').text().trim();
          const date = $tf(elem).find('.report-date, .date, .published').text().trim();
          const link = $tf(elem).find('a').attr('href');
          
          if (title && (title.toLowerCase().includes('spring') || content.toLowerCase().includes('spring creek'))) {
            // Check if we already have this source
            const exists = reports.some(r => r.source === 'Troutfitters');
            if (!exists) {
              reports.push({
                river: 'Spring Creeks',
                source: 'Troutfitters',
                title: title || 'Spring Creeks Report',
                content: content.substring(0, 500),
                url: link && link.startsWith('http') ? link : `https://www.troutfitters.com${link || '/fishing-report'}`,
                last_updated: date || new Date().toISOString(),
                flow: null,
                temp: null
              });
            }
          }
        }
      });
    } catch (tfError) {
      console.log('Troutfitters fetch failed:', tfError.message);
    }

    // If no specific Spring Creeks section found, get general report
    if (reports.length === 0) {
      reports.push({
        river: 'Spring Creeks',
        source: 'Montana Angler',
        title: 'Paradise Valley Spring Creeks',
        content: 'DePuy Spring Creek, Armstrong Spring Creek, and Nelson Spring Creek fishing reports. Check current conditions for private water access and hatches.',
        url: 'https://www.montanaangler.com/fishing-report/',
        last_updated: new Date().toISOString(),
        flow: null,
        temp: null
      });
    }

  } catch (error) {
    console.error('Spring Creeks scraper error:', error.message);
  }
  
  console.log(`Found ${reports.length} Spring Creeks reports`);
  return reports;
}

module.exports = { scrapeSpringCreekReports };

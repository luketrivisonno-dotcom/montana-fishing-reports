const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeMadisonMT() {
  const url = 'https://www.montanatrout.com/pages/madison-river-fishing-report';
  
  try {
    const { data } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 10000
    });
    
    const $ = cheerio.load(data);
    const pageText = $('body').text();
    
    const dateMatch = pageText.match(/UPDATED\s+(\d{1,2}\/\d{1,2}\/\d{4})/i);
    
    // Check if report mentions upper/lower sections
    const hasUpper = pageText.toLowerCase().includes('upper madison');
    const hasLower = pageText.toLowerCase().includes('lower madison');
    
    let reports = [];
    
    if (hasUpper || !hasLower) {
      reports.push({
        source: 'Montana Trout',
        river: 'Upper Madison River',
        url: url,
        last_updated: dateMatch ? dateMatch[1] : null,
        scraped_at: new Date()
      });
    }
    
    if (hasLower || !hasUpper) {
      reports.push({
        source: 'Montana Trout',
        river: 'Lower Madison River',
        url: url,
        last_updated: dateMatch ? dateMatch[1] : null,
        scraped_at: new Date()
      });
    }
    
    return reports.length > 0 ? reports : [{
      source: 'Montana Trout',
      river: 'Madison River',
      url: url,
      last_updated: dateMatch ? dateMatch[1] : null,
      scraped_at: new Date()
    }];
  } catch (error) {
    console.error('Madison MT error:', error.message);
    return null;
  }
}

async function scrapeMadisonRiverOutfitters() {
  const url = 'https://madisonriveroutfitters.com/blogs/fly-fishing-report';
  
  try {
    const { data } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 10000
    });
    
    const $ = cheerio.load(data);
    const articles = $('article, .blog-post');
    
    let upperReport = null;
    let lowerReport = null;
    
    articles.each((i, elem) => {
      const text = $(elem).text().toLowerCase();
      const title = $(elem).find('h2, h3').text();
      const dateMatch = title.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/);
      
      if (text.includes('upper madison') && !upperReport) {
        upperReport = {
          source: 'Madison River Outfitters',
          river: 'Upper Madison River',
          url: url,
          last_updated: dateMatch ? dateMatch[0] : null,
          scraped_at: new Date()
        };
      }
      
      if (text.includes('lower madison') && !lowerReport) {
        lowerReport = {
          source: 'Madison River Outfitters',
          river: 'Lower Madison River',
          url: url,
          last_updated: dateMatch ? dateMatch[0] : null,
          scraped_at: new Date()
        };
      }
    });
    
    let reports = [];
    if (upperReport) reports.push(upperReport);
    if (lowerReport) reports.push(lowerReport);
    
    return reports.length > 0 ? reports : [{
      source: 'Madison River Outfitters',
      river: 'Madison River',
      url: url,
      last_updated: null,
      scraped_at: new Date()
    }];
  } catch (error) {
    console.error('Madison Outfitters error:', error.message);
    return null;
  }
}

async function scrapeMadisonYellowDog() {
  const url = 'https://www.yellowdogflyfishing.com/pages/upper-madison-fishing-reports';
  
  try {
    const { data } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 10000
    });
    
    const $ = cheerio.load(data);
    const pageText = $('body').text();
    const dateMatch = pageText.match(/Updated\s+([A-Za-z]+\s+\d{1,2},?\s+\d{2,4})/i);
    
    return {
      source: 'Yellow Dog (Upper Madison)',
      river: 'Upper Madison River',
      url: url,
      last_updated: dateMatch ? dateMatch[1] : null,
      scraped_at: new Date()
    };
  } catch (error) {
    console.error('Madison Yellow Dog error:', error.message);
    return null;
  }
}

module.exports = { scrapeMadisonMT, scrapeMadisonRiverOutfitters, scrapeMadisonYellowDog };
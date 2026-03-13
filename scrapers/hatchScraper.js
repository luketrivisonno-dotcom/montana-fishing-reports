const axios = require('axios');
const cheerio = require('cheerio');
const db = require('../db');
const { getUSGSData } = require('../utils/usgs');
const { extractHatches, getFlyRecommendations } = require('../utils/hatchExtractor');

// Fly shop URLs that include hatch info
const HATCH_SOURCES = {
  'Montana Angler': {
    'Upper Madison River': 'https://www.montanaangler.com/montana-fishing-report/upper-madison-river-fishing-report',
    'Yellowstone River': 'https://www.montanaangler.com/montana-fishing-report/yellowstone-river-fishing-report',
    'Gallatin River': 'https://www.montanaangler.com/montana-fishing-report/gallatin-river-fishing-report',
    'Missouri River': 'https://www.montanaangler.com/montana-fishing-report/missouri-river-fishing-report',
    'Jefferson River': 'https://www.montanaangler.com/montana-fishing-report/jefferson-river-fishing-report',
    'Ruby River': 'https://www.montanaangler.com/montana-fishing-report/ruby-river-fishing-report',
    'Stillwater River': 'https://www.montanaangler.com/montana-fishing-report/stillwater-river-fishing-report',
    'Boulder River': 'https://www.montanaangler.com/montana-fishing-report/boulder-river-report',
    'Spring Creeks': 'https://www.montanaangler.com/montana-fishing-report/spring-creeks-fishing-report',
  },
  'Blue Ribbon Flies': {
    'Upper Madison River': 'https://www.blueribbonflies.com/fishing-report/',
    'Firehole River': 'https://www.blueribbonflies.com/fishing-report/',
    'Gibbon River': 'https://www.blueribbonflies.com/fishing-report/',
    'Slough Creek': 'https://www.blueribbonflies.com/fishing-report/',
    'Soda Butte Creek': 'https://www.blueribbonflies.com/fishing-report/',
    'Lamar River': 'https://www.blueribbonflies.com/fishing-report/',
    'Gardner River': 'https://www.blueribbonflies.com/fishing-report/',
  },
  'Stonefly Shop': {
    'Beaverhead River': 'https://www.thestonefly.com/pages/fishing-reports',
  },
  'Troutfitters': {
    'Big Hole River': 'https://troutfitters.com/reports/big-hole-river',
  }
};

async function scrapeMontanaAnglerHatches() {
  const results = [];
  
  for (const [river, url] of Object.entries(HATCH_SOURCES['Montana Angler'])) {
    try {
      console.log(`Scraping hatch data for ${river}...`);
      
      const { data } = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 15000
      });
      
      const $ = cheerio.load(data);
      const contentText = $('body').text();
      
      // Extract date
      const dateMatch = contentText.match(/([A-Za-z]+\s+\d{1,2},?\s+\d{4}|\d{1,2}\/[\d/]+)/);
      const reportDate = dateMatch ? new Date(dateMatch[0]) : new Date();
      
      // Extract hatches from text
      const hatches = extractHatches(contentText);
      
      // Get water temp from USGS first (most accurate), then fall back to scraped text
      let waterTemp = null;
      try {
        const usgsData = await getUSGSData(river);
        if (usgsData && usgsData.temp && !usgsData.temp.includes('est')) {
          waterTemp = usgsData.temp;
        }
      } catch (e) {
        // USGS failed, will try scraping
      }
      
      // If no USGS temp, try to extract from page text
      if (!waterTemp) {
        const tempMatch = contentText.match(/(\d{2,3})\s*(?:°|degrees?\s*[Ff]|[Ff])/);
        waterTemp = tempMatch ? `${tempMatch[1]}°F` : null;
      }
      
      // Extract water conditions
      let waterConditions = null;
      const conditionsMatch = contentText.match(/(clear|off.?color|muddy|low|high|flow[^.]*\d+[^.]*cfs)/i);
      if (conditionsMatch) {
        waterConditions = conditionsMatch[0];
      }
      
      // Get fly recommendations
      const flyRecommendations = getFlyRecommendations(hatches);
      
      if (hatches.length > 0) {
        results.push({
          river,
          source: 'Montana Angler',
          hatches,
          fly_recommendations: flyRecommendations,
          hatch_details: {
            extracted_from: 'fishing report text',
            confidence: 'medium'
          },
          water_temp: waterTemp,
          water_conditions: waterConditions,
          report_date: reportDate,
          url
        });
        
        console.log(`  Found ${hatches.length} hatches: ${hatches.join(', ')}`);
      }
      
    } catch (error) {
      console.error(`  Error scraping ${river}:`, error.message);
    }
  }
  
  return results;
}

async function scrapeBlueRibbonFliesHatches() {
  const results = [];
  const url = 'https://www.blueribbonflies.net/fishing-report';
  
  try {
    console.log(`Scraping Blue Ribbon Flies hatch data...`);
    
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    });
    
    const $ = cheerio.load(data);
    const contentText = $('body').text();
    
    // Extract date
    const dateMatch = contentText.match(/([A-Za-z]+\s+\d{1,2},?\s+\d{4}|\d{1,2}\/[\d/]+)/);
    const reportDate = dateMatch ? new Date(dateMatch[0]) : new Date();
    
    // Extract hatches from text
    const hatches = extractHatches(contentText);
    
    // Get fly recommendations
    const flyRecommendations = getFlyRecommendations(hatches);
    
    if (hatches.length > 0) {
      // Blue Ribbon Flies covers YNP rivers
      const ynppRivers = ['Firehole River', 'Gibbon River', 'Madison River', 'Yellowstone River'];
      
      for (const river of ynppRivers) {
        results.push({
          river,
          source: 'Blue Ribbon Flies',
          hatches,
          fly_recommendations: flyRecommendations,
          hatch_details: {
            extracted_from: 'fishing report text',
            confidence: 'medium'
          },
          water_temp: null,
          water_conditions: null,
          report_date: reportDate,
          url
        });
      }
      
      console.log(`  Found ${hatches.length} hatches for YNP rivers`);
    }
    
  } catch (error) {
    console.error(`  Error scraping Blue Ribbon Flies:`, error.message);
  }
  
  return results;
}

async function scrapeStoneflyShopHatches() {
  const results = [];
  const url = 'https://www.thestonefly.com/pages/fishing-reports';
  
  try {
    console.log(`Scraping Stonefly Shop hatch data for Beaverhead...`);
    
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    });
    
    const $ = cheerio.load(data);
    const contentText = $('body').text();
    
    // Extract date
    const dateMatch = contentText.match(/([A-Za-z]+\s+\d{1,2},?\s+\d{4}|\d{1,2}\/[\d/]+)/);
    const reportDate = dateMatch ? new Date(dateMatch[0]) : new Date();
    
    // Extract hatches from text
    const hatches = extractHatches(contentText);
    
    // Get fly recommendations
    const flyRecommendations = getFlyRecommendations(hatches);
    
    if (hatches.length > 0) {
      results.push({
        river: 'Beaverhead River',
        source: 'Stonefly Shop',
        hatches,
        fly_recommendations: flyRecommendations,
        hatch_details: {
          extracted_from: 'fishing report text',
          confidence: 'medium'
        },
        water_temp: null,
        water_conditions: null,
        report_date: reportDate,
        url
      });
      
      console.log(`  Found ${hatches.length} hatches: ${hatches.join(', ')}`);
    }
    
  } catch (error) {
    console.error(`  Error scraping Stonefly Shop:`, error.message);
  }
  
  return results;
}

async function scrapeTroutfittersHatches() {
  const results = [];
  const url = 'https://troutfitters.com/reports/big-hole-river';
  
  try {
    console.log(`Scraping Troutfitters hatch data for Big Hole...`);
    
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    });
    
    const $ = cheerio.load(data);
    const contentText = $('body').text();
    
    // Extract date
    const dateMatch = contentText.match(/([A-Za-z]+\s+\d{1,2},?\s+\d{4}|\d{1,2}\/[\d/]+)/);
    const reportDate = dateMatch ? new Date(dateMatch[0]) : new Date();
    
    // Extract hatches from text
    const hatches = extractHatches(contentText);
    
    // Get fly recommendations
    const flyRecommendations = getFlyRecommendations(hatches);
    
    if (hatches.length > 0) {
      results.push({
        river: 'Big Hole River',
        source: 'Troutfitters',
        hatches,
        fly_recommendations: flyRecommendations,
        hatch_details: {
          extracted_from: 'fishing report text',
          confidence: 'medium'
        },
        water_temp: null,
        water_conditions: null,
        report_date: reportDate,
        url
      });
      
      console.log(`  Found ${hatches.length} hatches: ${hatches.join(', ')}`);
    }
    
  } catch (error) {
    console.error(`  Error scraping Troutfitters:`, error.message);
  }
  
  return results;
}

async function saveHatchReports(reports) {
  const saved = [];
  
  for (const report of reports) {
    try {
      // Mark previous reports for this river as not current
      await db.query(
        `UPDATE hatch_reports SET is_current = false WHERE river = $1`,
        [report.river]
      );
      
      // Insert new report
      const result = await db.query(
        `INSERT INTO hatch_reports 
         (river, source, hatches, fly_recommendations, hatch_details, water_temp, water_conditions, report_date, is_current)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
         RETURNING *`,
        [
          report.river,
          report.source,
          report.hatches,
          report.fly_recommendations,
          JSON.stringify(report.hatch_details),
          report.water_temp,
          report.water_conditions,
          report.report_date
        ]
      );
      
      saved.push(result.rows[0]);
    } catch (error) {
      console.error(`Error saving hatch report for ${report.river}:`, error.message);
    }
  }
  
  return saved;
}

async function runHatchScraper() {
  console.log('\n=== Starting Hatch Scraper ===\n');
  
  let totalSaved = 0;
  const allReports = [];
  
  try {
    // Scrape from Montana Angler
    console.log('--- Montana Angler ---');
    const montanaAnglerHatches = await scrapeMontanaAnglerHatches();
    
    if (montanaAnglerHatches.length > 0) {
      const saved = await saveHatchReports(montanaAnglerHatches);
      console.log(`✓ Saved ${saved.length} Montana Angler reports`);
      totalSaved += saved.length;
      allReports.push(...montanaAnglerHatches);
    }
    
    // Scrape from Blue Ribbon Flies
    console.log('\n--- Blue Ribbon Flies ---');
    const blueRibbonHatches = await scrapeBlueRibbonFliesHatches();
    
    if (blueRibbonHatches.length > 0) {
      const saved = await saveHatchReports(blueRibbonHatches);
      console.log(`✓ Saved ${saved.length} Blue Ribbon Flies reports`);
      totalSaved += saved.length;
      allReports.push(...blueRibbonHatches);
    }
    
    // Scrape from Stonefly Shop
    console.log('\n--- Stonefly Shop ---');
    const stoneflyHatches = await scrapeStoneflyShopHatches();
    
    if (stoneflyHatches.length > 0) {
      const saved = await saveHatchReports(stoneflyHatches);
      console.log(`✓ Saved ${stoneflyHatches.length} Stonefly Shop reports`);
      totalSaved += saved.length;
      allReports.push(...stoneflyHatches);
    }
    
    // Scrape from Troutfitters
    console.log('\n--- Troutfitters ---');
    const troutfittersHatches = await scrapeTroutfittersHatches();
    
    if (troutfittersHatches.length > 0) {
      const saved = await saveHatchReports(troutfittersHatches);
      console.log(`✓ Saved ${troutfittersHatches.length} Troutfitters reports`);
      totalSaved += saved.length;
      allReports.push(...troutfittersHatches);
    }
    
    console.log(`\n✓ Total: ${totalSaved} hatch reports saved`);
    
    // Process hatch alerts for premium subscribers
    if (allReports.length > 0) {
      try {
        const { processHatchAlerts } = require('../utils/hatchNotifications');
        await processHatchAlerts(allReports);
      } catch (alertError) {
        console.error('Hatch alert processing error:', alertError.message);
      }
    }
    
  } catch (error) {
    console.error('Hatch scraper error:', error);
  }
  
  console.log('\n=== Hatch Scraper Complete ===\n');
}

// Get current hatches for a river from database
async function getCurrentHatches(riverName) {
  try {
    const result = await db.query(
      `SELECT * FROM hatch_reports 
       WHERE river = $1 AND is_current = true 
       ORDER BY scraped_at DESC LIMIT 1`,
      [riverName]
    );
    
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching hatches:', error);
    return null;
  }
}

// Fallback to static data if no dynamic data available
function getStaticHatches(riverName) {
  const staticHatches = require('../data/hatches');
  return staticHatches.getCurrentHatches(riverName);
}

module.exports = {
  runHatchScraper,
  getCurrentHatches,
  getStaticHatches,
  scrapeMontanaAnglerHatches,
  // Re-export for backward compatibility
  extractHatches,
  getFlyRecommendations
};

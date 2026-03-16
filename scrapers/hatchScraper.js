const axios = require('axios');
const cheerio = require('cheerio');
const db = require('../db');
const { getUSGSData } = require('../utils/usgs');
const { extractHatches, getFlyRecommendations } = require('../utils/hatchExtractor');

// Essential hatch sources only (to prevent server timeouts)
const HATCH_SOURCES = [
  // Bozeman area rivers
  {
    name: 'Bozeman Fly Supply',
    rivers: [
      { name: 'Gallatin River', url: 'https://www.bozemanflysupply.com/river-report/gallatin' },
      { name: 'Upper Madison River', url: 'https://www.bozemanflysupply.com/river-report/upper-madison' },
      { name: 'Lower Madison River', url: 'https://www.bozemanflysupply.com/river-report/lower-madison' },
      { name: 'Yellowstone River', url: 'https://www.bozemanflysupply.com/river-report/yellowstone' },
    ]
  },
  // Missouri River
  {
    name: 'Yellow Dog',
    rivers: [
      { name: 'Missouri River', url: 'https://www.yellowdogflyfishing.com/pages/missouri-river-fishing-reports' },
    ]
  },
  // Missoula area rivers
  {
    name: 'The Missoulian',
    rivers: [
      { name: 'Bitterroot River', url: 'https://www.missoulianangler.com/pages/bitterroot' },
      { name: 'Blackfoot River', url: 'https://www.missoulianangler.com/pages/blackfoot-river-fly-fishing' },
      { name: 'Clark Fork River', url: 'https://www.missoulianangler.com/pages/clark-fork-river-fishing-report' },
      { name: 'Rock Creek', url: 'https://www.missoulianangler.com/pages/rock-creek-fishing-report' },
    ]
  },
  // Bighorn River
  {
    name: 'Bighorn Angler',
    rivers: [
      { name: 'Bighorn River', url: 'https://bighornangler.com/reports' },
    ]
  },
  // Ruby River
  {
    name: 'Montana Angler',
    rivers: [
      { name: 'Ruby River', url: 'https://www.montanaangler.com/montana-fishing-report/ruby-river-fishing-report' },
    ]
  },
];

// Scrape a single river
async function scrapeRiver(sourceName, riverName, url) {
  try {
    const { data } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 10000
    });
    
    const $ = cheerio.load(data);
    const contentText = $('body').text();
    
    // Extract date
    const dateMatch = contentText.match(/([A-Za-z]+\s+\d{1,2},?\s+\d{4})/);
    const reportDate = dateMatch ? new Date(dateMatch[0]) : new Date();
    
    // Extract hatches
    const hatches = extractHatches(contentText);
    
    if (hatches.length > 0) {
      console.log(`  ✓ ${sourceName} - ${riverName}: ${hatches.length} hatches`);
      return {
        river: riverName,
        source: sourceName,
        hatches,
        fly_recommendations: getFlyRecommendations(hatches),
        hatch_details: { extracted_from: sourceName, confidence: 'medium' },
        water_temp: null,
        water_conditions: null,
        report_date: reportDate,
        url
      };
    } else {
      console.log(`  ⊘ ${sourceName} - ${riverName}: No hatches`);
      return null;
    }
  } catch (error) {
    console.error(`  ✗ ${sourceName} - ${riverName}: ${error.message}`);
    return null;
  }
}

async function saveHatchReports(reports) {
  const saved = [];
  
  for (const report of reports) {
    try {
      await db.query(`UPDATE hatch_reports SET is_current = false WHERE river = $1`, [report.river]);
      
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
      console.error(`Error saving ${report.river}:`, error.message);
    }
  }
  
  return saved;
}

async function runHatchScraper() {
  console.log('\n=== Starting Hatch Scraper ===\n');
  
  const allReports = [];
  
  // Process each source sequentially
  for (const source of HATCH_SOURCES) {
    console.log(`--- ${source.name} ---`);
    
    // Process each river in a source sequentially (to avoid overwhelming the server)
    for (const river of source.rivers) {
      const report = await scrapeRiver(source.name, river.name, river.url);
      if (report) {
        await saveHatchReports([report]);
        allReports.push(report);
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('');
  }
  
  console.log(`=== Total: ${allReports.length} hatch reports saved ===\n`);
  return allReports;
}

// Get current hatches for a river
async function getCurrentHatches(river) {
  try {
    const result = await db.query(
      `SELECT * FROM hatch_reports 
       WHERE river = $1 AND is_current = true
       ORDER BY scraped_at DESC
       LIMIT 1`,
      [river]
    );
    
    if (result.rows.length > 0) {
      const report = result.rows[0];
      return {
        hatches: report.hatches,
        flies: report.fly_recommendations,
        source: report.source,
        date: report.report_date,
        waterTemp: report.water_temp,
        waterConditions: report.water_conditions
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting current hatches:', error);
    return null;
  }
}

// Get seasonal static hatches (fallback)
function getStaticHatches(riverName) {
  const staticData = {
    'Madison River': ['Midges', 'Blue Winged Olives', 'Caddis', 'PMDs'],
    'Gallatin River': ['Midges', 'Blue Winged Olives', 'Caddis', 'Stoneflies'],
    'Yellowstone River': ['Midges', 'Blue Winged Olives', 'Caddis', 'PMDs'],
    'Bighorn River': ['Midges', 'Blue Winged Olives', 'Caddis', 'PMDs'],
    'Missouri River': ['Midges', 'Blue Winged Olives', 'Caddis', 'PMDs'],
    'Bitterroot River': ['Midges', 'Blue Winged Olives', 'Skwalas', 'March Browns'],
    'Blackfoot River': ['Midges', 'Blue Winged Olives', 'March Browns', 'Caddis'],
    'Clark Fork River': ['Midges', 'Blue Winged Olives', 'Caddis', 'PMDs'],
    'Rock Creek': ['Midges', 'Blue Winged Olives', 'March Browns', 'Caddis'],
    'Ruby River': ['Midges', 'Blue Winged Olives', 'Caddis', 'PMDs'],
    'Beaverhead River': ['Midges', 'Blue Winged Olives', 'Caddis', 'PMDs'],
  };
  
  return staticData[riverName] || null;
}

module.exports = {
  runHatchScraper,
  getCurrentHatches,
  getStaticHatches
};

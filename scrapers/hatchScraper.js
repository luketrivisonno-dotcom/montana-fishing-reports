const axios = require('axios');
const cheerio = require('cheerio');
const db = require('../db');
const { getUSGSData } = require('../utils/usgs');
const { extractHatches, getFlyRecommendations } = require('../utils/hatchExtractor');

// Priority hatch sources (reduced list to prevent timeouts)
const HATCH_SOURCES = {
  // Primary source for Bozeman area rivers
  'Bozeman Fly Supply': {
    'Gallatin River': 'https://www.bozemanflysupply.com/river-report/gallatin',
    'Upper Madison River': 'https://www.bozemanflysupply.com/river-report/upper-madison',
    'Lower Madison River': 'https://www.bozemanflysupply.com/river-report/lower-madison',
    'Yellowstone River': 'https://www.bozemanflysupply.com/river-report/yellowstone',
  },
  
  // Missouri River
  'Yellow Dog': {
    'Missouri River': 'https://www.yellowdogflyfishing.com/pages/missouri-river-fishing-reports',
  },
  
  // Missoula area rivers
  'The Missoulian': {
    'Bitterroot River': 'https://www.missoulianangler.com/pages/bitterroot',
    'Blackfoot River': 'https://www.missoulianangler.com/pages/blackfoot-river-fly-fishing',
    'Clark Fork River': 'https://www.missoulianangler.com/pages/clark-fork-river-fishing-report',
    'Rock Creek': 'https://www.missoulianangler.com/pages/rock-creek-fishing-report',
  },
  
  // Bighorn River
  'Bighorn Angler': {
    'Bighorn River': 'https://bighornangler.com/reports',
  },
  
  // YNP Rivers
  'Gallatin River Guides': {
    'Slough Creek': 'https://www.montanaflyfishing.com/yellowstone-national-park-fishing-report',
    'Soda Butte Creek': 'https://www.montanaflyfishing.com/yellowstone-national-park-fishing-report',
    'Lamar River': 'https://www.montanaflyfishing.com/yellowstone-national-park-fishing-report',
    'Gardner River': 'https://www.montanaflyfishing.com/yellowstone-national-park-fishing-report',
    'Firehole River': 'https://www.montanaflyfishing.com/yellowstone-national-park-fishing-report',
    'Gibbon River': 'https://www.montanaflyfishing.com/yellowstone-national-park-fishing-report',
  },
  
  // Ruby River
  'Montana Angler': {
    'Ruby River': 'https://www.montanaangler.com/montana-fishing-report/ruby-river-fishing-report',
  },
  
  // Beaverhead River
  'Stonefly Shop': {
    'Beaverhead River': 'https://www.thestonefly.com/pages/fishing-reports',
  },
};

// Scrape a single URL
async function scrapeUrl(sourceName, river, url) {
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 12000
    });
    
    const $ = cheerio.load(data);
    const contentText = $('body').text();
    
    // Extract date
    const dateMatch = contentText.match(/([A-Za-z]+\s+\d{1,2},?\s+\d{4}|\d{1,2}\/[\d/]+)/);
    const reportDate = dateMatch ? new Date(dateMatch[0]) : new Date();
    
    // Extract hatches from text
    const hatches = extractHatches(contentText);
    
    if (hatches.length > 0) {
      const flyRecommendations = getFlyRecommendations(hatches);
      
      console.log(`  ✓ ${sourceName} - ${river}: ${hatches.length} hatches`);
      
      return {
        river,
        source: sourceName,
        hatches,
        fly_recommendations: flyRecommendations,
        hatch_details: {
          extracted_from: sourceName,
          confidence: 'medium'
        },
        water_temp: null,
        water_conditions: null,
        report_date: reportDate,
        url
      };
    } else {
      console.log(`  ⊘ ${sourceName} - ${river}: No hatches found`);
      return null;
    }
    
  } catch (error) {
    console.error(`  ✗ ${sourceName} - ${river}: ${error.message}`);
    return null;
  }
}

// Scrape all URLs for a source in parallel
async function scrapeSource(sourceName, urlMap) {
  console.log(`--- ${sourceName} ---`);
  
  const entries = Object.entries(urlMap);
  
  // Scrape in parallel with Promise.all
  const results = await Promise.all(
    entries.map(([river, url]) => scrapeUrl(sourceName, river, url))
  );
  
  // Filter out nulls
  const validResults = results.filter(r => r !== null);
  
  console.log(`✓ ${sourceName}: ${validResults.length}/${entries.length} rivers with hatches\n`);
  
  return validResults;
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
    // Run sources sequentially but requests within each source in parallel
    
    // 1. Bozeman Fly Supply (4 rivers in parallel)
    const bozemanReports = await scrapeSource('Bozeman Fly Supply', HATCH_SOURCES['Bozeman Fly Supply']);
    if (bozemanReports.length > 0) {
      const saved = await saveHatchReports(bozemanReports);
      totalSaved += saved.length;
      allReports.push(...bozemanReports);
    }
    
    // 2. Yellow Dog (1 river)
    const yellowDogReports = await scrapeSource('Yellow Dog', HATCH_SOURCES['Yellow Dog']);
    if (yellowDogReports.length > 0) {
      const saved = await saveHatchReports(yellowDogReports);
      totalSaved += saved.length;
      allReports.push(...yellowDogReports);
    }
    
    // 3. The Missoulian (4 rivers in parallel)
    const missoulianReports = await scrapeSource('The Missoulian', HATCH_SOURCES['The Missoulian']);
    if (missoulianReports.length > 0) {
      const saved = await saveHatchReports(missoulianReports);
      totalSaved += saved.length;
      allReports.push(...missoulianReports);
    }
    
    // 4. Bighorn Angler (1 river)
    const bighornReports = await scrapeSource('Bighorn Angler', HATCH_SOURCES['Bighorn Angler']);
    if (bighornReports.length > 0) {
      const saved = await saveHatchReports(bighornReports);
      totalSaved += saved.length;
      allReports.push(...bighornReports);
    }
    
    // 5. Gallatin River Guides (6 YNP rivers in parallel)
    const gallatinGuidesReports = await scrapeSource('Gallatin River Guides', HATCH_SOURCES['Gallatin River Guides']);
    if (gallatinGuidesReports.length > 0) {
      const saved = await saveHatchReports(gallatinGuidesReports);
      totalSaved += saved.length;
      allReports.push(...gallatinGuidesReports);
    }
    
    // 6. Montana Angler (1 river)
    const montanaAnglerReports = await scrapeSource('Montana Angler', HATCH_SOURCES['Montana Angler']);
    if (montanaAnglerReports.length > 0) {
      const saved = await saveHatchReports(montanaAnglerReports);
      totalSaved += saved.length;
      allReports.push(...montanaAnglerReports);
    }
    
    // 7. Stonefly Shop (1 river)
    const stoneflyReports = await scrapeSource('Stonefly Shop', HATCH_SOURCES['Stonefly Shop']);
    if (stoneflyReports.length > 0) {
      const saved = await saveHatchReports(stoneflyReports);
      totalSaved += saved.length;
      allReports.push(...stoneflyReports);
    }
    
    console.log(`=== Total: ${totalSaved} hatch reports saved ===\n`);
    
  } catch (error) {
    console.error('Error in hatch scraper:', error);
  }
  
  return allReports;
}

// Get current hatches for a river (returns array of current hatches)
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

const axios = require('axios');
const cheerio = require('cheerio');
const db = require('../db');
const { getUSGSData } = require('../utils/usgs');
const { extractHatches, getFlyRecommendations } = require('../utils/hatchExtractor');

// Hatch sources mapped to specific rivers as requested
const HATCH_SOURCES = {
  // Yellowstone, Gallatin, Madison rivers - priority sources
  'Troutfitters': {
    'Gallatin River': 'https://troutfitters.com/reports/gallatin-river',
    'Yellowstone River': 'https://troutfitters.com/reports/yellowstone-river',
    'Upper Madison River': 'https://troutfitters.com/reports/upper-madison',
    'Lower Madison River': 'https://troutfitters.com/reports/lower-madison-river',
  },
  'Yellow Dog': {
    'Gallatin River': 'https://www.yellowdogflyfishing.com/pages/gallatin-river-fishing-report',
    'Upper Madison River': 'https://www.yellowdogflyfishing.com/pages/upper-madison-fishing-reports',
    'Lower Madison River': 'https://www.yellowdogflyfishing.com/pages/lower-madison-fishing-reports',
    'Yellowstone River': 'https://www.yellowdogflyfishing.com/pages/yellowstone-river-fishing-reports',
    'Missouri River': 'https://www.yellowdogflyfishing.com/pages/missouri-river-fishing-reports',
    'Bighorn River': 'https://www.yellowdogflyfishing.com/pages/bighorn-river-fishing-reports',
  },
  'Fins and Feathers': {
    // Single page covers all these rivers
    rivers: ['Gallatin River', 'Upper Madison River', 'Lower Madison River', 'Yellowstone River', 'Bighorn River'],
    url: 'https://www.finsandfeathers.com/fishing-reports'
  },
  'Bozeman Fly Supply': {
    'Gallatin River': 'https://www.bozemanflysupply.com/river-report/gallatin',
    'Upper Madison River': 'https://www.bozemanflysupply.com/river-report/upper-madison',
    'Lower Madison River': 'https://www.bozemanflysupply.com/river-report/lower-madison',
    'Yellowstone River': 'https://www.bozemanflysupply.com/river-report/yellowstone',
  },
  
  // Missouri River - priority sources
  'Grizzly Hackle': {
    'Missouri River': 'https://grizzlyhackle.com/pages/missouri-river-fishing-report',
    'Bitterroot River': 'https://grizzlyhackle.com/pages/bitterroot-river-fishing-report',
    'Blackfoot River': 'https://grizzlyhackle.com/pages/blackfoot-river-fishing-report',
    'Clark Fork River': 'https://grizzlyhackle.com/pages/clark-fork-river-fishing-report',
    'Rock Creek': 'https://grizzlyhackle.com/pages/rock-creek-fishing-report',
  },
  
  // Missoula area rivers (Bitterroot, Blackfoot, Clark Fork, Rock Creek)
  'The Missoulian': {
    'Bitterroot River': 'https://www.missoulianangler.com/pages/bitterroot-river-fishing-report',
    'Blackfoot River': 'https://www.missoulianangler.com/pages/blackfoot-river-fly-fishing',
    'Clark Fork River': 'https://www.missoulianangler.com/pages/clark-fork-river-fishing-report',
    'Rock Creek': 'https://www.missoulianangler.com/pages/rock-creek-fishing-report',
  },
  'Blackfoot River Outfitters': {
    'Blackfoot River': 'https://blackfootriver.com/blogs/fishing-reports',
  },
  
  // Bighorn River
  'Bighorn Angler': {
    'Bighorn River': 'https://bighornangler.com/reports',
  },
  
  // YNP Rivers
  'Gallatin River Guides': {
    'Gallatin River': 'https://www.montanaflyfishing.com/gallatin-river-fishing-report',
    'Upper Madison River': 'https://www.montanaflyfishing.com/upper-madison-river-fishing-report',
    'Lower Madison River': 'https://www.montanaflyfishing.com/lower-madison-river-fishing-report',
    'Yellowstone River': 'https://www.montanaflyfishing.com/yellowstone-river-fishing-report',
    // YNP specific
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
  'Perfect Fly Store': {
    'Ruby River': 'https://perfectflystore.com/your-streams/fly-fishing-ruby-river-montana/',
  },
  
  // Other rivers not covered above
  'Stonefly Shop': {
    'Beaverhead River': 'https://www.thestonefly.com/pages/fishing-reports',
  },
};

// Generic scraper for sources with individual river URLs
async function scrapeIndividualUrls(sourceName, urlMap) {
  const results = [];
  
  for (const [river, url] of Object.entries(urlMap)) {
    try {
      console.log(`Scraping ${sourceName} for ${river}...`);
      
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
      
      if (hatches.length > 0) {
        const flyRecommendations = getFlyRecommendations(hatches);
        
        results.push({
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
        });
        
        console.log(`  Found ${hatches.length} hatches: ${hatches.join(', ')}`);
      } else {
        console.log(`  No hatches found`);
      }
      
    } catch (error) {
      console.error(`  Error scraping ${sourceName} for ${river}:`, error.message);
    }
  }
  
  return results;
}

// Scraper for Fins and Feathers (single page, multiple rivers)
async function scrapeFinsAndFeathersHatches() {
  const results = [];
  const url = HATCH_SOURCES['Fins and Feathers'].url;
  const rivers = HATCH_SOURCES['Fins and Feathers'].rivers;
  
  try {
    console.log(`Scraping Fins and Feathers...`);
    
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    });
    
    const $ = cheerio.load(data);
    const contentText = $('body').text();
    
    const dateMatch = contentText.match(/([A-Za-z]+\s+\d{1,2},?\s+\d{4})/);
    const reportDate = dateMatch ? new Date(dateMatch[0]) : new Date();
    
    // Extract hatches once, apply to all rivers
    const hatches = extractHatches(contentText);
    
    if (hatches.length > 0) {
      const flyRecommendations = getFlyRecommendations(hatches);
      
      for (const river of rivers) {
        results.push({
          river,
          source: 'Fins and Feathers',
          hatches,
          fly_recommendations: flyRecommendations,
          hatch_details: {
            extracted_from: 'Fins and Feathers fishing report',
            confidence: 'medium'
          },
          water_temp: null,
          water_conditions: null,
          report_date: reportDate,
          url
        });
      }
      
      console.log(`  Found ${hatches.length} hatches for ${rivers.length} rivers`);
    } else {
      console.log(`  No hatches found`);
    }
    
  } catch (error) {
    console.error(`  Error scraping Fins and Feathers:`, error.message);
  }
  
  return results;
}

// Scraper for Blackfoot River Outfitters
async function scrapeBlackfootOutfittersHatches() {
  const results = [];
  const url = HATCH_SOURCES['Blackfoot River Outfitters']['Blackfoot River'];
  
  try {
    console.log(`Scraping Blackfoot River Outfitters...`);
    
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    });
    
    const $ = cheerio.load(data);
    const contentText = $('body').text();
    
    const dateMatch = contentText.match(/([A-Za-z]+\s+\d{1,2},?\s+\d{4})/);
    const reportDate = dateMatch ? new Date(dateMatch[0]) : new Date();
    
    const hatches = extractHatches(contentText);
    
    if (hatches.length > 0) {
      const flyRecommendations = getFlyRecommendations(hatches);
      
      results.push({
        river: 'Blackfoot River',
        source: 'Blackfoot River Outfitters',
        hatches,
        fly_recommendations: flyRecommendations,
        hatch_details: {
          extracted_from: 'Blackfoot River Outfitters fishing report',
          confidence: 'medium'
        },
        water_temp: null,
        water_conditions: null,
        report_date: reportDate,
        url
      });
      
      console.log(`  Found ${hatches.length} hatches`);
    } else {
      console.log(`  No hatches found`);
    }
    
  } catch (error) {
    console.error(`  Error scraping Blackfoot River Outfitters:`, error.message);
  }
  
  return results;
}

// Scraper for Bighorn Angler
async function scrapeBighornAnglerHatches() {
  const results = [];
  const url = HATCH_SOURCES['Bighorn Angler']['Bighorn River'];
  
  try {
    console.log(`Scraping Bighorn Angler...`);
    
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    });
    
    const $ = cheerio.load(data);
    const contentText = $('body').text();
    
    const dateMatch = contentText.match(/([A-Za-z]+\s+\d{1,2},?\s+\d{4})/);
    const reportDate = dateMatch ? new Date(dateMatch[0]) : new Date();
    
    const hatches = extractHatches(contentText);
    
    if (hatches.length > 0) {
      const flyRecommendations = getFlyRecommendations(hatches);
      
      results.push({
        river: 'Bighorn River',
        source: 'Bighorn Angler',
        hatches,
        fly_recommendations: flyRecommendations,
        hatch_details: {
          extracted_from: 'Bighorn Angler fishing report',
          confidence: 'medium'
        },
        water_temp: null,
        water_conditions: null,
        report_date: reportDate,
        url
      });
      
      console.log(`  Found ${hatches.length} hatches`);
    } else {
      console.log(`  No hatches found`);
    }
    
  } catch (error) {
    console.error(`  Error scraping Bighorn Angler:`, error.message);
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
    // 1. Troutfitters (Gallatin, Yellowstone, Upper/Lower Madison)
    console.log('--- Troutfitters ---');
    const troutfittersReports = await scrapeIndividualUrls('Troutfitters', HATCH_SOURCES['Troutfitters']);
    if (troutfittersReports.length > 0) {
      const saved = await saveHatchReports(troutfittersReports);
      console.log(`✓ Saved ${saved.length} Troutfitters reports\n`);
      totalSaved += saved.length;
      allReports.push(...troutfittersReports);
    }
    
    // 2. Yellow Dog (Gallatin, Yellowstone, Madison, Missouri, Bighorn)
    console.log('--- Yellow Dog ---');
    const yellowDogReports = await scrapeIndividualUrls('Yellow Dog', HATCH_SOURCES['Yellow Dog']);
    if (yellowDogReports.length > 0) {
      const saved = await saveHatchReports(yellowDogReports);
      console.log(`✓ Saved ${saved.length} Yellow Dog reports\n`);
      totalSaved += saved.length;
      allReports.push(...yellowDogReports);
    }
    
    // 3. Fins and Feathers (Gallatin, Yellowstone, Madison, Bighorn)
    console.log('--- Fins and Feathers ---');
    const finsReports = await scrapeFinsAndFeathersHatches();
    if (finsReports.length > 0) {
      const saved = await saveHatchReports(finsReports);
      console.log(`✓ Saved ${saved.length} Fins and Feathers reports\n`);
      totalSaved += saved.length;
      allReports.push(...finsReports);
    }
    
    // 4. Bozeman Fly Supply (Gallatin, Yellowstone, Madison)
    console.log('--- Bozeman Fly Supply ---');
    const bozemanReports = await scrapeIndividualUrls('Bozeman Fly Supply', HATCH_SOURCES['Bozeman Fly Supply']);
    if (bozemanReports.length > 0) {
      const saved = await saveHatchReports(bozemanReports);
      console.log(`✓ Saved ${saved.length} Bozeman Fly Supply reports\n`);
      totalSaved += saved.length;
      allReports.push(...bozemanReports);
    }
    
    // 5. Grizzly Hackle (Missouri, Bitterroot, Blackfoot, Clark Fork, Rock Creek)
    console.log('--- Grizzly Hackle ---');
    const grizzlyReports = await scrapeIndividualUrls('Grizzly Hackle', HATCH_SOURCES['Grizzly Hackle']);
    if (grizzlyReports.length > 0) {
      const saved = await saveHatchReports(grizzlyReports);
      console.log(`✓ Saved ${saved.length} Grizzly Hackle reports\n`);
      totalSaved += saved.length;
      allReports.push(...grizzlyReports);
    }
    
    // 6. The Missoulian (Bitterroot, Blackfoot, Clark Fork, Rock Creek)
    console.log('--- The Missoulian ---');
    const missoulianReports = await scrapeIndividualUrls('The Missoulian', HATCH_SOURCES['The Missoulian']);
    if (missoulianReports.length > 0) {
      const saved = await saveHatchReports(missoulianReports);
      console.log(`✓ Saved ${saved.length} The Missoulian reports\n`);
      totalSaved += saved.length;
      allReports.push(...missoulianReports);
    }
    
    // 7. Blackfoot River Outfitters (Blackfoot)
    console.log('--- Blackfoot River Outfitters ---');
    const blackfootReports = await scrapeBlackfootOutfittersHatches();
    if (blackfootReports.length > 0) {
      const saved = await saveHatchReports(blackfootReports);
      console.log(`✓ Saved ${saved.length} Blackfoot River Outfitters reports\n`);
      totalSaved += saved.length;
      allReports.push(...blackfootReports);
    }
    
    // 8. Bighorn Angler (Bighorn)
    console.log('--- Bighorn Angler ---');
    const bighornReports = await scrapeBighornAnglerHatches();
    if (bighornReports.length > 0) {
      const saved = await saveHatchReports(bighornReports);
      console.log(`✓ Saved ${saved.length} Bighorn Angler reports\n`);
      totalSaved += saved.length;
      allReports.push(...bighornReports);
    }
    
    // 9. Gallatin River Guides (YNP rivers + main rivers)
    console.log('--- Gallatin River Guides ---');
    const gallatinGuidesReports = await scrapeIndividualUrls('Gallatin River Guides', HATCH_SOURCES['Gallatin River Guides']);
    if (gallatinGuidesReports.length > 0) {
      const saved = await saveHatchReports(gallatinGuidesReports);
      console.log(`✓ Saved ${saved.length} Gallatin River Guides reports\n`);
      totalSaved += saved.length;
      allReports.push(...gallatinGuidesReports);
    }
    
    // 10. Montana Angler (Ruby)
    console.log('--- Montana Angler ---');
    const montanaAnglerReports = await scrapeIndividualUrls('Montana Angler', HATCH_SOURCES['Montana Angler']);
    if (montanaAnglerReports.length > 0) {
      const saved = await saveHatchReports(montanaAnglerReports);
      console.log(`✓ Saved ${saved.length} Montana Angler reports\n`);
      totalSaved += saved.length;
      allReports.push(...montanaAnglerReports);
    }
    
    // 11. Perfect Fly Store (Ruby)
    console.log('--- Perfect Fly Store ---');
    const perfectFlyReports = await scrapeIndividualUrls('Perfect Fly Store', HATCH_SOURCES['Perfect Fly Store']);
    if (perfectFlyReports.length > 0) {
      const saved = await saveHatchReports(perfectFlyReports);
      console.log(`✓ Saved ${saved.length} Perfect Fly Store reports\n`);
      totalSaved += saved.length;
      allReports.push(...perfectFlyReports);
    }
    
    // 12. Stonefly Shop (Beaverhead - not in priority list but kept for coverage)
    console.log('--- Stonefly Shop ---');
    const stoneflyReports = await scrapeIndividualUrls('Stonefly Shop', HATCH_SOURCES['Stonefly Shop']);
    if (stoneflyReports.length > 0) {
      const saved = await saveHatchReports(stoneflyReports);
      console.log(`✓ Saved ${saved.length} Stonefly Shop reports\n`);
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

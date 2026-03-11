const axios = require('axios');
const cheerio = require('cheerio');
const db = require('../db');

// Fly shop URLs that include hatch info
const HATCH_SOURCES = {
  'Montana Angler': {
    'Madison River': 'https://www.montanaangler.com/montana-fishing-report/upper-madison-river-fishing-report',
    'Yellowstone River': 'https://www.montanaangler.com/montana-fishing-report/yellowstone-river-fishing-report',
    'Gallatin River': 'https://www.montanaangler.com/montana-fishing-report/gallatin-river-fishing-report',
    'Missouri River': 'https://www.montanaangler.com/montana-fishing-report/missouri-river-fishing-report',
    'Jefferson River': 'https://www.montanaangler.com/montana-fishing-report/jefferson-river-fishing-report',
    'Ruby River': 'https://www.montanaangler.com/montana-fishing-report/ruby-river-fishing-report',
    'Stillwater River': 'https://www.montanaangler.com/montana-fishing-report/stillwater-river-fishing-report',
    'Boulder River': 'https://www.montanaangler.com/montana-fishing-report/boulder-river-fishing-report',
    'Spring Creeks': 'https://www.montanaangler.com/montana-fishing-report/spring-creeks-fishing-report',
  },
  'Blue Ribbon Flies': {
    'Madison River': 'https://www.blueribbonflies.com/fishing-report/',
    'Firehole River': 'https://www.blueribbonflies.com/fishing-report/',
    'Gibbon River': 'https://www.blueribbonflies.com/fishing-report/',
    'Yellowstone National Park': 'https://www.blueribbonflies.com/fishing-report/',
  }
};

// Common hatch patterns to extract from text
const HATCH_PATTERNS = [
  { name: 'Midges', patterns: [/\bmidge/i, /\bmidges/i] },
  { name: 'Blue Winged Olives', patterns: [/\bbwo\b/i, /\bblue.?winged/i, /\bbaetis/i] },
  { name: 'March Browns', patterns: [/\bmarch brown/i] },
  { name: 'Salmonflies', patterns: [/\bsalmonfly/i, /\bsalmon fly/i] },
  { name: 'Golden Stones', patterns: [/\bgolden stone/i] },
  { name: 'PMDs', patterns: [/\bpmd\b/i, /\bpale morning dun/i] },
  { name: 'Yellow Sallies', patterns: [/\byellow sall/i, /\bisoperla/i] },
  { name: 'Caddis', patterns: [/\bcaddis/i] },
  { name: 'Hoppers', patterns: [/\bhopper/i] },
  { name: 'Tricos', patterns: [/\btrico/i] },
  { name: 'Mahogany Duns', patterns: [/\bmahogany/i] },
  { name: 'October Caddis', patterns: [/\boctober caddis/i] },
  { name: 'Skwalas', patterns: [/\bskwala/i] },
  { name: 'Green Drakes', patterns: [/\bgreen drake/i] },
  { name: 'Gray Drakes', patterns: [/\bgray drake/i] },
  { name: 'Callibaetis', patterns: [/\bcallibaetis/i] },
  { name: 'Pseudos', patterns: [/\bpseudo/i] },
  { name: 'Ants', patterns: [/\bants?\b/i] },
  { name: 'Beetles', patterns: [/\bbeetles?\b/i] },
];

// Fly recommendations based on hatch
const FLY_RECOMMENDATIONS = {
  'Midges': ['Zebra Midge #18-22', 'Top Secret Midge #20-22', 'Griffiths Gnat #18-20', 'Miracle Midge #20-22'],
  'Blue Winged Olives': ['Parachute BWO #18-20', 'RS2 #20-22', 'Pheasant Tail #16-18', 'Barr Emerger #18-20'],
  'Baetis': ['BWO Comparadun #20-22', 'Barr Emerger #20-22', 'Sparkle Dun #18-20'],
  'March Browns': ['March Brown Dry #12-14', 'Hare\'s Ear #12-14', 'Parachute Adams #12-14'],
  'Salmonflies': ['Salmonfly Dry #4-6', 'Chubby Chernobyl #6-8', 'Pats Rubber Legs #6-8', 'Kaufmann Stone #6-8'],
  'Golden Stones': ['Golden Stone Dry #8-10', 'Kaufmann Stone #8-10', 'Chubby Chernobyl Tan #8-10'],
  'PMDs': ['Parachute PMD #16-18', 'Sparkle Dun #16-18', 'Pheasant Tail #16', 'Split Case PMD #16-18'],
  'Yellow Sallies': ['Yellow Sally Dry #14-16', 'Stimulator Yellow #14-16', 'Neversink Caddis #14-16'],
  'Caddis': ['Elk Hair Caddis #14-16', 'X-Caddis #16-18', 'Pupa patterns #14-16', 'CDC Caddis #14-16'],
  'Hoppers': ['Chubby Chernobyl #8-10', 'Morrish Hopper #10-12', 'Dave\'s Hopper #10-12', 'Parachute Hopper #10-12'],
  'Tricos': ['Trico Spinner #20-22', 'Trico Dun #20-22', 'Trico Comparadun #20-22'],
  'Mahogany Duns': ['Parachute Adams #14-16', 'Sparkle Dun #14-16', 'Pheasant Tail #14-16'],
  'October Caddis': ['Orange Stimulator #10-12', 'Elk Hair Caddis Orange #12-14', 'Pupa patterns #12-14'],
  'Skwalas': ['Skwala Dry #10-12', 'Pat\'s Rubber Legs Olive #8-10', 'Chubby Chernobyl Olive #10-12'],
  'Green Drakes': ['Green Drake Dry #10-12', 'Parachute Green Drake #10-12'],
  'Gray Drakes': ['Gray Drake Dry #10-12', 'Soda Fountain Parachute #10-12'],
  'Callibaetis': ['Callibaetis Cripple #14', 'Parachute Adams #14', 'Callibaetis Spinner #14'],
  'Pseudos': ['Pseudo Spinner #16-18', 'Sparkle Dun #16-18'],
  'Ants': ['Flying Ant #16-18', 'Foam Ant #14-16'],
  'Beetles': ['Foam Beetle #14-16', 'Crunchy Beetle #14-16'],
};

function extractHatches(text) {
  const foundHatches = [];
  const lowerText = text.toLowerCase();
  
  for (const hatch of HATCH_PATTERNS) {
    for (const pattern of hatch.patterns) {
      if (pattern.test(lowerText)) {
        foundHatches.push(hatch.name);
        break;
      }
    }
  }
  
  return [...new Set(foundHatches)]; // Remove duplicates
}

function getFlyRecommendations(hatches) {
  const recommendations = [];
  for (const hatch of hatches) {
    if (FLY_RECOMMENDATIONS[hatch]) {
      recommendations.push(...FLY_RECOMMENDATIONS[hatch]);
    }
  }
  // Return unique flies, limited to 6
  return [...new Set(recommendations)].slice(0, 6);
}

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
      
      // Try to find the main content area
      const contentText = $('body').text();
      
      // Extract date
      const dateMatch = contentText.match(/([A-Za-z]+\s+\d{1,2},?\s+\d{4}|\d{1,2}\/[\d/]+)/);
      const reportDate = dateMatch ? new Date(dateMatch[0]) : new Date();
      
      // Extract hatches from text
      const hatches = extractHatches(contentText);
      
      // Extract water temp if available
      const tempMatch = contentText.match(/(\d{2,3})\s*°?\s*[Ff]/);
      const waterTemp = tempMatch ? `${tempMatch[1]}°F` : null;
      
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
    
    // Extract date - Blue Ribbon Flies usually has date in header
    const dateMatch = contentText.match(/([A-Za-z]+\s+\d{1,2},?\s+\d{4}|\d{1,2}\/[\d/]+)/);
    const reportDate = dateMatch ? new Date(dateMatch[0]) : new Date();
    
    // Extract hatches from text
    const hatches = extractHatches(contentText);
    
    // Extract water temp
    const tempMatch = contentText.match(/(\d{2,3})\s*°?\s*[Ff]/);
    const waterTemp = tempMatch ? `${tempMatch[1]}°F` : null;
    
    // Blue Ribbon Flies focuses on West Yellowstone area rivers
    // The report covers Madison, Firehole, Gibbon, and YNP
    const rivers = [
      { name: 'Madison River', keywords: ['madison', 'madison river'] },
      { name: 'Firehole River', keywords: ['firehole', 'firehole river'] },
      { name: 'Gibbon River', keywords: ['gibbon', 'gibbon river'] },
      { name: 'Yellowstone National Park', keywords: ['ynp', 'yellowstone park', 'the park'] }
    ];
    
    // Try to assign hatches to specific rivers based on text context
    for (const river of rivers) {
      // Look for river-specific sections
      const riverPattern = new RegExp(`(${river.keywords.join('|')})[^.]*([^.]*hatch[^.]*|[^.]*fly[^.]*|[^.]*pattern[^.]*)`, 'gi');
      const matches = contentText.match(riverPattern);
      
      if (matches || hatches.length > 0) {
        results.push({
          river: river.name,
          source: 'Blue Ribbon Flies',
          hatches: hatches,
          fly_recommendations: getFlyRecommendations(hatches),
          hatch_details: {
            extracted_from: 'Blue Ribbon Flies fishing report',
            confidence: 'medium',
            note: 'West Yellowstone area report'
          },
          water_temp: waterTemp,
          water_conditions: null,
          report_date: reportDate,
          url
        });
        
        console.log(`  Found data for ${river.name}: ${hatches.length} hatches`);
      }
    }
    
  } catch (error) {
    console.error(`  Error scraping Blue Ribbon Flies:`, error.message);
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
  
  try {
    // Scrape from Montana Angler
    console.log('--- Montana Angler ---');
    const montanaAnglerHatches = await scrapeMontanaAnglerHatches();
    
    if (montanaAnglerHatches.length > 0) {
      const saved = await saveHatchReports(montanaAnglerHatches);
      console.log(`✓ Saved ${saved.length} Montana Angler reports`);
      totalSaved += saved.length;
    }
    
    // Scrape from Blue Ribbon Flies
    console.log('\n--- Blue Ribbon Flies ---');
    const blueRibbonHatches = await scrapeBlueRibbonFliesHatches();
    
    if (blueRibbonHatches.length > 0) {
      const saved = await saveHatchReports(blueRibbonHatches);
      console.log(`✓ Saved ${saved.length} Blue Ribbon Flies reports`);
      totalSaved += saved.length;
    }
    
    console.log(`\n✓ Total: ${totalSaved} hatch reports saved`);
    
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
  scrapeMontanaAnglerHatches
};

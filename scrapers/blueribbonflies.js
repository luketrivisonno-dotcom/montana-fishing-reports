const axios = require('axios');

const ICON_URL = 'https://montana-fishing-reports-production.up.railway.app/favicons/blue-ribbon-flies.png';
const cheerio = require('cheerio');
const { extractHatchData } = require('../utils/hatchExtractor');
const db = require('../db');

async function scrapeBlueRibbonFlies() {
  const url = 'https://www.blueribbonflies.com/fishing-report/';
  
  try {
    const { data } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 10000
    });
    
    const $ = cheerio.load(data);
    const pageText = $('body').text();
    
    const dateMatch = 
      pageText.match(/Updated[:\s]+([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i) ||
      pageText.match(/([A-Za-z]+\s+\d{1,2},?\s+\d{4})/) ||
      pageText.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
    
    // Extract hatch data from the page content
    const hatchData = extractHatchData(pageText);
    const dateStr = dateMatch ? dateMatch[1] : null;
    const reportDate = dateMatch ? new Date(dateMatch[1]) : new Date();
    
    // Save hatch data if we found any
    if (hatchData.hatches.length > 0) {
      console.log(`  Blue Ribbon Flies - Found hatches: ${hatchData.hatches.join(', ')}`);
    }
    
    // Return reports for all YNP rivers since this is a general YNP report
    const rivers = ['Slough Creek', 'Soda Butte Creek', 'Lamar River', 'Gardner River', 'Firehole River'];
    const reports = [];
    
    for (const river of rivers) {
      // Save hatch data for each river
      if (hatchData.hatches.length > 0) {
        try {
          await db.query(`UPDATE hatch_reports SET is_current = false WHERE river = $1`, [river]);
          await db.query(
            `INSERT INTO hatch_reports (river, source, hatches, fly_recommendations, hatch_details, water_temp, water_conditions, report_date, is_current)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)`,
            [river, 'Blue Ribbon Flies', hatchData.hatches, hatchData.fly_recommendations,
             JSON.stringify({ extracted_from: 'Blue Ribbon Flies fishing report', url }),
             hatchData.water_temp, hatchData.water_conditions, reportDate]
          );
        } catch (dbError) {
          console.error(`  → Error saving hatch data for ${river}:`, dbError.message);
        }
      }
      
      reports.push({
        source: 'Blue Ribbon Flies',
        river: river,
        url: url,
        last_updated: dateStr,
        scraped_at: new Date(),
        hatches: hatchData.hatches
      });
    }
    
    return reports;
    
  } catch (error) {
    console.error('Blue Ribbon Flies error:', error.message);
    return null;
  }
}

module.exports = scrapeBlueRibbonFlies;

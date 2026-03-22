const db = require('../db');
const { sendRiverNotification } = require('./pushNotifications');

// Major hatches that deserve special attention
const MAJOR_HATCHES = [
  'Salmonflies',      // Biggest event of the year
  'Golden Stones',    // Also very popular
  'Green Drakes',     // Great dry fly action
  'PMDs',             // Consistent summer hatch
  'Hoppers',          // Terrestrial season
  'Tricos',           // Technical but rewarding
  'October Caddis',   // Fall hatch
  'Skwalas',          // Early season
];

// Hatch emojis for notifications
const HATCH_EMOJIS = {
  'Salmonflies': '🦋',
  'Golden Stones': '🪨',
  'PMDs': '🌸',
  'Caddis': '🦟',
  'Blue Winged Olives': '🫒',
  'Hoppers': '🦗',
  'Tricos': '🌪️',
  'Midges': '🦟',
  'March Browns': '🟤',
  'Yellow Sallies': '🟡',
  'October Caddis': '🎃',
  'Skwalas': '🫒',
  'Green Drakes': '🐉',
  'Gray Drakes': '⬜',
  'Callibaetis': '🏔️',
  'Mahogany Duns': '🟫',
  'Ants': '🐜',
  'Beetles': '🪲',
};

/**
 * Check if a hatch is newly active (wasn't in the previous report)
 */
async function isNewHatchActivity(river, hatch, lookbackDays = 7) {
  try {
    // Check if this hatch was mentioned in recent reports
    const recentResult = await db.query(`
      SELECT hatches FROM hatch_reports 
      WHERE river = $1 
        AND report_date > NOW() - INTERVAL '${lookbackDays} days'
        AND is_current = false
      ORDER BY report_date DESC
      LIMIT 1
    `, [river]);
    
    if (recentResult.rows.length === 0) {
      // No previous report, this is the first mention
      return true;
    }
    
    const previousHatches = recentResult.rows[0].hatches || [];
    const wasPreviouslyActive = previousHatches.some(h => 
      h.toLowerCase().includes(hatch.toLowerCase()) ||
      hatch.toLowerCase().includes(h.toLowerCase())
    );
    
    // It's "new" if it wasn't in the previous report
    return !wasPreviouslyActive;
    
  } catch (error) {
    console.error('Error checking hatch history:', error);
    return false;
  }
}

/**
 * Detect significant hatch activity that warrants a notification
 */
async function detectHatchActivity(hatchReport) {
  const { river, hatches, source, hatch_details } = hatchReport;
  const significantHatches = [];
  
  for (const hatch of hatches) {
    // Check if this is a major hatch
    const isMajor = MAJOR_HATCHES.includes(hatch);
    
    // Check if this is newly active
    const isNew = await isNewHatchActivity(river, hatch);
    
    // Notify for major hatches, or any hatch that's newly active
    if (isMajor || isNew) {
      significantHatches.push({
        name: hatch,
        isMajor,
        isNew,
        emoji: HATCH_EMOJIS[hatch] || '🎣'
      });
    }
  }
  
  return significantHatches;
}

/**
 * Get users subscribed to hatch alerts for a specific river and hatch
 */
async function getHatchSubscribers(river, hatch = null) {
  try {
    let query = `
      SELECT DISTINCT pt.token, pt.platform
      FROM push_tokens pt
      JOIN hatch_subscriptions hs ON pt.token = hs.token
      WHERE hs.river = $1
    `;
    const params = [river];
    
    if (hatch) {
      query += ` AND (hs.hatch = $2 OR hs.hatch = 'all')`;
      params.push(hatch);
    }
    
    const result = await db.query(query, params);
    return result.rows;
    
  } catch (error) {
    console.error('Error fetching hatch subscribers:', error);
    return [];
  }
}

/**
 * Send hatch alert notifications
 */
async function sendHatchAlerts(hatchReport, significantHatches) {
  const { river, source, hatches, fly_recommendations, water_temp } = hatchReport;
  
  for (const hatch of significantHatches) {
    const subscribers = await getHatchSubscribers(river, hatch.name);
    
    if (subscribers.length === 0) continue;
    
    // Build notification message
    const emoji = hatch.emoji;
    const title = `${emoji} ${hatch.name} on ${river}!`;
    
    let body = `Reported by ${source}`;
    if (hatch.isMajor && hatch.isNew) {
      body = `🚨 Just starting! Reported by ${source}`;
    } else if (hatch.isMajor) {
      body = `Still going strong! Reported by ${source}`;
    }
    
    // Get fly recommendations for this specific hatch
    const relevantFlies = getFliesForHatch(hatch.name, fly_recommendations);
    if (relevantFlies.length > 0) {
      body += ` • Try: ${relevantFlies.slice(0, 2).join(', ')}`;
    }
    
    // Send notifications
    const { sendTestNotification } = require('./pushNotifications');
    const axios = require('axios');
    const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
    
    const messages = subscribers.map(sub => ({
      to: sub.token,
      title,
      body,
      data: {
        type: 'hatch_alert',
        river,
        hatch: hatch.name,
        source,
        water_temp,
        urgency: hatch.isMajor && hatch.isNew ? 'high' : 'normal'
      },
      sound: hatch.isMajor && hatch.isNew ? 'default' : 'default',
      badge: 1,
    }));
    
    try {
      // Send in batches of 100
      for (let i = 0; i < messages.length; i += 100) {
        const batch = messages.slice(i, i + 100);
        await axios.post(EXPO_PUSH_URL, batch, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });
      }
      
      console.log(`📱 Hatch alerts sent: ${hatch.name} on ${river} → ${subscribers.length} subscribers`);
      
    } catch (error) {
      console.error('Error sending hatch alerts:', error.message);
    }
  }
}

/**
 * Get fly patterns for a specific hatch
 */
function getFliesForHatch(hatchName, allRecommendations = []) {
  const FLY_RECOMMENDATIONS = {
    'Midges': ['Zebra Midge #18-22', 'Top Secret Midge #20-22'],
    'Blue Winged Olives': ['Parachute BWO #18-20', 'RS2 #20-22'],
    'March Browns': ['March Brown Dry #12-14', 'Hare\'s Ear #12-14'],
    'Salmonflies': ['Chubby Chernobyl #6-8', 'Pats Rubber Legs #6-8'],
    'Golden Stones': ['Kaufmann Stone #8-10', 'Chubby Chernobyl Tan #8-10'],
    'PMDs': ['Parachute PMD #16-18', 'Sparkle Dun #16-18'],
    'Yellow Sallies': ['Yellow Sally Dry #14-16', 'Stimulator Yellow #14-16'],
    'Caddis': ['Elk Hair Caddis #14-16', 'X-Caddis #16-18'],
    'Hoppers': ['Chubby Chernobyl #8-10', 'Morrish Hopper #10-12'],
    'Tricos': ['Trico Spinner #20-22', 'Trico Dun #20-22'],
    'Green Drakes': ['Green Drake Dry #10-12', 'Parachute Green Drake #10-12'],
    'October Caddis': ['Orange Stimulator #10-12', 'Elk Hair Caddis Orange #12-14'],
    'Skwalas': ['Skwala Dry #10-12', 'Pat\'s Rubber Legs Olive #8-10'],
  };
  
  return FLY_RECOMMENDATIONS[hatchName] || allRecommendations.slice(0, 2);
}

/**
 * Main function to process hatch reports and send alerts
 */
async function processHatchAlerts(hatchReports) {
  console.log('\n=== Processing Hatch Alerts ===\n');
  
  let totalAlerts = 0;
  
  for (const report of hatchReports) {
    console.log(`Checking ${report.river}...`);
    
    // Detect significant hatch activity
    const significantHatches = await detectHatchActivity(report);
    
    if (significantHatches.length > 0) {
      console.log(`  Significant hatches found: ${significantHatches.map(h => h.name).join(', ')}`);
      
      // Send alerts
      await sendHatchAlerts(report, significantHatches);
      totalAlerts += significantHatches.length;
    } else {
      console.log(`  No new significant hatch activity`);
    }
  }
  
  console.log(`\n=== Hatch Alerts Complete: ${totalAlerts} alerts sent ===\n`);
  return totalAlerts;
}

/**
 * Subscribe a user to hatch alerts
 */
async function subscribeToHatchAlerts(token, river, hatch = 'all') {
  try {
    await db.query(`
      INSERT INTO hatch_subscriptions (token, river, hatch, subscribed_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (token, river, hatch) DO UPDATE SET subscribed_at = NOW()
    `, [token, river, hatch]);
    
    return true;
  } catch (error) {
    console.error('Error subscribing to hatch alerts:', error);
    return false;
  }
}

/**
 * Unsubscribe from hatch alerts
 */
async function unsubscribeFromHatchAlerts(token, river, hatch = null) {
  try {
    let query = `DELETE FROM hatch_subscriptions WHERE token = $1 AND river = $2`;
    const params = [token, river];
    
    if (hatch) {
      query += ` AND hatch = $3`;
      params.push(hatch);
    }
    
    await db.query(query, params);
    return true;
  } catch (error) {
    console.error('Error unsubscribing from hatch alerts:', error);
    return false;
  }
}

module.exports = {
  processHatchAlerts,
  subscribeToHatchAlerts,
  unsubscribeFromHatchAlerts,
  getHatchSubscribers,
  isNewHatchActivity,
  MAJOR_HATCHES,
  HATCH_EMOJIS,
};

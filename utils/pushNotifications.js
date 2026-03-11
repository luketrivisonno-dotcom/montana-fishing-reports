const axios = require('axios');
const db = require('../db');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Send push notification for new fishing reports
 * Called after scrapers insert/update reports
 */
async function notifyNewReports(newReports) {
  if (!newReports || newReports.length === 0) return;
  
  // Group reports by river
  const reportsByRiver = {};
  for (const report of newReports) {
    if (!reportsByRiver[report.river]) {
      reportsByRiver[report.river] = [];
    }
    reportsByRiver[report.river].push(report);
  }
  
  // Send notifications for each river
  for (const [river, reports] of Object.entries(reportsByRiver)) {
    await sendRiverNotification(river, reports);
  }
}

/**
 * Send notification to all subscribers of a river
 */
async function sendRiverNotification(river, reports) {
  try {
    // Get all push tokens subscribed to this river
    const result = await db.query(`
      SELECT pt.token, pt.platform
      FROM push_tokens pt
      JOIN notification_subscriptions ns ON pt.token = ns.token
      WHERE ns.river = $1
    `, [river]);
    
    if (result.rows.length === 0) {
      console.log(`No subscribers for ${river}`);
      return;
    }
    
    const tokens = result.rows.map(r => r.token);
    const sourceNames = [...new Set(reports.map(r => r.source))].slice(0, 2).join(', ');
    const reportCount = reports.length;
    
    // Create notification message
    const title = `🎣 New Report: ${river}`;
    const body = reportCount === 1 
      ? `New fishing report from ${sourceNames}`
      : `${reportCount} new reports from ${sourceNames}`;
    
    // Send to all subscribers (batch in chunks of 100)
    const chunks = chunkArray(tokens, 100);
    let successCount = 0;
    let failCount = 0;
    
    for (const chunk of chunks) {
      const messages = chunk.map(token => ({
        to: token,
        title,
        body,
        data: { 
          river,
          sourceCount: reports.length,
          type: 'new_report'
        },
        sound: 'default',
        badge: 1,
      }));
      
      try {
        const response = await axios.post(EXPO_PUSH_URL, messages, {
          headers: {
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
        });
        
        // Check for errors in response
        if (response.data?.data) {
          for (const item of response.data.data) {
            if (item.status === 'ok') {
              successCount++;
            } else {
              failCount++;
              console.log(`Push failed: ${item.message || 'Unknown error'}`);
              // Remove invalid tokens
              if (item.details?.error === 'DeviceNotRegistered') {
                await removeInvalidToken(item.to);
              }
            }
          }
        }
      } catch (error) {
        console.error('Expo push error:', error.message);
        failCount += chunk.length;
      }
    }
    
    console.log(`📱 Push notifications for ${river}: ${successCount} sent, ${failCount} failed (${tokens.length} subscribers)`);
    
  } catch (error) {
    console.error(`Error sending notification for ${river}:`, error.message);
  }
}

/**
 * Remove invalid/unregistered push tokens
 */
async function removeInvalidToken(token) {
  try {
    await db.query('DELETE FROM push_tokens WHERE token = $1', [token]);
    await db.query('DELETE FROM notification_subscriptions WHERE token = $1', [token]);
    console.log(`Removed invalid token: ${token.substring(0, 20)}...`);
  } catch (error) {
    console.error('Error removing invalid token:', error.message);
  }
}

/**
 * Chunk array into smaller arrays
 */
function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Test push notification (for development)
 */
async function sendTestNotification(token, title, body) {
  try {
    const response = await axios.post(EXPO_PUSH_URL, [{
      to: token,
      title,
      body,
      sound: 'default',
    }], {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Test notification error:', error.message);
    throw error;
  }
}

module.exports = {
  notifyNewReports,
  sendRiverNotification,
  sendTestNotification,
};

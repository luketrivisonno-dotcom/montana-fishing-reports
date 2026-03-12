// This script resets the database and rebuilds reports
// Run it in Railway: Variables → Add → DEPLOY_RESET = true
// It will run once on next deploy, then you should remove the variable

const db = require('./db');
const { runAllScrapers } = require('./scrapers');

async function resetAndRebuild() {
  if (process.env.DEPLOY_RESET !== 'true') {
    console.log('DEPLOY_RESET not set, skipping reset.');
    console.log('To reset: Set DEPLOY_RESET=true in Railway Variables and redeploy');
    return;
  }
  
  console.log('=== REPORTS DATABASE RESET ===\n');
  
  try {
    // Step 1: Get count before
    const before = await db.query('SELECT COUNT(*) FROM reports');
    console.log(`Reports before: ${before.rows[0].count}`);
    
    // Step 2: Clear all reports
    console.log('\nClearing all reports...');
    await db.query('DELETE FROM reports');
    console.log('✓ All reports cleared');
    
    // Step 3: Rebuild
    console.log('\nRebuilding reports with correct dates...');
    await runAllScrapers();
    
    // Step 4: Get count after
    const after = await db.query('SELECT COUNT(*) FROM reports');
    console.log(`\n✓ Reports after: ${after.rows[0].count}`);
    console.log('\n=== RESET COMPLETE ===');
    console.log('\n⚠️  IMPORTANT: Remove DEPLOY_RESET from Railway Variables!');
    console.log('   Or this will reset again on next deploy.');
    
  } catch (error) {
    console.error('Reset failed:', error.message);
    process.exit(1);
  }
  
  process.exit(0);
}

resetAndRebuild();

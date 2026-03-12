// This script resets the database and rebuilds reports
// Run it in Railway: Variables → Add → DEPLOY_RESET = true
// It will run once on next deploy, then you should remove the variable

const db = require('./db');
const { runAllScrapers } = require('./scrapers');

async function resetAndRebuild() {
  console.log('=== CHECKING DEPLOY_RESET ===');
  console.log('DEPLOY_RESET env var:', process.env.DEPLOY_RESET);
  
  if (process.env.DEPLOY_RESET !== 'true') {
    console.log('DEPLOY_RESET not set to "true", skipping reset.');
    console.log('To reset: Set DEPLOY_RESET=true in Railway Variables and redeploy');
    return;
  }
  
  console.log('\n=== REPORTS DATABASE RESET STARTED ===\n');
  
  try {
    // Step 1: Get count before
    console.log('Step 1: Checking current reports count...');
    const before = await db.query('SELECT COUNT(*) FROM reports');
    console.log(`Reports before: ${before.rows[0].count}`);
    
    // Step 2: Clear all reports
    console.log('\nStep 2: Clearing all reports...');
    await db.query('DELETE FROM reports');
    console.log('✓ All reports cleared');
    
    // Step 3: Rebuild
    console.log('\nStep 3: Running all scrapers...');
    console.log('This may take a few minutes...\n');
    await runAllScrapers();
    
    // Step 4: Get count after
    console.log('\nStep 4: Checking new reports count...');
    const after = await db.query('SELECT COUNT(*) FROM reports');
    console.log(`✓ Reports after: ${after.rows[0].count}`);
    
    // Show sample of River's Edge and Bozeman Fly Supply
    console.log('\n=== Sample of Key Sources ===');
    const keySources = await db.query(
      "SELECT source, river, last_updated_text FROM reports WHERE source IN ('The River\\'s Edge', 'Bozeman Fly Supply') AND is_active = true ORDER BY source, river"
    );
    keySources.rows.forEach(r => {
      console.log(`${r.source} - ${r.river}: ${r.last_updated_text}`);
    });
    
    console.log('\n=== RESET COMPLETE ===');
    console.log('\n⚠️  IMPORTANT: Remove DEPLOY_RESET from Railway Variables!');
    console.log('   Or this will reset again on next deploy.');
    
  } catch (error) {
    console.error('\n❌ RESET FAILED:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
  
  process.exit(0);
}

resetAndRebuild();

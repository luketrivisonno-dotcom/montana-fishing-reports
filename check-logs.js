const db = require('./db');

async function checkData() {
  try {
    console.log('=== Checking Database ===\n');
    
    const count = await db.query('SELECT COUNT(*) FROM reports WHERE is_active = true');
    console.log(`Total active reports: ${count.rows[0].count}\n`);
    
    const riversEdge = await db.query(
      "SELECT river, last_updated, last_updated_text FROM reports WHERE source = 'The River\\'s Edge' AND is_active = true"
    );
    console.log("River's Edge reports:");
    riversEdge.rows.forEach(r => console.log(`  ${r.river}: ${r.last_updated} / ${r.last_updated_text}`));
    
    const bozeman = await db.query(
      "SELECT river, last_updated, last_updated_text FROM reports WHERE source = 'Bozeman Fly Supply' AND is_active = true"
    );
    console.log("\nBozeman Fly Supply reports:");
    bozeman.rows.forEach(r => console.log(`  ${r.river}: ${r.last_updated} / ${r.last_updated_text}`));
    
    const montanaAngler = await db.query(
      "SELECT river, last_updated, last_updated_text FROM reports WHERE source = 'Montana Angler' AND is_active = true LIMIT 3"
    );
    console.log("\nMontana Angler reports (sample):");
    montanaAngler.rows.forEach(r => console.log(`  ${r.river}: ${r.last_updated} / ${r.last_updated_text}`));
    
  } catch (err) {
    console.error('Error:', err.message);
  }
  process.exit(0);
}

checkData();

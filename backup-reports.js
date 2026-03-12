const db = require('./db');
const fs = require('fs');

async function backupReports() {
  try {
    console.log('Creating backup of reports table...');
    
    const result = await db.query(`
      SELECT * FROM reports 
      ORDER BY river, source, scraped_at DESC
    `);
    
    const backup = {
      created_at: new Date().toISOString(),
      count: result.rows.length,
      reports: result.rows
    };
    
    const filename = `reports-backup-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(filename, JSON.stringify(backup, null, 2));
    
    console.log(`✓ Backup created: ${filename}`);
    console.log(`  Total reports: ${backup.count}`);
    
    // Also show breakdown by river
    const byRiver = {};
    result.rows.forEach(r => {
      byRiver[r.river] = (byRiver[r.river] || 0) + 1;
    });
    
    console.log('\nReports by river:');
    Object.entries(byRiver).sort().forEach(([river, count]) => {
      console.log(`  ${river}: ${count}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Backup failed:', error.message);
    process.exit(1);
  }
}

backupReports();

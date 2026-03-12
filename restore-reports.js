const db = require('./db');
const fs = require('fs');

async function restoreReports() {
  try {
    // Find the most recent backup file
    const files = fs.readdirSync('.')
      .filter(f => f.startsWith('reports-backup-') && f.endsWith('.json'))
      .sort()
      .reverse();
    
    if (files.length === 0) {
      console.error('No backup files found!');
      console.log('Expected format: reports-backup-YYYY-MM-DD.json');
      process.exit(1);
    }
    
    const backupFile = files[0];
    console.log(`Found backup: ${backupFile}`);
    
    const backup = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    console.log(`Backup created: ${backup.created_at}`);
    console.log(`Reports in backup: ${backup.count}`);
    
    console.log('\n⚠️  This will RESTORE old reports with potentially INCORRECT dates.');
    console.log('Only use this if something went wrong with the rebuild!\n');
    
    // Restore each report
    let restored = 0;
    for (const report of backup.reports) {
      try {
        await db.query(`
          INSERT INTO reports 
          (source, source_normalized, river, url, title, last_updated, last_updated_text, 
           author, scraped_at, is_active, icon_url, water_clarity)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (river, source_normalized) 
          DO UPDATE SET
            url = EXCLUDED.url,
            title = EXCLUDED.title,
            last_updated = EXCLUDED.last_updated,
            last_updated_text = EXCLUDED.last_updated_text,
            author = EXCLUDED.author,
            scraped_at = EXCLUDED.scraped_at,
            is_active = EXCLUDED.is_active,
            icon_url = EXCLUDED.icon_url,
            water_clarity = EXCLUDED.water_clarity
        `, [
          report.source,
          report.source_normalized,
          report.river,
          report.url,
          report.title,
          report.last_updated,
          report.last_updated_text,
          report.author,
          report.scraped_at,
          report.is_active,
          report.icon_url,
          report.water_clarity
        ]);
        restored++;
      } catch (err) {
        console.error(`Failed to restore: ${report.source} - ${report.river}:`, err.message);
      }
    }
    
    console.log(`\n✓ Restored ${restored}/${backup.count} reports`);
    console.log('\nNOTE: These reports may have the OLD date problems!');
    console.log('Consider running the scraper again to get fresh dates.');
    
    process.exit(0);
  } catch (error) {
    console.error('Restore failed:', error.message);
    process.exit(1);
  }
}

restoreReports();

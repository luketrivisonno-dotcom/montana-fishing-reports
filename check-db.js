const db = require('./db');

async function check() {
  const result = await db.query(
    "SELECT source, river, is_active, last_updated, last_updated_text FROM reports WHERE source LIKE '%Edge%' OR source LIKE '%River%'"
  );
  console.log('River-related reports:');
  result.rows.forEach(r => {
    console.log(`  ${r.source} - ${r.river}: active=${r.is_active}, date=${r.last_updated_text}`);
  });
  process.exit(0);
}
check();

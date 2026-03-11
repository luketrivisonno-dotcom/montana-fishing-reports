const db = require('./db');

async function checkRivers() {
  try {
    // Get all active rivers
    const result = await db.query(`
      SELECT river, COUNT(*) as report_count 
      FROM reports 
      WHERE is_active = true 
      GROUP BY river 
      ORDER BY river
    `);
    
    console.log('Active rivers in database:');
    result.rows.forEach(row => {
      console.log(`  ${row.river}: ${row.report_count} reports`);
    });
    
    // Check for Madison River specifically
    const madison = await db.query(`
      SELECT source, river, is_active 
      FROM reports 
      WHERE river = 'Madison River'
    `);
    console.log('\nMadison River entries:');
    madison.rows.forEach(row => {
      console.log(`  ${row.source}: active=${row.is_active}`);
    });
    
    // Check for Yellowstone National Park
    const ynp = await db.query(`
      SELECT source, river, is_active 
      FROM reports 
      WHERE river = 'Yellowstone National Park'
    `);
    console.log('\nYellowstone National Park entries:');
    ynp.rows.forEach(row => {
      console.log(`  ${row.source}: active=${row.is_active}`);
    });
    
    // Check YNP rivers
    const ynpRivers = await db.query(`
      SELECT river, COUNT(*) as count 
      FROM reports 
      WHERE river IN ('Slough Creek', 'Soda Butte Creek', 'Lamar River', 'Gardner River', 'Firehole River')
        AND is_active = true
      GROUP BY river
    `);
    console.log('\nYNP rivers with reports:');
    ynpRivers.rows.forEach(row => {
      console.log(`  ${row.river}: ${row.count} reports`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkRivers();

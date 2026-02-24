cat > cleanup.js << 'EOF'
const db = require('./db');

async function cleanupDatabase() {
    console.log('\n========================================');
    console.log('Running database cleanup...');
    console.log('========================================\n');
    
    try {
        const generalResult = await db.query(
            "DELETE FROM reports WHERE river = 'General Montana' OR river = 'Montana General' RETURNING *"
        );
        console.log(`Removed ${generalResult.rowCount} General Montana entries`);
        
        const madisonResult = await db.query(
            "DELETE FROM reports WHERE river = 'Madison River' RETURNING *"
        );
        console.log(`Removed ${madisonResult.rowCount} combined Madison River entries`);
        
        const riversResult = await db.query(
            'SELECT DISTINCT river FROM reports WHERE is_active = true ORDER BY river'
        );
        
        console.log('\nRemaining rivers:');
        riversResult.rows.forEach((row, i) => {
            console.log(`  ${i + 1}. ${row.river}`);
        });
        
        console.log('\n========================================');
        console.log('Cleanup completed successfully');
        console.log('========================================\n');
        
        process.exit(0);
    } catch (error) {
        console.error('Cleanup error:', error.message);
        process.exit(1);
    }
}

cleanupDatabase();
EOF
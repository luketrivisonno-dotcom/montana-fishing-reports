cat > setup.js << 'EOF'
const { runAllScrapers } = require('./scrapers');

async function setup() {
    console.log('\n========================================');
    console.log('Setting up Montana Fishing Reports API');
    console.log('========================================\n');
    
    try {
        console.log('Running scrapers to populate database...\n');
        const results = await runAllScrapers();
        
        console.log('\n========================================');
        console.log('Setup completed!');
        console.log(`Success: ${results.successCount}, Failed: ${results.failCount}`);
        console.log('========================================\n');
        
        process.exit(0);
    } catch (error) {
        console.error('Setup error:', error.message);
        process.exit(1);
    }
}

setup();
EOF
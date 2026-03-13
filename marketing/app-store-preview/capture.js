const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// iPhone 14 Pro Max dimensions for App Store screenshots
const PHONE_WIDTH = 430;  // CSS pixels
const PHONE_HEIGHT = 932; // CSS pixels
const SCALE_FACTOR = 3;   // @3x for iPhone 14 Pro Max

// Screenshot dimensions (actual pixels)
const OUTPUT_WIDTH = 1290;
const OUTPUT_HEIGHT = 2796;

async function captureScreenshots() {
    console.log('🎣 Montana Fishing Reports - App Store Preview Generator\n');
    
    const inputFile = path.join(__dirname, 'generate-preview.html');
    const outputDir = path.join(__dirname, 'screenshots');
    
    // Create output directory
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Start browser
    const browser = await chromium.launch();
    const context = await browser.newContext({
        viewport: { width: PHONE_WIDTH * 2, height: PHONE_HEIGHT * 2 },
        deviceScaleFactor: SCALE_FACTOR
    });
    const page = await context.newPage();
    
    // Load the HTML file
    const fileUrl = 'file://' + inputFile;
    await page.goto(fileUrl, { waitUntil: 'networkidle' });
    
    // Wait for fonts and styles to load
    await page.waitForTimeout(1000);
    
    // Find all phone frames
    const phones = await page.$$('.phone-frame');
    console.log(`Found ${phones.length} screens to capture\n`);
    
    const screenNames = [
        '01-river-list',
        '02-river-details', 
        '03-map-view',
        '04-favorites',
        '05-premium-paywall'
    ];
    
    for (let i = 0; i < phones.length; i++) {
        const phone = phones[i];
        const name = screenNames[i] || `screen-${i + 1}`;
        
        // Get the bounding box of the phone frame
        const box = await phone.boundingBox();
        
        // Capture screenshot of just this phone
        const screenshotPath = path.join(outputDir, `${name}.png`);
        
        await phone.screenshot({
            path: screenshotPath,
            type: 'png'
        });
        
        console.log(`✅ Captured: ${name}.png`);
        
        // Get file size
        const stats = fs.statSync(screenshotPath);
        const sizeKb = Math.round(stats.size / 1024);
        console.log(`   Size: ${sizeKb} KB`);
        
        // Verify dimensions
        // Note: Playwright captures at device scale, so we need to check the actual size
    }
    
    await browser.close();
    
    console.log('\n🎉 All screenshots captured!');
    console.log(`📁 Location: ${outputDir}\n`);
    
    // List all files
    const files = fs.readdirSync(outputDir);
    console.log('Generated files:');
    files.forEach(f => {
        const stats = fs.statSync(path.join(outputDir, f));
        console.log(`  • ${f} (${Math.round(stats.size / 1024)} KB)`);
    });
}

captureScreenshots().catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});

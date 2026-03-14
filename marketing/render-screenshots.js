const puppeteer = require('puppeteer');
const path = require('path');

// App Store Screenshot Dimensions
const DIMENSIONS = {
  // iPhone 15 Pro Max / 15 Plus (required)
  iphone: {
    width: 430,
    height: 932,
    deviceScaleFactor: 3, // 1290 x 2796
    name: 'iphone'
  },
  // iPad Pro 13-inch (required)
  ipad: {
    width: 1024,
    height: 1366,
    deviceScaleFactor: 2, // 2048 x 2732
    name: 'ipad'
  }
};

async function captureScreenshot(htmlFile, outputFile, viewport) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: viewport.deviceScaleFactor
    });
    
    // Load HTML file
    const filePath = path.resolve(htmlFile);
    await page.goto('file://' + filePath, { waitUntil: 'networkidle0' });
    
    // Wait for fonts and styles to load
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Take screenshot
    await page.screenshot({
      path: outputFile,
      fullPage: false,
      type: 'png'
    });
    
    console.log(`✅ Created: ${outputFile}`);
    console.log(`   Size: ${viewport.width * viewport.deviceScaleFactor}x${viewport.height * viewport.deviceScaleFactor}`);
    
  } catch (error) {
    console.error(`❌ Error creating ${outputFile}:`, error.message);
  } finally {
    await browser.close();
  }
}

async function main() {
  console.log('Rendering App Store screenshots...\n');
  
  // iPhone Paywall screenshot
  await captureScreenshot(
    'paywall-mockup.html',
    'screenshot-iphone-paywall.png',
    DIMENSIONS.iphone
  );
  
  // iPad screenshots
  // First: iPad River List
  await captureScreenshot(
    'ipad-mockup.html',
    'screenshot-ipad-rivers.png',
    DIMENSIONS.ipad
  );
  
  // Second: iPad River Detail
  await captureScreenshot(
    'ipad-detail.html',
    'screenshot-ipad-detail.png',
    DIMENSIONS.ipad
  );
  
  // For subscription screenshot, use the iPad-specific paywall
  await captureScreenshot(
    'ipad-paywall.html',
    'screenshot-ipad-paywall.png',
    DIMENSIONS.ipad
  );
  
  console.log('\n✅ All screenshots rendered!');
  console.log('\nFiles created:');
  console.log('  - screenshot-iphone-paywall.png (1290x2796)');
  console.log('  - screenshot-ipad-rivers.png (2048x2732)');
  console.log('  - screenshot-ipad-paywall.png (2048x2732)');
}

main().catch(console.error);

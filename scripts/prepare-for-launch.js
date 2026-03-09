#!/usr/bin/env node
/**
 * Prepare app for App Store launch
 */

const fs = require('fs');
const path = require('path');

console.log('🎣 Pre-Launch Checklist\n');

let issues = 0;

// Check app.json
const appJson = JSON.parse(fs.readFileSync('mobile-app/app.json', 'utf8'));
if (appJson.expo.extra?.eas?.projectId === 'your-project-id-here') {
  console.log('❌ Update app.json: projectId is still placeholder');
  issues++;
} else {
  console.log('✅ Project ID set');
}

if (appJson.expo.owner === 'your-expo-username') {
  console.log('❌ Update app.json: owner is still placeholder');
  issues++;
} else {
  console.log('✅ Owner set');
}

// Check assets
const assets = ['icon.png', 'splash.png'];
for (const asset of assets) {
  if (fs.existsSync(`mobile-app/assets/${asset}`)) {
    console.log(`✅ ${asset} exists`);
  } else {
    console.log(`❌ Missing ${asset}`);
    issues++;
  }
}

console.log(`\n${issues === 0 ? '🚀 Ready to build!' : `⚠️  Fix ${issues} issues first`}`);

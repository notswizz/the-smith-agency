const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 167, name: 'apple-touch-icon-167x167.png' }, // iPad Pro
  { size: 152, name: 'apple-touch-icon-152x152.png' }, // iPad
  { size: 120, name: 'apple-touch-icon-120x120.png' }, // iPhone 6 Plus
  { size: 114, name: 'apple-touch-icon-114x114.png' }, // iPhone 4/4S
  { size: 76, name: 'apple-touch-icon-76x76.png' },   // iPad mini
  { size: 60, name: 'apple-touch-icon-60x60.png' },   // iPhone 3GS
  { size: 40, name: 'apple-touch-icon-40x40.png' },   // iPhone 3GS (spotlight)
  { size: 29, name: 'apple-touch-icon-29x29.png' }    // iPhone 3GS (settings)
];

async function generateAppleTouchIcons() {
  const sourceIcon = path.join(__dirname, '../public/icons/icon-512x512.png');
  const outputDir = path.join(__dirname, '../public/icons');
  
  if (!fs.existsSync(sourceIcon)) {
    console.error('Source icon not found:', sourceIcon);
    return;
  }

  console.log('Generating Apple touch icons...');

  for (const { size, name } of sizes) {
    try {
      await sharp(sourceIcon)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png({ quality: 100 })
        .toFile(path.join(outputDir, name));
      
      console.log(`✓ Generated ${name} (${size}x${size})`);
    } catch (error) {
      console.error(`✗ Failed to generate ${name}:`, error.message);
    }
  }

  console.log('\nApple touch icons generation complete!');
}

generateAppleTouchIcons().catch(console.error); 
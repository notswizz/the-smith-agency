const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 512, name: 'maskable-icon.png' }
];

const inputPath = path.join(__dirname, '../public/tsa.jpeg');
const outputDir = path.join(__dirname, '../public/icons');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function generateIcons() {
  console.log('Generating icons from tsa.jpeg...');
  
  for (const { size, name } of sizes) {
    try {
      await sharp(inputPath)
        .resize(size, size, {
          fit: 'cover',
          position: 'center'
        })
        .png()
        .toFile(path.join(outputDir, name));
      
      console.log(`✓ Generated ${name} (${size}x${size})`);
    } catch (error) {
      console.error(`✗ Failed to generate ${name}:`, error.message);
    }
  }
  
  // Generate favicon.png (32x32) - using PNG instead of ICO
  try {
    await sharp(inputPath)
      .resize(32, 32, {
        fit: 'cover',
        position: 'center'
      })
      .png()
      .toFile(path.join(__dirname, '../public/favicon.png'));
    
    console.log('✓ Generated favicon.png');
  } catch (error) {
    console.error('✗ Failed to generate favicon.png:', error.message);
  }
  
  console.log('Icon generation complete!');
}

generateIcons().catch(console.error); 
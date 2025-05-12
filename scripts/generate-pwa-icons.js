const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Install sharp if needed: npm install sharp

// Ensure the icons directory exists
const iconsDir = path.join(process.cwd(), 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create a simple hot pink icon with "TSA" text
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const backgroundColor = '#FF69B4'; // Hot pink color

// Function to create a base SVG with "TSA" text
function createBaseSVG(size) {
  const fontSize = Math.floor(size * 0.4);
  return `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="${backgroundColor}" />
      <text 
        x="50%" 
        y="50%" 
        font-family="Arial, sans-serif" 
        font-size="${fontSize}px" 
        font-weight="bold" 
        fill="white" 
        text-anchor="middle" 
        dominant-baseline="middle">TSA</text>
    </svg>
  `;
}

// Generate icons for each size
async function generateIcons() {
  try {
    // Generate regular icons
    for (const size of sizes) {
      const svgBuffer = Buffer.from(createBaseSVG(size));
      await sharp(svgBuffer)
        .png()
        .toFile(path.join(iconsDir, `icon-${size}x${size}.png`));
      console.log(`Generated icon-${size}x${size}.png`);
    }

    // Generate apple touch icon (180x180)
    const appleTouchSvg = Buffer.from(createBaseSVG(180));
    await sharp(appleTouchSvg)
      .png()
      .toFile(path.join(iconsDir, 'apple-touch-icon.png'));
    console.log('Generated apple-touch-icon.png');

    // Generate maskable icon (should have padding)
    const maskableSvg = Buffer.from(createBaseSVG(512));
    await sharp(maskableSvg)
      .png()
      .toFile(path.join(iconsDir, 'maskable-icon.png'));
    console.log('Generated maskable-icon.png');

    console.log('All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons(); 
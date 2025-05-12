const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Ensure the splash directory exists
const splashDir = path.join(process.cwd(), 'public', 'splash');
if (!fs.existsSync(splashDir)) {
  fs.mkdirSync(splashDir, { recursive: true });
}

// Common iPhone and iPad splash screen sizes
const splashScreens = [
  { width: 1125, height: 2436, name: 'apple-splash-1125x2436.png' }, // iPhone X/XS
  { width: 1242, height: 2688, name: 'apple-splash-1242x2688.png' }, // iPhone XS Max
  { width: 828, height: 1792, name: 'apple-splash-828x1792.png' },   // iPhone XR
  { width: 1242, height: 2208, name: 'apple-splash-1242x2208.png' }, // iPhone 8 Plus
  { width: 750, height: 1334, name: 'apple-splash-750x1334.png' },   // iPhone 8
];

// Create a simple splash screen with "The Smith Agency" text
function createSplashSVG(width, height) {
  const fontSize = Math.floor(Math.min(width, height) * 0.06);
  const backgroundColor = '#FF69B4'; // Hot pink color
  
  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="${backgroundColor}" />
      <text 
        x="50%" 
        y="50%" 
        font-family="Arial, sans-serif" 
        font-size="${fontSize}px" 
        font-weight="bold" 
        fill="white" 
        text-anchor="middle" 
        dominant-baseline="middle">The Smith Agency</text>
    </svg>
  `;
}

// Generate splash screens
async function generateSplashScreens() {
  try {
    for (const screen of splashScreens) {
      const svgBuffer = Buffer.from(createSplashSVG(screen.width, screen.height));
      await sharp(svgBuffer)
        .png()
        .toFile(path.join(splashDir, screen.name));
      console.log(`Generated ${screen.name}`);
    }
    
    console.log('All splash screens generated successfully!');
  } catch (error) {
    console.error('Error generating splash screens:', error);
  }
}

generateSplashScreens(); 
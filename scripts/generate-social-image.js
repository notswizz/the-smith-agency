const sharp = require('sharp');
const path = require('path');

const inputPath = path.join(__dirname, '../public/tsa.jpeg');
const outputPath = path.join(__dirname, '../public/tsa-social.jpeg');

async function generateSocialImage() {
  console.log('Generating social media optimized TSA image...');
  
  try {
    // Create a 1200x630 image optimized for social media sharing
    await sharp(inputPath)
      .resize(1200, 630, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 90 })
      .toFile(outputPath);
    
    console.log('✓ Generated tsa-social.jpeg (1200x630) for social media sharing');
  } catch (error) {
    console.error('✗ Failed to generate social image:', error.message);
  }
}

generateSocialImage().catch(console.error); 
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateIcons() {
  try {
    const svgPath = path.join(__dirname, 'public', 'icon.svg');
    const svgBuffer = fs.readFileSync(svgPath);

    console.log('Generating PWA icons...');

    // Generate 192x192
    await sharp(svgBuffer)
      .resize(192, 192)
      .png()
      .toFile(path.join(__dirname, 'public', 'icon-192.png'));
    console.log('✓ Generated icon-192.png');

    // Generate 512x512
    await sharp(svgBuffer)
      .resize(512, 512)
      .png()
      .toFile(path.join(__dirname, 'public', 'icon-512.png'));
    console.log('✓ Generated icon-512.png');

    console.log('\nAll icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();

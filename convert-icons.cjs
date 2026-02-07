const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const iconSizes = [
  { name: 'mipmap-mdpi', size: 48 },
  { name: 'mipmap-hdpi', size: 72 },
  { name: 'mipmap-xhdpi', size: 96 },
  { name: 'mipmap-xxhdpi', size: 144 },
  { name: 'mipmap-xxxhdpi', size: 192 }
];

const splashSizes = [
  { name: 'drawable-mdpi', width: 320, height: 480 },
  { name: 'drawable-hdpi', width: 480, height: 800 },
  { name: 'drawable-xhdpi', width: 720, height: 1280 },
  { name: 'drawable-xxhdpi', width: 1080, height: 1920 },
  { name: 'drawable-xxxhdpi', width: 1440, height: 2560 }
];

async function convertIcons() {
  const iconPath = path.join(__dirname, 'resources', 'RENTMAN_Icon.svg');
  const splashPath = 'C:\\Users\\Natan\\Downloads\\stitch\\RentMant\\RENTMAN_Splash_Screen_Full.svg';
  const capacitorAndroidPath = path.join(__dirname, 'rentman-capacitor', 'android', 'app', 'src', 'main', 'res');

  // Create directories if they don't exist
  for (const size of iconSizes) {
    const dir = path.join(capacitorAndroidPath, size.name);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  for (const size of splashSizes) {
    const dir = path.join(capacitorAndroidPath, size.name);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // Convert icon to different sizes
  console.log('Converting icon...');
  for (const size of iconSizes) {
    const outputPath = path.join(capacitorAndroidPath, size.name, 'ic_launcher.png');
    const roundOutputPath = path.join(capacitorAndroidPath, size.name, 'ic_launcher_round.png');
    
    await sharp(iconPath)
      .resize(size.size, size.size)
      .png()
      .toFile(outputPath);
    
    await sharp(iconPath)
      .resize(size.size, size.size)
      .png()
      .toFile(roundOutputPath);
    
    console.log(`✓ Created ${size.name}/ic_launcher.png (${size.size}x${size.size})`);
  }

  // Convert splash screen to different sizes
  console.log('\nConverting splash screen...');
  if (fs.existsSync(splashPath)) {
    for (const size of splashSizes) {
      const outputPath = path.join(capacitorAndroidPath, size.name, 'splash.png');
      
      await sharp(splashPath)
        .resize(size.width, size.height, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .png()
        .toFile(outputPath);
      
      console.log(`✓ Created ${size.name}/splash.png (${size.width}x${size.height})`);
    }
  } else {
    console.log('⚠ Splash SVG not found at:', splashPath);
  }

  console.log('\n✅ Icon and splash conversion complete!');
}

convertIcons().catch(console.error);

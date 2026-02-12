const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const logoSvg = `<svg viewBox="0 0 500 120" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="neonGlowFull" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    <style>
      .rentman-text-full {
        fill: #00ff88;
        font-family: 'JetBrains Mono', 'Courier New', monospace;
        font-weight: 800;
        font-size: 82px;
        letter-spacing: -6px;
        filter: url(#neonGlowFull);
      }
    </style>
  </defs>
  <rect width="100%" height="100%" fill="#0a0a0a" />
  <text x="50%" y="85" text-anchor="middle" class="rentman-text-full">
    RENTMAN_
  </text>
</svg>`;

async function convertLogo() {
  console.log('🎨 Convirtiendo logo RENTMAN...');

  // Crear directorio de logos si no existe
  const logoDir = path.join(__dirname, 'public', 'logos');
  if (!fs.existsSync(logoDir)) {
    fs.mkdirSync(logoDir, { recursive: true });
  }

  // Logo para web (PNG transparente)
  await sharp(Buffer.from(logoSvg))
    .resize(500, 120)
    .png({ quality: 100 })
    .toFile(path.join(logoDir, 'rentman-logo.png'));
  console.log('✅ Logo web creado: public/logos/rentman-logo.png');

  // Logo para Android drawable (varios tamaños)
  const androidResDir = path.join(__dirname, 'android', 'app', 'src', 'main', 'res');
  
  const sizes = [
    { folder: 'drawable-mdpi', width: 300 },
    { folder: 'drawable-hdpi', width: 400 },
    { folder: 'drawable-xhdpi', width: 500 },
    { folder: 'drawable-xxhdpi', width: 600 },
    { folder: 'drawable-xxxhdpi', width: 750 }
  ];

  for (const size of sizes) {
    const drawableDir = path.join(androidResDir, size.folder);
    if (!fs.existsSync(drawableDir)) {
      fs.mkdirSync(drawableDir, { recursive: true });
    }

    const height = Math.round(size.width * 120 / 500);
    
    await sharp(Buffer.from(logoSvg))
      .resize(size.width, height)
      .png({ quality: 100 })
      .toFile(path.join(drawableDir, 'rentman_logo.png'));
    
    console.log(`✅ Logo Android creado: ${size.folder}/rentman_logo.png (${size.width}x${height})`);
  }

  console.log('✨ Logos convertidos exitosamente!');
}

convertLogo().catch(console.error);

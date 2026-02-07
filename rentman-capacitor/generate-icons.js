const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

// Leer el SVG del icono original
const iconSvg = `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
    <style>
      .rentman-text {
        fill: #00ff88;
        font-family: 'JetBrains Mono', 'Courier New', monospace;
        font-weight: 800;
        font-size: 32px;
        letter-spacing: -2px;
        filter: url(#neonGlow);
      }
    </style>
  </defs>
  <rect width="120" height="120" fill="#050505" rx="26"/>
  <text x="60" y="75" text-anchor="middle" class="rentman-text">R_</text>
</svg>`;

const sizes = {
  'mipmap-ldpi': 36,
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192
};

async function generateIcons() {
  for (const [folder, size] of Object.entries(sizes)) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Fondo negro
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, size, size);
    
    // Texto R_ en verde neón
    ctx.fillStyle = '#00ff88';
    ctx.font = `bold ${size * 0.45}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Sombra neón
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = size * 0.08;
    ctx.fillText('R_', size / 2, size / 2);
    
    const buffer = canvas.toBuffer('image/png');
    const dir = `android/app/src/main/res/${folder}`;
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(`${dir}/ic_launcher.png`, buffer);
    fs.writeFileSync(`${dir}/ic_launcher_foreground.png`, buffer);
    console.log(`Generated ${folder}/ic_launcher.png (${size}x${size})`);
  }
  
  console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);

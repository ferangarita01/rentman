const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

// Logo SVG completo
const logoSVG = `<svg viewBox="0 0 500 120" xmlns="http://www.w3.org/2000/svg">
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
  <rect width="100%" height="100%" fill="transparent" />
  <text x="50%" y="85" text-anchor="middle" class="rentman-text-full">
    RENTMAN_
  </text>
</svg>`;

async function convertLogoToPNG() {
  const canvas = createCanvas(1000, 240);
  const ctx = canvas.getContext('2d');
  
  // Fondo transparente
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Simular el texto del logo
  ctx.fillStyle = '#00ff88';
  ctx.font = 'bold 164px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Glow effect
  ctx.shadowColor = '#00ff88';
  ctx.shadowBlur = 15;
  ctx.fillText('RENTMAN_', 500, 120);
  
  // Save logo
  const logoPath = path.join(__dirname, 'public', 'logo-full.png');
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(logoPath, buffer);
  console.log('✅ Logo completo creado:', logoPath);
}

convertLogoToPNG().catch(console.error);

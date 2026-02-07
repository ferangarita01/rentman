const fs = require('fs');
const { createCanvas } = require('canvas');

const splashSizes = [
  { name: 'drawable', width: 480, height: 800 },
  { name: 'drawable-ldpi', width: 240, height: 400 },
  { name: 'drawable-mdpi', width: 320, height: 480 },
  { name: 'drawable-hdpi', width: 480, height: 800 },
  { name: 'drawable-xhdpi', width: 720, height: 1280 },
  { name: 'drawable-xxhdpi', width: 1080, height: 1920 },
  { name: 'drawable-xxxhdpi', width: 1440, height: 2560 }
];

function generateSplash(width, height, folder) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Fondo negro
  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, width, height);
  
  // Logo centrado
  const fontSize = Math.min(width, height) * 0.15;
  ctx.fillStyle = '#00ff88';
  ctx.font = `bold ${fontSize}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Sombra neón
  ctx.shadowColor = '#00ff88';
  ctx.shadowBlur = fontSize * 0.1;
  
  // Texto RENTMAN_
  ctx.fillText('RENTMAN_', width / 2, height / 2);
  
  const buffer = canvas.toBuffer('image/png');
  const dir = `android/app/src/main/res/${folder}`;
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(`${dir}/splash.png`, buffer);
  console.log(`Generated ${folder}/splash.png (${width}x${height})`);
}

// Generar todas las orientaciones y densidades
const orientations = ['', '-land', '-port'];
const modes = ['', '-night'];

splashSizes.forEach(({ name, width, height }) => {
  orientations.forEach(orientation => {
    modes.forEach(mode => {
      const folder = name.replace('drawable', `drawable${orientation}${mode}`);
      const w = orientation === '-land' ? height : width;
      const h = orientation === '-land' ? width : height;
      generateSplash(w, h, folder);
    });
  });
});

console.log('\nAll splash screens generated successfully!');

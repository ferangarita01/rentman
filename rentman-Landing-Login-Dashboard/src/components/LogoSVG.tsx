
import React from 'react';

export const getLogoSVGCode = (withCursor: boolean = true) => `
<svg viewBox="0 0 500 120" xmlns="http://www.w3.org/2000/svg">
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
    RENTMAN${withCursor ? '_' : ''}
  </text>
</svg>`.trim();

export const getIconSVGCode = (withCursor: boolean = true) => `
<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="neonGlowIcon" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="15" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    <filter id="circleGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="5" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    <style>
      .rentman-icon-text {
        fill: #00ff88;
        font-family: 'JetBrains Mono', 'Courier New', monospace;
        font-weight: 800;
        font-size: 240px;
        filter: url(#neonGlowIcon);
        dominant-baseline: central;
      }
      .rentman-icon-circle {
        stroke: #00ff88;
        stroke-width: 4;
        stroke-opacity: 0.3;
        fill: #00ff88;
        fill-opacity: 0.05;
        filter: url(#circleGlow);
      }
    </style>
  </defs>
  <rect width="512" height="512" fill="transparent" />
  <circle cx="256" cy="256" r="200" class="rentman-icon-circle" />
  <text x="256" y="256" text-anchor="middle" class="rentman-icon-text">
    R${withCursor ? '_' : ''}
  </text>
</svg>`.trim();

export const getSplashSVGCode = () => `
<svg viewBox="0 0 360 640" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="splashGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="5" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    <pattern id="scanlines" width="100%" height="4" patternUnits="userSpaceOnUse">
      <rect width="100%" height="2" fill="black" fill-opacity="0.05" />
    </pattern>
    <style>
      .mono { font-family: 'JetBrains Mono', monospace; font-weight: bold; }
      .brand-title { fill: #00ff88; font-size: 24px; letter-spacing: 4px; filter: url(#splashGlow); }
      .brand-sub { fill: #00ff88; fill-opacity: 0.4; font-size: 9px; letter-spacing: 2px; }
      .bottom-protocol { fill: #00ff88; fill-opacity: 0.3; font-size: 10px; letter-spacing: 4px; }
      .icon-r { fill: #00ff88; font-size: 60px; filter: url(#splashGlow); }
      .icon-circle { stroke: #00ff88; stroke-width: 1; stroke-opacity: 0.2; fill: #00ff88; fill-opacity: 0.05; }
    </style>
  </defs>
  
  <rect width="360" height="640" fill="#000000" />
  
  <!-- Status Bar Sim -->
  <text x="20" y="25" fill="#00ff88" fill-opacity="0.4" font-size="10" class="mono">12:00</text>
  
  <!-- Central Icon -->
  <g transform="translate(180, 260)">
    <circle r="72" class="icon-circle" />
    <text text-anchor="middle" y="20" class="mono icon-r">R_</text>
  </g>
  
  <!-- Central Brand -->
  <g transform="translate(180, 400)">
    <text text-anchor="middle" class="mono brand-title">RENTMAN_</text>
    <text text-anchor="middle" y="25" class="mono brand-sub">INITIAL_LOAD_SEQUENCER</text>
  </g>
  
  <!-- Bottom Branding -->
  <text x="180" y="580" text-anchor="middle" class="mono bottom-protocol">RENTMAN_</text>
  
  <!-- Scanline Overlay -->
  <rect width="360" height="640" fill="url(#scanlines)" pointer-events="none" />
</svg>`.trim();

interface LogoSVGProps {
  id?: string;
  type?: 'full' | 'icon' | 'splash';
}

const LogoSVG: React.FC<LogoSVGProps> = ({ id, type = 'full' }) => {
  let svgCode = '';
  if (type === 'full') svgCode = getLogoSVGCode(true);
  else if (type === 'icon') svgCode = getIconSVGCode(true);
  else if (type === 'splash') svgCode = getSplashSVGCode();

  return (
    <div 
      id={id}
      dangerouslySetInnerHTML={{ __html: svgCode }} 
      className="w-full h-auto flex justify-center"
    />
  );
};

export default LogoSVG;

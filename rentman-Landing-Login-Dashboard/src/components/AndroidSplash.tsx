
import React, { useState, useEffect } from 'react';

interface AndroidSplashProps {
  id: string;
  mode: 'full' | 'icon';
}

const AndroidSplash: React.FC<AndroidSplashProps> = ({ id, mode }) => {
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible(v => !v);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // El icono de Android 12+ debe estar contenido en un círculo de 108dp.
  // En una exportación de 512px, el área del icono (safe zone) debería ser de aproximadamente 320px-384px.
  
  if (mode === 'icon') {
    return (
      <div 
        id={id} 
        className="bg-[#000000] flex items-center justify-center overflow-hidden"
        style={{ width: '512px', height: '512px' }}
      >
        {/* Contenedor del icono que simula el área de 108dp de Android */}
        <div className="w-[320px] h-[320px] border border-[#00ff88]/10 rounded-full flex items-center justify-center bg-[#00ff88]/5 relative">
          <h1 className="text-[#00ff88] text-[180px] font-bold mono-text tracking-tighter leading-none drop-shadow-[0_0_30px_rgba(0,255,136,0.5)]">
            R
            <span className={`${cursorVisible ? 'opacity-100' : 'opacity-0'} -ml-4`}>_</span>
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div 
      id={id}
      className="relative w-[360px] h-[640px] bg-[#000000] overflow-hidden border border-[#00ff88]/10 shadow-2xl scale-[0.8] origin-top"
      style={{ minWidth: '360px', height: '640px' }}
    >
      {/* Simulation of System Status Bar */}
      <div className="absolute top-0 left-0 w-full h-6 px-4 flex justify-between items-center z-10 opacity-40">
        <span className="text-[#00ff88] text-[10px] font-bold mono-text">12:00</span>
        <div className="flex gap-1 items-center">
          <span className="material-symbols-outlined text-[10px]">network_cell</span>
          <span className="material-symbols-outlined text-[10px]">wifi</span>
          <span className="material-symbols-outlined text-[10px]">battery_full</span>
        </div>
      </div>

      {/* Main Content (Android Splash Area) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {/* Área del icono: 108dp simulado */}
        <div className="size-36 border border-[#00ff88]/20 flex items-center justify-center rounded-full bg-[#00ff88]/5 relative">
          <div className="absolute inset-0 rounded-full border border-[#00ff88]/10 animate-pulse opacity-20" />
          <h1 className="text-[#00ff88] text-6xl font-bold mono-text tracking-tighter drop-shadow-[0_0_15px_rgba(0,255,136,0.5)]">
            R
            <span className={`${cursorVisible ? 'opacity-100' : 'opacity-0'} -ml-1`}>_</span>
          </h1>
        </div>
        
        <div className="mt-12 text-center">
          <h2 className="text-[#00ff88] text-2xl font-bold mono-text tracking-[0.2em]">RENTMAN</h2>
          <p className="text-[#00ff88]/40 text-[9px] mono-text mt-2 uppercase tracking-widest">Initial_Protocol_Load</p>
        </div>
      </div>

      {/* Brand area (Bottom Branding Area of Android) */}
      <div className="absolute bottom-12 w-full text-center">
        <p className="text-[#00ff88]/30 text-[10px] mono-text uppercase tracking-[0.4em]">
          RENTMAN_
        </p>
        <div className="mt-4 flex justify-center gap-1.5">
          <div className="size-1 bg-[#00ff88] animate-bounce [animation-delay:-0.3s] rounded-full" />
          <div className="size-1 bg-[#00ff88] animate-bounce [animation-delay:-0.15s] rounded-full" />
          <div className="size-1 bg-[#00ff88] animate-bounce rounded-full" />
        </div>
      </div>

      {/* Scanline overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px]" />
    </div>
  );
};

export default AndroidSplash;

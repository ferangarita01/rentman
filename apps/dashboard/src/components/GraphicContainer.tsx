
import React, { useState, useEffect } from 'react';

const GraphicContainer: React.FC = () => {
  const [bootLogs, setBootLogs] = useState<string[]>([]);
  const [cursorVisible, setCursorVisible] = useState(true);

  // Simular logs de terminal en el fondo
  useEffect(() => {
    const logs = [
      "INITIALIZING RENTMAN_PROTOCOL v2.4.0...",
      "CONNECTING TO ETHEREUM_MAINNET_NODE...",
      "LOADING NEURAL_TASK_ROUTING_ENGINE...",
      "VERIFYING AGENT_IDENTITY: [AUTH_OK]",
      "SCANNING FOR AVAILABLE GIG_CONTRACTS...",
      "LOCAL_NODE_ID: 0x77ae...99bf",
      "ENCRYPTING SESSION_TUNNEL [AES-256]...",
      "READY FOR COMMAND INPUT.",
      "FETCHING REWARD_STATS...",
      "SYSTEM_HEALTH: NOMINAL",
      "SYNCING_LEDGER_DATA...",
      "LISTENING ON PORT 8080..."
    ];
    
    let i = 0;
    const interval = setInterval(() => {
      setBootLogs(prev => [...prev.slice(-15), logs[i % logs.length]]);
      i++;
    }, 800);

    const cursorInterval = setInterval(() => {
      setCursorVisible(v => !v);
    }, 500);

    return () => {
      clearInterval(interval);
      clearInterval(cursorInterval);
    };
  }, []);

  return (
    <div 
      id="feature-graphic-container"
      className="relative w-[1024px] h-[500px] bg-[#020202] overflow-hidden border border-[#00ff88]/30 shadow-[0_0_60px_rgba(0,255,136,0.1)] group rounded-lg"
    >
      
      {/* 1. Terminal Window Header */}
      <div className="absolute top-0 left-0 w-full h-8 bg-[#111] border-b border-[#00ff88]/20 flex items-center px-4 z-50">
        <div className="flex gap-1.5 mr-4">
          <div className="size-2.5 rounded-full bg-red-500/50" />
          <div className="size-2.5 rounded-full bg-yellow-500/50" />
          <div className="size-2.5 rounded-full bg-green-500/50" />
        </div>
        <div className="text-[#00ff88]/40 text-[10px] mono-text uppercase tracking-widest flex-1 text-center">
          root@rentman: ~/deployment/protocol_v2
        </div>
        <span className="material-symbols-outlined text-[#00ff88]/30 text-sm">terminal</span>
      </div>

      {/* 2. Background Log Stream */}
      <div className="absolute inset-0 pt-10 px-8 z-0 opacity-20 pointer-events-none">
        <div className="mono-text text-[11px] text-[#00ff88] space-y-1">
          {bootLogs.map((log, idx) => (
            <div key={idx} className="flex gap-2">
              <span className="opacity-40">[{new Date().toLocaleTimeString()}]</span>
              <span>{log}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. CRT Scanline Overlay */}
      <div className="absolute inset-0 z-40 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_2px,3px_100%]" />

      {/* 4. Main Content Area */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full">
        
        {/* Decorative ASCII borders */}
        <div className="text-[#00ff88]/20 mono-text text-[10px] mb-4">
          +-----------------------------------------------------------+
        </div>

        {/* Central Logo - Targeted for logo-only export */}
        <div id="logo-capture-area" className="relative text-center p-8 bg-[#020202]">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 text-[10px] text-[#00ff88]/60 mono-text bg-black px-2">
            ST_TERMINAL_INTERFACE
          </div>
          
          <h1 className="text-[#00ff88] text-9xl font-bold tracking-tighter mono-text leading-none drop-shadow-[0_0_15px_rgba(0,255,136,0.6)]">
            RENTMAN
            <span className={`${cursorVisible ? 'opacity-100' : 'opacity-0'} ml-2`}>_</span>
          </h1>

          <div className="mt-6 flex items-center justify-center gap-4">
            <div className="h-px w-20 bg-[#00ff88]/30" />
            <p className="text-[#00ff88]/80 text-sm mono-text uppercase tracking-[0.3em]">
              Autonomous_Agent_Relay
            </p>
            <div className="h-px w-20 bg-[#00ff88]/30" />
          </div>
        </div>

        <div className="text-[#00ff88]/20 mono-text text-[10px] mt-4">
          +-----------------------------------------------------------+
        </div>

        {/* Status Bar */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-12 text-[#00ff88]/60 text-xs mono-text">
          <div className="flex items-center gap-2">
            <span className="opacity-40">REWARDS:</span>
            <span className="text-[#00ff88] font-bold">$450,231.02</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="opacity-40">UPTIME:</span>
            <span className="text-[#00ff88] font-bold">99.999%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="opacity-40">NODES:</span>
            <span className="text-[#00ff88] font-bold">1,024 ACTIVE</span>
          </div>
        </div>
      </div>

      {/* 5. HUD Corner Details */}
      <div className="absolute bottom-6 left-6 text-[#00ff88]/40 mono-text text-[9px] uppercase">
        Ver_2.4.0 // build_7721
      </div>
      
      <div className="absolute bottom-6 right-6 text-[#00ff88]/40 mono-text text-[9px] uppercase flex items-center gap-2">
        <div className="size-1.5 bg-[#00ff88] animate-pulse rounded-full" />
        SECURE_CONNECTION_STABLISHED
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .mono-text { font-family: 'JetBrains Mono', monospace; }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}} />
    </div>
  );
};

export default GraphicContainer;

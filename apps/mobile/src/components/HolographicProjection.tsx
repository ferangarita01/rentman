
import React from 'react';
import { Package, ShieldCheck, Wrench, Zap, Radio } from 'lucide-react';

interface HolographicProjectionProps {
    type: string;
}

export default function HolographicProjection({ type }: HolographicProjectionProps) {
    // Determine icon based on task type
    const getIcon = () => {
        switch (type) {
            case 'delivery':
                return <Package className="w-16 h-16 text-[#00ff88]" strokeWidth={1} />;
            case 'verification':
                return <ShieldCheck className="w-16 h-16 text-[#00ff88]" strokeWidth={1} />;
            case 'repair':
                return <Wrench className="w-16 h-16 text-[#00ff88]" strokeWidth={1} />;
            default:
                return <Zap className="w-16 h-16 text-[#00ff88]" strokeWidth={1} />;
        }
    };

    const COLORS = {
        primary: "#00ff88",
    };

    return (
        <div className="relative w-full h-32 bg-[#050505] overflow-hidden flex items-center justify-center border-t border-b border-[#00ff88]/10">

            {/* Background Grid Effect */}
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage: `linear-gradient(${COLORS.primary}1A 1px, transparent 1px), linear-gradient(90deg, ${COLORS.primary}1A 1px, transparent 1px)`,
                    backgroundSize: '20px 20px',
                    perspective: '500px',
                    transform: 'rotateX(60deg) scale(2)',
                    opacity: 0.2
                }}
            ></div>

            {/* Central Hologram Container */}
            <div className="relative z-10 flex flex-col items-center justify-end h-full pb-4">

                {/* Floating Icon with Glitch Effect */}
                <div
                    className="mb-2 relative"
                    style={{
                        animation: 'hologram-float 4s ease-in-out infinite, hologram-flicker 5s infinite',
                        filter: `drop-shadow(0 0 10px ${COLORS.primary})`
                    }}
                >
                    {getIcon()}

                    {/* Scanline passing through icon */}
                    <div
                        className="absolute left-0 right-0 h-1 bg-white/50 blur-[1px]"
                        style={{ animation: 'hologram-scan 2s linear infinite' }}
                    ></div>
                </div>

                {/* Projector Base Light */}
                <div
                    className="w-12 h-4 rounded-[100%] blur-md"
                    style={{
                        backgroundColor: COLORS.primary,
                        opacity: 0.4,
                        transform: 'scaleX(2)'
                    }}
                ></div>

                {/* Particle dust (simulated) */}
                <div className="absolute bottom-4 w-1 h-1 bg-white rounded-full animate-ping opacity-20" style={{ left: '40%', animationDuration: '3s' }}></div>
                <div className="absolute bottom-6 w-0.5 h-0.5 bg-white rounded-full animate-ping opacity-20" style={{ right: '40%', animationDuration: '2.5s' }}></div>

                {/* Status Text */}
                <div className="absolute top-2 right-2 flex items-center gap-1">
                    <Radio className="w-3 h-3 text-[#00ff88] animate-pulse" />
                    <span className="text-[8px] font-mono text-[#00ff88]/60 uppercase tracking-widest">PROJ_ACTIVE</span>
                </div>

            </div>

            {/* Top Vignette for depth */}
            <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-[#050505] to-transparent pointer-events-none"></div>
        </div>
    );
}

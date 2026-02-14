
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";

interface Star {
    x: number;
    y: number;
    z: number;
    size: number;
    color: string;
    opacity: number;
    vx: number;
    vy: number;
    baseX: number;
    baseY: number;
}

const COSMIC_COLORS = ['#ffffff', '#ffe9c4', '#d4e6ff', '#fff4f4', '#e3fffa', '#fbcfe8'];

const SpaceBackground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [insight, setInsight] = useState<string>("Toca la singularidad para escuchar a las estrellas...");
    const [loading, setLoading] = useState(false);
    const starsRef = useRef<Star[]>([]);
    const mouseRef = useRef({ x: 0, y: 0, isActive: false });
    const pulseRef = useRef({ x: 0, y: 0, radius: 0, active: false });

    const initStars = (width: number, height: number) => {
        const count = Math.floor((width * height) / 1500);
        const stars: Star[] = [];
        for (let i = 0; i < count; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            stars.push({
                x,
                y,
                baseX: x,
                baseY: y,
                z: Math.random() * 3 + 1,
                size: Math.random() * 2 + 0.5,
                color: COSMIC_COLORS[Math.floor(Math.random() * COSMIC_COLORS.length)],
                opacity: Math.random() * 0.8 + 0.2,
                vx: (Math.random() - 0.5) * 0.1,
                vy: (Math.random() - 0.5) * 0.1,
            });
        }
        starsRef.current = stars;
    };

    const getCosmicInsight = async () => {
        if (loading) return;
        setLoading(true);
        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "fallback_key"; // User should provide this
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({
                model: "gemini-pro",
                systemInstruction: "Eres una galaxia consciente compartiendo sabiduría con un viajero. Sé misterioso, bello y profundo. Máximo 15 palabras."
            });

            const result = await model.generateContent("Dame una observación cósmica profunda, poética y muy breve sobre el universo, el espacio o el tiempo en español.");
            const response = await result.response;
            setInsight(response.text() || "El vacío permanece en silencio hoy.");
        } catch (error) {
            console.error("Error cósmico:", error);
            setInsight("Las estrellas colisionan en silencio...");
        } finally {
            setLoading(false);
        }
    };

    const handleCanvasClick = (e: React.MouseEvent) => {
        pulseRef.current = {
            x: e.clientX,
            y: e.clientY,
            radius: 0,
            active: true
        };
        getCosmicInsight();
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initStars(canvas.width, canvas.height);
        };

        window.addEventListener('resize', resize);
        resize();

        let animationFrameId: number;

        const render = () => {
            ctx.fillStyle = '#020205';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const { x: mx, y: my } = mouseRef.current;
            const pulse = pulseRef.current;

            if (pulse.active) {
                pulse.radius += 20;
                if (pulse.radius > Math.max(canvas.width, canvas.height) * 1.5) {
                    pulse.active = false;
                }
            }

            starsRef.current.forEach(star => {
                star.x += star.vx + (mx - canvas.width / 2) * 0.0005 * star.z;
                star.y += star.vy + (my - canvas.height / 2) * 0.0005 * star.z;

                if (star.x < 0) star.x = canvas.width;
                if (star.x > canvas.width) star.x = 0;
                if (star.y < 0) star.y = canvas.height;
                if (star.y > canvas.height) star.y = 0;

                const dx = star.x - mx;
                const dy = star.y - my;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 200) {
                    const force = (200 - dist) / 2000;
                    star.x += dx * force;
                    star.y += dy * force;
                }

                if (pulse.active) {
                    const pdx = star.x - pulse.x;
                    const pdy = star.y - pulse.y;
                    const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
                    const diff = Math.abs(pdist - pulse.radius);
                    if (diff < 60) {
                        const pforce = (60 - diff) * 0.15;
                        star.x += (pdx / pdist) * pforce;
                        star.y += (pdy / pdist) * pforce;
                    }
                }

                ctx.beginPath();
                const flicker = Math.sin(Date.now() * 0.002 * star.z) * 0.3 + 0.7;
                ctx.arc(star.x, star.y, star.size * (dist < 100 ? 1.5 : 1), 0, Math.PI * 2);
                ctx.fillStyle = star.color;

                const alpha = Math.min(1, star.opacity * flicker + (dist < 150 ? 0.4 : 0));
                ctx.globalAlpha = alpha;

                if (dist < 120) {
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = star.color;
                }

                ctx.fill();
                ctx.shadowBlur = 0;
                ctx.globalAlpha = 1;
            });

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current = { x: e.clientX, y: e.clientY, isActive: true };
        };

        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div className="absolute inset-0 w-full h-full bg-[#020205] overflow-hidden pointer-events-auto">
            {/* Nebulosas Ambientales */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-purple-900/15 blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-900/15 blur-[100px] animate-pulse [animation-delay:3s]"></div>
                <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] rounded-full bg-emerald-900/5 blur-[150px]"></div>
            </div>

            {/* Canvas Principal */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 z-10"
                onClick={handleCanvasClick}
            />

            {/* Núcleo Interactivo (Singularidad) */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none">
                <div
                    className={`w-24 h-24 rounded-full transition-all duration-1000 relative pointer-events-auto cursor-pointer
            ${loading ? 'scale-75 blur-md' : 'hover:scale-110'}`}
                    style={{
                        background: 'radial-gradient(circle, #ffffff 0%, #818cf8 30%, #312e81 60%, transparent 80%)',
                        boxShadow: loading ? '0 0 20px #818cf8' : '0 0 100px 30px rgba(129, 140, 248, 0.3)'
                    }}
                    onClick={getCosmicInsight}
                >
                    <div className="absolute inset-[-5px] rounded-full border border-white/10 animate-spin [animation-duration:15s]"></div>
                    <div className={`absolute inset-0 m-auto w-1 h-1 bg-white rounded-full shadow-[0_0_20px_10px_white] transition-opacity duration-500 ${loading ? 'opacity-100 animate-ping' : 'opacity-50'}`}></div>
                </div>

                {/* Panel de Información */}
                <div className="mt-8 max-w-sm text-center p-4 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl transition-all duration-700 pointer-events-auto hover:bg-black/60">
                    <p className={`text-sm font-light italic leading-tight tracking-wide transition-all duration-500 ${loading ? 'opacity-20 scale-95 blur-sm' : 'opacity-100 scale-100'}`}>
                        "{insight}"
                    </p>
                    <div className="mt-2 text-[8px] opacity-30 tracking-[0.2em] uppercase">
                        Sincronización Cuántica: {loading ? 'Procesando...' : 'Estable'}
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes pulse-nebula {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.25; transform: scale(1.05); }
        }
        .animate-pulse {
          animation: pulse-nebula 10s infinite ease-in-out;
        }
      `}</style>
        </div>
    );
};

export default SpaceBackground;

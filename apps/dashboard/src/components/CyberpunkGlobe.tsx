
import React, { useMemo, useEffect, useState, useRef, useCallback } from 'react';
import Globe from 'react-globe.gl';
import * as THREE from 'three';

// Neon Theme Constants
const NEON_GREEN = '#00ff88';
const HOLOGRAPHIC_BLUE = '#00f3ff';

interface Task {
    id: string;
    title: string;
    status: string;
    budget_amount: number;
    agent_id?: string;
    lat?: number;
    lng?: number;
    type?: string;
}

const getPseudoLocation = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const lat = (hash % 140) - 70;
    const lng = (hash * 13 % 360) - 180;
    return { lat, lng };
};

// Generar textura de icono de satélite real
const createSatelliteTexture = (color: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    // Cuerpo central
    ctx.strokeRect(24, 24, 16, 16);
    ctx.fillStyle = color;
    ctx.fillRect(28, 28, 8, 8);

    // Paneles laterales
    ctx.beginPath();
    ctx.moveTo(8, 28); ctx.lineTo(24, 28);
    ctx.moveTo(8, 36); ctx.lineTo(24, 36);
    ctx.moveTo(8, 28); ctx.lineTo(8, 36); // Panel Izq

    ctx.moveTo(40, 28); ctx.lineTo(56, 28);
    ctx.moveTo(40, 36); ctx.lineTo(56, 36);
    ctx.moveTo(56, 28); ctx.lineTo(56, 36); // Panel Der

    // Antenas
    ctx.moveTo(32, 24); ctx.lineTo(32, 12);
    ctx.moveTo(28, 12); ctx.lineTo(36, 12);

    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
};

// Mapeo de iconos por tipo de misión
const getMissionIcon = (type: string = 'general') => {
    const t = type.toLowerCase();
    switch (t) {
        case 'delivery':
            return '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-5l-4-4h-3v10"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>';
        case 'digital':
            return '<path d="M2 12a10 10 0 0 1 18-6"/><path d="M5 15a7 7 0 0 1 12-4"/><path d="M8 18a4 4 0 0 1 6-3"/><path d="M11 21a1 1 0 0 1 0-2"/><path d="M12 2a12 12 0 0 0-10 16"/><path d="M22 12a10 10 0 0 0-10-10"/>';
        case 'cleaning':
            return '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>';
        case 'maintenance':
            return '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.77 3.77Z"/>';
        case 'verification':
            return '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/>';
        case 'security':
            return '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>';
        case 'logistics':
            return '<path d="M16.5 9.4 7.5 4.21"/><path d="m21 16-9 5.25L3 16V7l9-5.25L21 7v9Z"/><path d="M3.27 6.96 12 12.01l8.73-5.05"/><path d="M12 22.08V12"/>';
        case 'general':
        default:
            return '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.27a1 1 0 0 0 0 1.83l8.57 4.09a2 2 0 0 0 1.66 0l8.57-4.09a1 1 0 0 0 0-1.83Z"/><path d="m12.83 14.18a2 2 0 0 0-1.66 0L2.6 18.27a1 1 0 0 0 0 1.83l8.57 4.09a2 2 0 0 0 1.66 0l8.57-4.09a1 1 0 0 0 0-1.83Z"/><path d="m20.65 7.18-7.82 3.73a2 2 0 0 1-1.66 0L3.35 7.18"/>';
    }
};

interface CyberpunkGlobeProps {
    missions: Task[];
    onNodeClick?: (task: Task) => void;
    scrollOffset?: number;
    focusNode?: { lat: number; lng: number } | null;
}

const CyberpunkGlobe: React.FC<CyberpunkGlobeProps> = ({ missions, onNodeClick, scrollOffset = 0, focusNode = null }) => {
    const globeEl = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [points, setPoints] = useState<any[]>([]);
    const [rings, setRings] = useState<any[]>([]);
    const [pings, setPings] = useState<any[]>([]);
    const [hoverNode, setHoverNode] = useState<any>(null);
    const lastSectorRef = useRef(0);

    // Dimension handling
    useEffect(() => {
        if (!containerRef.current) return;
        const updateDims = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight
                });
            }
        };
        updateDims();
        window.addEventListener('resize', updateDims);
        return () => window.removeEventListener('resize', updateDims);
    }, []);

    // Data handling
    useEffect(() => {
        const newPoints = missions.map(task => {
            const loc = task.lat && task.lng
                ? { lat: task.lat, lng: task.lng }
                : getPseudoLocation(task.id);

            return {
                ...task,
                uniqueId: task.id,
                lat: loc.lat,
                lng: loc.lng,
                size: task.status === 'ASSIGNED' ? 0.5 : 0.3,
                color: task.status === 'ASSIGNED' ? NEON_GREEN : HOLOGRAPHIC_BLUE,
                label: `${task.title} - $${task.budget_amount}`,
                globeStatus: task.status
            };
        });
        setPoints(newPoints);

        const activeRings = newPoints
            .filter(p => p.globeStatus === 'OPEN' || p.globeStatus === 'ASSIGNED')
            .map(p => ({
                lat: p.lat,
                lng: p.lng,
                maxR: 4,
                propagationSpeed: 2,
                repeatPeriod: 1000,
                color: p.color
            }));
        setRings(activeRings);
    }, [missions]);

    // Arcs (Desactivados para una vista más limpia según feedback)
    const arcs = useMemo(() => [], []);

    // HTML Markers Data
    const htmlData = useMemo(() => {
        return [...points, ...(hoverNode ? [{ ...hoverNode, isHover: true }] : [])];
    }, [points, hoverNode]);

    // Manual Shield & Animation Loop
    useEffect(() => {
        const globe = globeEl.current;
        if (!globe) return;
        const scene = globe.scene();
        if (!scene) return;

        // Cleanup
        const existing = scene.getObjectByName('hexShield');
        if (existing) scene.remove(existing);

        // Create Hex Shield (Rejillas)
        const geometry = new THREE.IcosahedronGeometry(105, 2);
        const material = new THREE.MeshBasicMaterial({
            color: HOLOGRAPHIC_BLUE,
            wireframe: true,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
        });
        const shield = new THREE.Mesh(geometry, material);
        shield.name = 'hexShield';
        scene.add(shield);

        // --- NEW: Orbital Satellite Swarm ---
        const satelliteGroup = new THREE.Group();
        satelliteGroup.name = 'orbitalSwarm';
        const satCount = 100; // Un poco menos para mejorar rendimiento con modelos más complejos

        for (let i = 0; i < satCount; i++) {
            const satColor = Math.random() > 0.5 ? NEON_GREEN : HOLOGRAPHIC_BLUE;
            const texture = createSatelliteTexture(satColor);

            if (!texture) continue;

            const material = new THREE.SpriteMaterial({
                map: texture,
                transparent: true,
                opacity: 0.9,
                color: 0xffffff // Mantener colores de textura
            });

            const sprite = new THREE.Sprite(material);

            // Tamaño mucho más grande para que se vea el ICONO (8 unidades)
            sprite.scale.set(8, 8, 1);

            // Random orbit
            const radius = 140 + Math.random() * 60;
            const phi = Math.acos(-1 + (2 * i) / satCount);
            const theta = Math.sqrt(satCount * Math.PI) * phi;

            sprite.position.setFromSphericalCoords(radius, phi, theta);

            (sprite as any).userData = {
                speed: 0.0003 + Math.random() * 0.0006,
                axis: new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize(),
                satRadius: radius,
                phi: phi,
                theta: theta
            };

            satelliteGroup.add(sprite);
        }
        scene.add(satelliteGroup);
        // ------------------------------------

        let frameId: number;
        const animate = () => {
            if (shield) {
                shield.rotation.y += 0.001;
                shield.rotation.z += 0.0005;
            }

            if (satelliteGroup) {
                satelliteGroup.rotation.y += 0.0002;
                satelliteGroup.children.forEach(sat => {
                    const data = sat.userData;
                    sat.rotateOnAxis(data.axis, data.speed);
                });
            }

            frameId = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            cancelAnimationFrame(frameId);
            if (scene && shield) scene.remove(shield);
        };
    }, []);

    // Controls and POVs
    useEffect(() => {
        const globe = globeEl.current;
        if (!globe) return;

        globe.controls().autoRotate = false;
        globe.controls().enableZoom = true;
        globe.controls().minDistance = 150;
        globe.controls().maxDistance = 800;

        if (focusNode) {
            globe.pointOfView({ lat: focusNode.lat, lng: focusNode.lng, altitude: 1.5 }, 1000);
        } else {
            const baseAltitude = 2.5;
            const altitudeOffset = (scrollOffset % 2000) / 4000;
            globe.pointOfView({ altitude: baseAltitude - altitudeOffset }, 400);
        }
    }, [focusNode, scrollOffset]);

    // Sector Pings
    useEffect(() => {
        const currentSector = Math.floor(scrollOffset / 500);
        if (currentSector !== lastSectorRef.current) {
            lastSectorRef.current = currentSector;
            const newPing = { lat: 90, lng: 0, maxR: 100, propagationSpeed: 5, repeatPeriod: 0, color: NEON_GREEN };
            setPings([newPing]);
            setTimeout(() => setPings([]), 1000);
        }
    }, [scrollOffset]);

    const handleNodeClick = useCallback((d: any) => {
        if (onNodeClick) {
            const originalTask = missions.find(m => m.id === d.id);
            if (originalTask) onNodeClick(originalTask);
        }
    }, [missions, onNodeClick]);

    return (
        <div ref={containerRef} className="absolute inset-0 z-0 opacity-100 pointer-events-auto w-full h-full flex items-center justify-center">
            {dimensions.width > 0 && (
                <Globe
                    ref={globeEl}
                    width={dimensions.width}
                    height={dimensions.height}
                    globeImageUrl="https://unpkg.com/three-globe/example/img/earth-dark.jpg"
                    bumpImageUrl="https://unpkg.com/three-globe/example/img/earth-topology.png"
                    backgroundColor="rgba(0,0,0,0)" // Transparent background
                    showAtmosphere={true}
                    atmosphereColor={NEON_GREEN}
                    atmosphereAltitude={0.17 + (scrollOffset / 10000)}

                    pointsData={points}
                    pointAltitude={0.07}
                    pointColor="color"
                    pointRadius="size"
                    pointsMerge={true}

                    ringsData={[...rings, ...pings]}
                    ringColor="color"
                    ringMaxRadius="maxR"
                    ringPropagationSpeed="propagationSpeed"
                    ringRepeatPeriod="repeatPeriod"

                    arcsData={arcs}
                    arcColor="color"
                    arcDashLength={0.4}
                    arcDashGap={4}
                    arcDashAnimateTime={2000}
                    arcStroke={0.5}

                    onPointHover={(point: any) => setHoverNode(point)}
                    htmlElementsData={htmlData}
                    htmlAltitude={0.01}
                    htmlElement={(d: any) => {
                        const el = document.createElement('div');
                        if (d.isHover) {
                            el.innerHTML = `
                                <div style="background: rgba(0, 5, 5, 0.9); border: 1px solid ${NEON_GREEN}; padding: 10px; pointer-events: none; transform: translate(20px, -50%); font-family: monospace; font-size: 10px; color: white; box-shadow: 0 0 20px ${NEON_GREEN}44; min-width: 150px; backdrop-filter: blur(5px);">
                                    <div style="color: ${NEON_GREEN}; border-bottom: 1px solid ${NEON_GREEN}44; padding-bottom: 4px; margin-bottom: 4px; font-weight: bold;">NODE_SCAN: ${d.id.substring(0, 8)}</div>
                                    <div style="margin-bottom: 2px;">STATUS: ${d.globeStatus}</div>
                                    <div style="margin-bottom: 2px;">BUDGET: $${d.budget_amount}</div>
                                    <div style="margin-bottom: 4px; color: ${NEON_GREEN}; font-size: 8px;">[ENCRYPTED_SIGNAL_ACTIVE]</div>
                                </div>
                            `;
                            return el;
                        }
                        el.innerHTML = `
                            <div style="cursor: pointer; pointer-events: auto; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
                                <div style="width: 24px; height: 24px; background: rgba(0, 5, 5, 0.8); border: 1px solid ${d.color}; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px ${d.color}; animation: pulse 2s infinite;">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${d.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        ${getMissionIcon(d.type)}
                                    </svg>
                                </div>
                                <div style="width: 1px; height: 6px; background: linear-gradient(to top, transparent, ${d.color});"></div>
                            </div>
                        `;
                        el.onclick = () => handleNodeClick(d);
                        return el;
                    }}
                />
            )}
        </div>
    );
};

export default CyberpunkGlobe;

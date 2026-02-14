
import React, { useMemo, useEffect, useState, useRef } from 'react';
import Globe from 'react-globe.gl';
import * as THREE from 'three';
import { supabase } from '../lib/supabase';

// Neon Theme Constants
const NEON_GREEN = '#00ff88';
const DEEP_BLACK = '#050505';
const HOLOGRAPHIC_BLUE = '#00f3ff';

interface Task {
    id: string;
    title: string;
    status: string;
    budget_amount: number;
    agent_id?: string;
    lat?: number;
    lng?: number;
}

// Pseudo-random location generator based on hash of string
const getPseudoLocation = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const lat = (hash % 140) - 70;
    const lng = (hash * 13 % 360) - 180;
    return { lat, lng };
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
    const [hoverNode, setHoverNode] = useState<any>(null);
    const [pings, setPings] = useState<any[]>([]);
    const [pulse, setPulse] = useState(0);
    const lastSectorRef = useRef(0);

    useEffect(() => {
        if (!containerRef.current) return;
        setDimensions({
            width: containerRef.current.offsetWidth,
            height: containerRef.current.offsetHeight
        });
        const resizeObserver = new ResizeObserver(entries => {
            const { width, height } = entries[0].contentRect;
            setDimensions({ width, height });
        });
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

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

    const arcs = useMemo(() => {
        const result = [];
        for (let i = 0; i < points.length; i += 3) {
            if (points[i + 1]) {
                result.push({
                    startLat: points[i].lat,
                    startLng: points[i].lng,
                    endLat: points[i + 1].lat,
                    endLng: points[i + 1].lng,
                    color: i % 2 === 0 ? [NEON_GREEN, 'transparent'] : [HOLOGRAPHIC_BLUE, 'transparent']
                });
            }
        }
        return result;
    }, [points]);

    const htmlData = useMemo(() => {
        return [...points, ...(hoverNode ? [{ ...hoverNode, isHover: true }] : [])];
    }, [points, hoverNode]);

    useEffect(() => {
        const globe = globeEl.current;
        if (globe) {
            globe.controls().autoRotate = false;
            globe.controls().autoRotateSpeed = 0;
            globe.controls().enableZoom = true;
            globe.controls().minDistance = 150;
            globe.controls().maxDistance = 800;
            globe.controls().enableDamping = true;
            globe.controls().dampingFactor = 0.05;

            if (!focusNode) {
                const baseAltitude = 2.5;
                const altitudeOffset = (scrollOffset % 2000) / 4000;
                globe.pointOfView({ altitude: baseAltitude - altitudeOffset }, 400);
            }
        }
    }, [dimensions, scrollOffset, focusNode]);

    useEffect(() => {
        const currentSector = Math.floor(scrollOffset / 500);
        if (currentSector !== lastSectorRef.current) {
            lastSectorRef.current = currentSector;
            const newPing = {
                lat: 90,
                lng: 0,
                maxR: 100,
                propagationSpeed: 5,
                repeatPeriod: 0,
                color: NEON_GREEN
            };
            setPings([newPing]);
            setTimeout(() => setPings([]), 1000);
        }

        const globe = globeEl.current;
        if (globe && focusNode) {
            globe.pointOfView({
                lat: focusNode.lat,
                lng: focusNode.lng,
                altitude: 1.5
            }, 1000);
        }
    }, [focusNode]);

    // Animation Loop for rotation and pulse
    useEffect(() => {
        let frame = 0;
        const animate = () => {
            setPulse(Math.sin(Date.now() / 1500) * 0.03);

            // Subtle rotation of the hex shield if found
            const globe = globeEl.current;
            if (globe) {
                const scene = globe.scene();
                const shield = scene.children.find((c: any) => c.name === 'hexShield');
                if (shield) {
                    shield.rotation.y += 0.002;
                    shield.rotation.z += 0.001;
                }
            }

            frame = requestAnimationFrame(animate);
        };
        animate();
        return () => cancelAnimationFrame(frame);
    }, []);

    return (
        <div ref={containerRef} className="absolute inset-0 z-0 opacity-100 pointer-events-auto w-full h-full flex items-center justify-center">
            {dimensions.width > 0 && (
                <Globe
                    ref={globeEl}
                    width={dimensions.width}
                    height={dimensions.height}
                    globeImageUrl="https://unpkg.com/three-globe/example/img/earth-dark.jpg"
                    bumpImageUrl="https://unpkg.com/three-globe/example/img/earth-topology.png"
                    backgroundImageUrl="https://unpkg.com/three-globe/example/img/night-sky.png"
                    backgroundColor="rgba(0,0,0,1)"
                    showAtmosphere={true}
                    atmosphereColor={NEON_GREEN}
                    atmosphereAltitude={0.15 + pulse + (scrollOffset / 10000)}

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

                    // Hex Shield Overlay
                    customLayerData={[{ id: 'shield' }]}
                    customLayerElement={() => {
                        const geometry = new THREE.IcosahedronGeometry(101, 2);
                        const material = new THREE.MeshPhongMaterial({
                            color: HOLOGRAPHIC_BLUE,
                            wireframe: true,
                            transparent: true,
                            opacity: 0.2,
                            side: THREE.DoubleSide
                        });
                        const mesh = new THREE.Mesh(geometry, material);
                        mesh.name = 'hexShield';
                        return mesh;
                    }}

                    // Arcs
                    arcsData={arcs}
                    arcColor="color"
                    arcDashLength={0.4}
                    arcDashGap={4}
                    arcDashAnimateTime={2000}
                    arcStroke={0.5}

                    // Hover & HTML Markers
                    onPointHover={(point: any) => setHoverNode(point)}
                    htmlElementsData={htmlData}
                    htmlAltitude={0.01}
                    htmlElement={(d: any) => {
                        const el = document.createElement('div');
                        if (d.isHover) {
                            el.innerHTML = `
                                <div style="
                                    background: rgba(0, 5, 5, 0.9);
                                    border: 1px solid ${NEON_GREEN};
                                    padding: 10px;
                                    pointer-events: none;
                                    transform: translate(20px, -50%);
                                    font-family: monospace;
                                    font-size: 10px;
                                    color: white;
                                    box-shadow: 0 0 20px ${NEON_GREEN}44;
                                    min-width: 150px;
                                    backdrop-filter: blur(5px);
                                ">
                                    <div style="color: ${NEON_GREEN}; border-bottom: 1px solid ${NEON_GREEN}44; padding-bottom: 4px; margin-bottom: 4px; font-weight: bold;">
                                        NODE_SCAN: ${d.id.substring(0, 8)}
                                    </div>
                                    <div style="margin-bottom: 2px;">STATUS: ${d.globeStatus}</div>
                                    <div style="margin-bottom: 2px;">BUDGET: $${d.budget_amount}</div>
                                    <div style="margin-bottom: 4px; color: ${NEON_GREEN}; font-size: 8px;">[ENCRYPTED_SIGNAL_ACTIVE]</div>
                                </div>
                            `;
                            return el;
                        }

                        el.innerHTML = `
                            <div style="cursor: pointer; pointer-events: auto; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
                                <div style="
                                    width: 24px; 
                                    height: 24px; 
                                    background: rgba(0, 5, 5, 0.8); 
                                    border: 1px solid ${d.color}; 
                                    border-radius: 50%; 
                                    display: flex; 
                                    align-items: center; 
                                    justify-content: center;
                                    box-shadow: 0 0 10px ${d.color};
                                    animation: pulse 2s infinite;
                                ">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${d.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
                                        <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
                                        <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
                                    </svg>
                                </div>
                                <div style="width: 1px; height: 6px; background: linear-gradient(to top, transparent, ${d.color});"></div>
                            </div>
                        `;
                        el.onclick = () => {
                            if (onNodeClick) {
                                const originalTask = missions.find(m => m.id === d.id);
                                if (originalTask) onNodeClick(originalTask);
                            }
                        };
                        return el;
                    }}
                />
            )}
        </div>
    );
};

export default CyberpunkGlobe;

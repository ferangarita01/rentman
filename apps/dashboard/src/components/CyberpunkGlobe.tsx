
import React, { useMemo, useEffect, useState, useRef } from 'react';
import Globe from 'react-globe.gl';
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
// This simulates "real" locations until we have actual geocoding
const getPseudoLocation = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Limits: lat -90 to 90, lng -180 to 180
    // We focus on "populated" areas mostly to look good
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
    const lastSectorRef = useRef(0);

    useEffect(() => {
        if (!containerRef.current) return;

        // Initial size
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
        // Map tasks to points
        const newPoints = missions.map(task => {
            const loc = task.lat && task.lng
                ? { lat: task.lat, lng: task.lng }
                : getPseudoLocation(task.id);

            return {
                ...task, // Keep original task data
                uniqueId: task.id, // avoid id collision if any
                lat: loc.lat,
                lng: loc.lng,
                size: task.status === 'ASSIGNED' ? 0.5 : 0.3,
                color: task.status === 'ASSIGNED' ? NEON_GREEN : HOLOGRAPHIC_BLUE,
                label: `${task.title} - $${task.budget_amount}`,
                globeStatus: task.status // renaming to avoid conflict if any
            };
        });

        setPoints(newPoints);

        // Create rings for active missions
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

    useEffect(() => {
        // Auto-rotate and scroll interaction
        const globe = globeEl.current;
        if (globe) {
            globe.controls().autoRotate = false;
            globe.controls().autoRotateSpeed = 0;
            globe.controls().enableZoom = false;
            globe.controls().enableDamping = true;
            globe.controls().dampingFactor = 0.05;

            // FTL Travel Zoom Effect
            // As user scrolls, we "zoom in" slightly or adjust altitude
            const baseAltitude = 2.5;
            const altitudeOffset = (scrollOffset % 2000) / 4000; // Oscillate/zoom effect
            globe.pointOfView({ altitude: baseAltitude - altitudeOffset });
        }
    }, [dimensions, scrollOffset]);

    useEffect(() => {
        // Area Pings on Sector Change
        const currentSector = Math.floor(scrollOffset / 500);
        if (currentSector !== lastSectorRef.current) {
            lastSectorRef.current = currentSector;

            // Trigger a global "ping" from the poles
            const newPing = {
                lat: 90, // North pole
                lng: 0,
                maxR: 100,
                propagationSpeed: 5,
                repeatPeriod: 0,
                color: NEON_GREEN
            };
            setPings([newPing]);
            setTimeout(() => setPings([]), 1000); // Clear after wave
        }

        // Handle Camera Focus on selected node
        const globe = globeEl.current;
        if (globe && focusNode) {
            globe.pointOfView({
                lat: focusNode.lat,
                lng: focusNode.lng,
                altitude: 1.8 // Zoom in slightly
            }, 1000); // 1s transition
        }
    }, [focusNode]);

    return (
        <div ref={containerRef} className="absolute inset-0 z-0 opacity-80 pointer-events-auto w-full h-full flex items-center justify-center">
            {dimensions.width > 0 && (
                <Globe
                    ref={globeEl}
                    width={dimensions.width}
                    height={dimensions.height}
                    globeImageUrl="https://unpkg.com/three-globe/example/img/earth-night.jpg"
                    bumpImageUrl="https://unpkg.com/three-globe/example/img/earth-topology.png"
                    backgroundImageUrl="https://unpkg.com/three-globe/example/img/night-sky.png"
                    backgroundColor="rgba(0,0,0,1)"
                    atmosphereColor={NEON_GREEN}
                    atmosphereAltitude={0.15}
                    pointsData={points}
                    pointAltitude={0.05}
                    pointColor="color"
                    pointRadius="size"
                    pointsMerge={true}
                    ringsData={[...rings, ...pings]}
                    ringColor="color"
                    ringMaxRadius="maxR"
                    ringPropagationSpeed="propagationSpeed"
                    ringRepeatPeriod="repeatPeriod"

                    // Interaction
                    onPointClick={(point: any) => {
                        if (onNodeClick) {
                            // Reconstruct pure Task object or find strictly in original array if referenced
                            // Since we spread ...task, point has all task props
                            // We cast it back to Task for type safety in callback
                            const { lat, lng, size, color, label, globeStatus, uniqueId, ...taskData } = point;
                            // Or simpler: map find
                            const originalTask = missions.find(m => m.id === point.id);
                            if (originalTask) onNodeClick(originalTask);
                        }
                    }}
                    pointLabel="label"

                    // Holographic Arc Links (Live Network Flow)
                    arcsData={useMemo(() => {
                        const arcs = [];
                        for (let i = 0; i < points.length; i += 3) {
                            if (points[i + 1]) {
                                arcs.push({
                                    startLat: points[i].lat,
                                    startLng: points[i].lng,
                                    endLat: points[i + 1].lat,
                                    endLng: points[i + 1].lng,
                                    color: i % 2 === 0 ? [NEON_GREEN, 'transparent'] : [HOLOGRAPHIC_BLUE, 'transparent']
                                });
                            }
                        }
                        return arcs;
                    }, [points])}
                    arcColor="color"
                    arcDashLength={0.4}
                    arcDashGap={4}
                    arcDashAnimateTime={2000}
                    arcStroke={0.5}

                    // HTML Elements (Custom Markers)
                    htmlTransitionDuration={1000}
                    htmlAltitude={0.1}

                    // Proximity Scanner (Hover Panel)
                    onPointHover={(point: any) => setHoverNode(point)}
                    htmlElementsData={[...points, ...(hoverNode ? [{ ...hoverNode, isHover: true }] : [])]}
                    htmlElement={(d: any) => {
                        const el = document.createElement('div');
                        if (d.isHover) {
                            // Holographic Detail Panel
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
                                    <div style="margin-bottom: 2px;">LAT: ${d.lat.toFixed(2)}</div>
                                    <div style="margin-bottom: 2px;">LNG: ${d.lng.toFixed(2)}</div>
                                    <div style="margin-top: 4px; color: ${NEON_GREEN}; font-size: 8px;">[ENCRYPTED_SIGNAL_ACTIVE]</div>
                                </div>
                            `;
                            return el;
                        }

                        // Regular Marker (kept same)
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
                                <div style="
                                    width: 1px; 
                                    height: 20px; 
                                    background: linear-gradient(to top, transparent, ${d.color});
                                "></div>
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

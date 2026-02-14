
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
}

const CyberpunkGlobe: React.FC<CyberpunkGlobeProps> = ({ missions, onNodeClick }) => {
    const globeEl = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [points, setPoints] = useState<any[]>([]);
    const [rings, setRings] = useState<any[]>([]);

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
        // Auto-rotate
        const globe = globeEl.current;
        if (globe) {
            globe.controls().autoRotate = true;
            globe.controls().autoRotateSpeed = 0.5;
            globe.controls().enableZoom = false; // Keep it clean for dashboard bg

            // Adjust camera distance if needed
            globe.pointOfView({ altitude: 2.5 });
        }
    }, [dimensions]); // Re-adjust when dimensions change

    return (
        <div ref={containerRef} className="absolute inset-0 z-0 opacity-40 pointer-events-auto w-full h-full flex items-center justify-center">
            {dimensions.width > 0 && (
                <Globe
                    ref={globeEl}
                    width={dimensions.width}
                    height={dimensions.height}
                    globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
                    bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                    backgroundColor="rgba(0,0,0,0)"
                    atmosphereColor={NEON_GREEN}
                    atmosphereAltitude={0.15}
                    pointsData={points}
                    pointAltitude={0.05}
                    pointColor="color"
                    pointRadius="size"
                    pointsMerge={true}
                    ringsData={rings}
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

                    // Holographic Arc Links (Visual Noise)
                    arcsData={points.slice(0, 10).map((p, i) => {
                        const next = points[(i + 1) % points.length];
                        return {
                            startLat: p.lat,
                            startLng: p.lng,
                            endLat: next.lat,
                            endLng: next.lng,
                            color: ['rgba(0,255,136,0.5)', 'rgba(0,0,0,0)']
                        };
                    })}
                    arcColor="color"
                    arcDashLength={0.4}
                    arcDashGap={4}
                    arcDashAnimateTime={2000}
                    arcStroke={0.5}
                />
            )}
        </div>
    );
};

export default CyberpunkGlobe;

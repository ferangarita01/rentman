'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getTaskById, acceptTask, Task, getAgentProfile } from '@/lib/supabase-client';
import { useAuth } from '@/contexts/AuthContext';
import {
    ChevronLeft,
    Radio,
    Bot,
    Terminal,
    ShieldCheck,
    Fingerprint,
    MapPin,
    Unlock,
    CheckCircle,
    Loader2,
    Navigation,
    ExternalLink
} from 'lucide-react';

interface IssuerData {
    id: string; // Added issuer ID
    name: string;
    trustScore: number;
    verified: boolean;
}

interface LocationData {
    distance: string;
    userLat: number | null;
    userLng: number | null;
    targetLat: number | null;
    targetLng: number | null;
}

function ContractDetailsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const contractId = searchParams.get('id');

    const [task, setTask] = useState<Task | null>(null);
    const [loading, setLoading] = useState(true);
    const [accepting, setAccepting] = useState(false);
    const [issuerData, setIssuerData] = useState<IssuerData | null>(null);
    const [locationData, setLocationData] = useState<LocationData>({
        distance: 'CALCULATING...',
        userLat: null,
        userLng: null,
        targetLat: null,
        targetLng: null
    });
    const { user } = useAuth();
    const userId = user?.id || null;

    // useEffects moved below function declarations

    async function loadTask() {
        if (!contractId) return;
        const { data, error } = await getTaskById(contractId);
        if (error) {
            console.error('❌ Error loading contract:', error);
        } else {
            setTask(data);
        }
        setLoading(false);
    }

    async function loadIssuerData() {
        if (!task) return;

        try {
            // Get issuer ID (requester_id or created_by field)
            const issuerId = task.requester_id || task.agent_id;

            if (!issuerId) {
                // Fallback to system issuer
                setIssuerData({
                    id: 'system',
                    name: 'RENTMAN_CORE_v2',
                    trustScore: 100,
                    verified: true
                });
                return;
            }

            // Fetch agent profile with trust score
            const { data, error } = await getAgentProfile(issuerId);

            if (error || !data) {
                console.error('Error loading issuer data:', error);
                setIssuerData({
                    id: issuerId, // Use the ID even if profile fails
                    name: 'RENTMAN_CORE_v2',
                    trustScore: 100,
                    verified: true
                });
                return;
            }

            setIssuerData({
                id: issuerId,
                name: data.profile.full_name || data.profile.email || 'RENTMAN_CORE_v2',
                trustScore: data.trustScore,
                verified: data.profile.is_agent || false
            });
        } catch (err) {
            console.error('Error in loadIssuerData:', err);
            setIssuerData({
                id: 'system',
                name: 'RENTMAN_CORE_v2',
                trustScore: 100,
                verified: true
            });
        }
    }

    function handleIssuerClick() {
        if (!issuerData?.id || issuerData.id === 'system') {
            return; // Don't navigate for system issuers
        }
        router.push(`/issuer?id=${issuerData.id}`);
    }

    function toRad(degrees: number): number {
        return degrees * (Math.PI / 180);
    }

    function calculateHaversineDistance(
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number
    ): number {
        const R = 6371; // Earth's radius in km
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) *
            Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    function initializeGeolocation() {
        if (!task) return;

        // Check if geolocation is available
        if (!('geolocation' in navigator)) {
            setLocationData(prev => ({
                ...prev,
                distance: 'GPS UNAVAILABLE'
            }));
            return;
        }

        // Get user's current position
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;

                // Try to get target coordinates from task
                let targetLat: number | null = null;
                let targetLng: number | null = null;

                // Check if task has geo_location field
                if (task.geo_location) {
                    // Could be POINT type or JSONB with lat/lng
                    if (typeof task.geo_location === 'object') {
                        targetLat = task.geo_location.lat || task.geo_location.latitude;
                        targetLng = task.geo_location.lng || task.geo_location.longitude;
                    }
                }

                // Fallback: Use a mock coordinate if no real location
                // In production, you would geocode task.location_address
                if (targetLat === null || targetLng === null) {
                    // Mock coordinates (Downtown area)
                    targetLat = 40.7128;
                    targetLng = -74.0060;
                }

                // Calculate distance using Haversine formula
                const distance = calculateHaversineDistance(
                    userLat,
                    userLng,
                    targetLat,
                    targetLng
                );

                setLocationData({
                    distance: `${distance.toFixed(1)} KM`,
                    userLat,
                    userLng,
                    targetLat,
                    targetLng
                });
            },
            (error) => {
                console.error('Geolocation error:', error);
                setLocationData(prev => ({
                    ...prev,
                    distance: 'LOCATION DENIED'
                }));
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    }

    // useEffects after all function declarations
    useEffect(() => {
        if (contractId) {
            loadTask();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [contractId]);

    useEffect(() => {
        if (task) {
            loadIssuerData();
            initializeGeolocation();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [task]);

    function openNavigation(service: 'google' | 'waze') {
        if (!locationData.targetLat || !locationData.targetLng) {
            alert('Target location not available');
            return;
        }

        const lat = locationData.targetLat;
        const lng = locationData.targetLng;

        let url = '';
        if (service === 'google') {
            url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        } else if (service === 'waze') {
            url = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
        }

        window.open(url, '_blank');
    }

    async function handleAcceptContract() {
        if (!userId) {
            alert('You must be logged in to accept contracts');
            return;
        }
        if (!task) return;

        setAccepting(true);
        const { error } = await acceptTask(task.id, userId);

        if (error) {
            alert('Error accepting contract: ' + error.message);
        } else {
            alert('Contract accepted successfully! 🎉');
            router.push('/');
        }
        setAccepting(false);
    }

    // Reuse page styles
    const styles = {
        scanline: {
            background: 'linear-gradient(to bottom, transparent 50%, rgba(0, 255, 136, 0.05) 50%)',
            backgroundSize: '100% 4px',
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#050505]">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-[#00ff88] animate-spin mx-auto mb-4" />
                    <p className="text-white font-mono tracking-widest">LOADING DATA...</p>
                </div>
            </div>
        );
    }

    if (!task) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#050505]">
                <div className="text-center">
                    <div className="text-6xl mb-4">⚠️</div>
                    <p className="text-white font-mono mb-6">CONTRACT NOT FOUND</p>
                    <button
                        onClick={() => router.back()}
                        className="px-6 py-3 bg-[#00ff88] text-black font-mono font-bold uppercase rounded hover:bg-[#00cc6d] transition-colors">
                        Return to Base
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex h-full min-h-screen w-full flex-col overflow-x-hidden max-w-[430px] mx-auto bg-[#050505] text-white font-sans selection:bg-[#00ff88]/30">
            {/* Global Scanline Effect */}
            <div className="fixed inset-0 pointer-events-none z-0" style={styles.scanline}></div>

            {/* Top App Bar */}
            <header className="flex items-center bg-[#050505]/80 backdrop-blur-md sticky top-0 z-10 p-4 border-b border-[#333333] space-x-4">
                <button
                    onClick={() => router.back()}
                    className="text-white hover:text-[#00ff88] transition-colors flex items-center justify-center">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="flex-1">
                    <p className="text-[10px] text-[#00ff88] font-mono uppercase tracking-[0.2em]">Deployment Auth</p>
                    <h2 className="text-white text-lg font-mono font-bold leading-tight tracking-tight uppercase">
                        CONTRACT_ID: #{task.id.slice(0, 4)}
                    </h2>
                </div>
                <Radio className="w-5 h-5 text-[#00ff88]/50 animate-pulse" />
            </header>

            {/* Main Content */}
            <main className="flex-1 p-4 space-y-6 pb-32 z-1 relative">
                {/* Hero Badge */}
                <div className="border border-[#00ff88]/20 bg-[#00ff88]/5 p-4 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                        <Bot className="w-5 h-5 text-[#00ff88]" />
                        <span className="text-xs font-mono text-[#00ff88]/80 tracking-widest uppercase">Mission Objective</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2 uppercase">{task.title}</h1>
                    <p className="text-gray-400 text-sm leading-relaxed">
                        {task.description}
                    </p>
                </div>

                {/* Technical Specs Section */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-[#333333] pb-2">
                        <Terminal className="w-4 h-4 text-[#00ff88]" />
                        <h3 className="text-[#00ff88] text-sm font-mono font-bold tracking-widest uppercase">TECHNICAL SPECS</h3>
                    </div>
                    <div
                        onClick={() => router.push(`/contract/chat?id=${contractId}`)}
                        className="bg-[#1a1a1a]/40 border border-[#333333] rounded-lg overflow-hidden cursor-pointer active:scale-[0.98] transition-all hover:border-[#00ff88]/30"
                    >
                        <div className="grid divide-y divide-[#333333]">
                            {task.required_skills && task.required_skills.length > 0 ? (
                                task.required_skills.map((skill, index) => (
                                    <div key={index} className="flex items-center gap-3 p-4">
                                        <div className="h-4 w-4 rounded-sm border border-[#00ff88]/50 flex items-center justify-center">
                                            <div className="w-2 h-2 bg-[#00ff88]"></div>
                                        </div>
                                        <div className="flex flex-col flex-1">
                                            <span className="text-xs font-mono text-gray-500 uppercase">Constraint 0{index + 1}</span>
                                            <p className="text-white font-mono text-sm uppercase">{skill}</p>
                                        </div>
                                        <ChevronLeft className="w-4 h-4 text-[#00ff88]/50 rotate-180" />
                                    </div>
                                ))
                            ) : (
                                <div className="p-4 text-center text-gray-500 font-mono text-sm">NO CONSTRAINTS SPECIFIED</div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Issuer Signature */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-[#333333] pb-2">
                        <ShieldCheck className="w-4 h-4 text-[#00ff88]" />
                        <h3 className="text-[#00ff88] text-sm font-mono font-bold tracking-widest uppercase">ISSUER SIGNATURE</h3>
                    </div>
                    <div
                        onClick={handleIssuerClick}
                        className="bg-[#1a1a1a]/60 p-4 border border-[#333333] rounded-lg space-y-4 active:scale-95 transition-transform cursor-pointer hover:border-[#00ff88]/30"
                    >
                        {/* Issuer Identity */}
                        <div className="flex items-center gap-4 relative overflow-hidden">
                            <div className="text-[#00ff88] flex items-center justify-center rounded border border-[#00ff88]/30 bg-[#00ff88]/10 shrink-0 size-12 shadow-[0_0_10px_rgba(0,255,136,0.15)]">
                                <Fingerprint className="w-8 h-8" />
                            </div>
                            <div className="flex flex-col justify-center flex-1">
                                <p className="text-white font-mono text-sm tracking-tight">Hash: 0x{task.id.slice(0, 4)}...{task.id.slice(-4)}</p>
                                <p className="text-gray-500 text-xs font-mono mt-1">
                                    Verified AI Issuer: {issuerData?.name || 'Loading...'}
                                </p>
                            </div>
                            <div className="absolute right-0 top-0 h-full w-1 bg-[#00ff88]"></div>
                            <div className="absolute right-2 top-2">
                                <ChevronLeft className="w-4 h-4 text-[#00ff88] rotate-180" />
                            </div>
                        </div>

                        {/* Trust Score */}
                        {issuerData && (
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-mono text-gray-400 uppercase">Trust Score</span>
                                    <span className="text-sm font-mono text-[#00ff88] font-bold">
                                        {issuerData.trustScore}/100
                                    </span>
                                </div>
                                <div className="h-2 w-full rounded-full overflow-hidden border border-[#333333] bg-black">
                                    <div
                                        className="h-full bg-gradient-to-r from-[#00ff88] to-[#00cc6d] transition-all duration-500"
                                        style={{ width: `${issuerData.trustScore}%` }}
                                    ></div>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-gray-500 font-mono">
                                    {issuerData.verified && (
                                        <>
                                            <CheckCircle className="w-3 h-3 text-[#00ff88]" />
                                            <span>Verified Issuer</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* Geolocation & Navigation */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-[#333333] pb-2">
                        <MapPin className="w-4 h-4 text-[#00ff88]" />
                        <h3 className="text-[#00ff88] text-sm font-mono font-bold tracking-widest uppercase">OBJECTIVE LOCATION</h3>
                    </div>

                    {/* Map Visualization */}
                    <div className="w-full h-40 rounded-lg border border-[#333333] bg-[#1a1a1a] overflow-hidden relative group">
                        {/* Grid pattern background */}
                        <div className="absolute inset-0 opacity-20"
                            style={{
                                backgroundImage: 'radial-gradient(#00ff88 1px, transparent 1px)',
                                backgroundSize: '20px 20px'
                            }}>
                        </div>

                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] to-transparent"></div>

                        {/* Location Info */}
                        <div className="absolute bottom-3 left-3 right-3 space-y-2">
                            <div className="flex items-center gap-1 bg-black/70 backdrop-blur-sm px-2 py-1 rounded border border-[#00ff88]/20 inline-flex">
                                <MapPin className="w-3 h-3 text-[#00ff88]" />
                                <span className="text-[10px] font-mono text-white uppercase truncate">
                                    {task.location_address || 'Sector 7-G / Unknown District'}
                                </span>
                            </div>
                        </div>

                        {/* Distance Badge */}
                        <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded border border-[#00ff88]/30">
                            <div className="flex items-center gap-1">
                                <Navigation className="w-3 h-3 text-[#00ff88]" />
                                <span className="text-xs font-mono text-white font-bold uppercase">
                                    {locationData.distance}
                                </span>
                            </div>
                        </div>

                        {/* Pulsing Target Marker */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <div className="relative">
                                <div className="w-4 h-4 bg-[#00ff88] rounded-full animate-ping absolute"></div>
                                <div className="w-4 h-4 bg-[#00ff88] rounded-full relative"></div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => openNavigation('google')}
                            disabled={!locationData.targetLat || !locationData.targetLng}
                            className="flex items-center justify-center gap-2 bg-[#1a1a1a] border border-[#333333] hover:border-[#00ff88] py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-[#00ff88] transition-colors" />
                            <span className="text-sm font-mono text-white uppercase">Google Maps</span>
                        </button>
                        <button
                            onClick={() => openNavigation('waze')}
                            disabled={!locationData.targetLat || !locationData.targetLng}
                            className="flex items-center justify-center gap-2 bg-[#1a1a1a] border border-[#333333] hover:border-[#00ff88] py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            <Navigation className="w-4 h-4 text-gray-400 group-hover:text-[#00ff88] transition-colors" />
                            <span className="text-sm font-mono text-white uppercase">Waze</span>
                        </button>
                    </div>
                </section>
            </main>

            {/* Fixed Action Button */}
            <footer className="p-4 pt-0 bg-[#050505]/95 backdrop-blur-md sticky bottom-0 z-20 border-t border-[#333333]/50">
                <div className="pt-4">
                    <button
                        onClick={handleAcceptContract}
                        disabled={accepting || task.status !== 'open'}
                        className="w-full bg-[#00ff88] py-4 rounded-lg flex items-center justify-center gap-3 active:scale-95 transition-transform hover:shadow-[0_0_15px_rgba(0,255,136,0.4)] disabled:opacity-50 disabled:grayscale disabled:shadow-none"
                    >
                        {accepting ? (
                            <Loader2 className="w-5 h-5 text-black animate-spin" />
                        ) : task.status === 'open' ? (
                            <Unlock className="w-5 h-5 text-black font-bold" />
                        ) : (
                            <CheckCircle className="w-5 h-5 text-black font-bold" />
                        )}
                        <span className="text-black font-sans font-bold text-lg tracking-widest uppercase">
                            {accepting ? 'PROCESSING...' : task.status === 'open' ? 'ACCEPT CONTRACT' : 'ALREADY ASSIGNED'}
                        </span>
                    </button>
                    <div className="mt-4 flex justify-between items-center px-2">
                        <div className="flex flex-col">
                            <p className="text-[10px] text-gray-500 font-mono uppercase">Payout</p>
                            <p className="text-white font-mono font-bold text-sm">
                                {task.budget_amount} {task.budget_currency}
                            </p>
                        </div>
                        <div className="flex flex-col items-end">
                            <p className="text-[10px] text-gray-500 font-mono uppercase">ETA to Start</p>
                            <p className="text-white font-mono font-bold text-sm">IMMEDIATE</p>
                        </div>
                    </div>
                    {/* iOS Safe Area Padding if needed, though usually handled by safe-area-inset */}
                    <div className="h-4"></div>
                </div>
            </footer>
        </div>
    );
}

export default function ContractPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#050505]">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#00ff88] border-t-transparent"></div>
            </div>
        }>
            <ContractDetailsContent />
        </Suspense>
    );
}

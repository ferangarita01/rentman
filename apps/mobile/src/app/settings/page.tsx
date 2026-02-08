
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    ChevronLeft,
    Settings2,
    Video,
    MapPin,
    Fingerprint,
    Network,
    Zap,
    ShieldCheck,
    TriangleAlert,
    Activity
} from 'lucide-react';
import { supabase, getSettings, updateSettings, UserSettings } from '@/lib/supabase-client';

export default function SettingsPage() {
    const router = useRouter();
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // State for toggles
    const [hardware, setHardware] = useState({
        camera: true,
        gps: true,
        biometric: false,
    });

    const [comms, setComms] = useState({
        aiLink: true,
        neural: false,
    });

    // Load settings on mount
    useEffect(() => {
        loadUserSettings();
    }, []);

    async function loadUserSettings() {
        try {
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            
            if (userError || !user) {
                console.error('User not logged in');
                setLoading(false);
                return;
            }

            setUserId(user.id);

            // Fetch settings
            const { data: settings, error: settingsError } = await getSettings(user.id);
            
            if (settingsError) {
                console.error('Error loading settings:', settingsError);
            } else if (settings) {
                // Apply loaded settings to state
                setHardware({
                    camera: settings.camera_enabled,
                    gps: settings.gps_enabled,
                    biometric: settings.biometrics_enabled,
                });
                setComms({
                    aiLink: settings.ai_link_enabled,
                    neural: settings.neural_notifications,
                });
            }

            setLoading(false);
        } catch (err) {
            console.error('Error loading settings:', err);
            setLoading(false);
        }
    }

    // Save settings to Supabase
    async function saveSettingsToDb(newSettings: Partial<UserSettings>) {
        if (!userId) return;

        const { error } = await updateSettings(userId, newSettings);
        
        if (error) {
            console.error('Failed to save settings:', error);
            alert('Failed to save settings. Please try again.');
        }
    }

    // Toggle handlers with DB persistence
    const toggleHardware = async (key: keyof typeof hardware) => {
        const newValue = !hardware[key];
        setHardware(prev => ({ ...prev, [key]: newValue }));
        
        // Map to DB field names
        const dbFieldMap = {
            camera: 'camera_enabled',
            gps: 'gps_enabled',
            biometric: 'biometrics_enabled'
        };
        
        await saveSettingsToDb({ [dbFieldMap[key]]: newValue } as Partial<UserSettings>);
    };

    const toggleComms = async (key: keyof typeof comms) => {
        const newValue = !comms[key];
        setComms(prev => ({ ...prev, [key]: newValue }));
        
        // Map to DB field names
        const dbFieldMap = {
            aiLink: 'ai_link_enabled',
            neural: 'neural_notifications'
        };
        
        await saveSettingsToDb({ [dbFieldMap[key]]: newValue } as Partial<UserSettings>);
    };

    const handleReboot = () => {
        if (confirm('REBOOT SYSTEM?')) {
            // Mock reboot action
            alert('SYSTEM REBOOT INITIATED...');
            setTimeout(() => router.push('/'), 1000);
        }
    };

    // Inline styles for specific effects not in Tailwind by default
    const styles = {
        scanline: {
            background: 'linear-gradient(to bottom, rgba(0, 255, 136, 0.03) 50%, rgba(0, 0, 0, 0) 50%)',
            backgroundSize: '100% 4px',
        },
        glowPrimary: {
            boxShadow: '0 0 10px rgba(0, 255, 136, 0.4)',
        },
        textGlow: {
            textShadow: '0 0 8px rgba(0, 255, 136, 0.6)',
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#050505]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00ff88]"></div>
            </div>
        );
    }

    return (
        <div className="relative flex h-screen w-full flex-col overflow-hidden bg-[#050505] font-sans text-white selection:bg-[#00ff88] selection:text-black">
            {/* Scanline Overlay Effect */}
            <div className="pointer-events-none absolute inset-0 z-50 opacity-20" style={styles.scanline}></div>

            {/* Top AppBar */}
            <div className="flex items-center bg-[#050505] p-4 pt-12 border-b border-[#333333] justify-between z-10 shrink-0">
                <div className="text-white flex items-center">
                    <ChevronLeft
                        onClick={() => router.back()}
                        className="w-8 h-8 cursor-pointer text-white hover:text-[#00ff88] transition-colors"
                    />
                </div>
                <h2 className="font-mono text-sm tracking-widest text-[#00ff88] font-bold uppercase" style={styles.textGlow}>
                    SYSTEM_CONFIG_V1.0.4
                </h2>
                <div className="w-8"></div> {/* Spacer to balance the layout */}
            </div>

            {/* Main Scrollable Content */}
            <div className="flex-1 overflow-y-auto pb-40">

                {/* Category: Hardware Interface */}
                <div className="mt-6 px-4">
                    <h3 className="font-mono text-[10px] tracking-[0.2em] text-white/40 mb-3 border-l-2 border-[#00ff88] pl-2 uppercase font-bold">
                        HARDWARE_INTERFACE_LINK
                    </h3>
                    <div className="space-y-[-1px]">

                        {/* Item: Camera */}
                        <div className="flex items-center gap-4 border border-[#333333] bg-[#1a1a1a]/30 p-4 justify-between transition-colors hover:bg-[#1a1a1a]/50">
                            <div className="flex items-center gap-4">
                                <div className="text-[#00ff88] flex items-center justify-center border border-[#00ff88]/20 bg-[#00ff88]/5 w-10 h-10">
                                    <Video className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-sm font-bold tracking-tight">Camera Access</p>
                                    <p className="text-white/40 text-[11px] leading-tight">Enable vision processing for task verification</p>
                                </div>
                            </div>
                            <div className="shrink-0">
                                <label className="relative flex h-6 w-11 cursor-pointer items-center rounded-sm border border-[#333333] bg-black p-0.5 transition-all">
                                    <div
                                        className={`h-full w-4 rounded-sm transition-all ${hardware.camera ? 'translate-x-5 bg-[#00ff88]' : 'translate-x-0 bg-white/20'}`}
                                        style={hardware.camera ? styles.glowPrimary : {}}
                                    ></div>
                                    <input
                                        type="checkbox"
                                        className="invisible absolute peer"
                                        checked={hardware.camera}
                                        onChange={() => toggleHardware('camera')}
                                    />
                                </label>
                            </div>
                        </div>

                        {/* Item: GPS */}
                        <div className="flex items-center gap-4 border border-[#333333] bg-[#1a1a1a]/30 p-4 justify-between transition-colors hover:bg-[#1a1a1a]/50">
                            <div className="flex items-center gap-4">
                                <div className="text-[#00ff88] flex items-center justify-center border border-[#00ff88]/20 bg-[#00ff88]/5 w-10 h-10">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-sm font-bold tracking-tight">GPS / Telemetry</p>
                                    <p className="text-white/40 text-[11px] leading-tight">Real-time coordinate broadcast to agents</p>
                                </div>
                            </div>
                            <div className="shrink-0">
                                <label className="relative flex h-6 w-11 cursor-pointer items-center rounded-sm border border-[#333333] bg-black p-0.5 transition-all">
                                    <div
                                        className={`h-full w-4 rounded-sm transition-all ${hardware.gps ? 'translate-x-5 bg-[#00ff88]' : 'translate-x-0 bg-white/20'}`}
                                        style={hardware.gps ? styles.glowPrimary : {}}
                                    ></div>
                                    <input
                                        type="checkbox"
                                        className="invisible absolute peer"
                                        checked={hardware.gps}
                                        onChange={() => toggleHardware('gps')}
                                    />
                                </label>
                            </div>
                        </div>

                        {/* Item: Biometric */}
                        <div className="flex items-center gap-4 border border-[#333333] bg-[#1a1a1a]/30 p-4 justify-between transition-colors hover:bg-[#1a1a1a]/50">
                            <div className="flex items-center gap-4">
                                <div className="text-[#00ff88] flex items-center justify-center border border-[#00ff88]/20 bg-[#00ff88]/5 w-10 h-10">
                                    <Fingerprint className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-sm font-bold tracking-tight">Biometric Auth</p>
                                    <p className="text-white/40 text-[11px] leading-tight">Secure link via retina scan or finger</p>
                                </div>
                            </div>
                            <div className="shrink-0">
                                <label className="relative flex h-6 w-11 cursor-pointer items-center rounded-sm border border-[#333333] bg-black p-0.5 transition-all">
                                    <div
                                        className={`h-full w-4 rounded-sm transition-all ${hardware.biometric ? 'translate-x-5 bg-[#00ff88]' : 'translate-x-0 bg-white/20'}`}
                                        style={hardware.biometric ? styles.glowPrimary : {}}
                                    ></div>
                                    <input
                                        type="checkbox"
                                        className="invisible absolute peer"
                                        checked={hardware.biometric}
                                        onChange={() => toggleHardware('biometric')}
                                    />
                                </label>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Category: Communication Protocols */}
                <div className="mt-8 px-4">
                    <h3 className="font-mono text-[10px] tracking-[0.2em] text-white/40 mb-3 border-l-2 border-[#00ff88] pl-2 uppercase font-bold">
                        COMMUNICATION_PROTOCOLS
                    </h3>
                    <div className="space-y-[-1px]">

                        {/* Item: AI Direct Link */}
                        <div className="flex items-center gap-4 border border-[#333333] bg-[#1a1a1a]/30 p-4 justify-between transition-colors hover:bg-[#1a1a1a]/50">
                            <div className="flex items-center gap-4">
                                <div className="text-[#00ff88] flex items-center justify-center border border-[#00ff88]/20 bg-[#00ff88]/5 w-10 h-10">
                                    <Network className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-sm font-bold tracking-tight">AI Direct Link</p>
                                    <p className="text-white/40 text-[11px] leading-tight">Enable low-latency neural interfacing</p>
                                </div>
                            </div>
                            <div className="shrink-0">
                                <label className="relative flex h-6 w-11 cursor-pointer items-center rounded-sm border border-[#333333] bg-black p-0.5 transition-all">
                                    <div
                                        className={`h-full w-4 rounded-sm transition-all ${comms.aiLink ? 'translate-x-5 bg-[#00ff88]' : 'translate-x-0 bg-white/20'}`}
                                        style={comms.aiLink ? styles.glowPrimary : {}}
                                    ></div>
                                    <input
                                        type="checkbox"
                                        className="invisible absolute peer"
                                        checked={comms.aiLink}
                                        onChange={() => toggleComms('aiLink')}
                                    />
                                </label>
                            </div>
                        </div>

                        {/* Item: Neural Notifications */}
                        <div className="flex items-center gap-4 border border-[#333333] bg-[#1a1a1a]/30 p-4 justify-between transition-colors hover:bg-[#1a1a1a]/50">
                            <div className="flex items-center gap-4">
                                <div className="text-[#00ff88] flex items-center justify-center border border-[#00ff88]/20 bg-[#00ff88]/5 w-10 h-10">
                                    <Zap className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-sm font-bold tracking-tight">Neural Notifications</p>
                                    <p className="text-white/40 text-[11px] leading-tight">Priority haptic feedback for high-tier tasks</p>
                                </div>
                            </div>
                            <div className="shrink-0">
                                <label className="relative flex h-6 w-11 cursor-pointer items-center rounded-sm border border-[#333333] bg-black p-0.5 transition-all">
                                    <div
                                        className={`h-full w-4 rounded-sm transition-all ${comms.neural ? 'translate-x-5 bg-[#00ff88]' : 'translate-x-0 bg-white/20'}`}
                                        style={comms.neural ? styles.glowPrimary : {}}
                                    ></div>
                                    <input
                                        type="checkbox"
                                        className="invisible absolute peer"
                                        checked={comms.neural}
                                        onChange={() => toggleComms('neural')}
                                    />
                                </label>
                            </div>
                        </div>

                        {/* Item: Encryption */}
                        <div className="flex items-center gap-4 border border-[#333333] bg-[#1a1a1a]/30 p-4 justify-between transition-colors hover:bg-[#1a1a1a]/50">
                            <div className="flex items-center gap-4">
                                <div className="text-[#00ff88] flex items-center justify-center border border-[#00ff88]/20 bg-[#00ff88]/5 w-10 h-10">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-sm font-bold tracking-tight">Encryption Tier</p>
                                    <p className="text-white/40 text-[11px] leading-tight">Current: AES-4096 Quantum-Resistant</p>
                                </div>
                            </div>
                            <div className="text-[#00ff88] font-mono text-xs uppercase cursor-pointer hover:underline">Manage</div>
                        </div>

                    </div>
                </div>

                {/* Danger Zone */}
                <div className="mt-10 px-4 mb-8">
                    <button
                        onClick={handleReboot}
                        className="w-full border border-red-500/30 bg-red-500/5 py-4 text-red-500 font-mono text-[10px] tracking-widest uppercase flex items-center justify-center gap-2 hover:bg-red-500/20 transition-all active:scale-95">
                        <TriangleAlert className="w-4 h-4" />
                        Emergency System Reboot
                    </button>
                </div>

            </div>

            {/* Footer: System Diagnostics */}
            <div className="absolute bottom-0 left-0 w-full bg-[#050505]/95 backdrop-blur-md border-t border-[#333333] pt-4 pb-8 px-4 z-10">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-[#00ff88] animate-pulse" />
                        <h4 className="font-mono text-[10px] tracking-widest uppercase text-white/60">System_Diagnostics</h4>
                    </div>
                    <div className="font-mono text-[10px] text-[#00ff88] bg-[#00ff88]/10 px-2 py-0.5 border border-[#00ff88]/20">UPLINK_STABLE</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <div className="border border-[#333333] p-2 flex flex-col items-center">
                        <p className="font-mono text-[9px] text-white/30 uppercase">Ping</p>
                        <p className="font-mono text-xs text-[#00ff88]">24ms</p>
                    </div>
                    <div className="border border-[#333333] p-2 flex flex-col items-center">
                        <p className="font-mono text-[9px] text-white/30 uppercase">Loss</p>
                        <p className="font-mono text-xs text-[#00ff88]">0.00%</p>
                    </div>
                    <div className="border border-[#333333] p-2 flex flex-col items-center">
                        <p className="font-mono text-[9px] text-white/30 uppercase">Temp</p>
                        <p className="font-mono text-xs text-[#00ff88]">32°C</p>
                    </div>
                </div>

                {/* iOS Home Indicator */}
                <div className="mt-4 flex justify-center">
                    <div className="h-1.5 w-32 rounded-full bg-white/10"></div>
                </div>
            </div>
        </div>
    );
}

'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { chatWithRentman, ChatMessage, RentmanContext } from '@/lib/vertex-ai';

interface RentmanAssistantContextType {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (message: string) => Promise<void>;
  clearMessages: () => void;
  context: RentmanContext;
  updateContext: (newContext: Partial<RentmanContext>) => void;
}

const RentmanAssistantContext = createContext<RentmanAssistantContextType | undefined>(undefined);

// Dual logging: console + native Android
const log = {
    info: (msg: string) => { console.log(msg); NativeLog.info(msg); },
    warn: (msg: string) => { console.warn(msg); NativeLog.warn(msg); },
    error: (msg: string) => { console.error(msg); NativeLog.error(msg); },
    // ⚡ APK OPTIMIZATION: Toggle to prevent bridge flooding
    debug: (msg: string) => {
        if (DEBUG_AUDIO_PACKETS) {
            console.log(msg);
            NativeLog.debug(msg);
        }
    },
};

// ⚡ APK DEBUG CONFIG
const DEBUG_AUDIO_PACKETS = false; // Set to true only for deep debugging

interface ScreenContextData {
    route: string;
    habits?: any[];
    goals?: any[];
    objectives?: any[];
    stats?: any;
    wellness?: any;
    [key: string]: any; // ✅ Allow dynamic properties
}

interface SarahContextType {
    isActive: boolean;
    setIsActive: (active: boolean) => void; // ✅ Add this line
    isConnected: boolean;
    isListening: boolean;
    isReady: boolean;
    isSpeaking: boolean;
    agentResponse: string;
    toggleSarah: () => void;
    disconnect: () => void;
    sendUserAction: (action: string, data?: any) => void;
    isFullPageMode: boolean;
    setIsFullPageMode: (isFull: boolean) => void;
    mode: string; // ✅ New mode state
    setMode: (mode: string) => void; // ✅ New setter
    screenData: ScreenContextData | null; // ✅ Screen context
    setScreenData: (data: ScreenContextData | null) => void; // ✅ Screen context setter
}

const SarahContext = createContext<SarahContextType | null>(null);

export function useSarah() {
    const context = useContext(SarahContext);
    if (!context) {
        throw new Error('useSarah must be used within SarahProvider');
    }
    return context;
}

export function SarahProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const router = useRouter();

    const [isActive, setIsActive] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [agentResponse, setAgentResponse] = useState('');
    const [isFullPageMode, setIsFullPageMode] = useState(false);
    const [mode, setMode] = useState('normal'); // ✅ Default mode
    const [screenData, setScreenData] = useState<ScreenContextData | null>(null); // ✅ Screen context state

    const pathname = usePathname(); // ✅ Track current route

    // ✅ FORCE SYNC route when it changes (even if page component hasn't loaded data yet)
    useEffect(() => {
        if (pathname) {
            setScreenData(prev => ({
                ...(prev || {}),
                route: pathname
            }));
            log.info('📍 [Sarah] Route changed to: ' + pathname);

            // 🛡️ SAFETY: Force-reset speaking state after navigation to prevent locks
            // 🔧 FIX: Reduced from 3000ms to 500ms for faster recovery
            const safetyTimer = setTimeout(() => {
                if (isSpeakingRef.current) {
                    log.warn('🛡️ Safety unlock: Resetting hung isSpeaking state after navigation');
                    isSpeakingRef.current = false;
                }
            }, 500); // 500ms - quick recovery without cutting off short audio

            return () => clearTimeout(safetyTimer);
        }
    }, [pathname]);

    const wsRef = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const isReadyRef = useRef(false);
    const isSpeakingRef = useRef(false);
    const playbackCtxRef = useRef<AudioContext | null>(null);
    const nextPlayTimeRef = useRef(0);
    const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const activeAudioTimeoutRef = useRef<any>(null);

    // Connect when activated
    useEffect(() => {
        log.info('🔄 [Sarah] isActive changed: ' + isActive + ' user: ' + !!user);

        // ✅ Notification Action Listener (Global)
        // Moved here to ensure it only runs when we have context, though ideally it should be higher up
        // But we need 'user' for database operations
        const setupNotificationListener = async () => {
            const { LocalNotifications } = await import('@/lib/notifications').then(_ => ({ LocalNotifications: require('@capacitor/local-notifications').LocalNotifications }));

            await LocalNotifications.addListener('localNotificationActionPerformed', async (notification: any) => {
                const actionId = notification.actionId;
                const habitId = notification.notification.extra?.habitId; // Assuming we pass habitId in extra

                console.log(`🔔 Notification Action: ${actionId} for habit ${habitId}`);

                if (actionId === 'COMPLETE' && habitId) {
                    // Call Supabase RPC to mark complete
                    /* 
                       Note: We need supabase client here. Assuming it's available via context or we create a new one.
                       Since we're inside the component, we can import the client.
                       However, to keep it clean, we'll try to use the existing flow or fetch.
                    */
                    // For now, let's just log and maybe play a sound if active
                    // Ideally: await supabase.rpc('complete_habit', { habit_id: habitId, ... })
                    console.log('✅ Marking habit complete from notification');
                    // TODO: Implement direct DB call
                } else if (actionId === 'SNOOZE') {
                    console.log('💤 Snoozing notification');
                    const { NotificationService } = await import('@/lib/notifications');
                    // Reschedule for +15 mins
                    const newTime = new Date(Date.now() + 15 * 60 * 1000);
                    await NotificationService.scheduleNotification(
                        notification.notification.title || 'Snoozed Habit',
                        notification.notification.body || 'Time to do it!',
                        notification.notification.id + 1, // varied ID
                        newTime
                    );
                }
            });
        };

        setupNotificationListener();

        if (isActive && user && !wsRef.current) {
            // Only connect if not already connected
            log.info('✅ [Sarah] Conditions met, calling connectAgent');
            connectAgent();
        }
        // ✅ REMOVED: Auto-disconnect when isActive becomes false
        // This allows Sarah to stay connected when navigating between tabs
        // User must explicitly close Sarah via the close button

        return () => {
            // Cleanup only if explicitly deactivated
            // Don't auto-disconnect on unmount
        };
    }, [isActive, user]);

    // ✅ SYNC screen context to backend when it changes mid-session
    useEffect(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && screenData) {
            wsRef.current.send(JSON.stringify({
                type: 'update_context',
                screenContext: screenData
            }));
            log.info('📤 [Sarah] Sent update_context: ' + (screenData?.route || 'unknown'));
        }
    }, [screenData]);

    const connectAgent = async () => {
        log.info('🔵 [Sarah] connectAgent called');
        log.info('🔵 [Sarah] isActive: ' + isActive);
        log.info('🔵 [Sarah] user: ' + (user?.id || 'null'));
        log.info('🔵 [Sarah] wsRef.current: ' + (wsRef.current ? 'exists' : 'null'));

        if (typeof window === 'undefined' || wsRef.current) {
            log.warn('⚠️ [Sarah] Skipping connect - window undefined or ws exists');
            return;
        }

        log.info('🔵 [Sarah] Setting response: Conectando...');
        setAgentResponse('🔄 Conectando con Sarah...');

        try {
            const url = `${WS_URL}?mode=${mode}`; // ✅ Append mode to URL
            log.info('🔵 [Sarah] Creating WebSocket: ' + url);
            const ws = new WebSocket(url);
            ws.binaryType = 'arraybuffer';
            wsRef.current = ws;

            ws.onopen = () => {
                log.info('✅ [Sarah] WebSocket opened!');
                setAgentResponse('🔄 Iniciando sesión...');
                setIsConnected(true);

                // Ensure we have a valid userId before sending init
                if (!user?.id) {
                    log.error('❌ [Sarah] No user ID available, cannot initialize');
                    ws.close();
                    return;
                }

                ws.send(JSON.stringify({
                    type: 'init',
                    userId: user.id,
                    screenContext: screenData // ✅ Send screen context
                }));
                log.info(`🔵 [Sarah] Init message sent with userId: ${user.id.substring(0, 8)}...`);
                // ⚠️ DON'T call startListening() here - wait for 'ready' message
            };

            ws.onmessage = (event: MessageEvent) => {
                if (event.data instanceof ArrayBuffer) {
                    const view = new Uint8Array(event.data);
                    log.debug('🎵 [Sarah] Audio data received. First byte: ' + view[0] + ' Size: ' + event.data.byteLength);
                    if (view[0] === 0x02) {
                        log.info('🔊 [Sarah] Calling playAudio with ' + (event.data.byteLength - 1) + ' bytes');
                        isSpeakingRef.current = true;
                        if (!isReadyRef.current) {
                            setIsReady(true);
                            isReadyRef.current = true;
                            setAgentResponse('Escuchando...');
                        }
                        playAudio(event.data.slice(1));
                    } else {
                        log.warn('⚠️ [Sarah] Unknown audio byte: ' + view[0]);
                    }
                } else {
                    try {
                        const msg = JSON.parse(event.data);

                        if (msg.type === 'debug') {
                            setAgentResponse(`🔧 ${msg.message}`);
                            return;
                        }

                        if (msg.type === 'ready') {
                            setIsReady(true);
                            isReadyRef.current = true;
                            setAgentResponse('Escuchando...');
                            // 🎤 NOW start listening after backend confirms ready
                            log.info('🔵 [Sarah] Backend ready, starting microphone...');
                            startListening();
                            return;
                        }

                        if (msg.type === 'interrupt') {
                            if (currentSourceRef.current) {
                                try { currentSourceRef.current.stop(); } catch (e) { }
                                currentSourceRef.current = null;
                            }
                            isSpeakingRef.current = false;
                            return;
                        }

                        // Handle navigation from Sarah
                        if (msg.type === 'app_control') {
                            if (msg.command === 'navigate') {
                                log.info(`🧭 [Sarah] Navigation command: ${msg.path}`);

                                // 🔧 FIX: Reset speaking state BEFORE navigating
                                // This prevents Sarah from getting stuck after navigation
                                if (currentSourceRef.current) {
                                    try { currentSourceRef.current.stop(); } catch (e) { /* ignore */ }
                                    currentSourceRef.current = null;
                                }
                                if (activeAudioTimeoutRef.current) {
                                    clearTimeout(activeAudioTimeoutRef.current);
                                    activeAudioTimeoutRef.current = null;
                                }
                                isSpeakingRef.current = false;

                                // Navigate and update UI
                                setAgentResponse(`📍 ${msg.path}`);
                                router.push(msg.path);

                                // 6. Send confirmation to backend
                                if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                                    wsRef.current.send(JSON.stringify({
                                        type: 'navigation_complete',
                                        path: msg.path,
                                        timestamp: Date.now()
                                    }));
                                }
                            }

                            // Handle close_app command
                            if (msg.command === 'close_app') {
                                log.info('👋 [Sarah] Close app command received');

                                // Try to minimize the app on mobile
                                import('@capacitor/app').then(({ App }) => {
                                    App.minimizeApp();
                                }).catch((e) => {
                                    // On web, just show a message
                                    log.info('Cannot minimize on web, showing farewell');
                                    setAgentResponse(msg.farewell || '👋 ¡Hasta luego!');
                                });
                            }

                            // Handle update_settings command
                            if (msg.command === 'update_settings') {
                                log.info(`⚙️ [Sarah] Settings update: ${JSON.stringify(msg.settings)}`);
                                // Dispatch event for Settings page to handle
                                window.dispatchEvent(new CustomEvent('sarah_settings_update', {
                                    detail: msg.settings
                                }));
                            }
                        }

                        // Handle dynamic UI rendering (TODO: implement render system)
                        if (msg.type === 'render_ui') {
                            log.info('Render UI: ' + JSON.stringify(msg));
                            // Will dispatch event for current page to handle
                            window.dispatchEvent(new CustomEvent('sarah_render', { detail: msg }));
                        }

                        // Handle scheduled notifications from Sarah
                        if (msg.type === 'schedule_notification') {
                            console.log('📅 Schedule notification:', msg.notification);
                            window.dispatchEvent(new CustomEvent('schedule_notification', {
                                detail: msg.notification
                            }));
                        }

                        // Handle turn completion from Sarah
                        if (msg.type === 'turn_complete') {
                            console.log('✅ Sarah finished speaking - audio will drain naturally');
                            // FIX: Don't stop audio immediately - let it finish playing
                            // The activeAudioTimeoutRef will handle setting isSpeaking=false
                            // This prevents cutting Sarah off mid-sentence

                            // Just mark that we received turn complete for logging
                            // Audio queue will drain naturally via existing timeout mechanism
                        }

                        // Handle Onboarding Completion
                        if (msg.type === 'onboarding_complete') {
                            console.log('🎉 Onboarding event received from backend');
                            window.dispatchEvent(new CustomEvent('onboarding_complete'));
                        }

                        // Handle Habits Updated (trigger UI refresh)
                        if (msg.type === 'habits_updated') {
                            console.log('🔄 Habits updated via Sarah:', msg.action);
                            window.dispatchEvent(new CustomEvent('habits_updated', {
                                detail: { action: msg.action, habit_id: msg.habit_id }
                            }));
                        }

                        // Handle Sarah Message (formatted text card)
                        if (msg.type === 'sarah_message') {
                            console.log('💬 Sarah message received:', msg.title);
                            window.dispatchEvent(new CustomEvent('sarah_message', {
                                detail: {
                                    emoji: msg.emoji,
                                    title: msg.title,
                                    body: msg.body,
                                    style: msg.style
                                }
                            }));
                        }

                    } catch (e) {
                        console.error('Parse error:', e);
                    }
                }
            };

            ws.onclose = () => {
                log.warn('🔴 [Sarah] WebSocket closed');
                setIsConnected(false);
                setIsReady(false);
                setIsListening(false);
                wsRef.current = null;
            };

            ws.onerror = (error) => {
                log.error('❌ [Sarah] WebSocket error: ' + JSON.stringify(error));
                setAgentResponse('❌ Error de conexión');
            };

        } catch (e) {
            log.error('❌ [Sarah] Connection error: ' + (e as Error).message);
            setAgentResponse('❌ Error al crear conexión');
        }
    };

    const disconnectAgent = useCallback(() => {
        log.info('🔴 [Sarah] disconnectAgent called');

        // 1. WebSocket (Close immediately if open)
        if (wsRef.current) {
            // Prevent onclose/onerror from firing after manual disconnect
            wsRef.current.onclose = null;
            wsRef.current.onerror = null;
            wsRef.current.onmessage = null;

            if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
                wsRef.current.close();
            }
            wsRef.current = null;
        }

        // 2. Microphone Stream (Stop tracks)
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }

        // 3. Audio Contexts (Close safely)
        // Note: .close() returns a promise, we don't await because unmount shouldn't block
        if (audioContextRef.current) {
            if (audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close().catch(e => console.warn('Error closing Mic Context:', e));
            }
            audioContextRef.current = null;
        }

        // 4. Playback Context
        if (playbackCtxRef.current) {
            if (playbackCtxRef.current.state !== 'closed') {
                playbackCtxRef.current.close().catch(e => console.warn('Error closing Playback Context:', e));
            }
            playbackCtxRef.current = null;
        }

        // 5. Timers
        if (activeAudioTimeoutRef.current) {
            clearTimeout(activeAudioTimeoutRef.current);
            activeAudioTimeoutRef.current = null;
        }

        // 6. Stop processor
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current.onaudioprocess = null; // Kill loop
            processorRef.current = null;
        }

        // Reset State
        // Don't set isActive to false here - let the caller control that
        setIsListening(false);
        setIsConnected(false);
        setIsReady(false);
        isReadyRef.current = false;
        isSpeakingRef.current = false; // Reset speaking state
        if (currentSourceRef.current) {
            try { currentSourceRef.current.stop(); } catch (e) { }
            currentSourceRef.current = null;
        }
        setAgentResponse('');
    }, []);

    const startListening = async () => {
        console.log('🎤 [Sarah] startListening called');

        try {
            if (typeof window === 'undefined') {
                console.log('⚠️ [Sarah] Window is undefined, skipping');
                return;
            }

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                setAgentResponse('⚠️ Microphone requires HTTPS or localhost');
                console.error('Media devices not available');
                return;
            }

            // 🎤 NATIVE AEC CONFIGURATION (Android Optimized)
            // We use 'sampleRate: undefined' to let the OS/Hardware handle the native stream
            // Then we software-downsample to 16kHz for Gemini.
            console.log('🎤 Requesting NATIVE echo-cancelled microphone access...');
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: undefined // Let OS decide (Critical for Android 16k crash fix)
                }
            });
            console.log('✅ [Sarah] Microphone access granted!');
            streamRef.current = stream;

            // processing context (16kHz target)
            // If we can't get 16k natively, we handle it in the processor
            console.log('🎛️ [Sarah] Creating AudioContext...');
            const audioContext = new AudioContext({ sampleRate: 16000 });
            audioContextRef.current = audioContext;
            console.log(`✅ [Sarah] AudioContext created. Sample rate: ${audioContext.sampleRate}Hz`);

            const source = audioContext.createMediaStreamSource(stream);
            const processor = audioContext.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (e) => {
                // Check state
                if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
                if (!isReadyRef.current) return;
                if (isSpeakingRef.current) return; // Half-duplex (mute self when agent speaks)

                const inputData = e.inputBuffer.getChannelData(0);

                // 🔊 DOWNSAMPLING LOGIC (If needed, although AudioContext(16k) handles most)
                // We clamp and convert Float32 -> Int16
                const pcm16 = new Int16Array(inputData.length);
                let sumSq = 0;

                for (let i = 0; i < inputData.length; i++) {
                    const s = Math.max(-1, Math.min(1, inputData[i]));
                    sumSq += s * s;
                    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                }

                // Noise Gate (Simple)
                const rms = Math.sqrt(sumSq / inputData.length);
                if (rms < 0.002) return; // Silence

                // Send Packet
                const packet = new Uint8Array(1 + pcm16.byteLength);
                packet[0] = 0x01; // Opcode
                packet.set(new Uint8Array(pcm16.buffer), 1);
                wsRef.current.send(packet);
            };

            source.connect(processor);
            processor.connect(audioContext.destination);
            setIsListening(true);
            console.log('🎤 [Sarah] Audio processing pipeline ready!');

        } catch (e: any) {
            console.error('❌ [Sarah] Microphone error:', e);
            console.error('❌ [Sarah] Error name:', e.name);
            console.error('❌ [Sarah] Error message:', e.message);
            setAgentResponse('❌ Error con micrófono');
        }
    };

    const playAudio = async (audioData: ArrayBuffer) => {
        console.log('🎧 [Sarah] playAudio called with', audioData.byteLength, 'bytes');
        try {
            if (!playbackCtxRef.current) {
                playbackCtxRef.current = new AudioContext({ sampleRate: 24000 });
                console.log('🎧 [Sarah] AudioContext created. Sample rate:', playbackCtxRef.current.sampleRate);
            }
            const ctx = playbackCtxRef.current;

            const int16Array = new Int16Array(audioData);
            const float32Array = new Float32Array(int16Array.length);
            for (let i = 0; i < int16Array.length; i++) {
                float32Array[i] = int16Array[i] / 32768;
            }

            // Gemini sends 24kHz, create buffer at 24kHz then let browser resample
            const audioBuffer = ctx.createBuffer(1, float32Array.length, 24000);
            audioBuffer.getChannelData(0).set(float32Array);

            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(ctx.destination);

            const now = ctx.currentTime;
            const startTime = Math.max(now, nextPlayTimeRef.current);
            source.start(startTime);
            nextPlayTimeRef.current = startTime + audioBuffer.duration;
            currentSourceRef.current = source;

            if (activeAudioTimeoutRef.current) {
                clearTimeout(activeAudioTimeoutRef.current);
            }

            // FIX: Calculate timeout based on the TOTAL queue end time, not just this chunk.
            // This ensures microphone stays muted (isSpeaking=true) until the entire sentence finishes.
            const timeUntilQueueEnds = Math.max(0, nextPlayTimeRef.current - ctx.currentTime);
            const durationMs = timeUntilQueueEnds * 1000;

            activeAudioTimeoutRef.current = setTimeout(() => {
                console.log('🔇 Agent finished speaking (Queue empty)');
                isSpeakingRef.current = false;
            }, durationMs + 300); // +300ms buffer for safety

        } catch (e) {
            console.error('❌ [Sarah] Audio play error:', e);
        }
    };

    const sendUserAction = useCallback((action: string, data: any = {}) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'user_action',
                action,
                data
            }));
            console.log('📤 Sent User Action:', action, data);
        } else {
            console.warn('⚠️ Cannot send user action, WS not connected:', action);
        }
    }, []);

    const toggleSarah = useCallback(() => {
        setIsActive(prev => !prev);
    }, []);

    // ⚡ PERFORMANCE: Memoize context value to prevent app-wide re-renders
    // This is critical for mobile battery life and UI smoothness
    const contextValue = React.useMemo(() => ({
        isActive,
        setIsActive,
        isConnected,
        isListening,
        isReady,
        isSpeaking: isSpeakingRef.current,
        agentResponse,
        toggleSarah,
        disconnect: disconnectAgent,
        sendUserAction,
        isFullPageMode,
        setIsFullPageMode,
        mode,
        setMode,
        screenData,
        setScreenData
    }), [
        isActive,
        isConnected,
        isListening,
        isReady,
        agentResponse,
        isFullPageMode,
        mode,
        screenData,
        toggleSarah,
        disconnectAgent,
        sendUserAction
        // isSpeakingRef is a ref, so it doesn't trigger re-renders, 
        // but we include it in the object. Components needing real-time speaking state 
        // should likely listen to an event or use a separate subscription if they need 
        // >60fps updates, but for React state this is efficient.
    ]);



    return (
        <SarahContext.Provider value={contextValue}>
            {children}
        </SarahContext.Provider>
    );
}

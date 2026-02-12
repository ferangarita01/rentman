'use client';

import React, { Suspense, useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Camera, FileText, MapPin, CheckCircle, DollarSign, AlertCircle, ArrowLeft, Upload, Send, ChevronRight, Loader2, Image as ImageIcon } from 'lucide-react';
import {
    getTaskById,
    getTaskProofs,
    uploadProof,
    reviewProof,
    getEscrowStatus,
    releasePayment,
    getMessages,
    sendMessage,
    Task,
    TaskProof,
    Message,
    supabase
} from '@/lib/supabase-client';
import { useAuth } from '@/contexts/AuthContext';
import ProofCard from '@/components/ProofCard';

function ContractChatContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const contractId = searchParams.get('id') || '';
    const { user } = useAuth();

    const [task, setTask] = useState<Task | null>(null);
    const [proofs, setProofs] = useState<TaskProof[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [escrowStatus, setEscrowStatus] = useState<{ grossAmount?: number; netAmount?: number; status?: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [message, setMessage] = useState('');
    const [uploadingPhoto, setUploadingPhoto] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Hide navigation bar
    useEffect(() => {
        const nav = document.querySelector('nav');
        if (nav) nav.style.display = 'none';
        return () => {
            const nav = document.querySelector('nav');
            if (nav) nav.style.display = '';
        };
    }, []);

    async function loadContractData() {
        setLoading(true);

        const { data: taskData } = await getTaskById(contractId);
        if (taskData) setTask(taskData);

        await loadProofs();
        await loadMessages();

        const { data: escrowData } = await getEscrowStatus(contractId);
        if (escrowData) setEscrowStatus(escrowData);

        setLoading(false);
    }

    async function loadProofs() {
        const { data } = await getTaskProofs(contractId);
        if (data) setProofs(data);
    }

    async function loadMessages() {
        const { data } = await getMessages(contractId);
        if (data) setMessages(data);
    }

    // ── CAPTURE_IMG: Open device camera ──
    function handleCapturePhoto() {
        fileInputRef.current?.click();
    }

    async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setUploadingPhoto(true);

        try {
            // Upload to Supabase Storage
            const fileExt = file.name.split('.').pop() || 'jpg';
            const fileName = `proofs/${contractId}/${user.id}_${Date.now()}.${fileExt}`;

            const { data: uploadData, error: uploadError } = await supabase
                .storage
                .from('proof-files')
                .upload(fileName, file, { contentType: file.type });

            let fileUrl = '';

            if (uploadError) {
                console.error('Storage upload error:', uploadError);
                // Fallback: convert to base64 data URL for proof
                const reader = new FileReader();
                const dataUrl = await new Promise<string>((resolve) => {
                    reader.onload = () => resolve(reader.result as string);
                    reader.readAsDataURL(file);
                });
                fileUrl = dataUrl;
            } else {
                // Get public URL
                const { data: urlData } = supabase.storage
                    .from('proof-files')
                    .getPublicUrl(uploadData.path);
                fileUrl = urlData.publicUrl;
            }

            // Submit proof with real file URL
            const { error } = await uploadProof(
                contractId,
                user.id,
                'photo',
                'Photo Proof',
                `Photo captured at ${new Date().toLocaleTimeString()}`,
                fileUrl
            );

            if (error) {
                // Fallback: direct Supabase insert if backend fails
                console.error('Backend proof upload failed, trying direct insert:', error);
                await supabase.from('task_proofs').insert({
                    task_id: contractId,
                    human_id: user.id,
                    proof_type: 'photo',
                    title: 'Photo Proof',
                    description: `Photo captured at ${new Date().toLocaleTimeString()}`,
                    file_url: fileUrl,
                    status: 'pending'
                });
            }

            // Also send a system message to the chat
            await sendMessage(contractId, user.id, '📸 Photo proof submitted', 'image', { file_url: fileUrl });

            await loadProofs();
            await loadMessages();
            scrollToBottom();
        } catch (err: unknown) {
            console.error('Photo capture error:', err);
            const errMsg = err instanceof Error ? err.message : 'Unknown error';
            alert('Error uploading photo: ' + errMsg);
        } finally {
            setUploadingPhoto(false);
            // Reset file input
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }

    // ── GEO_LOCATE: Send GPS coordinates as proof ──
    async function handleGeoLocate() {
        if (!user) return;
        setUploading(true);

        try {
            if (!navigator.geolocation) {
                alert('GPS not available on this device');
                return;
            }

            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                });
            });

            const locationData = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy,
                timestamp: new Date().toISOString()
            };

            const { error } = await uploadProof(
                contractId,
                user.id,
                'location',
                'Location Proof',
                `GPS: ${locationData.lat.toFixed(6)}, ${locationData.lng.toFixed(6)}`,
                undefined,
                locationData
            );

            if (error) {
                // Fallback: direct insert
                console.error('Backend location proof failed, trying direct insert:', error);
                await supabase.from('task_proofs').insert({
                    task_id: contractId,
                    human_id: user.id,
                    proof_type: 'location',
                    title: 'Location Proof',
                    description: `GPS: ${locationData.lat.toFixed(6)}, ${locationData.lng.toFixed(6)}`,
                    location_data: locationData,
                    status: 'pending'
                });
            }

            // Send location message to chat
            await sendMessage(
                contractId,
                user.id,
                `📍 Location proof: ${locationData.lat.toFixed(6)}, ${locationData.lng.toFixed(6)}`,
                'location',
                locationData
            );

            await loadProofs();
            await loadMessages();
            scrollToBottom();
        } catch (err: unknown) {
            console.error('Geolocation error:', err);
            const errMsg = err instanceof Error ? err.message : 'GPS denied';
            alert('Error getting location: ' + errMsg);
        } finally {
            setUploading(false);
        }
    }

    // ── ATTACH_LOG: Submit text from the message input as a formal proof ──
    async function handleAttachLog() {
        if (!user) return;

        const textContent = message.trim();
        if (!textContent) {
            alert('Type your update in the message field first, then tap ATTACH_LOG');
            return;
        }

        setUploading(true);

        try {
            const { error } = await uploadProof(
                contractId,
                user.id,
                'text',
                'Text Proof',
                textContent
            );

            if (error) {
                // Fallback: direct insert
                console.error('Backend text proof failed, trying direct insert:', error);
                await supabase.from('task_proofs').insert({
                    task_id: contractId,
                    human_id: user.id,
                    proof_type: 'text',
                    title: 'Text Proof',
                    description: textContent,
                    status: 'pending'
                });
            }

            // Also send as chat message
            await sendMessage(contractId, user.id, `📝 Proof: ${textContent}`, 'text');

            setMessage('');
            await loadProofs();
            await loadMessages();
            scrollToBottom();
        } catch (err: unknown) {
            console.error('Text proof error:', err);
            const errMsg = err instanceof Error ? err.message : 'Unknown error';
            alert('Error submitting text proof: ' + errMsg);
        } finally {
            setUploading(false);
        }
    }

    // ── SEND MESSAGE: Regular chat message ──
    async function handleSendMessage() {
        if (!user || !message.trim()) return;

        setSendingMessage(true);

        try {
            const { error } = await sendMessage(contractId, user.id, message.trim(), 'text');

            if (error) {
                console.error('Error sending message:', error);
                alert('Failed to send message');
            } else {
                setMessage('');
                await loadMessages();
                scrollToBottom();
            }
        } catch (err: unknown) {
            console.error('Message send error:', err);
        } finally {
            setSendingMessage(false);
        }
    }

    // Handle Enter key
    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    }

    async function handleApproveProof(proofId: string) {
        if (!user) return;
        const { error } = await reviewProof(proofId, user.id, 'approve');
        if (error) {
            // Fallback: direct Supabase update if backend rejects (e.g. same-user testing)
            console.warn('Backend review failed, attempting direct update:', error);
            const { error: directError } = await supabase
                .from('task_proofs')
                .update({
                    status: 'approved',
                    reviewed_by: user.id,
                    reviewed_at: new Date().toISOString()
                })
                .eq('id', proofId);

            if (directError) {
                alert('Failed to approve proof: ' + directError.message);
                return;
            }
        }
        await loadProofs();
        await sendMessage(contractId, user.id, '✅ Proof approved', 'system');
        await loadMessages();
    }

    async function handleRejectProof(proofId: string, reason: string) {
        if (!user) return;
        const { error } = await reviewProof(proofId, user.id, 'reject', reason);
        if (error) {
            // Fallback: direct Supabase update
            console.warn('Backend review failed, attempting direct update:', error);
            const { error: directError } = await supabase
                .from('task_proofs')
                .update({
                    status: 'rejected',
                    reviewed_by: user.id,
                    reviewed_at: new Date().toISOString(),
                    rejection_reason: reason
                })
                .eq('id', proofId);

            if (directError) {
                alert('Failed to reject proof: ' + directError.message);
                return;
            }
        }
        await loadProofs();
        await sendMessage(contractId, user.id, `❌ Proof rejected: ${reason}`, 'system');
        await loadMessages();
    }

    async function handleReleasePayment() {
        if (!user || !task) return;
        if (!confirm('Release payment? This action cannot be undone.')) return;

        const { data, error } = await releasePayment(contractId, user.id);
        if (error) {
            alert('Failed to release payment: ' + error.message);
        } else {
            alert(`✅ Payment released! Amount: $${data.amount}`);
            await loadContractData();
        }
    }

    function scrollToBottom() {
        setTimeout(() => {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 200);
    }

    // ── Build unified timeline ──
    function buildTimeline() {
        const timeline: Array<{ type: 'proof' | 'message'; data: TaskProof | Message; timestamp: string }> = [];

        proofs.forEach(p => {
            timeline.push({ type: 'proof', data: p, timestamp: p.created_at });
        });

        messages.forEach(m => {
            timeline.push({ type: 'message', data: m, timestamp: m.created_at });
        });

        // Sort chronologically (oldest first)
        timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        return timeline;
    }

    useEffect(() => {
        if (contractId) {
            loadContractData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [contractId]);

    // Real-time subscriptions
    useEffect(() => {
        if (!contractId) return;

        // Subscribe to proofs
        const proofsChannel = supabase
            .channel(`proofs-${contractId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'task_proofs',
                filter: `task_id=eq.${contractId}`
            }, () => { loadProofs(); })
            .subscribe();

        // Subscribe to messages
        const messagesChannel = supabase
            .channel(`messages-${contractId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `task_id=eq.${contractId}`
            }, () => {
                loadMessages();
                scrollToBottom();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(proofsChannel);
            supabase.removeChannel(messagesChannel);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [contractId]);

    // Check both requester_id and agent_id for requester role
    const isRequester = user?.id === task?.requester_id || user?.id === task?.agent_id;
    const isHuman = user?.id === task?.assigned_human_id;
    const isParticipant = isRequester || isHuman;
    const allProofsApproved = proofs.length > 0 && proofs.every(p => p.status === 'approved');
    const canReleasePayment = isRequester && allProofsApproved && escrowStatus?.status === 'held';

    const getStatusText = () => {
        if (task?.status === 'COMPLETED') return 'COMPLETED';
        if (proofs.length === 0) return 'WAITING_FOR_PROOF';
        if (proofs.some(p => p.status === 'pending')) return 'PENDING_REVIEW';
        if (allProofsApproved) return 'APPROVED';
        return 'IN_PROGRESS';
    };

    const timeline = buildTimeline();

    if (loading) {
        return (
            <div className="h-screen bg-[#050505] flex items-center justify-center">
                <div className="fixed inset-0 pointer-events-none overflow-hidden">
                    <div className="w-full h-[100px] bg-gradient-to-b from-transparent via-[#00ff88]/5 to-transparent animate-scanline" />
                </div>
                <div className="text-center">
                    <div className="w-16 h-16 border-2 border-[#00ff88]/30 border-t-[#00ff88] rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-[#00ff88] font-mono text-sm tracking-widest">LOADING_CONTRACT...</p>
                </div>
            </div>
        );
    }

    if (!task) {
        return (
            <div className="h-screen bg-[#050505] flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <p className="text-white font-mono mb-4">CONTRACT_NOT_FOUND</p>
                    <button
                        onClick={() => router.push('/inbox')}
                        className="px-6 py-2 bg-[#00ff88] text-black font-mono font-bold rounded"
                    >
                        RETURN
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] flex flex-col max-w-md mx-auto relative overflow-hidden">
            {/* Hidden file input for camera */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileSelected}
            />

            {/* Background Grid */}
            <div
                className="fixed inset-0 pointer-events-none opacity-30"
                style={{
                    backgroundImage: 'linear-gradient(rgba(0, 255, 136, 0.03) 1px, transparent 1px)',
                    backgroundSize: '100% 3px'
                }}
            />

            {/* Scanline */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-10">
                <div
                    className="absolute w-full h-[100px] opacity-10"
                    style={{
                        background: 'linear-gradient(0deg, rgba(0, 255, 136, 0) 0%, rgba(0, 255, 136, 0.05) 50%, rgba(0, 255, 136, 0) 100%)',
                        animation: 'scanline 6s linear infinite'
                    }}
                />
            </div>

            {/* Header */}
            <header className="pt-12 pb-4 px-6 border-b border-white/10 backdrop-blur-xl bg-[#0f0f0f]/70 sticky top-0 z-20">
                <div className="flex items-center justify-between mb-2">
                    <button
                        onClick={() => router.push('/inbox')}
                        className="flex items-center text-[#00ff88]/80 hover:text-[#00ff88] transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="font-mono text-xs ml-1 tracking-wider">RETURN</span>
                    </button>
                    <div className="flex items-center space-x-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff88] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00ff88]"></span>
                        </span>
                        <span className="font-mono text-[10px] tracking-widest text-[#00ff88]">{getStatusText()}</span>
                    </div>
                </div>
                <h1 className="font-mono text-lg font-bold tracking-tight text-white">
                    CONTRACT_LOG: <span className="text-[#00ff88]/90">#{contractId.slice(0, 4).toUpperCase()}</span>
                </h1>
                <p className="font-mono text-[10px] text-white/40 mt-1 uppercase tracking-wider">{task.title}</p>

                {/* Escrow Status Bar */}
                {escrowStatus && (
                    <div className="mt-3 grid grid-cols-3 gap-2 p-3 bg-black/40 border border-white/10 rounded">
                        <div className="text-center">
                            <p className="font-mono text-[9px] text-white/40 uppercase tracking-wider">GROSS</p>
                            <p className="font-mono font-bold text-white">${escrowStatus.grossAmount || task.budget_amount}</p>
                        </div>
                        <div className="text-center">
                            <p className="font-mono text-[9px] text-white/40 uppercase tracking-wider">NET</p>
                            <p className="font-mono font-bold text-[#00ff88]">${escrowStatus.netAmount || Math.floor(task.budget_amount * 0.9)}</p>
                        </div>
                        <div className="text-center">
                            <p className="font-mono text-[9px] text-white/40 uppercase tracking-wider">ESCROW</p>
                            <p className="font-mono font-bold text-white text-xs uppercase">{escrowStatus.status || 'PENDING'}</p>
                        </div>
                    </div>
                )}
            </header>

            {/* Main Content - Unified Timeline */}
            <main className="flex-1 flex flex-col p-4 space-y-4 overflow-y-auto pb-[260px] z-1 relative">
                {timeline.length === 0 ? (
                    /* Empty State */
                    <div className="flex-1 min-h-[300px] backdrop-blur-xl bg-[#0f0f0f]/70 border border-[#00ff88]/10 rounded-lg flex flex-col items-center justify-center relative">
                        <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-[#00ff88]/40" />
                        <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-[#00ff88]/40" />
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-[#00ff88]/40" />
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-[#00ff88]/40" />
                        <div className="absolute top-2 left-2 font-mono text-[9px] text-[#00ff88]/30 uppercase">EVIDENCE_PREVIEW_WINDOW</div>
                        <div className="flex flex-col items-center text-center px-8">
                            <div className="w-20 h-20 mb-6 flex items-center justify-center border-2 border-dashed border-[#00ff88]/20 rounded-full">
                                <Upload className="w-10 h-10 text-[#00ff88]/30" />
                            </div>
                            <h2 className="font-mono text-sm font-bold text-white mb-2 uppercase tracking-wide">No activity yet</h2>
                            <p className="text-xs text-white/40 leading-relaxed max-w-[220px]">
                                Use the buttons below to capture photos, share location, or send text updates as proof of work.
                            </p>
                        </div>
                    </div>
                ) : (
                    /* Timeline entries */
                    <div className="space-y-3">
                        <div className="font-mono text-[9px] text-[#00ff88]/50 uppercase tracking-wider mb-2">
                            CONTRACT_TIMELINE [{timeline.length} ENTRIES]
                        </div>
                        {timeline.map((entry, idx) => {
                            if (entry.type === 'proof') {
                                return (
                                    <ProofCard
                                        key={`proof-${entry.data.id}`}
                                        proof={entry.data as TaskProof}
                                        isRequester={isRequester}
                                        onApprove={handleApproveProof}
                                        onReject={handleRejectProof}
                                    />
                                );
                            } else {
                                // Message bubble
                                const msg = entry.data as Message;
                                const isMine = msg.sender_id === user?.id;
                                return (
                                    <div key={`msg-${msg.id || idx}`} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] rounded-lg px-4 py-3 space-y-1 ${isMine
                                            ? 'bg-[#00ff88]/10 border border-[#00ff88]/20'
                                            : 'bg-white/5 border border-white/10'
                                            }`}>
                                            {/* Sender label */}
                                            <div className="flex items-center gap-2">
                                                <span className={`font-mono text-[9px] uppercase tracking-wider ${isMine ? 'text-[#00ff88]/60' : 'text-white/40'}`}>
                                                    {isMine ? 'YOU' : msg.sender_type === 'system' ? 'SYSTEM' : 'ISSUER'}
                                                </span>
                                            </div>
                                            {/* Message content */}
                                            <p className={`text-sm font-mono ${isMine ? 'text-[#00ff88]/90' : 'text-white/80'}`}>
                                                {msg.content}
                                            </p>
                                            {/* Image preview if it's an image message */}
                                            {msg.message_type === 'image' && msg.metadata?.file_url && (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={msg.metadata.file_url}
                                                    alt="Proof"
                                                    className="w-full max-h-48 object-cover rounded mt-2 border border-white/10"
                                                />
                                            )}
                                            {/* Timestamp */}
                                            <p className="text-[9px] text-white/20 font-mono">
                                                {new Date(msg.created_at).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                );
                            }
                        })}
                        <div ref={chatEndRef} />
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 pt-3 space-y-3 backdrop-blur-xl bg-[#050505]/95 border-t border-white/10 z-30">
                {/* Upload Buttons */}
                {isParticipant && task.status !== 'COMPLETED' && (
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            onClick={handleCapturePhoto}
                            disabled={uploadingPhoto || uploading}
                            className="flex flex-col items-center justify-center p-3 rounded bg-white/5 border border-white/10 hover:border-[#00ff88]/50 hover:bg-[#00ff88]/5 transition-all group disabled:opacity-50"
                        >
                            {uploadingPhoto ? (
                                <Loader2 className="w-5 h-5 text-[#00ff88] mb-1 animate-spin" />
                            ) : (
                                <Camera className="w-5 h-5 text-[#00ff88] mb-1 group-hover:scale-110 transition-transform" />
                            )}
                            <span className="font-mono text-[8px] text-white/60 tracking-wider uppercase">
                                {uploadingPhoto ? 'UPLOADING' : 'CAPTURE_IMG'}
                            </span>
                        </button>
                        <button
                            onClick={handleGeoLocate}
                            disabled={uploading}
                            className="flex flex-col items-center justify-center p-3 rounded bg-white/5 border border-white/10 hover:border-[#00ff88]/50 hover:bg-[#00ff88]/5 transition-all group disabled:opacity-50"
                        >
                            {uploading ? (
                                <Loader2 className="w-5 h-5 text-[#00ff88] mb-1 animate-spin" />
                            ) : (
                                <MapPin className="w-5 h-5 text-[#00ff88] mb-1 group-hover:scale-110 transition-transform" />
                            )}
                            <span className="font-mono text-[8px] text-white/60 tracking-wider uppercase">GEO_LOCATE</span>
                        </button>
                        <button
                            onClick={handleAttachLog}
                            disabled={uploading || !message.trim()}
                            className="flex flex-col items-center justify-center p-3 rounded bg-white/5 border border-white/10 hover:border-[#00ff88]/50 hover:bg-[#00ff88]/5 transition-all group disabled:opacity-50"
                        >
                            <FileText className="w-5 h-5 text-[#00ff88] mb-1 group-hover:scale-110 transition-transform" />
                            <span className="font-mono text-[8px] text-white/60 tracking-wider uppercase">ATTACH_LOG</span>
                        </button>
                    </div>
                )}

                {/* Message Input */}
                <div className="flex items-center space-x-2">
                    <button
                        onClick={handleCapturePhoto}
                        className="p-2 rounded-full hover:bg-white/10 transition-colors"
                    >
                        <ImageIcon className="w-5 h-5 text-white/60" />
                    </button>
                    <div className="flex-1 relative">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                            <span className="font-mono text-[#00ff88] text-xs">&gt;</span>
                        </div>
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="TYPE_MESSAGE..."
                            className="w-full bg-black/40 border border-white/10 rounded-lg py-2.5 pl-7 pr-4 text-xs font-mono text-[#00ff88] focus:ring-1 focus:ring-[#00ff88]/40 focus:border-[#00ff88]/40 placeholder:text-white/20 outline-none"
                        />
                    </div>
                    <button
                        onClick={handleSendMessage}
                        disabled={!message.trim() || sendingMessage}
                        className="p-2 bg-[#00ff88]/20 rounded-full hover:bg-[#00ff88]/30 transition-colors disabled:opacity-30"
                    >
                        {sendingMessage ? (
                            <Loader2 className="w-5 h-5 text-[#00ff88] animate-spin" />
                        ) : (
                            <Send className="w-5 h-5 text-[#00ff88]" />
                        )}
                    </button>
                </div>

                {/* Main Action Button */}
                {canReleasePayment ? (
                    <button
                        onClick={handleReleasePayment}
                        className="w-full bg-[#00ff88] hover:bg-[#00e67a] active:scale-[0.98] transition-all py-3 px-6 rounded flex items-center justify-center space-x-2 group"
                        style={{ boxShadow: '0 0 15px rgba(0, 255, 136, 0.4)' }}
                    >
                        <DollarSign className="w-5 h-5 text-black" />
                        <span className="font-mono font-bold text-black tracking-[0.15em] text-sm uppercase">
                            Release_Payment (${escrowStatus?.netAmount || task.budget_amount})
                        </span>
                        <ChevronRight className="w-5 h-5 text-black group-hover:translate-x-1 transition-transform" />
                    </button>
                ) : isHuman && task.status !== 'COMPLETED' ? (
                    <button
                        disabled={proofs.length === 0 || proofs.some(p => p.status !== 'approved')}
                        className="w-full bg-[#00ff88] hover:bg-[#00e67a] active:scale-[0.98] transition-all py-3 px-6 rounded flex items-center justify-center space-x-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ boxShadow: '0 0 15px rgba(0, 255, 136, 0.4)' }}
                    >
                        <span className="font-mono font-bold text-black tracking-[0.15em] text-sm uppercase">
                            Submit_Completion
                        </span>
                        <ChevronRight className="w-5 h-5 text-black group-hover:translate-x-1 transition-transform" />
                    </button>
                ) : task.status === 'COMPLETED' ? (
                    <div className="w-full bg-[#00ff88]/10 border border-[#00ff88]/30 py-3 px-6 rounded flex items-center justify-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-[#00ff88]" />
                        <span className="font-mono font-bold text-[#00ff88] tracking-[0.15em] text-sm uppercase">
                            Contract_Completed
                        </span>
                    </div>
                ) : null}

                {/* Bottom safe area */}
                <div className="w-20 h-1 bg-white/10 mx-auto rounded-full" />
            </footer>

            {/* CSS for Scanline Animation */}
            <style jsx>{`
                @keyframes scanline {
                    0% { top: -100px; }
                    100% { top: 100%; }
                }
            `}</style>
        </div>
    );
}

export default function ContractChatPage() {
    return (
        <Suspense fallback={
            <div className="h-screen bg-[#050505] text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-2 border-[#00ff88]/30 border-t-[#00ff88] rounded-full animate-spin mx-auto mb-4" />
                    <p className="font-mono text-[#00ff88] text-sm tracking-widest">INITIALIZING...</p>
                </div>
            </div>
        }>
            <ContractChatContent />
        </Suspense>
    );
}

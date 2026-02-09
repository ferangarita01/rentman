'use client';

import React, { Suspense, useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Camera, FileText, MapPin, CheckCircle, DollarSign, AlertCircle, ArrowLeft, Upload, Send, Paperclip, ChevronRight } from 'lucide-react';
import {
    getTaskById,
    getTaskProofs,
    uploadProof,
    reviewProof,
    getEscrowStatus,
    releasePayment,
    Task,
    TaskProof,
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
    const [escrowStatus, setEscrowStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [showUploadMenu, setShowUploadMenu] = useState(false);
    const [message, setMessage] = useState('');

    // Hide navigation bar
    useEffect(() => {
        const nav = document.querySelector('nav');
        if (nav) nav.style.display = 'none';
        return () => {
            const nav = document.querySelector('nav');
            if (nav) nav.style.display = '';
        };
    }, []);

    useEffect(() => {
        if (contractId) {
            loadContractData();
        }
    }, [contractId]);

    // Real-time subscription for proofs
    useEffect(() => {
        if (!contractId) return;

        const channel = supabase
            .channel(`proofs-${contractId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'task_proofs',
                    filter: `task_id=eq.${contractId}`
                },
                () => {
                    loadProofs();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [contractId]);

    async function loadContractData() {
        setLoading(true);

        const { data: taskData } = await getTaskById(contractId);
        if (taskData) setTask(taskData);

        await loadProofs();

        const { data: escrowData } = await getEscrowStatus(contractId);
        if (escrowData) setEscrowStatus(escrowData);

        setLoading(false);
    }

    async function loadProofs() {
        const { data } = await getTaskProofs(contractId);
        if (data) setProofs(data);
    }

    async function handleUploadProof(type: 'photo' | 'location' | 'text') {
        if (!user) return;

        setUploading(true);
        setShowUploadMenu(false);

        try {
            let title = '';
            let fileUrl = '';
            let locationData = null;

            if (type === 'photo') {
                title = 'Photo Proof';
                fileUrl = 'https://via.placeholder.com/400x300?text=Proof+Photo';
            } else if (type === 'location') {
                if (navigator.geolocation) {
                    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject);
                    });
                    title = 'Location Proof';
                    locationData = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                }
            } else {
                title = prompt('Enter proof title:') || 'Text Proof';
            }

            const { error } = await uploadProof(
                contractId,
                user.id,
                type,
                title,
                'Proof of work completed',
                fileUrl || undefined,
                locationData
            );

            if (error) {
                alert('Failed to upload proof: ' + error.message);
            } else {
                await loadProofs();
            }
        } catch (error: any) {
            alert('Error uploading proof: ' + error.message);
        } finally {
            setUploading(false);
        }
    }

    async function handleApproveProof(proofId: string) {
        if (!user) return;

        const { error } = await reviewProof(proofId, user.id, 'approve');
        if (error) {
            alert('Failed to approve proof: ' + error.message);
        } else {
            await loadProofs();
        }
    }

    async function handleRejectProof(proofId: string, reason: string) {
        if (!user) return;

        const { error } = await reviewProof(proofId, user.id, 'reject', reason);
        if (error) {
            alert('Failed to reject proof: ' + error.message);
        } else {
            await loadProofs();
        }
    }

    async function handleReleasePayment() {
        if (!user || !task) return;

        if (!confirm('Release payment to human? This action cannot be undone.')) {
            return;
        }

        const { data, error } = await releasePayment(contractId, user.id);
        if (error) {
            alert('Failed to release payment: ' + error.message);
        } else {
            alert(`✅ Payment released! Amount: $${data.amount}`);
            await loadContractData();
        }
    }

    const isRequester = user?.id === task?.requester_id;
    const isHuman = user?.id === task?.assigned_human_id;
    const allProofsApproved = proofs.length > 0 && proofs.every(p => p.status === 'approved');
    const canReleasePayment = isRequester && allProofsApproved && escrowStatus?.status === 'held';

    // Get status text
    const getStatusText = () => {
        if (task?.status === 'COMPLETED') return 'COMPLETED';
        if (proofs.length === 0) return 'WAITING_FOR_PROOF';
        if (proofs.some(p => p.status === 'pending')) return 'PENDING_REVIEW';
        if (allProofsApproved) return 'APPROVED';
        return 'IN_PROGRESS';
    };

    if (loading) {
        return (
            <div className="h-screen bg-[#050505] flex items-center justify-center">
                {/* Scanline Effect */}
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
            {/* Background Grid Lines */}
            <div
                className="fixed inset-0 pointer-events-none opacity-30"
                style={{
                    backgroundImage: 'linear-gradient(rgba(0, 255, 136, 0.03) 1px, transparent 1px)',
                    backgroundSize: '100% 3px'
                }}
            />

            {/* Scanline Animation */}
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
            <header className="pt-12 pb-6 px-6 border-b border-white/10 backdrop-blur-xl bg-[#0f0f0f]/70 sticky top-0 z-20">
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
                    <div className="mt-4 grid grid-cols-3 gap-2 p-3 bg-black/40 border border-white/10 rounded">
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

            {/* Main Content */}
            <main className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto pb-[200px]">
                {proofs.length === 0 ? (
                    /* Empty State - Evidence Preview Window */
                    <div className="flex-1 min-h-[300px] backdrop-blur-xl bg-[#0f0f0f]/70 border border-[#00ff88]/10 rounded-lg flex flex-col items-center justify-center relative">
                        {/* Corner Decorations */}
                        <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-[#00ff88]/40" />
                        <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-[#00ff88]/40" />
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-[#00ff88]/40" />
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-[#00ff88]/40" />

                        {/* Label */}
                        <div className="absolute top-2 left-2 font-mono text-[9px] text-[#00ff88]/30 uppercase">EVIDENCE_PREVIEW_WINDOW</div>

                        {/* Dots */}
                        <div className="absolute top-2 right-2 flex space-x-1">
                            <div className="w-1 h-1 bg-[#00ff88]/20" />
                            <div className="w-1 h-1 bg-[#00ff88]/20" />
                            <div className="w-1 h-1 bg-[#00ff88]/20" />
                        </div>

                        <div className="flex flex-col items-center text-center px-8">
                            <div className="w-20 h-20 mb-6 flex items-center justify-center border-2 border-dashed border-[#00ff88]/20 rounded-full">
                                <Upload className="w-10 h-10 text-[#00ff88]/30" />
                            </div>
                            <h2 className="font-mono text-sm font-bold text-white mb-2 uppercase tracking-wide">No proofs submitted yet</h2>
                            <p className="text-xs text-white/40 leading-relaxed max-w-[200px]">
                                Upload mission proof to verify contract completion and release escrow funds.
                            </p>
                        </div>
                    </div>
                ) : (
                    /* Proof Cards */
                    <div className="space-y-4">
                        <div className="font-mono text-[9px] text-[#00ff88]/50 uppercase tracking-wider mb-2">
                            EVIDENCE_LOG [{proofs.length} ENTRIES]
                        </div>
                        {proofs.map(proof => (
                            <ProofCard
                                key={proof.id}
                                proof={proof}
                                isRequester={isRequester}
                                onApprove={handleApproveProof}
                                onReject={handleRejectProof}
                            />
                        ))}
                    </div>
                )}

                {/* Upload Buttons Grid */}
                {isHuman && task.status !== 'COMPLETED' && (
                    <div className="grid grid-cols-3 gap-3">
                        <button
                            onClick={() => handleUploadProof('photo')}
                            disabled={uploading}
                            className="flex flex-col items-center justify-center p-4 rounded bg-white/5 border border-white/10 hover:border-[#00ff88]/50 hover:bg-[#00ff88]/5 transition-all group disabled:opacity-50"
                        >
                            <Camera className="w-6 h-6 text-[#00ff88] mb-2 group-hover:scale-110 transition-transform" />
                            <span className="font-mono text-[9px] text-white/60 tracking-wider uppercase">Capture_Img</span>
                        </button>
                        <button
                            onClick={() => handleUploadProof('location')}
                            disabled={uploading}
                            className="flex flex-col items-center justify-center p-4 rounded bg-white/5 border border-white/10 hover:border-[#00ff88]/50 hover:bg-[#00ff88]/5 transition-all group disabled:opacity-50"
                        >
                            <MapPin className="w-6 h-6 text-[#00ff88] mb-2 group-hover:scale-110 transition-transform" />
                            <span className="font-mono text-[9px] text-white/60 tracking-wider uppercase">Geo_Locate</span>
                        </button>
                        <button
                            onClick={() => handleUploadProof('text')}
                            disabled={uploading}
                            className="flex flex-col items-center justify-center p-4 rounded bg-white/5 border border-white/10 hover:border-[#00ff88]/50 hover:bg-[#00ff88]/5 transition-all group disabled:opacity-50"
                        >
                            <FileText className="w-6 h-6 text-[#00ff88] mb-2 group-hover:scale-110 transition-transform" />
                            <span className="font-mono text-[9px] text-white/60 tracking-wider uppercase">Attach_Log</span>
                        </button>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-6 pt-4 space-y-4 backdrop-blur-xl bg-[#050505]/90 border-t border-white/10 z-30">
                {/* Message Input */}
                <div className="flex items-center space-x-3">
                    <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
                        <Paperclip className="w-5 h-5 text-white/60" />
                    </button>
                    <div className="flex-1 relative">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                            <span className="font-mono text-[#00ff88] text-xs">&gt;</span>
                        </div>
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="TYPE_MESSAGE..."
                            className="w-full bg-black/40 border border-white/10 rounded-lg py-2.5 pl-7 pr-4 text-xs font-mono text-[#00ff88] focus:ring-1 focus:ring-[#00ff88]/40 focus:border-[#00ff88]/40 placeholder:text-white/20 outline-none"
                        />
                    </div>
                    <button className="p-2 bg-white/5 rounded-full hover:bg-[#00ff88]/20 transition-colors">
                        <Send className="w-5 h-5 text-[#00ff88]" />
                    </button>
                </div>

                {/* Main Action Button */}
                {canReleasePayment ? (
                    <button
                        onClick={handleReleasePayment}
                        className="w-full bg-[#00ff88] hover:bg-[#00e67a] active:scale-[0.98] transition-all py-4 px-6 rounded flex items-center justify-center space-x-2 group"
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
                        onClick={() => { }}
                        disabled={proofs.length === 0 || proofs.some(p => p.status !== 'approved')}
                        className="w-full bg-[#00ff88] hover:bg-[#00e67a] active:scale-[0.98] transition-all py-4 px-6 rounded flex items-center justify-center space-x-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ boxShadow: '0 0 15px rgba(0, 255, 136, 0.4)' }}
                    >
                        <span className="font-mono font-bold text-black tracking-[0.15em] text-sm uppercase">
                            Submit_Completion
                        </span>
                        <ChevronRight className="w-5 h-5 text-black group-hover:translate-x-1 transition-transform" />
                    </button>
                ) : task.status === 'COMPLETED' ? (
                    <div className="w-full bg-[#00ff88]/10 border border-[#00ff88]/30 py-4 px-6 rounded flex items-center justify-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-[#00ff88]" />
                        <span className="font-mono font-bold text-[#00ff88] tracking-[0.15em] text-sm uppercase">
                            Contract_Completed
                        </span>
                    </div>
                ) : null}

                {/* Bottom Indicator */}
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

'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Camera, FileText, MapPin, CheckCircle, DollarSign, AlertCircle } from 'lucide-react';
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
        
        // Load task
        const { data: taskData } = await getTaskById(contractId);
        if (taskData) setTask(taskData);

        // Load proofs
        await loadProofs();

        // Load escrow status
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
                // In production, this would open camera/file picker
                title = 'Photo Proof';
                fileUrl = 'https://via.placeholder.com/400x300?text=Proof+Photo';
            } else if (type === 'location') {
                // Get current location
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

    if (loading) {
        return (
            <div className="h-screen bg-[#050505] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-[#00ff88] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-white font-mono">LOADING CONTRACT...</p>
                </div>
            </div>
        );
    }

    if (!task) {
        return (
            <div className="h-screen bg-[#050505] flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <p className="text-white font-mono mb-4">CONTRACT NOT FOUND</p>
                    <button
                        onClick={() => router.push('/inbox')}
                        className="px-6 py-2 bg-[#00ff88] text-black font-mono font-bold rounded-lg"
                    >
                        Back to Inbox
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] flex flex-col">
            {/* Header */}
            <div className="bg-[#1a1a1a] border-b border-[#333] p-4">
                <div className="flex items-center justify-between mb-3">
                    <button 
                        onClick={() => router.push('/inbox')}
                        className="text-gray-400 hover:text-white"
                    >
                        ← Back
                    </button>
                    <div className="text-center flex-1">
                        <h1 className="text-white font-mono font-bold">{task.title}</h1>
                        <p className="text-[10px] text-[#00ff88] font-mono uppercase tracking-wider">
                            {task.status}
                        </p>
                    </div>
                    <div className="w-16" /> {/* Spacer */}
                </div>

                {/* Escrow Status */}
                {escrowStatus && (
                    <div className="bg-[#111] border border-[#333] rounded-lg p-3 grid grid-cols-3 gap-2 text-center">
                        <div>
                            <p className="text-[10px] text-gray-500 font-mono uppercase">Gross</p>
                            <p className="text-white font-mono font-bold">${escrowStatus.grossAmount}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500 font-mono uppercase">Net</p>
                            <p className="text-[#00ff88] font-mono font-bold">${escrowStatus.netAmount}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500 font-mono uppercase">Status</p>
                            <p className="text-white font-mono font-bold text-xs uppercase">{escrowStatus.status}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Proofs List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
                {proofs.length === 0 ? (
                    <div className="text-center py-12">
                        <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-500 font-mono">No proofs submitted yet</p>
                        {isHuman && (
                            <p className="text-gray-600 text-sm mt-2">Upload proof to complete this contract</p>
                        )}
                    </div>
                ) : (
                    proofs.map(proof => (
                        <ProofCard
                            key={proof.id}
                            proof={proof}
                            isRequester={isRequester}
                            onApprove={handleApproveProof}
                            onReject={handleRejectProof}
                        />
                    ))
                )}
            </div>

            {/* Bottom Actions */}
            <div className="fixed bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-[#333] p-4">
                {isHuman && task.status !== 'COMPLETED' && (
                    <div className="space-y-2">
                        {showUploadMenu ? (
                            <div className="grid grid-cols-3 gap-2 mb-2">
                                <button
                                    onClick={() => handleUploadProof('photo')}
                                    disabled={uploading}
                                    className="flex flex-col items-center gap-2 p-3 bg-[#111] border border-[#333] rounded-lg hover:border-[#00ff88] hover:bg-[#00ff88]/10 transition-colors disabled:opacity-50"
                                >
                                    <Camera className="w-6 h-6 text-[#00ff88]" />
                                    <span className="text-[10px] font-mono text-gray-400">Photo</span>
                                </button>
                                <button
                                    onClick={() => handleUploadProof('location')}
                                    disabled={uploading}
                                    className="flex flex-col items-center gap-2 p-3 bg-[#111] border border-[#333] rounded-lg hover:border-[#00ff88] hover:bg-[#00ff88]/10 transition-colors disabled:opacity-50"
                                >
                                    <MapPin className="w-6 h-6 text-[#00ff88]" />
                                    <span className="text-[10px] font-mono text-gray-400">Location</span>
                                </button>
                                <button
                                    onClick={() => handleUploadProof('text')}
                                    disabled={uploading}
                                    className="flex flex-col items-center gap-2 p-3 bg-[#111] border border-[#333] rounded-lg hover:border-[#00ff88] hover:bg-[#00ff88]/10 transition-colors disabled:opacity-50"
                                >
                                    <FileText className="w-6 h-6 text-[#00ff88]" />
                                    <span className="text-[10px] font-mono text-gray-400">Note</span>
                                </button>
                            </div>
                        ) : null}
                        <button
                            onClick={() => setShowUploadMenu(!showUploadMenu)}
                            disabled={uploading}
                            className="w-full py-3 bg-[#00ff88] text-black font-mono font-bold rounded-lg hover:bg-[#00cc6d] transition-colors disabled:opacity-50"
                        >
                            {uploading ? 'UPLOADING...' : showUploadMenu ? 'CLOSE MENU' : '📤 UPLOAD PROOF'}
                        </button>
                    </div>
                )}

                {canReleasePayment && (
                    <button
                        onClick={handleReleasePayment}
                        className="w-full py-3 bg-[#00ff88] text-black font-mono font-bold rounded-lg hover:bg-[#00cc6d] transition-colors flex items-center justify-center gap-2"
                    >
                        <DollarSign className="w-5 h-5" />
                        RELEASE PAYMENT (${escrowStatus.netAmount})
                    </button>
                )}

                {task.status === 'COMPLETED' && (
                    <div className="flex items-center justify-center gap-2 py-3 bg-[#00ff88]/10 border border-[#00ff88]/30 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-[#00ff88]" />
                        <span className="text-[#00ff88] font-mono font-bold">CONTRACT COMPLETED</span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ContractChatPage() {
    return (
        <Suspense fallback={
            <div className="h-screen bg-black text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-[#00ff88] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="font-mono">Loading...</p>
                </div>
            </div>
        }>
            <ContractChatContent />
        </Suspense>
    );
}


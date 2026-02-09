'use client';

import React from 'react';
import { Camera, MapPin, FileText, CheckCircle, XCircle, Clock, Sparkles } from 'lucide-react';
import { TaskProof } from '@/lib/supabase-client';

interface ProofCardProps {
    proof: TaskProof;
    isRequester: boolean;
    onApprove?: (proofId: string) => void;
    onReject?: (proofId: string, reason: string) => void;
}

export default function ProofCard({ proof, isRequester, onApprove, onReject }: ProofCardProps) {
    const [showRejectModal, setShowRejectModal] = React.useState(false);
    const [rejectionReason, setRejectionReason] = React.useState('');

    const getIcon = () => {
        switch (proof.proof_type) {
            case 'photo':
            case 'video':
                return <Camera className="w-5 h-5" />;
            case 'location':
                return <MapPin className="w-5 h-5" />;
            case 'document':
            case 'text':
                return <FileText className="w-5 h-5" />;
            default:
                return <FileText className="w-5 h-5" />;
        }
    };

    const getStatusBadge = () => {
        switch (proof.status) {
            case 'approved':
                return (
                    <div className="flex items-center gap-1 px-2 py-1 bg-[#00ff88]/20 border border-[#00ff88]/30 rounded-md">
                        <CheckCircle className="w-3 h-3 text-[#00ff88]" />
                        <span className="text-[10px] font-mono text-[#00ff88] uppercase">Approved</span>
                    </div>
                );
            case 'rejected':
                return (
                    <div className="flex items-center gap-1 px-2 py-1 bg-red-500/20 border border-red-500/30 rounded-md">
                        <XCircle className="w-3 h-3 text-red-400" />
                        <span className="text-[10px] font-mono text-red-400 uppercase">Rejected</span>
                    </div>
                );
            case 'pending':
                return (
                    <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-md">
                        <Clock className="w-3 h-3 text-yellow-400" />
                        <span className="text-[10px] font-mono text-yellow-400 uppercase">Pending</span>
                    </div>
                );
            default:
                return null;
        }
    };

    const handleReject = () => {
        if (!rejectionReason.trim()) {
            alert('Please provide a reason for rejection');
            return;
        }
        onReject?.(proof.id, rejectionReason);
        setShowRejectModal(false);
        setRejectionReason('');
    };

    const autoApproveTime = new Date(proof.created_at);
    autoApproveTime.setHours(autoApproveTime.getHours() + 24);
    const hoursUntilAutoApprove = Math.max(0, Math.round((autoApproveTime.getTime() - Date.now()) / (1000 * 60 * 60)));

    return (
        <>
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-[#00ff88]/10 border border-[#00ff88]/20 flex items-center justify-center text-[#00ff88]">
                            {getIcon()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-mono font-bold text-white text-sm mb-1">{proof.title}</h4>
                            {proof.description && (
                                <p className="text-xs text-gray-400 mb-2">{proof.description}</p>
                            )}
                            <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono">
                                <span>{new Date(proof.created_at).toLocaleDateString()}</span>
                                <span>•</span>
                                <span>{new Date(proof.created_at).toLocaleTimeString()}</span>
                            </div>
                        </div>
                    </div>
                    {getStatusBadge()}
                </div>

                {/* Preview */}
                {proof.file_url && (proof.proof_type === 'photo' || proof.proof_type === 'video') && (
                    <div className="relative rounded-lg overflow-hidden bg-[#111] border border-[#333]">
                        {proof.proof_type === 'photo' ? (
                            <img 
                                src={proof.file_url} 
                                alt={proof.title} 
                                className="w-full h-48 object-cover"
                            />
                        ) : (
                            <video 
                                src={proof.file_url} 
                                controls 
                                className="w-full h-48 object-cover"
                            />
                        )}
                    </div>
                )}

                {/* Location Preview */}
                {proof.proof_type === 'location' && proof.location_data && (
                    <div className="bg-[#111] border border-[#333] rounded-lg p-3">
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                            <MapPin className="w-4 h-4 text-[#00ff88]" />
                            <span className="font-mono">
                                {proof.location_data.lat?.toFixed(6)}, {proof.location_data.lng?.toFixed(6)}
                            </span>
                        </div>
                    </div>
                )}

                {/* AI Validation */}
                {proof.ai_validation && (
                    <div className="bg-[#00ff88]/5 border border-[#00ff88]/20 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-[#00ff88]" />
                            <span className="text-[10px] font-mono text-[#00ff88] uppercase">AI Validation</span>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-400">Confidence:</span>
                                <span className="text-white font-mono">{proof.ai_validation.confidence}%</span>
                            </div>
                            {proof.ai_validation.summary && (
                                <p className="text-xs text-gray-300 mt-2">{proof.ai_validation.summary}</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Rejection Reason */}
                {proof.status === 'rejected' && proof.rejection_reason && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                        <p className="text-xs text-red-400">
                            <strong className="font-mono">Rejected:</strong> {proof.rejection_reason}
                        </p>
                    </div>
                )}

                {/* Requester Actions */}
                {isRequester && proof.status === 'pending' && (
                    <div className="space-y-2 pt-2 border-t border-[#333]">
                        <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono mb-2">
                            <span>AUTO-APPROVE IN {hoursUntilAutoApprove}H</span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => onApprove?.(proof.id)}
                                className="flex-1 py-2 bg-[#00ff88] text-black font-mono font-bold text-sm rounded-lg hover:bg-[#00cc6d] transition-colors"
                            >
                                ✓ APPROVE
                            </button>
                            <button
                                onClick={() => setShowRejectModal(true)}
                                className="flex-1 py-2 bg-red-500/20 text-red-400 border border-red-500/30 font-mono font-bold text-sm rounded-lg hover:bg-red-500/30 transition-colors"
                            >
                                ✗ REJECT
                            </button>
                        </div>
                    </div>
                )}

                {/* Human sees pending status */}
                {!isRequester && proof.status === 'pending' && (
                    <div className="text-center text-xs text-gray-500 font-mono pt-2 border-t border-[#333]">
                        Awaiting requester approval ({hoursUntilAutoApprove}h until auto-approve)
                    </div>
                )}
            </div>

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 max-w-md w-full">
                        <h3 className="text-white font-mono font-bold mb-4">REJECT PROOF</h3>
                        <p className="text-gray-400 text-sm mb-4">
                            Please provide a reason for rejection:
                        </p>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="w-full bg-[#111] border border-[#333] rounded-lg p-3 text-white text-sm font-mono h-24 resize-none focus:border-[#00ff88] focus:outline-none"
                            placeholder="e.g., Photo does not show required item..."
                        />
                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={() => setShowRejectModal(false)}
                                className="flex-1 py-2 bg-[#333] text-white font-mono text-sm rounded-lg hover:bg-[#444] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                className="flex-1 py-2 bg-red-500 text-white font-mono font-bold text-sm rounded-lg hover:bg-red-600 transition-colors"
                            >
                                Reject Proof
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

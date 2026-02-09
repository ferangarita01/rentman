'use client';

import React from 'react';
import { Camera, MapPin, FileText, CheckCircle, XCircle, Clock, Sparkles, Shield } from 'lucide-react';
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

    const getStatusConfig = () => {
        switch (proof.status) {
            case 'approved':
                return {
                    icon: <CheckCircle className="w-3 h-3" />,
                    text: 'VERIFIED',
                    bgClass: 'bg-[#00ff88]/10 border-[#00ff88]/30',
                    textClass: 'text-[#00ff88]'
                };
            case 'rejected':
                return {
                    icon: <XCircle className="w-3 h-3" />,
                    text: 'REJECTED',
                    bgClass: 'bg-red-500/10 border-red-500/30',
                    textClass: 'text-red-400'
                };
            case 'pending':
                return {
                    icon: <Clock className="w-3 h-3" />,
                    text: 'PENDING',
                    bgClass: 'bg-yellow-500/10 border-yellow-500/30',
                    textClass: 'text-yellow-400'
                };
            default:
                return {
                    icon: <Clock className="w-3 h-3" />,
                    text: 'UNKNOWN',
                    bgClass: 'bg-white/10 border-white/30',
                    textClass: 'text-white/60'
                };
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

    const statusConfig = getStatusConfig();

    return (
        <>
            <div className="backdrop-blur-xl bg-[#0f0f0f]/70 border border-[#00ff88]/10 rounded-lg p-4 space-y-3 relative">
                {/* Corner Decorations */}
                <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-[#00ff88]/30" />
                <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-[#00ff88]/30" />
                <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-[#00ff88]/30" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-[#00ff88]/30" />

                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                        <div className="w-10 h-10 rounded bg-[#00ff88]/10 border border-[#00ff88]/20 flex items-center justify-center text-[#00ff88]">
                            {getIcon()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-mono font-bold text-white text-sm mb-1 uppercase tracking-wide">{proof.title}</h4>
                            {proof.description && (
                                <p className="text-xs text-white/40 mb-2">{proof.description}</p>
                            )}
                            <div className="flex items-center gap-2 text-[9px] text-white/30 font-mono uppercase tracking-wider">
                                <span>{new Date(proof.created_at).toLocaleDateString()}</span>
                                <span className="text-[#00ff88]/30">|</span>
                                <span>{new Date(proof.created_at).toLocaleTimeString()}</span>
                            </div>
                        </div>
                    </div>
                    {/* Status Badge */}
                    <div className={`flex items-center gap-1.5 px-2 py-1 border rounded ${statusConfig.bgClass}`}>
                        <span className={statusConfig.textClass}>{statusConfig.icon}</span>
                        <span className={`text-[9px] font-mono tracking-wider ${statusConfig.textClass}`}>{statusConfig.text}</span>
                    </div>
                </div>

                {/* Preview */}
                {proof.file_url && (proof.proof_type === 'photo' || proof.proof_type === 'video') && (
                    <div className="relative rounded overflow-hidden bg-black/40 border border-white/10">
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
                        {/* Overlay */}
                        <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 rounded">
                            <span className="font-mono text-[9px] text-[#00ff88]/70 uppercase tracking-wider">
                                {proof.proof_type === 'photo' ? 'IMG_CAPTURE' : 'VID_CAPTURE'}
                            </span>
                        </div>
                    </div>
                )}

                {/* Location Preview */}
                {proof.proof_type === 'location' && proof.location_data && (
                    <div className="bg-black/40 border border-white/10 rounded p-3">
                        <div className="flex items-center gap-2 text-sm text-white/80">
                            <MapPin className="w-4 h-4 text-[#00ff88]" />
                            <span className="font-mono text-xs tracking-wide">
                                {proof.location_data.lat?.toFixed(6)}, {proof.location_data.lng?.toFixed(6)}
                            </span>
                        </div>
                        <div className="mt-2 font-mono text-[9px] text-white/30 uppercase tracking-wider">
                            GEO_COORDINATES_VERIFIED
                        </div>
                    </div>
                )}

                {/* AI Validation */}
                {proof.ai_validation && (
                    <div className="bg-[#00ff88]/5 border border-[#00ff88]/20 rounded p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-[#00ff88]" />
                            <span className="text-[9px] font-mono text-[#00ff88] uppercase tracking-wider">AI_VALIDATION</span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-white/40 font-mono">Confidence:</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-20 h-1.5 bg-black/40 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[#00ff88]"
                                            style={{ width: `${proof.ai_validation.confidence}%` }}
                                        />
                                    </div>
                                    <span className="text-white font-mono text-xs">{proof.ai_validation.confidence}%</span>
                                </div>
                            </div>
                            {proof.ai_validation.summary && (
                                <p className="text-xs text-white/50 mt-2 font-mono">{proof.ai_validation.summary}</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Rejection Reason */}
                {proof.status === 'rejected' && proof.rejection_reason && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <XCircle className="w-4 h-4 text-red-400" />
                            <span className="text-[9px] font-mono text-red-400 uppercase tracking-wider">REJECTION_REASON</span>
                        </div>
                        <p className="text-xs text-red-300/80 font-mono">{proof.rejection_reason}</p>
                    </div>
                )}

                {/* Requester Actions */}
                {isRequester && proof.status === 'pending' && (
                    <div className="space-y-3 pt-3 border-t border-white/10">
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] text-white/30 font-mono uppercase tracking-wider">
                                AUTO_APPROVE_IN: {hoursUntilAutoApprove}H
                            </span>
                            <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-yellow-500/50"
                                    style={{ width: `${(hoursUntilAutoApprove / 24) * 100}%` }}
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => onApprove?.(proof.id)}
                                className="flex-1 py-2.5 bg-[#00ff88] text-black font-mono font-bold text-xs rounded hover:bg-[#00e67a] transition-colors flex items-center justify-center gap-2"
                                style={{ boxShadow: '0 0 10px rgba(0, 255, 136, 0.3)' }}
                            >
                                <CheckCircle className="w-4 h-4" />
                                <span className="tracking-wider">VERIFY</span>
                            </button>
                            <button
                                onClick={() => setShowRejectModal(true)}
                                className="flex-1 py-2.5 bg-red-500/10 text-red-400 border border-red-500/30 font-mono font-bold text-xs rounded hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
                            >
                                <XCircle className="w-4 h-4" />
                                <span className="tracking-wider">REJECT</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Human sees pending status */}
                {!isRequester && proof.status === 'pending' && (
                    <div className="pt-3 border-t border-white/10">
                        <div className="flex items-center justify-center gap-2 text-[10px] text-white/40 font-mono">
                            <Shield className="w-4 h-4 text-yellow-500/50" />
                            <span className="uppercase tracking-wider">AWAITING_VERIFICATION ({hoursUntilAutoApprove}H UNTIL AUTO)</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
                    <div className="backdrop-blur-xl bg-[#0f0f0f]/90 border border-[#00ff88]/20 rounded-lg p-6 max-w-md w-full relative">
                        {/* Corner Decorations */}
                        <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-[#00ff88]/40" />
                        <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-[#00ff88]/40" />
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-[#00ff88]/40" />
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-[#00ff88]/40" />

                        <h3 className="text-white font-mono font-bold mb-4 uppercase tracking-wider">REJECT_PROOF</h3>
                        <p className="text-white/40 text-sm mb-4 font-mono">
                            Provide rejection reason:
                        </p>
                        <div className="relative mb-4">
                            <div className="absolute top-3 left-3 pointer-events-none">
                                <span className="font-mono text-[#00ff88] text-xs">&gt;</span>
                            </div>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 pl-7 text-white text-sm font-mono h-24 resize-none focus:border-[#00ff88]/40 focus:ring-1 focus:ring-[#00ff88]/40 outline-none placeholder:text-white/20"
                                placeholder="e.g., Evidence does not match requirements..."
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowRejectModal(false)}
                                className="flex-1 py-3 bg-white/5 text-white border border-white/10 font-mono text-sm rounded hover:bg-white/10 transition-colors uppercase tracking-wider"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                className="flex-1 py-3 bg-red-500 text-white font-mono font-bold text-sm rounded hover:bg-red-600 transition-colors uppercase tracking-wider"
                            >
                                Confirm_Reject
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

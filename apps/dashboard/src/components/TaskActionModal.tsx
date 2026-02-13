import React, { useState, useRef, useEffect } from 'react';
import { X, CheckCircle, XCircle, AlertTriangle, FileText, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Task {
    id: string;
    title: string;
    description: string;
    status: string;
    budget_amount: number;
    created_at: string;
    proof_url?: string; // Hypothetical field for proof
    proof_notes?: string;
    agent_id?: string;
}

interface TaskActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    task: Task | null;
    isEmployer: boolean; // True if current user owns the task
    onUpdate: () => void;
}

const TaskActionModal: React.FC<TaskActionModalProps> = ({ isOpen, onClose, task, isEmployer, onUpdate }) => {
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    // Dynamic WebMCP Attributes based on state
    useEffect(() => {
        if (isOpen && formRef.current && task) {
            let toolname = '';
            let description = '';

            if (isEmployer) {
                if (task.status === 'review') {
                    toolname = 'review_proof';
                    description = 'Review submitted proof. Action: "approve" or "reject".';
                } else if (task.status === 'completed') {
                    toolname = 'manage_contract_closure';
                    description = 'Finalize contract lifecycle. Action: "archive" or "dispute".';
                }
            } else {
                // Worker Side
                if (task.status === 'in_progress') {
                    toolname = 'submit_proof';
                    description = 'Submit proof of work for the assigned task.';
                }
            }

            if (toolname) {
                formRef.current.setAttribute('toolname', toolname);
                formRef.current.setAttribute('tooldescription', description);
                formRef.current.setAttribute('toolautosubmit', 'true');
            }
        }
    }, [isOpen, task, isEmployer]);

    if (!isOpen || !task) return null;

    const handleAction = async (action: string) => {
        setLoading(true);
        try {
            let updates: any = {};

            if (task.status === 'review') {
                if (action === 'approve') {
                    updates = { status: 'completed' }; // or 'payment_release'
                } else if (action === 'reject') {
                    updates = { status: 'in_progress' }; // Send back to worker
                }
            } else if (task.status === 'completed') {
                if (action === 'dispute') {
                    updates = { status: 'disputed' };
                }
            } else if (task.status === 'in_progress' && !isEmployer) {
                if (action === 'submit') {
                    updates = { status: 'review', proof_notes: notes };
                }
            }

            if (Object.keys(updates).length > 0) {
                const { error } = await supabase
                    .from('tasks')
                    .update(updates)
                    .eq('id', task.id);

                if (error) throw error;
                onUpdate();
                onClose();
            }
        } catch (err: any) {
            console.error('Error updating task:', err);
            alert(`Failed to update task: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl relative overflow-hidden">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors z-20"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="p-8">
                    <div className="flex items-center gap-3 mb-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest ${task.status === 'completed' ? 'bg-[#00ff88]/20 text-[#00ff88]' :
                                task.status === 'review' ? 'bg-yellow-500/20 text-yellow-500' :
                                    'bg-slate-800 text-slate-400'
                            }`}>
                            {task.status}
                        </span>
                        <h2 className="text-xl font-bold text-white font-mono">{task.title}</h2>
                    </div>

                    <p className="text-sm text-slate-400 font-mono mb-8 p-4 bg-[#111] rounded border border-white/5">
                        {task.description}
                    </p>

                    {/* Agent/Worker View - Submission */}
                    {!isEmployer && task.status === 'in_progress' && (
                        <form ref={formRef} onSubmit={(e) => { e.preventDefault(); handleAction('submit'); }} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">
                                    Proof of Work (URL / Notes)
                                </label>
                                <textarea
                                    name="proof_notes"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full bg-[#111] border border-white/10 text-white p-3 rounded font-mono text-sm focus:border-[#00ff88] outline-none"
                                    placeholder="Describe work done or paste URL..."
                                    required
                                />
                            </div>
                            <button type="submit" disabled={loading} className="w-full bg-[#00ff88] text-black py-3 rounded font-bold font-mono uppercase text-xs hover:bg-[#33ff99] transition-all">
                                Submit for Review
                            </button>
                        </form>
                    )}

                    {/* Employer View - Review */}
                    {isEmployer && task.status === 'review' && (
                        <form ref={formRef} className="space-y-6">
                            <div className="bg-[#111] p-4 rounded border border-white/10">
                                <h4 className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Submitted Proof</h4>
                                <p className="text-white font-mono text-sm">{task.proof_notes || 'No notes provided.'}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button" // Controlled by handleAction (WebMCP agent would use dedicated submit with name="action" value="reject" if we implemented strict form sub)
                                    // For hybrid, we can use buttons submitting the form with a value
                                    onClick={() => handleAction('reject')}
                                    className="py-4 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded font-mono text-xs uppercase font-bold flex items-center justify-center gap-2"
                                >
                                    <XCircle size={16} /> Reject / Request Changes
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleAction('approve')}
                                    className="py-4 bg-[#00ff88] text-black hover:bg-[#33ff99] rounded font-mono text-xs uppercase font-bold flex items-center justify-center gap-2"
                                >
                                    <CheckCircle size={16} /> Approve & Complete
                                </button>
                                {/* WebMCP Hidden Inputs for Agent Discoverability of Actions */}
                                <input type="hidden" name="action_options" value="approve,reject" />
                            </div>
                        </form>
                    )}

                    {/* Employer View - Finalize/Dispute */}
                    {isEmployer && (task.status === 'completed' || task.status === 'payment_released') && (
                        <form ref={formRef} className="mt-6 pt-6 border-t border-white/10">
                            <h3 className="text-[10px] text-slate-400 uppercase tracking-widest mb-4">Contract Governance</h3>
                            <button
                                type="button"
                                onClick={() => handleAction('dispute')}
                                className="w-full py-3 border border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 rounded font-mono text-xs uppercase font-bold flex items-center justify-center gap-2"
                            >
                                <AlertTriangle size={16} /> Impugn / Open Dispute
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TaskActionModal;

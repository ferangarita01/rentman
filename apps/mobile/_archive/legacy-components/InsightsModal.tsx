'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { XMarkIcon, SparklesIcon, ChartBarIcon, HeartIcon } from '@heroicons/react/24/outline';
import SentimentBadge from './SentimentBadge';
import PatternCard from './PatternCard';

// Rentman user context
interface RentmanContext {
    profile: {
        email: string;
        full_name: string | null;
        credits: number;
        is_agent: boolean;
    };
}

interface InsightsModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId?: string;
}

export default function InsightsModal({ isOpen, onClose, userId }: InsightsModalProps) {
    const [data, setData] = useState<RentmanContext | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            fetchInsights();
        }
    }, [isOpen]);

    const fetchInsights = async () => {
        setLoading(true);
        try {
            // Get current user if ID not provided
            let targetUserId = userId;
            if (!targetUserId) {
                const { data: { user } } = await supabase.auth.getUser();
                targetUserId = user?.id;
            }

            if (!targetUserId) {
                setLoading(false);
                return;
            }

            // Get Rentman profile data
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('email, full_name, credits, is_agent')
                .eq('id', targetUserId)
                .single();

            if (error) throw error;
            
            setData({
                profile: profile as any
            });

        } catch (err) {
            console.error('Error fetching Rentman profile:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div
                className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header - Sarah Orange Gradient */}
                <div style={{ background: 'var(--sarah-gradient-cta)' }} className="p-6 text-white shrink-0">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <SparklesIcon className="w-5 h-5 text-yellow-200" />
                                <h2 className="text-sm font-bold uppercase tracking-wider opacity-90">Expediente de Usuario</h2>
                            </div>
                            <h1 className="text-3xl font-bold">Lo que sé de ti</h1>
                            <p className="text-white/80 mt-1">
                                Mis notas personales para ser tu mejor coach.
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content - Scrollable */}
                <div className="overflow-y-auto p-6 space-y-8 custom-scrollbar bg-gray-50 flex-1">

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
                            <p className="text-gray-400 font-medium">Cargando perfil...</p>
                        </div>
                    ) : !data ? (
                        <div className="text-center py-12 text-gray-500">
                            No se encontró información de usuario.
                        </div>
                    ) : (
                        <>
                            {/* 1. User Profile Section - Rentman */}
                            <section className="grid md:grid-cols-2 gap-4">
                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                                    <div className="flex items-center gap-2 mb-3 text-orange-600 font-bold text-sm uppercase tracking-wide">
                                        <HeartIcon className="w-4 h-4" />
                                        Información de Usuario
                                    </div>
                                    <p className="text-gray-800 text-lg font-medium leading-relaxed">
                                        {data.profile?.email || "Sin correo"}
                                    </p>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {data.profile?.full_name && (
                                            <span className="px-3 py-1 bg-orange-50 text-orange-700 text-xs font-bold rounded-full uppercase">
                                                {data.profile.full_name}
                                            </span>
                                        )}
                                        <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase ${
                                            data.profile?.is_agent ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                                        }`}>
                                            {data.profile?.is_agent ? 'Agente' : 'Usuario'}
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                                    <div className="flex items-center gap-2 mb-3 text-blue-600 font-bold text-sm uppercase tracking-wide">
                                        <ChartBarIcon className="w-4 h-4" />
                                        Créditos
                                    </div>
                                    <div className="text-center p-3 bg-gray-50 rounded-xl">
                                        <div className="text-2xl font-bold text-gray-900">{data.profile?.credits || 0}</div>
                                        <div className="text-xs text-gray-500 font-medium uppercase mt-1">Créditos Disponibles</div>
                                    </div>
                                </div>
                            </section>

                            {/* Info Message */}
                            <section>
                                <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-gray-300">
                                    <p className="text-gray-600">Perfil de Rentman configurado correctamente.</p>
                                </div>
                            </section>

                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

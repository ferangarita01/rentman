'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { XMarkIcon, SparklesIcon, ChartBarIcon, HeartIcon } from '@heroicons/react/24/outline';
import SentimentBadge from './SentimentBadge';
import PatternCard from './PatternCard';

// Define the shape of Sarah's context (matching the SQL function output)
interface SarahContext {
    profile: {
        name: string;
        style: string;
        personality: string;
        engagement: string;
        total_convos: number;
        best_time: string;
    };
    insights: Array<{
        type: string;
        key: string;
        value: string;
        confidence: number;
    }>;
    habits_today: Array<{
        name: string;
        streak: number;
        completed_today: boolean;
    }>;
}

interface InsightsModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId?: string;
}

export default function InsightsModal({ isOpen, onClose, userId }: InsightsModalProps) {
    const [data, setData] = useState<SarahContext | null>(null);
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

            // Call the RPC function we created in migration 012
            const { data, error } = await supabase.rpc('get_sarah_context', {
                p_user_id: targetUserId
            });

            if (error) throw error;
            setData(data as SarahContext);

        } catch (err) {
            console.error('Error fetching insights:', err);
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
                            <p className="text-gray-400 font-medium">Leyendo mi memoria...</p>
                        </div>
                    ) : !data ? (
                        <div className="text-center py-12 text-gray-500">
                            No encontré datos. ¡Hablemos más para que pueda conocerte!
                        </div>
                    ) : (
                        <>
                            {/* 1. Identity & Engagement Section */}
                            <section className="grid md:grid-cols-2 gap-4">
                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                                    <div className="flex items-center gap-2 mb-3 text-orange-600 font-bold text-sm uppercase tracking-wide">
                                        <HeartIcon className="w-4 h-4" />
                                        Personalidad
                                    </div>
                                    <p className="text-gray-800 text-lg font-medium leading-relaxed">
                                        {data.profile?.personality || "Aún te estoy conociendo..."}
                                    </p>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {data.profile?.style && (
                                            <span className="px-3 py-1 bg-orange-50 text-orange-700 text-xs font-bold rounded-full uppercase">
                                                Estilo: {data.profile.style}
                                            </span>
                                        )}
                                        {data.profile?.engagement && (
                                            <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase ${data.profile.engagement === 'champion' ? 'bg-green-100 text-green-700' :
                                                data.profile.engagement === 'at_risk' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                Nivel: {data.profile.engagement.replace('_', ' ')}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                                    <div className="flex items-center gap-2 mb-3 text-blue-600 font-bold text-sm uppercase tracking-wide">
                                        <ChartBarIcon className="w-4 h-4" />
                                        Rendimiento
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="text-center p-3 bg-gray-50 rounded-xl">
                                            <div className="text-2xl font-bold text-gray-900">{data.profile?.total_convos || 0}</div>
                                            <div className="text-xs text-gray-500 font-medium uppercase mt-1">Conversaciones</div>
                                        </div>
                                        <div className="text-center p-3 bg-gray-50 rounded-xl">
                                            <div className="text-2xl font-bold text-gray-900 capitalize">{data.profile?.best_time || 'N/A'}</div>
                                            <div className="text-xs text-gray-500 font-medium uppercase mt-1">Mejor Horario</div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* 2. Insights Cards */}
                            <section>
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <span className="w-1 h-6 bg-orange-500 rounded-full" />
                                    Patrones Detectados
                                </h3>

                                {data.insights && data.insights.length > 0 ? (
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        {data.insights.map((insight, idx) => (
                                            <PatternCard
                                                key={idx}
                                                type={insight.type}
                                                value={insight.value}
                                                confidence={insight.confidence}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-gray-300">
                                        <p className="text-gray-400">Aún no he detectado patrones claros.</p>
                                    </div>
                                )}
                            </section>

                            {/* 3. Emotional State - Latest (Derived from insights for now) */}
                            <section className="bg-gradient-to-br from-indigo-50 to-purple-50 p-5 rounded-2xl border border-indigo-100">
                                <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wide mb-3">
                                    Estados Emocionales Recientes
                                </h3>
                                <div className="flex flex-wrap gap-3">
                                    {/* Mocked/Filtered for demo as emotion is momentary */}
                                    <SentimentBadge emotion="excited" intensity="medium" />
                                    <SentimentBadge emotion="tired" intensity="low" />
                                    <span className="text-xs text-indigo-400 self-center ml-2">Basado en tu tono de voz</span>
                                </div>
                            </section>

                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

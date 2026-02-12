'use client';

import { useState } from 'react';
import { CalendarIcon, ClockIcon, PaperAirplaneIcon, XMarkIcon } from '@heroicons/react/24/outline';

// Types for A2UI
interface Component {
    id: string;
    type: string;
    text?: string;
    label?: string;
    action?: string;
    children?: string[];
    child?: string;
    usageHint?: string;
    inputType?: string;
    path?: string;
    style?: string;
    distribution?: string;
    mode?: string;
    placeholder?: string;
    minDate?: string;
    maxDate?: string;
    slots?: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

export interface UISurface {
    surfaceId: string;
    type: string;
    components: Component[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    plans?: any[]; // For specific pricing UI
    paypalClientId?: string;
}

interface DynamicUIProps {
    surface: UISurface | null;
    onClose: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onAction: (action: string, data?: any) => void;
}

export default function DynamicUI({ surface, onClose, onAction }: DynamicUIProps) {
    if (!surface) return null;

    // Handle BESPOKE Pricing Plans UI (Phase 4 Special)
    if (surface.type === 'ui_plans') {
        return (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl p-4 max-h-[400px] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg">Planes de Coach</h3>
                    <button onClick={onClose}><XMarkIcon className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" /></button>
                </div>
                <div className="space-y-4">
                    {surface.plans?.map((plan: any) => (
                        <div key={plan.id} className={`border rounded-lg p-4 ${plan.recommended ? 'border-green-500 bg-green-500/10' : 'border-gray-200 dark:border-gray-700'}`}>
                            <div className="flex justify-between">
                                <h4 className="font-bold text-lg">{plan.name}</h4>
                                {plan.recommended && <span className="bg-green-500 text-black text-xs px-2 py-0.5 rounded-full font-bold">RECOMENDADO</span>}
                            </div>
                            <div className="text-2xl font-bold my-2">${plan.price} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">/mes</span></div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 italic mb-2">{plan.tagline}</p>
                            <ul className="text-sm space-y-1 mb-4">
                                {plan.features.map((f: string, i: number) => <li key={i}>• {f}</li>)}
                            </ul>
                            <button
                                onClick={() => onAction('select_plan', { planId: plan.id })}
                                className={`w-full py-2 rounded-lg font-bold text-sm ${plan.recommended ? 'bg-green-500 text-black' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'}`}
                            >
                                Seleccionar {plan.name}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Handle A2UI Standard Surfaces
    const { components, data: initialData } = surface;
    const [formData, setFormData] = useState(initialData || {});

    // Build Registry
    const registry = new Map<string, Component>();
    components?.forEach(c => registry.set(c.id, c));

    const handleInputChange = (path: string | undefined, value: string) => {
        if (!path) return;
        const key = path.replace('/', '').replace('/', '_'); // Simple mapping /form/name -> form_name
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setFormData((prev: any) => ({ ...prev, [key]: value }));
    };

    const renderComponent = (id: string): React.ReactNode => {
        const comp = registry.get(id);
        if (!comp) return null;

        switch (comp.type) {
            case 'Column':
                return (
                    <div key={id} className="flex flex-col gap-3" style={comp.style as any}>
                        {comp.children?.map(childId => renderComponent(childId))}
                    </div>
                );
            case 'Row':
                return (
                    <div key={id} className={`flex flex-row gap-2 ${comp.distribution === 'spaceEvenly' ? 'justify-evenly' : ''}`}>
                        {comp.children?.map(childId => renderComponent(childId))}
                    </div>
                );
            case 'Text':
                if (comp.usageHint === 'h1') return <h1 key={id} className="text-2xl font-bold text-gray-900 dark:text-white">{comp.text}</h1>;
                if (comp.usageHint === 'h2') return <h2 key={id} className="text-xl font-bold text-orange-500 dark:text-orange-400">{comp.text}</h2>;
                if (comp.usageHint === 'h3') return <h3 key={id} className="text-lg font-semibold text-gray-800 dark:text-gray-200">{comp.text}</h3>;
                return <p key={id} className="text-sm text-gray-600 dark:text-gray-300">{comp.text}</p>;

            case 'TextField':
                return (
                    <div key={id} className="flex flex-col gap-1">
                        {comp.label && <label className="text-xs text-gray-500 dark:text-gray-400">{comp.label}</label>}
                        <input
                            type={comp.inputType || 'text'}
                            placeholder={comp.placeholder}
                            className="bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm text-gray-900 dark:text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all placeholder:text-gray-400"
                            onChange={(e) => handleInputChange(comp.path, e.target.value)}
                        />
                    </div>
                );

            case 'Button':
                return (
                    <button
                        key={id}
                        onClick={() => onAction(comp.action || '', formData)}
                        className={`py-3 px-6 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-lg
                            ${comp.style === 'secondary'
                                ? 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-white/10'
                                : 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-[1.02]'}
                        `}
                    >
                        {comp.label}
                    </button>
                );

            case 'Card':
                return (
                    <div key={id} className="bg-white dark:bg-black/20 border border-gray-100 dark:border-white/5 rounded-2xl p-4 shadow-sm">
                        {comp.child ? renderComponent(comp.child) : null}
                    </div>
                );

            case 'DateTimeInput':
                return (
                    <div key={id} className="flex flex-col gap-2">
                        <label className="text-xs text-gray-500 dark:text-gray-400">{comp.label}</label>
                        <input
                            type={comp.mode === 'date' ? 'date' : comp.mode === 'time' ? 'time' : 'datetime-local'}
                            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-sm text-gray-900 dark:text-white"
                            onChange={(e) => handleInputChange(comp.path || 'date', e.target.value)}
                        />
                    </div>
                );

            case 'Slider':
                return (
                    <div key={id} className="flex flex-col gap-2">
                        <div className="flex justify-between">
                            <label className="text-xs text-gray-500 dark:text-gray-400">{comp.label}</label>
                            <span className="text-xs font-bold text-orange-500">{formData[comp.path?.replace(/\//g, '_') || id] || comp.defaultValue || 5}</span>
                        </div>
                        <input
                            type="range"
                            min={comp.min || 1}
                            max={comp.max || 10}
                            defaultValue={comp.defaultValue || 5}
                            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                            onChange={(e) => handleInputChange(comp.path, e.target.value)}
                        />
                        <div className="flex justify-between text-xs text-gray-400">
                            <span>{comp.minLabel || comp.min || 1}</span>
                            <span>{comp.maxLabel || comp.max || 10}</span>
                        </div>
                    </div>
                );

            case 'ButtonGroup':
                return (
                    <div key={id} className="flex flex-col gap-2">
                        {comp.label && <label className="text-xs text-gray-500 dark:text-gray-400">{comp.label}</label>}
                        <div className="flex gap-2">
                            {comp.options?.map((opt: any, i: number) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => handleInputChange(comp.path, opt.value)}
                                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all
                                        ${formData[comp.path?.replace(/\//g, '_') || id] === opt.value
                                            ? 'bg-orange-500 text-white shadow-lg'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    {opt.emoji && <span className="mr-1">{opt.emoji}</span>}
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                );

            case 'NumberStepper':
                const currentVal = parseInt(formData[comp.path?.replace(/\//g, '_') || id] || comp.defaultValue || '0');
                return (
                    <div key={id} className="flex flex-col gap-2">
                        {comp.label && <label className="text-xs text-gray-500 dark:text-gray-400">{comp.label}</label>}
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => handleInputChange(comp.path, String(Math.max(comp.min || 0, currentVal - 1)))}
                                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold text-xl hover:bg-gray-200 dark:hover:bg-gray-700"
                            >−</button>
                            <span className="text-2xl font-bold text-orange-500 min-w-[3ch] text-center">{currentVal}</span>
                            <button
                                type="button"
                                onClick={() => handleInputChange(comp.path, String(Math.min(comp.max || 99, currentVal + 1)))}
                                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold text-xl hover:bg-gray-200 dark:hover:bg-gray-700"
                            >+</button>
                            {comp.unit && <span className="text-sm text-gray-500">{comp.unit}</span>}
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    // Render Root
    const root = components?.find(c => c.id === 'root' || c.id.startsWith('card') || c.id.startsWith('badge')); // Heuristic for root
    const rootId = root ? root.id : components?.[0]?.id;

    return (
        <div className={`
            backdrop-blur-xl border rounded-2xl p-4 mt-2 mb-4 animate-in fade-in slide-in-from-bottom-4 shadow-2xl
            bg-white/90 dark:bg-gray-900/80
            border-white/20 dark:border-white/10
            shadow-gray-200/50 dark:shadow-black/50
        `}>
            <div className="flex justify-end mb-2">
                <button onClick={onClose}><XMarkIcon className="w-5 h-5 text-gray-400 hover:text-gray-900 dark:text-gray-500 dark:hover:text-white transition-colors" /></button>
            </div>
            {rootId ? renderComponent(rootId) : <p className="text-red-500">Error rendering UI</p>}
        </div>
    );
}

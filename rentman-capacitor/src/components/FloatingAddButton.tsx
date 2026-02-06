'use client';

import { PlusIcon } from 'lucide-react';

interface FloatingAddButtonProps {
    onClick: () => void;
}

export default function FloatingAddButton({ onClick }: FloatingAddButtonProps) {
    return (
        <div className="fixed bottom-24 w-full max-w-[440px] px-6 pointer-events-none left-1/2 -translate-x-1/2 z-40">
            <div className="relative w-full h-20">
                {/* Add Button */}
                <button
                    onClick={onClick}
                    className="pointer-events-auto absolute left-0 bottom-2 w-16 h-16 rounded-full bg-gradient-to-tr from-[#ff4d6d] to-[#ff758f] flex items-center justify-center shadow-lg shadow-pink-900/40 text-white active:scale-90 transition-transform"
                >
                    <PlusIcon className="w-8 h-8 stroke-[2.5]" />
                </button>
            </div>
        </div>
    );
}

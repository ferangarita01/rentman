'use client';

import React from 'react';
import { Sword, Sparkles, Globe } from 'lucide-react';

export const LoadingScreen = () => {
    return (
        <div className="bg-background text-foreground antialiased h-screen w-full flex flex-col items-center justify-center relative overflow-hidden selection:bg-secondary/20 selection:text-secondary">

            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px]"></div>
                {/* Subtle grid overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/80 to-background"></div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center">

                {/* Icon / Brand Mark */}
                <div className="relative group cursor-default">
                    {/* Glow behind icon */}
                    <div className="absolute -inset-0.5 bg-gradient-to-br from-primary to-secondary rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-700"></div>

                    {/* Icon Container */}
                    <div className="relative w-28 h-28 bg-card-bg rounded-2xl border border-white/10 shadow-2xl flex items-center justify-center overflow-hidden">

                        {/* Background Map Pattern inside Logo */}
                        <div className="absolute inset-0 opacity-20">
                            <Globe className="w-full h-full text-gray-500 stroke-[0.5] scale-150 rotate-12 origin-bottom-right" />
                        </div>

                        {/* Radial Gradient overlay inside logo */}
                        <div className="absolute inset-0 bg-gradient-to-t from-card-bg via-transparent to-transparent"></div>

                        {/* Main Icon Composite: Sword + Activity */}
                        <div className="relative flex items-center justify-center">
                            <Sword className="w-12 h-12 text-foreground stroke-[1.5] drop-shadow-lg z-10" />
                            <Sparkles className="absolute -top-3 -right-4 w-6 h-6 text-secondary stroke-[1.5] animate-pulse" />
                        </div>
                    </div>
                </div>

                {/* Typography */}
                <div className="mt-10 text-center space-y-2">
                    <h1 className="text-3xl font-medium tracking-tight text-white drop-shadow-sm">
                        Habit Coach
                    </h1>
                    <p className="text-lg text-gray-400 max-w-[280px] mx-auto leading-relaxed">
                        Forging discipline, <br /> one habit at a time.
                    </p>
                </div>

                {/* Loading State */}
                <div className="mt-14 w-full flex flex-col items-center gap-4">
                    {/* Custom Loader */}
                    <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary to-transparent w-full h-full animate-loader opacity-80"></div>
                    </div>

                    {/* Status Text */}
                    <span className="text-sm font-medium text-gray-500 tracking-wide uppercase text-[11px]">
                        Initializing Journey...
                    </span>
                </div>

            </div>

            {/* Footer / Version */}
            <div className="absolute bottom-8 text-gray-600 text-sm font-normal">
                <span className="opacity-50">v2.4.0</span>
            </div>

        </div>
    );
};

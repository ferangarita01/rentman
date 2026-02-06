'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import QuickCheckinModal from './QuickCheckinModal';
import {
    BarChart2,
    Moon,
    BrainCircuit,
    Zap,
    Footprints,
    Droplet,
    Salad,
    Pizza,
    ChevronDown,
    Lightbulb,
    TrendingUp
} from 'lucide-react';

interface WellnessDay {
    date: string;
    sleep_hours: number | null;
    sleep_quality: number | null;
    stress_level: number | null;
    energy_level: number | null;
    exercise_minutes: number | null;
    water_glasses: number | null;
    mood_overall: number | null;
    healthy_meals?: number | null;
    junk_food_count?: number | null;
}

interface Correlation {
    pattern: string;
    observation: string;
    recommendation: string;
}

interface WeekComparison {
    metric: string;
    thisWeek: number | null;
    lastWeek: number | null;
    change: number | null;
    trend: 'up' | 'down' | 'same';
    isGood: boolean;
}

interface WellnessInsightsProps {
    days?: number;
}

export default function WellnessInsights({ days = 7 }: WellnessInsightsProps) {
    const { isDark } = useTheme();
    const { user } = useAuth();

    const [isLoading, setIsLoading] = useState(true);
    const [trends, setTrends] = useState<WellnessDay[]>([]);
    const [averages, setAverages] = useState<{
        sleep: number | null;
        stress: number | null;
        energy: number | null;
        exercise: number | null;
        water: number | null;
        healthy_meals: number | null;
        junk_food: number | null;
    }>({ sleep: null, stress: null, energy: null, exercise: null, water: null, healthy_meals: null, junk_food: null });
    const [correlations, setCorrelations] = useState<Correlation[]>([]);
    const [todayLogged, setTodayLogged] = useState(false);
    const [showQuickCheckin, setShowQuickCheckin] = useState(false);
    const [weekComparisons, setWeekComparisons] = useState<WeekComparison[]>([]);
    const [selectedDays, setSelectedDays] = useState(7);
    const [activeSection, setActiveSection] = useState<'sleep' | 'stress' | 'energy' | 'water' | 'exercise' | 'nutrition' | undefined>(undefined);

    const handleCardClick = (section: 'sleep' | 'stress' | 'energy' | 'water' | 'exercise' | 'nutrition') => {
        setActiveSection(section);
        setShowQuickCheckin(true);
    };

    useEffect(() => {
        async function fetchWellnessData() {
            if (!user?.id) {
                setIsLoading(false);
                return;
            }

            try {
                // Fetch 2 weeks of data for week-over-week comparison
                const startDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
                    .toISOString().split('T')[0];

                const { data, error } = await supabase
                    .from('daily_wellness')
                    .select('date, sleep_hours, sleep_quality, stress_level, energy_level, exercise_minutes, water_glasses, healthy_meals, junk_food_count, mood_overall')
                    .eq('user_id', user.id)
                    .gte('date', startDate)
                    .order('date', { ascending: false });

                if (error) throw error;

                if (data && data.length > 0) {
                    // Check if today is logged
                    const today = new Date().toISOString().split('T')[0];
                    const hasTodayData = data.some(d => d.date === today);
                    setTodayLogged(hasTodayData);

                    // Filter to requested days for main view
                    const daysAgo = new Date(Date.now() - selectedDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                    const displayData = data.filter(d => d.date >= daysAgo);
                    setTrends(displayData);

                    // Calculate averages
                    const validSleep = displayData.filter(d => d.sleep_hours != null);
                    const validStress = displayData.filter(d => d.stress_level != null);
                    const validEnergy = displayData.filter(d => d.energy_level != null);
                    const validExercise = displayData.filter(d => d.exercise_minutes != null);

                    setAverages({
                        sleep: validSleep.length > 0
                            ? validSleep.reduce((a, b) => a + (b.sleep_hours || 0), 0) / validSleep.length
                            : null,
                        stress: validStress.length > 0
                            ? validStress.reduce((a, b) => a + (b.stress_level || 0), 0) / validStress.length
                            : null,
                        energy: validEnergy.length > 0
                            ? validEnergy.reduce((a, b) => a + (b.energy_level || 0), 0) / validEnergy.length
                            : null,
                        exercise: validExercise.length > 0
                            ? validExercise.reduce((a, b) => a + (b.exercise_minutes || 0), 0) / validExercise.length
                            : null,
                        water: displayData.reduce((a, b) => a + (b.water_glasses || 0), 0) / displayData.length,
                        healthy_meals: displayData.reduce((a, b) => a + (b.healthy_meals || 0), 0) / displayData.length,
                        junk_food: displayData.reduce((a, b) => a + (b.junk_food_count || 0), 0) / displayData.length
                    });

                    // Detect correlations
                    const detectedCorrelations: Correlation[] = [];

                    // Sleep-Stress correlation
                    const lowSleepDays = displayData.filter(d => d.sleep_hours && d.sleep_hours < 6);
                    const lowSleepHighStress = lowSleepDays.filter(d => d.stress_level && d.stress_level > 6);

                    if (lowSleepDays.length >= 2 && lowSleepHighStress.length / lowSleepDays.length > 0.5) {
                        detectedCorrelations.push({
                            pattern: 'sleep_stress',
                            observation: `When you sleep less than 6 hours, your stress is higher ${Math.round((lowSleepHighStress.length / lowSleepDays.length) * 100)}% of the time.`,
                            recommendation: 'Prioritize sleep to reduce stress levels.'
                        });
                    }

                    // Exercise-Mood correlation
                    const exerciseDays = displayData.filter(d => d.exercise_minutes && d.exercise_minutes > 0);
                    const noExerciseDays = displayData.filter(d => !d.exercise_minutes || d.exercise_minutes === 0);

                    if (exerciseDays.length >= 2 && noExerciseDays.length >= 2) {
                        const avgMoodEx = exerciseDays.reduce((a, b) => a + (b.mood_overall || 5), 0) / exerciseDays.length;
                        const avgMoodNoEx = noExerciseDays.reduce((a, b) => a + (b.mood_overall || 5), 0) / noExerciseDays.length;

                        if (avgMoodEx > avgMoodNoEx + 0.5) {
                            detectedCorrelations.push({
                                pattern: 'exercise_mood',
                                observation: `Your mood is ${(avgMoodEx - avgMoodNoEx).toFixed(1)} points higher on days you exercise.`,
                                recommendation: 'Even a short walk can boost your mood significantly.'
                            });
                        }
                    }

                    // Water-Energy correlation
                    const highWaterDays = displayData.filter(d => d.water_glasses && d.water_glasses >= 6);
                    const lowWaterDays = displayData.filter(d => d.water_glasses && d.water_glasses < 4);
                    if (highWaterDays.length >= 2 && lowWaterDays.length >= 2) {
                        const avgEnergyHigh = highWaterDays.reduce((a, b) => a + (b.energy_level || 5), 0) / highWaterDays.length;
                        const avgEnergyLow = lowWaterDays.reduce((a, b) => a + (b.energy_level || 5), 0) / lowWaterDays.length;

                        if (avgEnergyHigh > avgEnergyLow + 0.8) {
                            detectedCorrelations.push({
                                pattern: 'water_energy',
                                observation: `Your energy is ${(avgEnergyHigh - avgEnergyLow).toFixed(1)} points higher when you drink 6+ glasses of water.`,
                                recommendation: 'Stay hydrated for more energy!'
                            });
                        }
                    }

                    // Junk food-Energy correlation
                    const junkDays = displayData.filter(d => d.junk_food_count && d.junk_food_count >= 2);
                    const cleanDays = displayData.filter(d => !d.junk_food_count || d.junk_food_count === 0);
                    if (junkDays.length >= 2 && cleanDays.length >= 2) {
                        const avgEnergyJunk = junkDays.reduce((a, b) => a + (b.energy_level || 5), 0) / junkDays.length;
                        const avgEnergyClean = cleanDays.reduce((a, b) => a + (b.energy_level || 5), 0) / cleanDays.length;

                        if (avgEnergyClean > avgEnergyJunk + 0.5) {
                            detectedCorrelations.push({
                                pattern: 'junk_energy',
                                observation: `Eating junk food drops your energy by ${(avgEnergyClean - avgEnergyJunk).toFixed(1)} points.`,
                                recommendation: 'Choose whole foods for sustained energy.'
                            });
                        }
                    }

                    // Exercise-Stress correlation
                    const exerciseDaysStress = displayData.filter(d => d.exercise_minutes && d.exercise_minutes > 15);
                    const noExDaysStress = displayData.filter(d => !d.exercise_minutes || d.exercise_minutes < 5);
                    if (exerciseDaysStress.length >= 2 && noExDaysStress.length >= 2) {
                        const avgStressEx = exerciseDaysStress.reduce((a, b) => a + (b.stress_level || 5), 0) / exerciseDaysStress.length;
                        const avgStressNoEx = noExDaysStress.reduce((a, b) => a + (b.stress_level || 5), 0) / noExDaysStress.length;

                        if (avgStressNoEx > avgStressEx + 0.8) {
                            detectedCorrelations.push({
                                pattern: 'exercise_stress',
                                observation: `Exercise lowers your stress by ${(avgStressNoEx - avgStressEx).toFixed(1)} points.`,
                                recommendation: '15 minutes of movement = calmer mind.'
                            });
                        }
                    }

                    setCorrelations(detectedCorrelations);

                    // Calculate week-over-week comparisons
                    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                    const thisWeekData = data.filter(d => d.date >= oneWeekAgo);
                    const lastWeekData = data.filter(d => d.date < oneWeekAgo);

                    const calculateAvg = (arr: WellnessDay[], key: keyof WellnessDay) => {
                        const valid = arr.filter(d => d[key] != null);
                        if (valid.length === 0) return null;
                        return valid.reduce((a, b) => a + (Number(b[key]) || 0), 0) / valid.length;
                    };

                    const createComparison = (
                        metric: string,
                        key: keyof WellnessDay,
                        lowerIsBetter: boolean = false
                    ): WeekComparison => {
                        const thisWeek = calculateAvg(thisWeekData, key);
                        const lastWeek = calculateAvg(lastWeekData, key);
                        let change = null;
                        let trend: 'up' | 'down' | 'same' = 'same';
                        let isGood = false;

                        if (thisWeek !== null && lastWeek !== null) {
                            change = thisWeek - lastWeek;
                            if (Math.abs(change) > 0.1) {
                                trend = change > 0 ? 'up' : 'down';
                                isGood = lowerIsBetter ? change < 0 : change > 0;
                            } else {
                                isGood = true;
                            }
                        }

                        return { metric, thisWeek, lastWeek, change, trend, isGood };
                    };

                    const comparisons: WeekComparison[] = [
                        createComparison('Sleep', 'sleep_hours'),
                        createComparison('Stress', 'stress_level', true),
                        createComparison('Energy', 'energy_level'),
                        createComparison('Exercise', 'exercise_minutes'),
                        createComparison('Water', 'water_glasses'),
                    ];

                    setWeekComparisons(comparisons);
                }
            } catch (err) {
                console.error('Error fetching wellness data:', err);
            } finally {
                setIsLoading(false);
            }
        }

        fetchWellnessData();
    }, [user?.id, selectedDays]);

    if (isLoading) {
        return (
            <div className={`w-full space-y-6 font-sans animate-pulse ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>
                <div className={`h-8 rounded w-1/3 mb-4 ${isDark ? 'bg-zinc-800/50' : 'bg-gray-200'}`}></div>
                <div className="grid grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className={`h-28 rounded-2xl ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-gray-200'} border`}></div>
                    ))}
                </div>
            </div>
        );
    }

    if (trends.length === 0) {
        return (
            <div className={`w-full space-y-6 font-sans ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>
                <div className={`rounded-2xl p-8 text-center border ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-gray-200'}`}>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-zinc-800/50' : 'bg-gray-100'}`}>
                        <BarChart2 className={`w-8 h-8 ${isDark ? 'text-zinc-400' : 'text-gray-500'}`} />
                    </div>
                    <div className={`font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>No Wellness Data Yet</div>
                    <div className={`text-sm ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>
                        Complete your morning check-ins to see insights here!
                    </div>
                </div>
            </div>
        );
    }

    const getPillarColor = (value: number | null, type: 'sleep' | 'stress' | 'energy') => {
        if (value === null) return '#71717a'; // zinc-500

        if (type === 'sleep') {
            return value >= 7 ? '#10B981' : value >= 5 ? '#F59E0B' : '#EF4444';
        }
        if (type === 'stress') {
            return value <= 4 ? '#10B981' : value <= 6 ? '#F59E0B' : '#EF4444';
        }
        if (type === 'energy') {
            return value >= 7 ? '#10B981' : value >= 4 ? '#F59E0B' : '#EF4444';
        }
        return '#71717a';
    };

    return (
        <div className={`w-full space-y-3 sm:space-y-4 font-sans ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>
            {/* Header - Más compacto */}
            <header className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg border ${isDark ? 'bg-zinc-800 border-zinc-700/50' : 'bg-gray-100 border-gray-300'}`}>
                        <BarChart2 className={`w-4 h-4 sm:w-5 sm:h-5 ${isDark ? 'text-zinc-100' : 'text-gray-700'}`} />
                    </div>
                    <h1 className={`text-base sm:text-lg font-semibold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>Wellness Insights</h1>
                </div>

                {/* Time Filter Dropdown - Más compacto */}
                <div className="relative">
                    <select
                        value={selectedDays}
                        onChange={(e) => setSelectedDays(Number(e.target.value))}
                        className={`rounded-lg px-2 sm:px-3 py-1.5 text-xs sm:text-sm appearance-none pr-7 cursor-pointer border transition-colors ${isDark
                                ? 'bg-zinc-800 border-zinc-700 text-zinc-100 hover:bg-zinc-700'
                                : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
                            }`}
                    >
                        <option value={7}>7 days</option>
                        <option value={14}>14 days</option>
                        <option value={30}>30 days</option>
                    </select>
                    <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-zinc-400' : 'text-gray-500'}`} />
                </div>
            </header>

            {/* Quick Check-in Button - Más compacto */}
            {!todayLogged && (
                <div className={`group relative overflow-hidden rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-center justify-between border ${isDark
                        ? 'bg-gradient-to-r from-orange-500/10 to-amber-500/10 border-orange-500/30'
                        : 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200'
                    }`}>
                    <div>
                        <div className={`text-sm sm:text-base font-bold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>Log Today&apos;s Wellness</div>
                        <div className={`text-[10px] sm:text-xs ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>Keep your streak going!</div>
                    </div>
                    <button
                        onClick={() => { setActiveSection('sleep'); setShowQuickCheckin(true); }}
                        className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm text-white transition-colors ${isDark ? 'bg-orange-500 hover:bg-orange-600' : 'bg-orange-500 hover:bg-orange-600'
                            }`}
                    >
                        Check In
                    </button>
                    <div className={`absolute -right-4 -top-4 w-24 h-24 sm:w-32 sm:h-32 blur-3xl rounded-full pointer-events-none ${isDark ? 'bg-orange-500/20' : 'bg-orange-300/30'}`}></div>
                </div>
            )}

            {/* Main Stats Grid - Tarjetas más compactas */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {/* Sleep Card - Más compacta */}
                <div
                    onClick={() => handleCardClick('sleep')}
                    className={`group relative overflow-hidden rounded-xl sm:rounded-2xl p-3 sm:p-4 border transition-all duration-300 cursor-pointer ${isDark
                            ? 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800'
                            : 'bg-white border-gray-200 hover:border-amber-300 hover:shadow-lg'
                        }`}>
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
                        <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                        <span className={`text-xs sm:text-sm font-medium ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>Sleep</span>
                    </div>
                    <div className="flex items-baseline gap-0.5 sm:gap-1">
                        <span className={`text-2xl sm:text-3xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {averages.sleep?.toFixed(1) || '-'}
                        </span>
                        <span className={`text-sm sm:text-lg font-medium ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>h</span>
                    </div>
                    <div className={`absolute -right-3 -top-3 w-16 h-16 sm:w-20 sm:h-20 blur-2xl rounded-full pointer-events-none transition-all ${isDark ? 'bg-amber-500/10 group-hover:bg-amber-500/20' : 'bg-amber-400/20 group-hover:bg-amber-400/30'
                        }`}></div>
                </div>

                {/* Stress Card - Más compacta */}
                <div
                    onClick={() => handleCardClick('stress')}
                    className={`group relative overflow-hidden rounded-xl sm:rounded-2xl p-3 sm:p-4 border transition-all duration-300 cursor-pointer ${isDark
                            ? 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800'
                            : 'bg-white border-gray-200 hover:border-emerald-300 hover:shadow-lg'
                        }`}>
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
                        <BrainCircuit className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                        <span className={`text-xs sm:text-sm font-medium ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>Stress</span>
                    </div>
                    <div className="flex items-baseline gap-0.5 sm:gap-1">
                        <span className={`text-2xl sm:text-3xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {averages.stress?.toFixed(1) || '-'}
                        </span>
                        <span className={`text-sm sm:text-lg font-medium ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>/10</span>
                    </div>
                    <div className={`absolute -right-3 -top-3 w-16 h-16 sm:w-20 sm:h-20 blur-2xl rounded-full pointer-events-none transition-all ${isDark ? 'bg-emerald-500/10 group-hover:bg-emerald-500/20' : 'bg-emerald-400/20 group-hover:bg-emerald-400/30'
                        }`}></div>
                </div>

                {/* Energy Card - Más compacta */}
                <div
                    onClick={() => handleCardClick('energy')}
                    className={`group relative overflow-hidden rounded-xl sm:rounded-2xl p-3 sm:p-4 border transition-all duration-300 cursor-pointer ${isDark
                            ? 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800'
                            : 'bg-white border-gray-200 hover:border-yellow-300 hover:shadow-lg'
                        }`}>
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
                        <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
                        <span className={`text-xs sm:text-sm font-medium ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>Energy</span>
                    </div>
                    <div className="flex items-baseline gap-0.5 sm:gap-1">
                        <span className={`text-2xl sm:text-3xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {averages.energy?.toFixed(1) || '-'}
                        </span>
                        <span className={`text-sm sm:text-lg font-medium ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>/10</span>
                    </div>
                    <div className={`absolute -right-3 -top-3 w-16 h-16 sm:w-20 sm:h-20 blur-2xl rounded-full pointer-events-none transition-all ${isDark ? 'bg-yellow-500/10 group-hover:bg-yellow-500/20' : 'bg-yellow-400/20 group-hover:bg-yellow-400/30'
                        }`}></div>
                </div>

                {/* Exercise Card - Más compacta */}
                <div
                    onClick={() => handleCardClick('exercise')}
                    className={`group relative overflow-hidden rounded-xl sm:rounded-2xl p-3 sm:p-4 border transition-all duration-300 cursor-pointer ${isDark
                            ? 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800'
                            : 'bg-white border-gray-200 hover:border-violet-300 hover:shadow-lg'
                        }`}>
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
                        <Footprints className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400" />
                        <span className={`text-xs sm:text-sm font-medium ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>Exercise</span>
                    </div>
                    <div className="flex items-baseline gap-0.5 sm:gap-1">
                        <span className={`text-2xl sm:text-3xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {averages.exercise ? Math.round(averages.exercise) : '-'}
                        </span>
                        <span className={`text-sm sm:text-lg font-medium ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>min</span>
                    </div>
                    <div className={`absolute -right-3 -top-3 w-16 h-16 sm:w-20 sm:h-20 blur-2xl rounded-full pointer-events-none transition-all ${isDark ? 'bg-violet-500/10 group-hover:bg-violet-500/20' : 'bg-violet-400/20 group-hover:bg-violet-400/30'
                        }`}></div>
                </div>
            </div>

            {/* Nutrition Grid - Más compacta */}
            <div className="grid grid-cols-3 gap-2">
                {/* Water */}
                <div
                    onClick={() => handleCardClick('water')}
                    className={`rounded-lg sm:rounded-xl p-2 sm:p-3 flex flex-col items-center justify-center text-center border transition-colors cursor-pointer ${isDark
                            ? 'bg-zinc-900/30 border-zinc-800 hover:bg-zinc-800'
                            : 'bg-blue-50/50 border-blue-200 hover:bg-blue-100'
                        }`}>
                    <Droplet className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 mb-1" />
                    <div className={`text-lg sm:text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{averages.water?.toFixed(1) || '0'}</div>
                    <div className={`text-[10px] sm:text-xs ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>Water</div>
                </div>

                {/* Healthy Meals */}
                <div
                    onClick={() => handleCardClick('nutrition')}
                    className={`rounded-lg sm:rounded-xl p-2 sm:p-3 flex flex-col items-center justify-center text-center border transition-colors cursor-pointer ${isDark
                            ? 'bg-zinc-900/30 border-zinc-800 hover:bg-zinc-800'
                            : 'bg-green-50/50 border-green-200 hover:bg-green-100'
                        }`}>
                    <Salad className="w-5 h-5 sm:w-6 sm:h-6 text-green-400 mb-1" />
                    <div className={`text-lg sm:text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{averages.healthy_meals?.toFixed(1) || '0'}</div>
                    <div className={`text-[10px] sm:text-xs ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>Healthy</div>
                </div>

                {/* Junk Food */}
                <div
                    onClick={() => handleCardClick('nutrition')}
                    className={`rounded-lg sm:rounded-xl p-2 sm:p-3 flex flex-col items-center justify-center text-center border transition-colors cursor-pointer ${isDark
                            ? 'bg-zinc-900/30 border-zinc-800 hover:bg-zinc-800'
                            : 'bg-red-50/50 border-red-200 hover:bg-red-100'
                        }`}>
                    <Pizza className="w-5 h-5 sm:w-6 sm:h-6 text-red-400 mb-1" />
                    <div className={`text-lg sm:text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{averages.junk_food?.toFixed(1) || '0'}</div>
                    <div className={`text-[10px] sm:text-xs ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>Junk</div>
                </div>
            </div>

            {/* Trend Chart - Más compacto */}
            <div className={`rounded-xl sm:rounded-2xl p-3 sm:p-4 border ${isDark ? 'bg-zinc-900/30 border-zinc-800' : 'bg-white border-gray-200'}`}>
                <div className={`text-xs sm:text-sm font-medium mb-3 ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>
                    Sleep Trend ({trends.length}d)
                </div>
                <div className="flex items-end gap-1 sm:gap-2 h-24 sm:h-32">
                    {trends.slice().reverse().map((day, idx) => {
                        const height = day.sleep_hours ? (day.sleep_hours / 10) * 100 : 0;
                        const color = getPillarColor(day.sleep_hours, 'sleep');
                        return (
                            <div key={idx} className="flex-1 group relative flex flex-col justify-end">
                                <div
                                    className="w-full rounded-t transition-all duration-300 group-hover:opacity-80"
                                    style={{
                                        height: `${height}%`,
                                        background: `linear-gradient(to top, ${color}, ${color}CC)`,
                                        minHeight: day.sleep_hours ? '8px' : '2px'
                                    }}
                                />
                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                    <div className={`rounded-lg px-2 py-1 text-xs whitespace-nowrap border ${isDark
                                            ? 'bg-zinc-800 border-zinc-700 text-white'
                                            : 'bg-white border-gray-300 text-gray-900 shadow-lg'
                                        }`}>
                                        {day.sleep_hours?.toFixed(1) || '0'}h
                                        <div className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>{day.date.split('-').slice(1).join('/')}</div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className={`flex justify-between text-xs mt-3 ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>
                    <span>{trends.length > 0 ? trends[trends.length - 1].date.split('-').slice(1).join('/') : ''}</span>
                    <span>Today</span>
                </div>
            </div>

            {/* Correlations - Sarah's Insights - Más compacta */}
            {correlations.length > 0 && (
                <div className={`relative overflow-hidden rounded-xl sm:rounded-2xl p-3 sm:p-4 border ${isDark
                        ? 'bg-gradient-to-br from-purple-500/10 to-violet-500/10 border-purple-500/30'
                        : 'bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200'
                    }`}>
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-3">
                        <Lightbulb className={`w-4 h-4 sm:w-5 sm:h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                        <span className={`text-sm sm:text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Sarah&apos;s Insights</span>
                    </div>
                    <div className="space-y-2 sm:space-y-3">
                        {correlations.map((corr, idx) => (
                            <div key={idx} className={`rounded-lg sm:rounded-xl p-2.5 sm:p-3 border ${isDark
                                    ? 'bg-zinc-900/50 border-zinc-800'
                                    : 'bg-white border-purple-100'
                                }`}>
                                <div className={`text-xs sm:text-sm mb-1.5 ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>{corr.observation}</div>
                                <div className="flex items-start gap-1.5 text-xs sm:text-sm">
                                    <span className={`mt-0.5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>💡</span>
                                    <span className={`font-medium ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>{corr.recommendation}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className={`absolute -right-6 -bottom-6 w-24 h-24 sm:w-32 sm:h-32 blur-3xl rounded-full pointer-events-none ${isDark ? 'bg-purple-500/20' : 'bg-purple-400/30'
                        }`}></div>
                </div>
            )}

            {/* Week-over-Week Comparison - Más compacta */}
            {weekComparisons.length > 0 && weekComparisons.some(c => c.thisWeek !== null && c.lastWeek !== null) && (
                <div className={`rounded-xl sm:rounded-2xl p-3 sm:p-4 border ${isDark ? 'bg-zinc-900/30 border-zinc-800' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-3">
                        <TrendingUp className={`w-4 h-4 sm:w-5 sm:h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                        <span className={`text-sm sm:text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Week vs Last</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {weekComparisons.map(c => {
                            if (c.thisWeek === null || c.lastWeek === null) return null;
                            return (
                                <div
                                    key={c.metric}
                                    className={`rounded-lg sm:rounded-xl p-2 sm:p-2.5 flex items-center justify-between border transition-colors ${isDark
                                            ? 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
                                            : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <span className={`text-xs sm:text-sm ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>{c.metric}</span>
                                    <div className="flex items-center gap-0.5 sm:gap-1">
                                        <span className={`text-xs sm:text-sm font-bold ${c.isGood ? 'text-green-400' : 'text-red-400'}`}>
                                            {c.trend === 'up' ? '↑' : c.trend === 'down' ? '↓' : '−'}
                                        </span>
                                        <span className={`text-xs sm:text-sm font-semibold ${c.isGood ? 'text-green-400' : 'text-red-400'}`}>
                                            {c.change !== null ? Math.abs(c.change).toFixed(1) : '0.0'}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Days Logged - Más compacto */}
            <div className={`text-center text-xs sm:text-sm ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>
                {trends.length} of {selectedDays} days logged
            </div>

            {/* Quick Check-in Modal */}
            {showQuickCheckin && (
                <QuickCheckinModal
                    initialSection={activeSection}
                    onClose={() => setShowQuickCheckin(false)}
                    onSaved={() => {
                        setShowQuickCheckin(false);
                        window.location.reload();
                    }}
                />
            )}
        </div>
    );
}

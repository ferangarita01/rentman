import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

export interface WeeklyActivity {
    day: string; // 'Dom', 'Lun', etc.
    date: string; // ISO date string
    count: number; // Habits completed
    isToday: boolean;
    intensity: number; // 0-100 for graph height
}

export interface ProgressStats {
    currentStreak: number;
    totalCompleted: number;
    weeklyActivity: WeeklyActivity[];
    loading: boolean;
}

// Helper: Safe Parse Date (Handle Postgres format)
// Helper: Safe Parse Date (Handle Postgres format)
const parseISO = (dateStr: string): Date => {
    if (!dateStr) return new Date();
    // 1. Ensure " " is "T"
    let iso = dateStr.replace(' ', 'T');

    // 2. Handle microseconds (Postgres timestampz often has .123456)
    // JS Date sometimes chokes on >3 digits of ms, though V8 is usually fine.
    // Safe approach: Truncate ms to 3 digits if >3.
    // Regex: look for .(\d{4,}) and replace with .(\d{3})
    iso = iso.replace(/\.(\d{4,})/, (match, ms) => `.${ms.substring(0, 3)}`);

    // 3. Ensure timezone presence
    if (!iso.includes('Z') && !iso.includes('+') && !iso.endsWith('Z')) {
        iso += 'Z';
    }

    const d = new Date(iso);
    // 4. Fallback if still invalid (e.g. rare edge cases)
    if (isNaN(d.getTime())) {
        console.error('❌ [parseISO] Invalid date:', dateStr, '->', iso);
        return new Date(); // Or handle as error? For stats, maybe ignore or count as today?
        // Better to return invalid date so callee filters it out, 
        // BUT we want to see it. Let's return invalid to let filter catch it, but log it.
        return d;
    }
    return d;
};

export function useProgressStats() {
    const { user } = useAuth();
    const [stats, setStats] = useState<ProgressStats>({
        currentStreak: 0,
        totalCompleted: 0,
        weeklyActivity: [],
        loading: true
    });

    useEffect(() => {
        if (!user) {
            console.log('⚠️ [useProgressStats] No user, skipping fetch');
            setStats(prev => ({ ...prev, loading: false }));
            return;
        }

        console.log('📊 [useProgressStats] Fetching stats for user:', user.id);

        const fetchStats = async () => {
            try {
                // 1. Fetch all logs for this user to calculate streak and total
                console.log('📊 [useProgressStats] Querying habit_logs...');
                const { data: allLogs, error } = await supabase
                    .from('habit_logs')
                    .select('completed_at, created_at')
                    .eq('user_id', user.id)
                    .order('completed_at', { ascending: false });

                if (error) {
                    console.error('❌ [useProgressStats] Error fetching logs:', error);
                    throw error;
                }

                console.log('📊 [useProgressStats] Found logs:', allLogs?.length || 0);

                if (!allLogs || allLogs.length === 0) {
                    console.log('⚠️ [useProgressStats] No logs found, using empty week');
                    toast('⚠️ No habit logs found. Complete a habit!', {
                        duration: 3000,
                        icon: '📊'
                    });
                    setStats({
                        currentStreak: 0,
                        totalCompleted: 0,
                        weeklyActivity: generateEmptyWeek(),
                        loading: false
                    });
                    return;
                }

                // --- Calculate Total Completed ---
                const totalCompleted = allLogs.length;

                // --- Calculate Current Streak (Local Time) ---
                // Filter out invalid dates and map to keys
                const uniqueDates = Array.from(new Set(
                    allLogs.map(log => {
                        const dateVal = log.completed_at || log.created_at;
                        const dateObj = parseISO(dateVal);
                        return isNaN(dateObj.getTime()) ? null : toLocalDateKey(dateObj);
                    }).filter(d => d !== null) as string[]
                )).sort((a, b) => b.localeCompare(a)); // Descending order: ['2026-01-13', '2026-01-12', ...]

                let streak = 0;
                const todayStr = toLocalDateKey(new Date());
                const yesterdayStr = toLocalDateKey(new Date(Date.now() - 86400000));

                console.log('📊 [Stats] Unique Dates:', uniqueDates);
                console.log('📊 [Stats] Today:', todayStr, 'Yesterday:', yesterdayStr);

                // Check if last completion was today or yesterday
                let lastActiveDate = null;
                if (uniqueDates.includes(todayStr)) {
                    lastActiveDate = todayStr;
                } else if (uniqueDates.includes(yesterdayStr)) {
                    lastActiveDate = yesterdayStr;
                }

                if (lastActiveDate) {
                    streak = 1;
                    let checkDate = new Date(lastActiveDate + 'T12:00:00'); // Safe middle of day

                    // Count backwards
                    while (true) {
                        checkDate.setDate(checkDate.getDate() - 1);
                        const str = toLocalDateKey(checkDate);
                        if (uniqueDates.includes(str)) {
                            streak++;
                        } else {
                            break;
                        }
                    }
                }

                // --- Calculate Weekly Activity (Last 7 days) ---
                const weekData = generateWeekData(allLogs);
                console.log('📊 [useProgressStats] Week data generated:', weekData);

                setStats({
                    currentStreak: streak,
                    totalCompleted,
                    weeklyActivity: weekData,
                    loading: false
                });

                console.log('✅ [useProgressStats] Stats updated successfully');


            } catch (err) {
                console.error('❌ [useProgressStats] Error fetching progress stats:', err);
                toast.error('Failed to load progress data');
                setStats(prev => ({ ...prev, loading: false }));
            }
        };

        fetchStats();
    }, [user]);

    return stats;
}

// Helper: Input date -> YYYY-MM-DD (Local)
const toLocalDateKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Helper: Generate Empty Week (if no data)
function generateEmptyWeek(): WeeklyActivity[] {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const today = new Date();
    const week = [];

    // Generate last 7 days ending today
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dayName = days[d.getDay()];

        week.push({
            day: dayName.charAt(0), // First letter only for UI
            date: toLocalDateKey(d),
            count: 0,
            isToday: i === 0,
            intensity: 10 // Minimum height for visual
        });
    }
    return week;
}

// Helper: Generate Week Data from Logs
function generateWeekData(logs: { completed_at: string, created_at?: string }[]): WeeklyActivity[] {
    const daysMap = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const today = new Date(); // Re-declare today
    const week: WeeklyActivity[] = []; // Re-declare week array

    // Group logs by date (Local Time)
    const countsByDate: Record<string, number> = {};
    logs.forEach(log => {
        // Parse UTC string to Date object (which has local context)
        const dateVal = log.completed_at || log.created_at || '';
        const dateObj = parseISO(dateVal);
        if (isNaN(dateObj.getTime())) return;

        const dateStr = toLocalDateKey(dateObj);
        countsByDate[dateStr] = (countsByDate[dateStr] || 0) + 1;
    });

    // Find max for scaling intensity
    const maxCount = Math.max(...Object.values(countsByDate), 1); // Avoid div by 0

    // Generate last 7 days
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = toLocalDateKey(d);
        const dayName = daysMap[d.getDay()];
        const count = countsByDate[dateStr] || 0;

        // Calculate intensity (10% min, 100% max)
        const intensity = Math.max(15, Math.min(100, (count / maxCount) * 100));

        week.push({
            day: dayName.charAt(0),
            date: dateStr,
            count: count,
            isToday: i === 0,
            intensity
        });
    }
    return week;
}

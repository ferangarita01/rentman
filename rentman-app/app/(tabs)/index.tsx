import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Task {
    id: string;
    title: string;
    description: string;
    task_type: string;
    budget_amount: number;
    location_address?: string;
    status: string;
    created_at: string;
}

export default function Dashboard() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    const loadTasks = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('status', 'OPEN')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTasks(data || []);
        } catch (error) {
            console.error('Error loading tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTasks();

        // Real-time subscription
        const channel = supabase
            .channel('tasks_changes')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'tasks' },
                (payload) => {
                    console.log('Task change detected:', payload);
                    loadTasks();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const getTaskIcon = (type: string) => {
        const icons: Record<string, string> = {
            delivery: '📦',
            verification: '✅',
            repair: '🔧',
            representation: '👤',
            creative: '🎨',
            communication: '📞'
        };
        return icons[type] || '📋';
    };

    return (
        <View className="flex-1 bg-background pt-12 px-4">
            <StatusBar style="light" />
            <View className="flex-row justify-between items-center mb-6">
                <View>
                    <Text className="text-[#00ff88] font-mono text-xs tracking-widest mb-1">OPERATOR_ID: HUMAN-001</Text>
                    <Text className="text-white text-3xl font-bold tracking-tight">MISSION STATUS</Text>
                </View>
                <View className="h-8 w-8 rounded-full border border-[#00ff88] items-center justify-center bg-[#00ff88]/10 animate-pulse">
                    <View className="h-2 w-2 bg-[#00ff88] rounded-full" />
                </View>
            </View>

            <View className="bg-[#0a0a0a] border border-white/10 p-6 rounded-lg mb-6">
                <Text className="text-gray-400 font-mono text-xs mb-2">CURRENT BALANCE</Text>
                <Text className="text-4xl text-white font-mono font-bold">$0.00 <Text className="text-gray-600 text-lg">USD</Text></Text>
            </View>

            <Text className="text-[#00ff88] font-mono text-xs tracking-widest mb-4 border-b border-[#00ff88]/20 pb-2">
                AVAILABLE_MISSIONS ({tasks.length})
            </Text>

            <ScrollView 
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={loadTasks} tintColor="#00ff88" />
                }
            >
                {tasks.length === 0 ? (
                    <View className="items-center justify-center py-20 opacity-50">
                        <Text className="text-gray-600 font-mono text-xs text-center">NO MISSIONS DETECTED IN SECTOR</Text>
                        <Text className="text-gray-700 font-mono text-[10px] text-center mt-2">WAITING FOR AGENT REQUESTS...</Text>
                    </View>
                ) : (
                    tasks.map((task) => (
                        <TouchableOpacity
                            key={task.id}
                            className="bg-[#0a0a0a] border border-white/10 p-4 rounded-lg mb-3"
                            activeOpacity={0.7}
                        >
                            <View className="flex-row items-start justify-between mb-2">
                                <View className="flex-row items-center flex-1">
                                    <Text className="text-2xl mr-2">{getTaskIcon(task.task_type)}</Text>
                                    <Text className="text-white font-bold text-base flex-1">{task.title}</Text>
                                </View>
                                <View className="bg-[#00ff88]/20 px-3 py-1 rounded">
                                    <Text className="text-[#00ff88] font-mono text-xs font-bold">
                                        ${task.budget_amount}
                                    </Text>
                                </View>
                            </View>
                            
                            <Text className="text-gray-400 text-sm mb-2" numberOfLines={2}>
                                {task.description}
                            </Text>
                            
                            {task.location_address && (
                                <View className="flex-row items-center mt-2">
                                    <Text className="text-gray-500 font-mono text-xs">📍 {task.location_address}</Text>
                                </View>
                            )}
                            
                            <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-white/5">
                                <Text className="text-gray-600 font-mono text-[10px]">
                                    ID: {task.id.slice(0, 8)}
                                </Text>
                                <TouchableOpacity className="bg-[#00ff88] px-4 py-2 rounded">
                                    <Text className="text-black font-bold text-xs">ACCEPT</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
        </View>
    );
}

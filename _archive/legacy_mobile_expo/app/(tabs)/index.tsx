import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import JobCard from '@/components/ui/JobCard';
import NeoButton from '@/components/ui/NeoButton';
import { API_URL } from '@/lib/constants';

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
    const router = useRouter();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [acceptingTask, setAcceptingTask] = useState<string | null>(null);

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

    const handleAccept = async (taskId: string) => {
        try {
            setAcceptingTask(taskId);

            // Call Cloud Run API (Production)
            const response = await fetch(`${API_URL}/v1/market/bid`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    task_id: taskId,
                    human_id: 'HUMAN-001' // TODO: Replace with real user ID
                })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Success! Navigate to mission
                Alert.alert(
                    'Mission Accepted',
                    `You've accepted the mission!`,
                    [{
                        text: 'START MISSION',
                        onPress: () => router.push(`/mission/${taskId}` as any)
                    }]
                );

                // Remove from list (optimistic update)
                setTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));
            } else {
                // Task unavailable or error
                Alert.alert('Task Unavailable', result.error?.message || 'This task has already been accepted.');
                loadTasks(); // Refresh list
            }
        } catch (error) {
            console.error('Error accepting task:', error);
            Alert.alert('Error', 'Failed to accept task. Please try again.');
        } finally {
            setAcceptingTask(null);
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

    return (
        <View className="flex-1 bg-background">
            <StatusBar style="light" />

            {/* Header */}
            <View className="pt-14 pb-4 px-4 border-b border-white/5">
                <View className="flex-row justify-between items-center mb-2">
                    <View>
                        <Text className="text-[#00ff88] font-mono text-xs tracking-widest mb-1">
                            OPERATOR_ID: HUMAN-001
                        </Text>
                        <Text className="text-white text-3xl font-bold tracking-tight">
                            JOB FEED
                        </Text>
                    </View>
                    <View className="h-10 w-10 rounded-full border-2 border-[#00ff88] items-center justify-center bg-[#00ff88]/10">
                        <View className="h-3 w-3 bg-[#00ff88] rounded-full animate-pulse" />
                    </View>
                </View>

                <Text className="text-gray-500 font-mono text-xs">
                    {tasks.length} AVAILABLE MISSION{tasks.length !== 1 ? 'S' : ''}
                </Text>
            </View>

            {/* Job List */}
            <ScrollView
                className="flex-1 px-4"
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={loading}
                        onRefresh={loadTasks}
                        tintColor="#00ff88"
                        colors={['#00ff88']}
                    />
                }
                contentContainerStyle={{ paddingTop: 16, paddingBottom: 80 }}
            >
                {tasks.length === 0 ? (
                    <View className="items-center justify-center py-24 opacity-50">
                        <Text className="text-6xl mb-4">📡</Text>
                        <Text className="text-gray-600 font-mono text-sm text-center mb-2">
                            NO MISSIONS DETECTED IN SECTOR
                        </Text>
                        <Text className="text-gray-700 font-mono text-xs text-center">
                            WAITING FOR AGENT REQUESTS...
                        </Text>
                    </View>
                ) : (
                    tasks.map((task) => (
                        <View key={task.id} className="mb-3">
                            <TouchableOpacity
                                activeOpacity={0.9}
                                onPress={() => {
                                    Alert.alert(
                                        task.title,
                                        task.description,
                                        [
                                            { text: 'Cancel', style: 'cancel' },
                                            {
                                                text: 'ACCEPT MISSION',
                                                onPress: () => handleAccept(task.id),
                                                style: 'default'
                                            }
                                        ]
                                    );
                                }}
                            >
                                <JobCard
                                    {...task}
                                    agent_name="Agent-X"
                                    distance={2.5}
                                />
                            </TouchableOpacity>

                            {/* Accept Button */}
                            <View className="px-4 mt-2">
                                <NeoButton
                                    title={acceptingTask === task.id ? 'ACCEPTING...' : '⚡ ACCEPT MISSION'}
                                    variant="primary"
                                    size="md"
                                    fullWidth
                                    loading={acceptingTask === task.id}
                                    disabled={acceptingTask !== null}
                                    onPress={() => handleAccept(task.id)}
                                />
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );
}

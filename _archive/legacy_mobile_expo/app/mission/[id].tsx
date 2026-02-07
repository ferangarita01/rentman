import { View, Text, ScrollView, Alert, Dimensions, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '@/lib/supabase';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import NeoButton from '@/components/ui/NeoButton';
import * as ImagePicker from 'expo-image-picker';

// Mock MapView until react-native-maps is configured
const MapPlaceholder = () => (
    <View className="h-64 bg-[#050505] border-y border-white/10 items-center justify-center relative overflow-hidden">
        {/* Grid Background - simplified for React Native */}
        <View className="absolute inset-0 opacity-20" />

        <View className="absolute inset-0 bg-black/50" />

        {/* Radar Animation Rings */}
        <View className="absolute w-40 h-40 border border-[#00ff88]/30 rounded-full" />
        <View className="absolute w-20 h-20 border border-[#00ff88]/50 rounded-full" />

        {/* Pin */}
        <View className="items-center">
            <Ionicons name="location" size={32} color="#00ff88" />
            <Text className="text-[#00ff88] font-mono text-xs bg-black/80 px-2 py-0.5 rounded mt-1">TARGET</Text>
        </View>
    </View>
);

interface Task {
    id: string;
    title: string;
    description: string;
    status: string;
    budget_amount: number;
    location_address: string;
}

export default function MissionScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [task, setTask] = useState<Task | null>(null);
    const [loading, setLoading] = useState(true);
    const [completing, setCompleting] = useState(false);
    const [proofImages, setProofImages] = useState<string[]>([]);

    useEffect(() => {
        if (id) fetchTask();

        // Real-time subscription for mission updates
        const channel = supabase
            .channel('mission-updates')
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'tasks',
                filter: `id=eq.${id}`
            }, (payload: any) => {
                console.log('Mission update:', payload);
                setTask(payload.new as Task);
            })
            .subscribe();

        // Real-time subscription for task_assignments
        const assignmentChannel = supabase
            .channel('assignment-updates')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'task_assignments',
                filter: `task_id=eq.${id}`
            }, (payload: any) => {
                console.log('Assignment update:', payload);
                // Refresh task to get latest assignment data
                fetchTask();
            })
            .subscribe();

        // Real-time subscription for payments
        const paymentChannel = supabase
            .channel('payment-updates')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'payments',
                filter: `task_id=eq.${id}`
            }, (payload: any) => {
                console.log('Payment update:', payload);
                // Refresh task to reflect payment status
                fetchTask();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
            supabase.removeChannel(assignmentChannel);
            supabase.removeChannel(paymentChannel);
        };
    }, [id]);

    const fetchTask = async () => {
        try {
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            setTask(data);
        } catch (error) {
            console.error('Error fetching mission:', error);
            Alert.alert('Error', 'Could not load mission data');
        } finally {
            setLoading(false);
        }
    };

    const handleTakePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Camera access is needed to upload proof.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setProofImages([...proofImages, result.assets[0].uri]);
        }
    };

    const handleComplete = async () => {
        if (proofImages.length === 0) {
            Alert.alert('Proof Required', 'Please upload at least one photo as proof of completion.');
            return;
        }

        setCompleting(true);
        try {
            // Update status to COMPLETED
            const { error } = await supabase
                .from('tasks')
                .update({ status: 'COMPLETED' })
                .eq('id', id);

            if (error) throw error;

            Alert.alert(
                'MISSION ACCOMPLISHED',
                `Payment of $${task?.budget_amount} released to your account.`,
                [{
                    text: 'RETURN TO BASE',
                    onPress: () => router.push('/(tabs)')
                }]
            );
        } catch (error) {
            console.error('Error completing task:', error);
            Alert.alert('Error', 'Failed to submit completion proof.');
            setCompleting(false);
        }
    };

    const handleAbort = () => {
        Alert.alert(
            'ABORT MISSION?',
            'This will release the task back to the market.',
            [
                { text: 'CANCEL', style: 'cancel' },
                {
                    text: 'ABORT',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await supabase
                                .from('tasks')
                                .update({ status: 'OPEN', human_id: null })
                                .eq('id', id);
                            router.push('/(tabs)');
                        } catch (error) {
                            console.error('Error aborting:', error);
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View className="flex-1 bg-[#050505] items-center justify-center">
                <StatusBar style="light" />
                <Text className="text-[#00ff88] font-mono animate-pulse">DOWNLOADING MISSION DATA...</Text>
            </View>
        );
    }

    if (!task) {
        return (
            <View className="flex-1 bg-[#050505] items-center justify-center">
                <Text className="text-white">Mission Not Found</Text>
                <NeoButton title="GO BACK" onPress={() => router.back()} />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-[#050505]">
            <StatusBar style="light" />

            {/* Custom Header (Overlay) */}
            <View className="absolute top-0 left-0 right-0 pt-12 pb-4 px-4 z-10 flex-row justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
                <TouchableOpacity onPress={() => router.back()} className="h-10 w-10 bg-black/50 rounded-full items-center justify-center border border-white/10">
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <View className="bg-[#00ff88]/20 px-3 py-1 rounded border border-[#00ff88]/50">
                    <Text className="text-[#00ff88] font-mono font-bold">STATUS: {task.status}</Text>
                </View>
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Map Area */}
                <MapPlaceholder />

                {/* Mission Brief */}
                <View className="p-5">
                    <Text className="text-gray-500 font-mono text-xs tracking-widest mb-1">MISSION DATALINK</Text>
                    <Text className="text-white text-3xl font-bold uppercase leading-8 mb-4">{task.title}</Text>

                    {/* Stats Grid */}
                    <View className="flex-row gap-3 mb-6">
                        <View className="flex-1 bg-[#111] p-3 rounded border border-white/5">
                            <Text className="text-gray-500 text-[10px] uppercase">BOUNTY</Text>
                            <Text className="text-[#00ff88] text-xl font-bold">${task.budget_amount}</Text>
                        </View>
                        <View className="flex-1 bg-[#111] p-3 rounded border border-white/5">
                            <Text className="text-gray-500 text-[10px] uppercase">DISTANCE</Text>
                            <Text className="text-white text-xl font-bold">2.4km</Text>
                        </View>
                        <View className="flex-1 bg-[#111] p-3 rounded border border-white/5">
                            <Text className="text-gray-500 text-[10px] uppercase">TIME</Text>
                            <Text className="text-white text-xl font-bold">45m</Text>
                        </View>
                    </View>

                    {/* Description */}
                    <View className="bg-[#111] p-4 rounded border border-white/5 mb-6">
                        <Text className="text-white/80 leading-6 font-mono">{task.description}</Text>
                    </View>

                    {/* Location */}
                    <View className="flex-row items-center gap-3 mb-8">
                        <View className="h-10 w-10 bg-[#222] rounded items-center justify-center">
                            <Ionicons name="navigate" size={20} color="white" />
                        </View>
                        <View>
                            <Text className="text-gray-500 text-xs">TARGET LOCATION</Text>
                            <Text className="text-white font-bold">{task.location_address || 'Coordinates Only'}</Text>
                        </View>
                    </View>

                    {/* Requirements / Steps */}
                    <Text className="text-gray-500 font-mono text-xs tracking-widest mb-3">OBJECTIVES</Text>
                    {[1, 2, 3].map((step) => (
                        <View key={step} className="flex-row items-center gap-4 mb-4 opacity-50">
                            <View className="h-6 w-6 rounded border border-white/30 items-center justify-center">
                                <Text className="text-white/50 text-xs">{step}</Text>
                            </View>
                            <Text className="text-white/50 font-mono">Verify target integrity</Text>
                        </View>
                    ))}

                    {/* Proof Upload */}
                    <Text className="text-gray-500 font-mono text-xs tracking-widest mb-3 mt-6">UPLOAD PROOF</Text>
                    <TouchableOpacity
                        onPress={handleTakePhoto}
                        className="bg-[#111] border-2 border-dashed border-[#00ff88]/30 rounded-lg p-6 items-center justify-center mb-4"
                        activeOpacity={0.7}
                    >
                        <MaterialCommunityIcons name="camera-plus" size={32} color="#00ff88" />
                        <Text className="text-[#00ff88] font-mono text-sm mt-2">CAPTURE PROOF</Text>
                        <Text className="text-gray-500 font-mono text-xs mt-1">
                            {proofImages.length} photo{proofImages.length !== 1 ? 's' : ''} uploaded
                        </Text>
                    </TouchableOpacity>

                </View>
            </ScrollView>

            {/* Action Bar */}
            <View className="absolute bottom-0 left-0 right-0 p-5 bg-[#050505] border-t border-white/10">
                <View className="flex-row gap-3 mb-3">
                    <View className="flex-1">
                        <TouchableOpacity
                            onPress={handleAbort}
                            className="bg-red-900/20 border border-red-500/50 py-3 rounded items-center active:scale-95"
                            activeOpacity={0.8}
                        >
                            <Text className="text-red-500 font-mono font-bold text-sm">ABORT MISSION</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <NeoButton
                    title={completing ? "UPLOADING PROOF..." : "⚡ COMPLETE MISSION"}
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={completing}
                    disabled={proofImages.length === 0}
                    onPress={handleComplete}
                />
            </View>
        </View>
    );
}

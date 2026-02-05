import { View, Text, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function Dashboard() {
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

            <Text className="text-[#00ff88] font-mono text-xs tracking-widest mb-4 border-b border-[#00ff88]/20 pb-2">AVAILABLE_MISSIONS (0)</Text>

            <View className="items-center justify-center py-20 opacity-50">
                <Text className="text-gray-600 font-mono text-xs text-center">NO MISSIONS DETECTED IN SECTOR</Text>
                <Text className="text-gray-700 font-mono text-[10px] text-center mt-2">WAITING FOR AGENT REQUESTS...</Text>
            </View>
        </View>
    );
}

import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface TaskCardProps {
  id: string;
  title: string;
  description: string;
  task_type: 'delivery' | 'verification' | 'repair' | 'representation' | 'creative' | 'communication';
  budget_amount: number;
  location_address?: string;
  status: 'open' | 'assigned' | 'in_progress' | 'completed';
  onAccept: (id: string) => void;
}

const typeIcons = {
  delivery: 'package-variant' as const,
  verification: 'check-decagram' as const,
  repair: 'wrench' as const,
  representation: 'account-tie' as const,
  creative: 'palette' as const,
  communication: 'phone' as const,
};

const typeLabels = {
  delivery: 'DELIVERY',
  verification: 'VERIFY',
  repair: 'REPAIR',
  representation: 'REPRESENT',
  creative: 'CREATE',
  communication: 'CONTACT',
};

export default function TaskCard({
  id,
  title,
  description,
  task_type,
  budget_amount,
  location_address,
  status,
  onAccept,
}: TaskCardProps) {
  return (
    <View className="border border-[#1a2e25] bg-black/40 rounded overflow-hidden">
      {/* Terminal Header */}
      <View className="flex-row items-center justify-between p-3 border-b border-[#1a2e25] bg-[#0d1a14]/50">
        <View className="flex-row items-center gap-2">
          <MaterialCommunityIcons 
            name={typeIcons[task_type]} 
            size={16} 
            color="#00ff88" 
          />
          <Text className="text-[#00ff88] text-[10px] font-mono font-bold uppercase tracking-widest">
            {typeLabels[task_type]}
          </Text>
        </View>
        <View className="flex-row items-center gap-1">
          <View className="w-1.5 h-1.5 bg-[#00ff88] rounded-full animate-pulse" />
          <Text className="text-[#00ff88]/60 text-[9px] font-mono uppercase">
            {status}
          </Text>
        </View>
      </View>

      {/* Body */}
      <View className="p-4">
        <Text className="text-white font-bold text-sm mb-2" numberOfLines={1}>
          {title}
        </Text>
        <Text className="text-gray-400 text-xs mb-3 leading-5" numberOfLines={2}>
          {description}
        </Text>

        {location_address && (
          <View className="flex-row items-center gap-2 mb-3">
            <MaterialCommunityIcons name="map-marker" size={12} color="#00ff88" />
            <Text className="text-[#00ff88]/60 text-[10px] font-mono" numberOfLines={1}>
              {location_address}
            </Text>
          </View>
        )}

        {/* Footer */}
        <View className="flex-row items-center justify-between pt-3 border-t border-[#1a2e25]">
          <View className="bg-[#00ff88]/10 border border-[#00ff88]/30 rounded-full px-3 py-1.5">
            <Text className="text-[#00ff88] text-xs font-mono font-bold">
              ${budget_amount.toFixed(2)}
            </Text>
          </View>
          
          <TouchableOpacity
            onPress={() => onAccept(id)}
            activeOpacity={0.8}
            className="bg-[#00ff88] px-4 py-1.5 rounded active:scale-95"
          >
            <Text className="text-black font-mono font-bold text-xs uppercase">
              ACCEPT
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

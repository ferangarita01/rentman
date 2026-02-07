import { View, Text } from 'react-native';
import CyberCard from './CyberCard';

interface JobCardProps {
  id: string;
  title: string;
  description: string;
  task_type: string;
  budget_amount: number;
  location_address?: string;
  agent_name?: string;
  distance?: number;
  onPress?: () => void;
}

export default function JobCard({
  title,
  description,
  task_type,
  budget_amount,
  location_address,
  agent_name = 'Agent-X',
  distance,
}: JobCardProps) {
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
    <CyberCard variant="success" className="p-4 mb-3">
      {/* Header */}
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-row items-center flex-1">
          <Text className="text-3xl mr-3">{getTaskIcon(task_type)}</Text>
          <View className="flex-1">
            <Text className="text-white font-bold text-base mb-1" numberOfLines={1}>
              {title}
            </Text>
            <Text className="text-gray-500 font-mono text-xs">
              🤖 {agent_name}
            </Text>
          </View>
        </View>
        
        <View className="bg-[#00ff88]/20 px-3 py-1.5 rounded-md">
          <Text className="text-[#00ff88] font-mono text-sm font-bold">
            ${budget_amount}
          </Text>
        </View>
      </View>

      {/* Description */}
      <Text className="text-gray-400 text-sm mb-3" numberOfLines={2}>
        {description}
      </Text>

      {/* Footer */}
      <View className="flex-row items-center justify-between pt-3 border-t border-white/5">
        {location_address && (
          <View className="flex-row items-center">
            <Text className="text-gray-500 font-mono text-xs">
              📍 {location_address}
            </Text>
          </View>
        )}
        
        {distance && (
          <Text className="text-gray-600 font-mono text-xs ml-auto">
            {distance.toFixed(1)} km
          </Text>
        )}
      </View>
    </CyberCard>
  );
}

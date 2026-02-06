import { View, Text } from 'react-native';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

export default function StatCard({ label, value, icon, trend, trendValue }: StatCardProps) {
  const trendColors = {
    up: 'text-[#00ff88]',
    down: 'text-red-500',
    neutral: 'text-gray-500',
  };

  const trendIcons = {
    up: '↑',
    down: '↓',
    neutral: '→',
  };

  return (
    <View className="bg-surface border border-white/10 rounded-lg p-4">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-gray-500 font-mono text-xs uppercase tracking-wider">
          {label}
        </Text>
        {icon && <Text className="text-xl">{icon}</Text>}
      </View>
      
      <Text className="text-white text-2xl font-bold mb-1">
        {value}
      </Text>
      
      {trend && trendValue && (
        <View className="flex-row items-center">
          <Text className={`${trendColors[trend]} font-mono text-xs font-bold`}>
            {trendIcons[trend]} {trendValue}
          </Text>
          <Text className="text-gray-600 font-mono text-xs ml-1">vs last week</Text>
        </View>
      )}
    </View>
  );
}

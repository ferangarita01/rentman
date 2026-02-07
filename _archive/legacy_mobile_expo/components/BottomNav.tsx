import { View, TouchableOpacity, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';

const tabs = [
  { name: 'MARKET', icon: 'compass' as const, route: '/' },
  { name: 'WALLET', icon: 'wallet' as const, route: '/wallet' },
  { name: 'AGENTS', icon: 'robot' as const, route: '/agents' },
  { name: 'USER', icon: 'account' as const, route: '/profile' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  
  return (
    <View className="h-20 bg-black/80 border-t border-[#00ff88]/20 flex-row items-center justify-around px-6">
      {tabs.map((tab) => {
        const isActive = pathname === tab.route;
        return (
          <TouchableOpacity 
            key={tab.name} 
            onPress={() => router.push(tab.route as any)}
            activeOpacity={0.7}
          >
            <View className="items-center gap-1">
              <MaterialCommunityIcons 
                name={tab.icon} 
                size={24} 
                color={isActive ? '#00ff88' : '#00ff8866'} 
              />
              <Text className={`text-[9px] font-mono ${isActive ? 'text-[#00ff88]' : 'text-[#00ff88]/40'}`}>
                {tab.name}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

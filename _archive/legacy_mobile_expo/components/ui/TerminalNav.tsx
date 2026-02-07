import { View, Text, Pressable, Platform } from 'react-native';
import { useLinkBuilder, useTheme } from '@react-navigation/native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

export function TerminalNav({ state, descriptors, navigation }: BottomTabBarProps) {
    const { colors } = useTheme();
    const { buildHref } = useLinkBuilder();

    return (
        <View className="flex-row bg-[#080808] border-t border-white/10 pb-6 pt-2 h-20 items-center justify-around translate-y-0 relative z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
            {/* Cyberpunk decorative line */}
            <View className="absolute top-0 left-0 right-0 h-[1px] bg-primary/20" />

            {state.routes.map((route, index) => {
                const { options } = descriptors[route.key];
                const isFocused = state.index === index;

                const label =
                    options.tabBarLabel !== undefined
                        ? options.tabBarLabel
                        : options.title !== undefined
                            ? options.title
                            : route.name;

                const onPress = () => {
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    });

                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name, route.params);
                    }
                };

                const onLongPress = () => {
                    navigation.emit({
                        type: 'tabLongPress',
                        target: route.key,
                    });
                };

                const iconName =
                    route.name === 'index' ? 'SYS' :
                        route.name === 'history' ? 'LOG' :
                            'CFG';

                return (
                    <Pressable
                        key={route.name}
                        href={buildHref(route.name, route.params)}
                        accessibilityState={isFocused ? { selected: true } : {}}
                        accessibilityLabel={options.tabBarAccessibilityLabel}
                        testID={options.tabBarTestID}
                        onPress={onPress}
                        onLongPress={onLongPress}
                        className={`items-center justify-center h-full px-4 rounded transition-all duration-200 ${isFocused ? 'bg-primary/10' : ''}`}
                    >
                        <Text
                            className={`font-mono text-xs font-bold tracking-widest uppercase mb-1 ${isFocused ? 'text-primary text-glow' : 'text-slate-500'}`}
                        >
                            [{iconName}]
                        </Text>
                        <View className={`h-1 w-8 rounded-full ${isFocused ? 'bg-primary shadow-[0_0_10px_#00ff88]' : 'bg-transparent'}`} />
                    </Pressable>
                );
            })}
        </View>
    );
}

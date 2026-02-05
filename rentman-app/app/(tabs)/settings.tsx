import { View, Text } from 'react-native';

export default function Settings() {
    return (
        <View className="flex-1 bg-background pt-12 px-4 justify-center items-center">
            <Text className="text-white font-mono text-xl">SYSTEM CONFIG</Text>
            <Text className="text-gray-500 font-mono text-xs mt-2">v0.1.0-alpha</Text>
        </View>
    );
}

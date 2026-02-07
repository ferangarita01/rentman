import { View, Text } from 'react-native';

export default function History() {
    return (
        <View className="flex-1 bg-background pt-12 px-4 justify-center items-center">
            <Text className="text-white font-mono text-xl">MISSION LOGS</Text>
            <Text className="text-gray-500 font-mono text-xs mt-2">NO PRIOR RECORDS FOUND</Text>
        </View>
    );
}

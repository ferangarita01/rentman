import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CyberpunkCardProps {
    title: string;
    subtitle?: string;
    icon?: keyof typeof Ionicons.glyphMap;
    variant?: 'default' | 'success' | 'warning' | 'error';
    onPress?: () => void;
    children?: React.ReactNode;
}

export default function CyberpunkCard({
    title,
    subtitle,
    icon,
    variant = 'default',
    onPress,
    children
}: CyberpunkCardProps) {
    const variantStyles = {
        default: {
            border: 'border-white/10',
            glow: 'bg-[#00ff88]/0',
            iconColor: '#00ff88'
        },
        success: {
            border: 'border-[#00ff88]/50',
            glow: 'bg-[#00ff88]/5',
            iconColor: '#00ff88'
        },
        warning: {
            border: 'border-yellow-500/50',
            glow: 'bg-yellow-500/5',
            iconColor: '#eab308'
        },
        error: {
            border: 'border-red-500/50',
            glow: 'bg-red-500/5',
            iconColor: '#ef4444'
        }
    };

    const styles = variantStyles[variant];

    const CardContent = (
        <View className={`bg-[#111] ${styles.glow} ${styles.border} border rounded-lg p-4`}>
            <View className="flex-row items-center gap-3 mb-2">
                {icon && (
                    <View className="h-10 w-10 bg-black/50 rounded-lg items-center justify-center">
                        <Ionicons name={icon} size={20} color={styles.iconColor} />
                    </View>
                )}
                <View className="flex-1">
                    <Text className="text-white font-bold text-lg">{title}</Text>
                    {subtitle && (
                        <Text className="text-gray-500 font-mono text-xs">{subtitle}</Text>
                    )}
                </View>
            </View>
            {children}
        </View>
    );

    if (onPress) {
        return (
            <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
                {CardContent}
            </TouchableOpacity>
        );
    }

    return CardContent;
}

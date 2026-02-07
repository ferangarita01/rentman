import { View, ViewProps } from 'react-native';
import { ReactNode } from 'react';

interface GlassPanelProps extends ViewProps {
  children: ReactNode;
  intensity?: 'light' | 'medium' | 'heavy';
}

export default function GlassPanel({ 
  children, 
  intensity = 'medium',
  className = '',
  ...props 
}: GlassPanelProps) {
  const bgOpacity = {
    light: 'bg-black/60',
    medium: 'bg-black/80',
    heavy: 'bg-black/90',
  };

  return (
    <View
      className={`
        ${bgOpacity[intensity]}
        border 
        border-white/10
        rounded-lg
        ${className}
      `}
      style={{
        // Note: backdrop-blur not natively supported, requires expo-blur
        // For v1, using solid opacity backgrounds
      }}
      {...props}
    >
      {children}
    </View>
  );
}

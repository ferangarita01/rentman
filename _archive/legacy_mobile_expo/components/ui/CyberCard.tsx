import { View, ViewProps } from 'react-native';
import { ReactNode } from 'react';

interface CyberCardProps extends ViewProps {
  children: ReactNode;
  glowColor?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export default function CyberCard({ 
  children, 
  glowColor, 
  variant = 'default',
  className = '',
  ...props 
}: CyberCardProps) {
  const glowColors = {
    default: 'border-white/10',
    success: 'border-[#00ff88]/30',
    warning: 'border-yellow-500/30',
    danger: 'border-red-500/30',
  };

  const bgGlow = {
    default: '',
    success: 'bg-[#00ff88]/5',
    warning: 'bg-yellow-500/5',
    danger: 'bg-red-500/5',
  };

  return (
    <View
      className={`
        bg-surface 
        border 
        ${glowColors[variant]} 
        ${bgGlow[variant]}
        rounded-lg 
        overflow-hidden
        ${className}
      `}
      {...props}
    >
      {children}
    </View>
  );
}

import { TouchableOpacity, Text, TouchableOpacityProps, ActivityIndicator } from 'react-native';

interface NeoButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

export default function NeoButton({ 
  title, 
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  className = '',
  disabled,
  ...props 
}: NeoButtonProps) {
  const variants = {
    primary: 'bg-[#00ff88] border-[#00ff88]',
    secondary: 'bg-transparent border-[#00ff88]',
    ghost: 'bg-transparent border-transparent',
    danger: 'bg-red-500 border-red-500',
  };

  const textColors = {
    primary: 'text-black',
    secondary: 'text-[#00ff88]',
    ghost: 'text-white',
    danger: 'text-white',
  };

  const sizes = {
    sm: 'px-3 py-1.5',
    md: 'px-4 py-2.5',
    lg: 'px-6 py-3.5',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <TouchableOpacity
      className={`
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        border
        rounded-lg
        items-center
        justify-center
        flex-row
        ${disabled || loading ? 'opacity-50' : 'active:opacity-80'}
        ${className}
      `}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'primary' ? '#000' : '#00ff88'} />
      ) : (
        <Text className={`${textColors[variant]} ${textSizes[size]} font-bold tracking-wide`}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

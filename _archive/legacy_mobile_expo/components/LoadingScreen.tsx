import { View, Text, Animated } from 'react-native';
import { useEffect, useRef, useState } from 'react';

const messages = [
  '> CONNECTING_TO_NETWORK...',
  '> FETCHING_TASKS...',
  '> LOADING_INTERFACE...',
  '> READY_FOR_MISSION',
];

export default function LoadingScreen({ onComplete }: { onComplete?: () => void }) {
  const [currentMessage, setCurrentMessage] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Typewriter effect
  useEffect(() => {
    const message = messages[currentMessage];
    let currentIndex = 0;

    const typeInterval = setInterval(() => {
      if (currentIndex < message.length) {
        setDisplayText(message.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typeInterval);
        
        // Move to next message after delay
        setTimeout(() => {
          if (currentMessage < messages.length - 1) {
            setCurrentMessage(prev => prev + 1);
          } else {
            // Fade out and complete
            setTimeout(() => {
              Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
              }).start(() => {
                onComplete?.();
              });
            }, 500);
          }
        }, 300);
      }
    }, 50);

    return () => clearInterval(typeInterval);
  }, [currentMessage]);

  // Blinking cursor
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);

    return () => clearInterval(cursorInterval);
  }, []);

  return (
    <Animated.View 
      className="flex-1 bg-[#050505] items-center justify-center"
      style={{ opacity: fadeAnim }}
    >
      {/* Grid Background */}
      <View className="absolute inset-0 opacity-20" />

      {/* Content */}
      <View className="items-center">
        <View className="flex-row items-center mb-8">
          <Text className="text-[#00ff88] font-mono text-base">
            {displayText}
          </Text>
          {showCursor && (
            <Text className="text-[#00ff88] font-mono text-base ml-1">
              ▌
            </Text>
          )}
        </View>

        {/* Progress Indicator */}
        <View className="flex-row gap-2">
          {messages.map((_, index) => (
            <View
              key={index}
              className={`h-1 w-8 rounded-full ${
                index <= currentMessage ? 'bg-[#00ff88]' : 'bg-[#00ff88]/20'
              }`}
            />
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

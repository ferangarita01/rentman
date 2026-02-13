'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { chatWithRentman, ChatMessage, RentmanContext } from '@/lib/vertex-ai';

interface RentmanAssistantContextType {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (message: string) => Promise<void>;
  clearMessages: () => void;
  context: RentmanContext;
  updateContext: (newContext: Partial<RentmanContext>) => void;
  isConnected: boolean;
  connectToRealtime: () => void;
  disconnectFromRealtime: () => void;
}

import { usePushNotifications } from '@/hooks/usePushNotifications';

const RentmanAssistantContext = createContext<RentmanAssistantContextType | undefined>(undefined);

// WebSocket server URL
import { config } from '@/lib/config';

// Build WebSocket URL
const BACKEND_URL = config.apiUrl;
const WS_URL = BACKEND_URL.replace(/^https:\/\//, 'wss://').replace(/^http:\/\//, 'ws://');

export function RentmanAssistantProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState<RentmanContext>({});

  // Initialize Push Notifications
  usePushNotifications();

  // WebSocket State
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = React.useRef<WebSocket | null>(null);

  // Initialize WebSocket connection
  const connectToRealtime = useCallback(() => {
    if (wsRef.current || typeof window === 'undefined') return;

    try {
      console.log('🔵 [Rentman] Connecting to Realtime:', WS_URL);
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ [Rentman] WebSocket connected');
        setIsConnected(true);
        // Auth handshake would go here if needed
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          console.log('📩 [Rentman] Received:', msg);

          // Handle 'app_control' events (Navigation, etc.)
          if (msg.type === 'app_control') {
            // Dispatch event for UI to handle (e.g. navigation)
            if (msg.command === 'navigate') {
              window.location.href = msg.path; // Simple nav fallback or use router if available
            }
          }

          // Handle real-time notifications
          if (msg.type === 'notification') {
            // Show toast or local notification
          }

        } catch {
          // Ignore non-JSON messages (like raw audio if we ever add it back)
        }
      };

      ws.onclose = () => {
        console.log('🔴 [Rentman] WebSocket closed');
        setIsConnected(false);
        wsRef.current = null;
      };

      ws.onerror = (err) => {
        console.error('❌ [Rentman] WebSocket error:', err);
      };

    } catch (e: unknown) {
      console.error('❌ [Rentman] Connection failed:', e);
    }
  }, []);

  const disconnectFromRealtime = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // Auto-connect on mount (optional, or trigger manually)
  React.useEffect(() => {
    connectToRealtime();
    return () => disconnectFromRealtime();
  }, [connectToRealtime, disconnectFromRealtime]);

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // 1. Try sending via WebSocket if connected (faster)
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'chat_message',
          content: message,
          context
        }));
        // Note: We assume the backend will send a 'chat_response' message back 
        // via ws.onmessage to complete the loop. 
        // For now, we fallback to REST if we want immediate Promise resolution 
        // or we can implement a hybrid approach. 

        // Hybrid: We still call REST for now to get the guaranteed response 
        // while WS is used for side-effects/events.
        // In full WS mode, we wouldn't await apiPost.
      }

      const response = await chatWithRentman(message, context, messages);

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);

      const errorResponse: ChatMessage = {
        role: 'assistant',
        content: `Lo siento, hubo un error: ${errorMessage}`,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, context]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const updateContext = useCallback((newContext: Partial<RentmanContext>) => {
    setContext(prev => ({ ...prev, ...newContext }));
  }, []);

  return (
    <RentmanAssistantContext.Provider
      value={{
        messages,
        isLoading,
        error,
        sendMessage,
        clearMessages,
        context,
        updateContext,
        isConnected,
        connectToRealtime,
        disconnectFromRealtime
      }}
    >
      {children}
    </RentmanAssistantContext.Provider>
  );
}

export function useRentmanAssistant() {
  const context = useContext(RentmanAssistantContext);
  if (context === undefined) {
    throw new Error('useRentmanAssistant must be used within a RentmanAssistantProvider');
  }
  return context;
}

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
}

const RentmanAssistantContext = createContext<RentmanAssistantContextType | undefined>(undefined);

export function RentmanAssistantProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState<RentmanContext>({});

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

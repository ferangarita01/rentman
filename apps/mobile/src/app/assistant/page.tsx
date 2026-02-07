'use client';

import React from 'react';
import SmartChat from '@/components/SmartChat';
import { useRentmanAssistant } from '@/contexts/RentmanAssistantContext';

export default function AssistantPage() {
  const { messages, isLoading, sendMessage } = useRentmanAssistant();

  // Map context messages to SmartChat format
  const mappedMessages = messages.map((msg, index) => ({
    id: `msg-${index}`,
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
    timestamp: typeof msg.timestamp === 'string' ? new Date(msg.timestamp) : msg.timestamp,
    type: 'text' as const
  }));

  const handleSendMessage = async (content: string, type: 'text' | 'image' | 'audio' | 'location') => {
    // In the future, we can handle different types here (e.g. upload image first)
    // For now, we just send the content string
    await sendMessage(content);
  };

  return (
    <div className="h-screen flex flex-col">
      <SmartChat
        title="RENTMAN_OS"
        type="ai"
        initialMessages={mappedMessages}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
      />
    </div>
  );
}

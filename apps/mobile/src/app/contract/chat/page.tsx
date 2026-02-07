'use client';

import React, { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import SmartChat, { Message } from '@/components/SmartChat';

function ContractChatContent() {
    const searchParams = useSearchParams();
    const contractId = searchParams.get('id') || 'UNKNOWN';

    // Use explicit type for messages state
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: `Connected to Contract #${contractId}. Please upload proof of delivery.`,
            timestamp: new Date(Date.now() - 1000 * 60 * 60),
            type: 'text'
        }
    ]);

    const handleSendMessage = async (content: string, type: 'text' | 'image' | 'audio' | 'location') => {
        console.log(`Sending ${type} to contract ${contractId}:`, content);

        // 1. Optimistic Update (Show user message immediately)
        const newMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: content,
            timestamp: new Date(),
            type: type
        };

        setMessages(prev => [...prev, newMessage]);

        // 2. Simulate Network/AI Reply (after 1s)
        setTimeout(() => {
            const reply: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: type === 'text' ? 'Message received.' : 'Proof received. Verifying...',
                timestamp: new Date(),
                type: 'text'
            };
            setMessages(prev => [...prev, reply]);
        }, 1000);
    };

    return (
        <div className="h-screen flex flex-col">
            <SmartChat
                title={`Contract #${contractId}`}
                subtitle="VERIFIED CHANNEL"
                type="contract"
                initialMessages={messages}
                onSendMessage={handleSendMessage}
            />
        </div>
    );
}

export default function ContractChatPage() {
    return (
        <Suspense fallback={<div className="h-screen bg-black text-white flex items-center justify-center">Loading Chat...</div>}>
            <ContractChatContent />
        </Suspense>
    );
}

'use client';

import React from 'react';
import RentmanChat from '@/components/RentmanChat';

export default function AssistantPage() {
  return (
    <div className="h-screen flex flex-col bg-[#050505]">
      <RentmanChat title="RENTMAN_OS" showBackButton={true} />
    </div>
  );
}

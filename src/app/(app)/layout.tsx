import React from 'react';
import type { Metadata } from 'next';

import { AppSidebar } from '@/components/app/AppSidebar';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-sky">
      <AppSidebar />
      <div className="pl-64 min-h-screen animate-[fadeIn_0.2s_ease-in]">
        {children}
      </div>
    </div>
  );
}

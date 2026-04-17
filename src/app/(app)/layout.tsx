import React from 'react';

export const runtime = 'edge';

import { AppSidebar } from '@/components/app/AppSidebar';


export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-sky">
      <AppSidebar />
      <div className="pl-64 min-h-screen">
        {children}
      </div>
    </div>
  );
}

import React from 'react';
import { MarketingBrandStamp } from '@/components/brand/MarketingBrandStamp';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-sky">
      <MarketingBrandStamp />
      {children}
    </div>
  );
}

"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { QuantisLogo } from '@/components/brand/QuantisLogo';

export function MarketingBrandStamp() {
  const pathname = usePathname();

  if (pathname === '/') return null;

  return (
    <Link
      href="/"
      className="fixed left-6 top-6 z-50 border-4 border-ink bg-sky px-4 py-3 shadow-[6px_6px_0_#111] transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
      aria-label="Go to Quantis home"
    >
      <QuantisLogo size="sm" showVersion version="v0.42" />
    </Link>
  );
}

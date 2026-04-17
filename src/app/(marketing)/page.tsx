import React from 'react';

export const runtime = 'edge';

import { FloatingNav } from '@/components/landing/FloatingNav';

import { HeroSection } from '@/components/landing/HeroSection';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { Features } from '@/components/landing/Features';
import { SocialProof } from '@/components/landing/SocialProof';
import { CTAFooter } from '@/components/landing/CTAFooter';

export default function LandingPage() {
  return (
    <>
      <FloatingNav />
      <HeroSection />
      <HowItWorks />
      <Features />
      <SocialProof />
      <CTAFooter />
    </>
  );
}

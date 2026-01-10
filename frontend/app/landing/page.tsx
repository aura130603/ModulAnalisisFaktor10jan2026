'use client';

import {
    HeroSection,
    FeaturesSection,
    ComparisonSection,
    CspSection
} from '@/app/landing/components';
import LandingHeader from '@/app/landing/components/layout/LandingHeader';
import LandingFooter from '@/app/landing/components/layout/LandingFooter';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AnimatedSection } from './components/AnimatedSection';

export default function LandingPage() {
    return (
        <>
            <LandingHeader />
            <main>
                <HeroSection />
                <FeaturesSection />
                <ComparisonSection />
                <CspSection />
                <CTASection />
            </main>
            <LandingFooter />
        </>
    );
}

function CTASection() {
    return (
        <section id="cta" className="py-16 bg-primary text-primary-foreground">
            <div className="container mx-auto px-4 text-center">
                <AnimatedSection delay={0.2}>
                    <h2 className="text-3xl font-bold mb-4">Ready to Start Analyzing?</h2>
                    <p className="text-lg mb-8">Access Statify now and explore your data.</p>
                    <Link href="/dashboard/">
                        <Button variant="secondary" size="lg" className="animate-pulse hover:animate-none">Start Now</Button>
                    </Link>
                </AnimatedSection>
            </div>
        </section>
    );
}
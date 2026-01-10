'use client';

import { Shield, Cpu, Zap, Lock } from 'lucide-react';
import { AnimatedSection } from './AnimatedSection';
import { motion } from 'framer-motion';

export const CspSection = () => {
    const benefits = [
        {
            icon: <Lock className="h-10 w-10 text-primary" />,
            title: 'Enhanced Privacy',
            description: 'Your data never leaves your browser. Statistical computations happen locally, ensuring complete data privacy with no server uploads required.'
        },
        {
            icon: <Zap className="h-10 w-10 text-primary" />,
            title: 'Speed & Performance',
            description: 'Immediate analysis without waiting for server processing. Results appear instantly as calculations run directly on your device.'
        },
        {
            icon: <Cpu className="h-10 w-10 text-primary" />,
            title: 'Reduced Server Costs',
            description: 'By leveraging your computer\'s processing power, we eliminate expensive server infrastructure, keeping Statify completely free.'
        },
        {
            icon: <Shield className="h-10 w-10 text-primary" />,
            title: 'Offline Capability',
            description: 'Continue working even with unstable internet connections. Your analysis workflows are uninterrupted by connectivity issues.'
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.5
            }
        }
    };

    return (
        <section id="csp" className="py-24 w-full bg-muted/40">
            <div className="container mx-auto px-4 md:px-8 max-w-6xl">
                <AnimatedSection className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-foreground mb-4">Client-Side Processing</h2>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Why we built Statify as a browser-based application and how it benefits you
                    </p>
                </AnimatedSection>

                <motion.div
                    className="grid md:grid-cols-2 gap-8"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.1 }}
                >
                    {benefits.map((benefit, index) => (
                        <motion.div
                            key={index}
                            variants={itemVariants}
                            className="bg-card border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-300"
                        >
                            <div className="flex items-start">
                                <div className="bg-accent p-3 rounded-md mr-4">
                                    {benefit.icon}
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold mb-2 text-foreground">{benefit.title}</h3>
                                    <p className="text-muted-foreground">{benefit.description}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
                
                <AnimatedSection delay={0.4} className="mt-16 text-center">
                    <div className="p-6 bg-accent/20 border border-border rounded-lg">
                        <h3 className="text-xl font-semibold mb-4 text-foreground">How Client-Side Processing Works</h3>
                        <p className="text-muted-foreground mb-4">
                            Unlike traditional statistics software that processes data on remote servers, Statify runs entirely in your browser. 
                            We use modern JavaScript frameworks and WebAssembly to bring high-performance statistical computing directly to your device, 
                            without requiring installation or server communication.
                        </p>
                        <p className="text-muted-foreground">
                            This approach aligns with modern web standards while providing a secure, fast, and accessible experience for all users.
                        </p>
                    </div>
                </AnimatedSection>
            </div>
        </section>
    );
}; 
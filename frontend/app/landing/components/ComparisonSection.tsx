'use client';

import { Check, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AnimatedSection } from './AnimatedSection';
import { motion } from 'framer-motion';
import Link from 'next/link';
import type { Variants } from 'framer-motion';

export const ComparisonSection = () => {
    const statifyFeatures = [
        { text: "100% Free Forever", important: true },
        { text: "Open Source - fully customizable", important: true },
        { text: "Access from any browser", important: false },
        { text: "No installation required", important: false },
        { text: "Client-side computation for privacy", important: true },
        { text: "Works offline after loading", important: false },
        { text: "Lightweight & modern interface", important: true }
    ];

    const spssFeatures = [
        { text: "Expensive annual license fees", negative: true, important: true },
        { text: "Closed-source - cannot be modified", negative: true, important: false },
        { text: "Requires installation on each computer", negative: true, important: false },
        { text: "Manual updates that may cost money", negative: true, important: false },
        { text: "More advanced statistical features", negative: false, important: true },
        { text: "Professional technical support", negative: false, important: false },
        { text: "Enterprise collaboration features", negative: false, important: false }
    ];

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,
                delayChildren: 0.3
            }
        }
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: {
                type: "spring" as const,
                stiffness: 100,
                damping: 15
            }
        }
    };

    return (
        <section id="comparison" className="py-32 bg-gradient-to-b from-background to-muted/20">
            <div className="container mx-auto px-4 md:px-8 max-w-7xl">
                <AnimatedSection className="text-center mb-20">
                    <Badge variant="outline" className="mb-4 px-4 py-2 text-sm font-medium rounded-full">
                        Comparison
                    </Badge>
                    <h2 className="text-4xl font-bold text-foreground mb-6 tracking-tight">Statify vs <span className="text-primary">Commercial SPSS</span></h2>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                        A side-by-side comparison of Statify and commercial SPSS software to help you understand the key differences.
                    </p>
                </AnimatedSection>

                <motion.div 
                    className="grid md:grid-cols-2 gap-8 lg:gap-12"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                >
                    <motion.div variants={itemVariants}>
                        <Card className="h-full border-primary/20 shadow-lg overflow-hidden bg-gradient-to-br from-card to-card/90">
                            <CardHeader className="bg-primary/5 border-b border-primary/10 pb-6">
                                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                                    <div>
                                        <CardTitle className="text-2xl font-bold text-foreground">Statify</CardTitle>
                                        <CardDescription className="text-base mt-1">
                                            Web-Based Non-commercial Alternative
                                        </CardDescription>
                                    </div>
                                    <Badge className="bg-primary/10 text-primary border-primary/20 text-sm py-1 px-3 self-start">
                                        Recommended
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-8 pb-4 px-6">
                                <ul className="space-y-5">
                                    {statifyFeatures.map((feature, index) => (
                                        <motion.li 
                                            key={index} 
                                            className="flex items-start"
                                            initial={{ opacity: 0, x: -10 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1, duration: 0.5 }}
                                            viewport={{ once: true }}
                                        >
                                            <div className="flex-shrink-0 mt-1 bg-primary/10 p-1 rounded-full mr-3">
                                                <Check className="h-4 w-4 text-primary" />
                                            </div>
                                            <span className={`${feature.important ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{feature.text}</span>
                                        </motion.li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter className="pt-4 pb-6 px-6 border-t border-border/20 mt-4">
                                <Link href="/dashboard/" className="w-full">
                                    <Button className="w-full bg-primary hover:bg-primary/90 text-white">
                                        Get Started Now
                                    </Button>
                                </Link>
                            </CardFooter>
                        </Card>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <Card className="h-full border-muted shadow-md overflow-hidden">
                            <CardHeader className="pb-6 border-b border-border/30">
                                <CardTitle className="text-2xl font-bold text-foreground">Commercial SPSS</CardTitle>
                                <CardDescription className="text-base mt-1">
                                    Paid Desktop Solution
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-8 pb-4 px-6">
                                <ul className="space-y-5">
                                    {spssFeatures.map((feature, index) => (
                                        <motion.li 
                                            key={index} 
                                            className="flex items-start"
                                            initial={{ opacity: 0, x: -10 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1, duration: 0.5 }}
                                            viewport={{ once: true }}
                                        >
                                            <div className={`flex-shrink-0 mt-1 p-1 rounded-full mr-3 ${feature.negative ? 'bg-red-100 dark:bg-red-900/20' : 'bg-accent'}`}>
                                                {feature.negative ? (
                                                    <X className="h-4 w-4 text-red-500 dark:text-red-400" />
                                                ) : (
                                                    <Check className="h-4 w-4 text-green-500 dark:text-green-400" />
                                                )}
                                            </div>
                                            <span className={`${feature.important ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{feature.text}</span>
                                        </motion.li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter className="pt-4 pb-6 px-6 border-t border-border/20 mt-4 bg-muted/20">
                                <Button variant="outline" className="w-full" disabled>
                                    Requires Purchase
                                </Button>
                            </CardFooter>
                        </Card>
                    </motion.div>
                </motion.div>
                
                <div className="text-center mt-12">
                    <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                        Statify provides the essential statistical tools you need without the high cost and complexity of commercial solutions.
                        Start analyzing your data immediately with no installation or subscription required.
                    </p>
                </div>
            </div>
        </section>
    );
}
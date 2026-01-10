'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, BarChart2, ArrowRightCircle, Sparkles } from 'lucide-react';

import { motion } from 'framer-motion';

export const HeroSection = () => {
    return (
        <section id="home" className="pt-32 pb-24 w-full bg-gradient-to-b from-background via-background to-muted/20">
            <div className="container px-4 md:px-8 max-w-6xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <motion.div 
                        className="text-left"
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.7, delay: 0.2 }}
                    >
                        <Badge variant="outline" className="mb-6 px-4 py-2 text-sm font-medium rounded-full border-primary/20">
                        100% Free & Open Source
                        </Badge>
                        
                        <motion.h1 
                            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground leading-tight tracking-tight"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.7, delay: 0.4 }}
                        >
                            Easy and Fast <span className="text-primary">Statistical Analysis</span>
                        </motion.h1>
                        
                        <motion.p 
                            className="text-xl text-muted-foreground mb-8 leading-relaxed"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.7, delay: 0.6 }}
                        >
                            Statify provides a complete data analysis toolkit in your browser, 
                            with no installation or costs. Analyze data with powerful statistics tools.
                        </motion.p>
                        
                        <motion.div 
                            className="flex flex-col sm:flex-row gap-4"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.8 }}
                        >
                    <Link href="/dashboard/" className="w-full sm:w-auto">
                                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 h-14 text-lg font-medium group w-full transition-all duration-300 shadow-md hover:shadow-lg">
                            <span>Try for Free</span>
                                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                        </Button>
                    </Link>
                    <Link href="/help" className="w-full sm:w-auto">
                                <Button variant="outline" className="px-8 py-6 h-14 text-lg font-medium border-primary/20 hover:bg-primary/5 transition-colors duration-300 w-full sm:w-auto">
                            Learn More
                        </Button>
                    </Link>
                        </motion.div>
                        
                        <motion.div 
                            className="mt-12 flex items-center gap-6"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.7, delay: 1.0 }}
                        >
                            <div className="flex items-center gap-2">
                                <div className="h-1 w-1 rounded-full bg-primary"></div>
                                <span className="text-sm text-muted-foreground">Web-Based</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-1 w-1 rounded-full bg-primary"></div>
                                <span className="text-sm text-muted-foreground">No Installation</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-1 w-1 rounded-full bg-primary"></div>
                                <span className="text-sm text-muted-foreground">Privacy-Focused</span>
                            </div>
                        </motion.div>
                    </motion.div>
                    
                    <motion.div
                        className="relative hidden md:block"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.7, delay: 0.5 }}
                    >
                        <div className="relative z-10">
                            <div className="absolute -top-8 -right-8 w-24 h-24 bg-primary/10 rounded-full blur-xl"></div>
                            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-primary/10 rounded-full blur-xl"></div>
                            
                            <div className="bg-gradient-to-br from-card to-background border border-border/40 rounded-2xl p-6 shadow-xl">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h3 className="text-lg font-medium">Statistical Analysis</h3>
                                        <p className="text-sm text-muted-foreground">Data visualization</p>
                                    </div>
                                    <div className="bg-primary/10 p-2 rounded-lg">
                                        <BarChart2 className="h-6 w-6 text-primary" />
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                    <div className="h-16 bg-muted/50 rounded-lg flex items-center justify-between px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-md bg-blue-500/20 flex items-center justify-center">
                                                <span className="text-blue-500 text-sm font-medium">T</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">T-Test Analysis</p>
                                                <p className="text-xs text-muted-foreground">Compare means</p>
                                            </div>
                                        </div>
                                        <ArrowRightCircle className="h-5 w-5 text-muted-foreground/40" />
                                    </div>
                                    
                                    <div className="h-16 bg-primary/5 rounded-lg border border-primary/10 flex items-center justify-between px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-md bg-primary/20 flex items-center justify-center">
                                                <span className="text-primary text-sm font-medium">R</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">Regression Model</p>
                                                <p className="text-xs text-muted-foreground">Linear prediction</p>
                                            </div>
                                        </div>
                                        <Sparkles className="h-5 w-5 text-primary/60" />
                                    </div>
                                    
                                    <div className="h-16 bg-muted/50 rounded-lg flex items-center justify-between px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-md bg-purple-500/20 flex items-center justify-center">
                                                <span className="text-purple-500 text-sm font-medium">C</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">Cluster Analysis</p>
                                                <p className="text-xs text-muted-foreground">Group classification</p>
                                            </div>
                                        </div>
                                        <ArrowRightCircle className="h-5 w-5 text-muted-foreground/40" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
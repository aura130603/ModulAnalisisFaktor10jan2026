'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion, type Variants } from 'framer-motion';

export default function LandingFooter() {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const footerLinks = {
        navigasi: [
            { name: 'Features', href: '#features' },
            { name: 'CSP', href: '#csp' },
            { name: 'Comparison', href: '#comparison' }
        ],
        komunitas: [
            { name: 'Forum', href: '#' },
            { name: 'GitHub', href: '#' },
            { name: 'Discord', href: '#' }
        ],
        bantuan: [
            { name: 'Documentation', href: '#' },
            { name: 'Tutorial', href: '#' },
            { name: 'FAQ', href: '#' }
        ]
    };

    const containerAnimation: Variants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05,
                delayChildren: 0.1
            }
        }
    };

    const itemAnimation: Variants = {
        hidden: { opacity: 0, y: 20 },
        show: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.5
            }
        }
    };

    if (!isMounted) {
        return (
            <footer className="border-t border-border py-24 bg-gradient-to-b from-muted/10 to-background">
                <div className="container mx-auto px-4 md:px-8 max-w-7xl"></div>
            </footer>
        );
    }

    return (
        <footer className="border-t border-border py-24 bg-gradient-to-b from-muted/10 to-background">
            <div className="container mx-auto px-4 md:px-8 max-w-7xl">
                <div className="flex flex-wrap">
                    <motion.div 
                        className="w-full md:w-1/4 mb-8 md:mb-0 pr-8"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="font-bold text-lg mb-4 text-foreground">
                            <span className="bg-primary text-primary-foreground px-2 py-1 rounded-sm">Stat</span>
                            <span>ify</span>
                        </div>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            Simple, open, and free web-based statistical analysis for everyone.
                        </p>
                    </motion.div>

                    <div className="w-full md:w-3/4 flex flex-wrap justify-between">
                        <motion.div 
                            className="w-1/2 md:w-1/3 mb-8 md:mb-0"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                        >
                            <h3 className="font-medium text-sm text-foreground mb-4">Navigation</h3>
                            <motion.nav 
                                className="flex flex-col space-y-2"
                                variants={containerAnimation}
                                initial="hidden"
                                animate="show"
                            >
                                {footerLinks.navigasi.map((link, i) => (
                                    <motion.div key={i} variants={itemAnimation}>
                                        <Link
                                            href={link.href}
                                            className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm"
                                        >
                                            {link.name}
                                        </Link>
                                    </motion.div>
                                ))}
                            </motion.nav>
                        </motion.div>

                        <motion.div 
                            className="w-1/2 md:w-1/3 mb-8 md:mb-0"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                        >
                            <h3 className="font-medium text-sm text-foreground mb-4">Community</h3>
                            <motion.nav 
                                className="flex flex-col space-y-2"
                                variants={containerAnimation}
                                initial="hidden"
                                animate="show"
                            >
                                {footerLinks.komunitas.map((link, i) => (
                                    <motion.div key={i} variants={itemAnimation}>
                                        <Link
                                            href={link.href}
                                            className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm"
                                        >
                                            {link.name}
                                        </Link>
                                    </motion.div>
                                ))}
                            </motion.nav>
                        </motion.div>

                        <motion.div 
                            className="w-1/2 md:w-1/3"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                        >
                            <h3 className="font-medium text-sm text-foreground mb-4">Support</h3>
                            <motion.nav 
                                className="flex flex-col space-y-2"
                                variants={containerAnimation}
                                initial="hidden"
                                animate="show"
                            >
                                {footerLinks.bantuan.map((link, i) => (
                                    <motion.div key={i} variants={itemAnimation}>
                                        <Link
                                            href={link.href}
                                            className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm"
                                        >
                                            {link.name}
                                        </Link>
                                    </motion.div>
                                ))}
                            </motion.nav>
                        </motion.div>
                    </div>
                </div>

                <motion.div 
                    className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row md:justify-between md:items-center text-xs text-muted-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                >
                    <p>© {new Date().getFullYear()} Statify. Open Source.</p>
                    <div className="mt-4 md:mt-0">
                        <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors duration-200 mr-6">Privacy</Link>
                        <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors duration-200">Terms</Link>
                    </div>
                </motion.div>
            </div>
        </footer>
    );
}
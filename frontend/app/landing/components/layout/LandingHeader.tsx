"use client"

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu, ChevronRight, BarChart2, LayoutGrid, Cpu } from 'lucide-react';
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetClose,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { useState, useEffect } from 'react';
import { motion, type Variants } from 'framer-motion';

export default function LandingHeader() {
    const [open, setOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const handleScroll = () => {
            if (window.scrollY > 10) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const navItems = [
        { name: 'Features', href: '#features', icon: <BarChart2 className="h-5 w-5" /> },
        { name: 'CSP', href: '#csp', icon: <Cpu className="h-5 w-5" /> },
        { name: 'Comparison', href: '#comparison', icon: <LayoutGrid className="h-5 w-5" /> },
    ];

    const headerVariants: Variants = {
        hidden: { opacity: 0, y: -20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring" as const,
                stiffness: 120,
                damping: 20,
            }
        }
    };

    if (!isMounted) return null;

    return (
        <motion.nav 
            initial="hidden"
            animate="visible"
            variants={headerVariants}
            className={`border-b border-border py-2 w-full fixed top-0 z-50 backdrop-blur-sm transition-all duration-300 ${
                isScrolled ? "bg-background/95 shadow-md" : "bg-background/80"
            }`}
        >
            <div className="container mx-auto px-4 md:px-8 max-w-7xl flex justify-between items-center h-16">
                {/* Logo */}
                <Link href="/" className="font-bold text-xl tracking-tighter text-foreground flex items-center">
                    <span className="bg-primary text-primary-foreground px-2 py-1 mr-1 rounded-sm">Stat</span>
                    <span>ify</span>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex">
                    <NavigationMenu className="mx-auto">
                        <NavigationMenuList>
                            {navItems.map((item, index) => (
                                <NavigationMenuItem key={item.name}>
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 * index, duration: 0.5 }}
                                    >
                                        <NavigationMenuLink asChild>
                                            <Link 
                                                href={item.href}
                                                className="px-4 py-2 text-base font-medium text-muted-foreground hover:text-primary hover:bg-accent transition-colors duration-200 rounded-md"
                                            >
                                                {item.name}
                                            </Link>
                                        </NavigationMenuLink>
                                    </motion.div>
                                </NavigationMenuItem>
                            ))}
                        </NavigationMenuList>
                    </NavigationMenu>
                </div>

                {/* Mobile Menu */}
                <div className="md:hidden">
                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger asChild>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-foreground border-border hover:bg-accent transition-colors duration-200 rounded-md w-10 h-10 p-0"
                            >
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-[280px] p-0 bg-popover border-border">
                            <SheetHeader className="sr-only">
                                <SheetTitle>Statify Navigation Menu</SheetTitle>
                            </SheetHeader>
                            <div className="flex flex-col h-full">
                                {/* Header with Logo */}
                                <div className="p-4 border-b border-border flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="bg-primary text-primary-foreground px-2 py-1 rounded-sm font-bold mr-1">Stat</div>
                                        <div className="text-popover-foreground font-bold">ify</div>
                                    </div>
                                </div>

                                {/* Menu Title */}
                                <div className="px-4 py-3 bg-muted">
                                    <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Navigation Menu</h2>
                                </div>

                                {/* Menu Navigation */}
                                <div className="flex-1 overflow-auto">
                                    <nav className="flex flex-col">
                                        {navItems.map((item, _) => (
                                            <SheetClose asChild key={item.name}>
                                                <Link
                                                    href={item.href}
                                                    className="flex items-center px-4 py-4 text-muted-foreground hover:text-primary hover:bg-accent transition-colors duration-200 border-b border-border"
                                                >
                                                    <span className="bg-muted p-2 mr-4 rounded-md text-muted-foreground">{item.icon}</span>
                                                    <span className="font-medium">{item.name}</span>
                                                    <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
                                                </Link>
                                            </SheetClose>
                                        ))}
                                    </nav>
                                </div>

                                {/* Footer Info */}
                                <div className="py-4 px-4 text-center text-xs text-muted-foreground bg-muted border-t border-border">
                                    Open-source Statistical Analysis Application
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </motion.nav>
    );
}
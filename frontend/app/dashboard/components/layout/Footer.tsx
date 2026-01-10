// components/layout/dashboard/Footer.tsx
"use client";
"use client";

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { DatabaseIcon, VariableIcon, BarChartIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import useAutoSync from "@/hooks/useAutoSync";
import SyncStatus from "@/components/ui/SyncStatus";

export default function Footer() {
    const pathname = usePathname();
    const router = useRouter();
    useAutoSync();
    const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline'>('online');

    const isDataActive = pathname ? pathname.startsWith('/dashboard/data') : false;
    const isVariableActive = pathname ? pathname.startsWith('/dashboard/variable') : false;
    const isResultActive = pathname ? pathname.startsWith('/dashboard/result') : false;

    // Prefetch routes when component mounts
    useEffect(() => {
        // Prefetch all main routes
        router.prefetch('/dashboard/data');
        router.prefetch('/dashboard/variable');
        router.prefetch('/dashboard/result');
    }, [router]);

    useEffect(() => {
        const handleConnectionChange = () => {
            setConnectionStatus(navigator.onLine ? 'online' : 'offline');
        };

        window.addEventListener('online', handleConnectionChange);
        window.addEventListener('offline', handleConnectionChange);

        return () => {
            window.removeEventListener('online', handleConnectionChange);
            window.removeEventListener('offline', handleConnectionChange);
        };
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.altKey) {
                switch (e.key) {
                    case 'd': router.push('/dashboard/data'); break;
                    case 'v': router.push('/dashboard/variable'); break;
                    case 'r': router.push('/dashboard/result'); break;
                    default: break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [router]);

    const tabStyle = "py-1 px-2.5 flex items-center gap-1.5 text-sm transition-colors rounded-md";
    const activeTabStyle = "bg-primary text-primary-foreground ring-2 ring-primary/30";
    const inactiveTabStyle = "text-muted-foreground hover:bg-accent hover:text-accent-foreground";

    return (
        <footer id="dashboard-footer" className="w-full bg-background border-t border-border py-1 px-3 flex items-center justify-between flex-shrink-0" data-testid="footer-navigation">
            <TooltipProvider>
                <div className="flex items-center gap-1" data-testid="navigation-tabs">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                className={`${tabStyle} ${isDataActive ? activeTabStyle : inactiveTabStyle}`}
                                onClick={() => router.push('/dashboard/data')}
                                onMouseEnter={() => router.prefetch('/dashboard/data')}
                                data-testid="data-tab"
                            >
                                <DatabaseIcon size={14} />
                                <span>Data</span>
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                            <p>View and edit dataset (Alt+D)</p>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                className={`${tabStyle} ${isVariableActive ? activeTabStyle : inactiveTabStyle}`}
                                onClick={() => router.push('/dashboard/variable')}
                                onMouseEnter={() => router.prefetch('/dashboard/variable')}
                                data-testid="variable-tab"
                            >
                                <VariableIcon size={14} />
                                <span>Variable</span>
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                            <p>Configure variables (Alt+V)</p>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                className={`${tabStyle} ${isResultActive ? activeTabStyle : inactiveTabStyle}`}
                                onClick={() => router.push('/dashboard/result')}
                                onMouseEnter={() => router.prefetch('/dashboard/result')}
                                data-testid="result-tab"
                            >
                                <BarChartIcon size={14} />
                                <span>Result</span>
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                            <p>View analysis results (Alt+R)</p>
                        </TooltipContent>
                    </Tooltip>
                </div>

                <div className="flex items-center gap-3" data-testid="footer-status">
                    {connectionStatus === 'offline' && (
                        <span className="flex items-center text-muted-foreground text-sm" data-testid="offline-indicator">
                            <span className="inline-block w-2 h-2 rounded-full bg-muted-foreground mr-1.5"></span>
                            Offline
                        </span>
                    )}

                    <SyncStatus />
                </div>
            </TooltipProvider>
        </footer>
    );
}
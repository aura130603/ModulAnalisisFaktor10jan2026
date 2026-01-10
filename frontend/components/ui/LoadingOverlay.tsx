// components/LoadingOverlay.tsx
"use client";

import React, { Suspense, useEffect, useState } from 'react';
import { useDataStore } from "@/stores/useDataStore";
import { useVariableStore } from "@/stores/useVariableStore";
import { useResultStore } from "@/stores/useResultStore";
import { useMetaStore } from '@/stores/useMetaStore';

interface LoadingOverlayProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

function GlobalLoadingIndicator() {
    const dataIsLoading = useDataStore((state) => state.isLoading);
    const variablesIsLoading = useVariableStore((state) => state.isLoading);
    const logsLoading = useResultStore((state) => state.isLoading);
    const metaIsLoading = useMetaStore((state) => state.isLoading);
    const [visible, setVisible] = useState(false);
    const [opacity, setOpacity] = useState(0);
    const [scale, setScale] = useState(0.98);

    const isLoading = dataIsLoading || variablesIsLoading || logsLoading || metaIsLoading;

    useEffect(() => {
        if (isLoading) {
            setVisible(true);
            setTimeout(() => {
                setOpacity(1);
                setScale(1);
            }, 10);
        } else {
            setOpacity(0);
            const timer = setTimeout(() => setVisible(false), 150);
            return () => clearTimeout(timer);
        }
    }, [isLoading]);

    if (!visible && !isLoading) return null;

    return (
        <div
            style={{
                opacity,
                transform: `scale(${scale})`,
                transition: isLoading ? 'opacity 200ms ease-out, transform 200ms ease-out' : 'opacity 150ms ease-in'
            }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="loading-title"
        >
            <div className="flex flex-col items-center gap-4 bg-white p-6 border border-[#E6E6E6] rounded-sm shadow-[0_4px_8px_rgba(0,0,0,0.1)]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-black border-t-[#F7F7F7]"></div>
                <p className="text-sm text-[#444444]" id="loading-title">Data Loading...</p>
            </div>
        </div>
    );
}

export default function LoadingOverlay({ children, fallback }: LoadingOverlayProps) {
    return (
        <>
            <GlobalLoadingIndicator />
            <Suspense fallback={fallback || <div className="text-[#444444] text-sm flex items-center justify-center h-32">Loading...</div>}>
                {children}
            </Suspense>
        </>
    );
}
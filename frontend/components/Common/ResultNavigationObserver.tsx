"use client";

import { useEffect } from 'react';
import { useResultStore } from '@/stores/useResultStore';
import { useRouter } from 'next/navigation';

/**
 * A non-rendering component that observes the result store
 * and triggers navigation to the latest result log.
 */
const ResultNavigationObserver = () => {
    const router = useRouter();
    const latestLogId = useResultStore((state) => state.latestLogId);
    const setLatestLogId = useResultStore((state) => state.setLatestLogId);

    useEffect(() => {
        if (latestLogId !== null) {
            router.push(`/dashboard/result#log-${latestLogId}`);
            // Reset the ID to prevent re-triggering navigation
            setLatestLogId(null);
        }
    }, [latestLogId, router, setLatestLogId]);

    return null; // This component does not render anything
};

export default ResultNavigationObserver; 
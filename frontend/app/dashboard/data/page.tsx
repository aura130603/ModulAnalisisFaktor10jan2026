// app/dashboard/data/page.tsx

"use client";

import React, { Suspense, useEffect } from 'react';
import Index from "./components/dataTable";
import { DataTableSkeleton } from "@/components/ui/Skeletons";
import { useTableRefStore } from '@/stores/useTableRefStore';

export default function DataPage() {
    const { setViewMode } = useTableRefStore();
    useEffect(() => {
        setViewMode('numeric');
        return () => setViewMode('numeric');
    }, [setViewMode]);

    return (
        <div className="z-0 h-full w-full" data-testid="data-page">
            <Suspense fallback={<DataTableSkeleton data-testid="data-table-loading" />}>
                <Index />
            </Suspense>
        </div>
    );
}

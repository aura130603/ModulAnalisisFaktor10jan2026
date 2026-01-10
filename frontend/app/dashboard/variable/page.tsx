// app/dashboard/variables/page.tsx

"use client";

import React, { Suspense, useEffect } from 'react';
import { useTableRefStore } from '@/stores/useTableRefStore';
import VariableTable from "./components/variableTable";
import { VariableTableSkeleton } from "@/components/ui/Skeletons";

export default function VariablesPage() {
    const { setViewMode } = useTableRefStore();
    useEffect(() => {
        setViewMode('numeric');
        return () => setViewMode('numeric');
    }, [setViewMode]);
    return (
        <div className="h-full w-full" data-testid="variable-page">
            <Suspense fallback={<VariableTableSkeleton data-testid="variable-table-loading" />}>
                <VariableTable />
            </Suspense>
        </div>
    );
}

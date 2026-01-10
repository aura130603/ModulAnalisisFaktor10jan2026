// components/Skeletons.tsx
import React from 'react';

export function DataTableSkeleton({ ...props }) {
    const columnCount = 20;
    const rowCount = 25;

    return (
        <div className="h-full w-full relative border border-border rounded animate-pulse" {...props}>
            {/* Column Headers */}
            <div className="flex border-b border-border sticky top-0 z-10 bg-muted/50">
                <div className="w-12 h-8 p-1 flex justify-center items-center border-r border-border">
                    {/* Corner cell */}
                </div>
                {Array.from({ length: columnCount }).map((_, i) => (
                    <div key={i} className="w-16 min-w-16 h-8 p-1 border-r border-border flex flex-row items-center justify-between">
                        <div className="h-5 bg-muted rounded w-8 mr-1"></div>
                        <div className="h-5 w-4 bg-muted rounded"></div>
                    </div>
                ))}
            </div>

            {/* Row Headers and Cells */}
            <div className="overflow-auto">
                {Array.from({ length: rowCount }).map((_, rowIndex) => (
                    <div key={rowIndex} className="flex border-b border-border hover:bg-muted/50">
                        <div className="w-12 h-6 p-1 border-r border-border bg-muted/50 flex justify-center items-center">
                            <div className="h-4 bg-muted rounded w-6"></div>
                        </div>
                        {Array.from({ length: columnCount }).map((_, i) => (
                            <div key={i} className="w-16 min-w-16 h-6 p-1 border-r border-border"></div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

export function VariableTableSkeleton({ ...props }) {
    const columnCount = 7;
    const rowCount = 25;
    const columnWidths = ["flex-1", "flex-1", "w-24", "w-24", "flex-1", "flex-1", "flex-1"];
    const columnNames = ["Name", "Type", "Width", "Decimals", "Label", "Values", "Missing"];

    return (
        <div className="h-full w-full relative border border-border rounded animate-pulse" {...props}>
            {/* Column Headers */}
            <div className="flex border-b border-border sticky top-0 z-10 bg-muted/50">
                <div className="w-12 h-8 p-1 flex justify-center items-center border-r border-border">
                    {/* Corner cell */}
                </div>
                {Array.from({ length: columnCount }).map((_, i) => (
                    <div key={i} className={`${columnWidths[i]} h-8 p-2 border-r border-border flex items-center justify-center`}>
                        <div className="h-5 bg-muted rounded w-4/5"></div>
                    </div>
                ))}
            </div>

            {/* Row Headers and Cells */}
            <div className="overflow-auto">
                {Array.from({ length: rowCount }).map((_, rowIndex) => (
                    <div key={rowIndex} className="flex border-b border-border hover:bg-muted/50">
                        <div className="w-12 h-8 p-1 border-r border-border bg-muted/50 flex justify-center items-center">
                            <div className="h-4 bg-muted rounded w-6"></div>
                        </div>
                        {Array.from({ length: columnCount }).map((_, i) => (
                            <div key={i} className={`${columnWidths[i]} h-8 p-2 border-r border-border`}>
                                {/* Empty cell content */}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

export function ResultsSkeleton({ ...props }) {
    return (
        <div className="p-6 space-y-8 animate-pulse" {...props}>
            {/* Sidebar skeleton - will be hidden on small screens */}
            <div className="hidden md:block fixed top-16 left-0 w-64 h-full border-r border-border bg-card p-4">
                <div className="h-8 bg-muted rounded w-2/3 mb-4"></div>
                <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-6 bg-muted rounded"></div>
                    ))}
                </div>
            </div>

            {/* Result cards */}
            <div className="md:ml-64">
                {Array.from({ length: 2 }).map((_, cardIndex) => (
                    <div key={cardIndex} className="mb-8">
                        <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
                        <div className="border border-border rounded-lg p-6 bg-card shadow-sm">
                            <div className="h-8 bg-muted rounded w-1/2 mb-6"></div>
                            <div className="h-4 bg-muted rounded w-2/3 mb-8"></div>

                            {/* Chart placeholder */}
                            <div className="h-64 bg-muted/50 rounded-lg mb-6 flex items-center justify-center">
                                <div className="h-48 w-5/6 bg-muted rounded"></div>
                            </div>

                            {/* Table placeholder */}
                            <div className="border border-border rounded">
                                <div className="flex border-b border-border bg-muted/50">
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <div key={i} className="flex-1 h-10 p-2 border-r border-border">
                                            <div className="h-6 bg-muted rounded w-full"></div>
                                        </div>
                                    ))}
                                </div>
                                {Array.from({ length: 3 }).map((_, rowIndex) => (
                                    <div key={rowIndex} className="flex border-b border-border">
                                        {Array.from({ length: 4 }).map((_, i) => (
                                            <div key={i} className="flex-1 h-10 p-2 border-r border-border">
                                                <div className="h-6 bg-muted rounded w-full"></div>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function SidebarSkeleton({ ...props }) {
    return (
        <div className="bg-card border-r border-border h-full animate-pulse" {...props}>
            <div className="flex items-center justify-between p-3 border-b border-border">
                <div className="h-6 bg-muted rounded w-24"></div>
                <div className="h-8 w-8 bg-muted rounded"></div>
            </div>
            <div className="p-3 space-y-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-6 bg-muted rounded w-full"></div>
                ))}
            </div>
        </div>
    );
}

// New Skeleton for Dashboard Landing Page Loading State
export function DashboardLandingSkeleton({ ...props }) {
    const actionCardCount = 3;

    return (
        <div className="container mx-auto px-4 py-12 max-w-6xl animate-pulse" {...props}>
            {/* Header Skeleton */}
            <div className="mb-12">
                <div className="h-8 bg-muted rounded w-1/3 mb-3"></div>
                <div className="h-5 bg-muted rounded w-1/2"></div>
            </div>

            {/* Action Cards Skeleton */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
                {Array.from({ length: actionCardCount }).map((_, index) => (
                    <div key={index} className="h-48 bg-card border border-border rounded p-6 flex flex-col items-center justify-center">
                        <div className="h-12 w-12 bg-muted rounded-full mb-4"></div>
                        <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-muted rounded w-full"></div>
                    </div>
                ))}
            </div>

             {/* Placeholder for Recent Projects / Resources might also be added here if desired */}
             <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-4">
                    <div className="h-6 bg-muted rounded w-1/4 mb-4"></div>
                    <div className="h-24 bg-card border border-border rounded"></div>
                    <div className="h-24 bg-card border border-border rounded"></div>
                </div>
                 <div className="space-y-4">
                    <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
                    <div className="h-20 bg-card border border-border rounded"></div>
                    <div className="h-20 bg-card border border-border rounded"></div>
                </div>
            </div>
        </div>
    );
}
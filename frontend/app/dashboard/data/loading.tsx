// app/dashboard/data/loading.tsx
import { DataTableSkeleton } from "@/components/ui/Skeletons";

export default function DataLoading() {
    return (
        <div className="z-0 h-full w-full" data-testid="data-loading">
            <DataTableSkeleton data-testid="data-table-skeleton" />
        </div>
    );
}
// app/dashboard/variables/loading.tsx
import { VariableTableSkeleton } from "@/components/ui/Skeletons";

export default function VariablesLoading() {
    return (
        <div className="h-full w-full" data-testid="variables-loading">
            <VariableTableSkeleton data-testid="variable-table-skeleton" />
        </div>
    );
}
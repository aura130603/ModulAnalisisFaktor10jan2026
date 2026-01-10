// app/dashboard/results/loading.tsx
import { ResultsSkeleton, SidebarSkeleton } from "@/components/ui/Skeletons";

export default function ResultsLoading() {
    return (
        <div className="flex h-full w-full overflow-hidden" data-testid="results-loading">
            <div className="h-full" data-testid="results-sidebar-container">
                <SidebarSkeleton data-testid="results-sidebar-skeleton" />
            </div>
            <div className="flex-1 overflow-y-auto" data-testid="results-content-container">
                <ResultsSkeleton data-testid="results-skeleton" />
            </div>
        </div>
    );
}
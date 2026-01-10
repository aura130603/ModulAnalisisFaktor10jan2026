// app/dashboard/loading.tsx
import { Card, CardContent } from '@/components/ui/card';

export default function DashboardLoading() {
    const dataActionSkeletons = Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="block h-full" data-testid={`data-action-skeleton-${index}`}>
            <Card className="h-full border border-border shadow-sm bg-card animate-pulse">
                <CardContent className="p-6 flex flex-col items-center text-center h-full">
                    <div className="p-4 rounded-full mb-4 bg-muted">
                        <div className="h-12 w-12 bg-muted rounded-full"></div>
                    </div>
                    <div className="h-6 bg-muted rounded w-32 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-48"></div>
                </CardContent>
            </Card>
        </div>
    ));

    const recentProjectSkeletons = Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="block" data-testid={`recent-project-skeleton-${index}`}>
            <Card className="bg-card border border-border shadow-sm animate-pulse">
                <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="h-5 bg-muted rounded w-36 mb-2"></div>
                            <div className="h-4 bg-muted rounded w-48"></div>
                        </div>
                        <div className="h-4 bg-muted rounded w-16"></div>
                    </div>
                </CardContent>
            </Card>
        </div>
    ));

    const resourceSkeletons = Array.from({ length: 2 }).map((_, index) => (
        <div key={index} className="block" data-testid={`resource-skeleton-${index}`}>
            <Card className="bg-card border border-border shadow-sm animate-pulse">
                <CardContent className="p-4">
                    <div className="flex items-center">
                        <div className="mr-4 p-2 bg-muted rounded-full">
                            <div className="h-6 w-6 bg-muted rounded-full"></div>
                        </div>
                        <div>
                            <div className="h-5 bg-muted rounded w-28 mb-1"></div>
                            <div className="h-4 bg-muted rounded w-40"></div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    ));

    return (
        <div className="min-h-screen bg-background" data-testid="dashboard-loading">
            <div className="container mx-auto px-4 py-12 max-w-6xl">
                <div className="mb-12" data-testid="loading-header">
                    <div className="h-8 bg-muted rounded w-64 mb-2 animate-pulse"></div>
                    <div className="h-5 bg-muted rounded w-96 animate-pulse"></div>
                </div>

                {/* Data Action Card Skeletons */}
                <div className="grid md:grid-cols-3 gap-6 mb-12" data-testid="data-actions-loading">
                    {dataActionSkeletons}
                </div>

                <div className="grid md:grid-cols-3 gap-8" data-testid="content-sections-loading">
                    {/* Recent Projects Section */}
                    <div className="md:col-span-2" data-testid="recent-projects-loading">
                        <div className="mb-6 flex justify-between items-center">
                            <div className="h-6 bg-muted rounded w-40 animate-pulse"></div>
                            <div className="h-8 w-24 bg-muted rounded animate-pulse"></div>
                        </div>

                        <div className="space-y-4">
                            {recentProjectSkeletons}
                        </div>
                    </div>

                    {/* Resources Section */}
                    <div data-testid="resources-loading">
                        <div className="mb-6">
                            <div className="h-6 bg-muted rounded w-32 animate-pulse"></div>
                        </div>

                        <div className="space-y-4">
                            {resourceSkeletons}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
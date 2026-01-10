"use client";

import React from 'react';
import type { DataAction, ResourceItem } from './types';
import { DataActionCard } from './DataActionCard';
import { ResourceCard } from './ResourceCard';

export * from './types';

interface DashboardLandingProps {
    dataActions: DataAction[];
    resources: ResourceItem[];
}

/**
 * Komponen landing page dashboard
 * Menampilkan opsi untuk memulai analisis data dan sumber daya
 */
export const DashboardLanding: React.FC<DashboardLandingProps> = ({ dataActions, resources }) => {
    return (
        <div className="container mx-auto px-4 py-12 max-w-6xl" id="dashboard-content" data-testid="dashboard-landing">
            <div className="mb-12" data-testid="welcome-section">
                <h1 className="text-3xl font-semibold text-foreground mb-2" data-testid="welcome-title">Welcome to Statify</h1>
                <p className="text-muted-foreground" data-testid="welcome-subtitle">Start statistical analysis or open an existing project.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-12" data-tour="data-actions" data-testid="data-actions-grid">
                {dataActions.map((action) => (
                    <DataActionCard key={action.id} action={action} />
                ))}
            </div>

            <div data-tour="resources" data-testid="resources-section">
                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-foreground" data-testid="resources-title">Resources</h2>
                </div>
                <div className="space-y-4" data-testid="resources-list">
                    {resources.map((resource, index) => (
                        <ResourceCard key={index} resource={resource} />
                    ))}
                </div>
            </div>
        </div>
    );
};